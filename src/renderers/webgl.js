import vertexSource from '../shaders/waveVertex.glsl'
import fragmentSource from '../shaders/waveFragment.glsl'
import postVertexSource from '../shaders/postVertex.glsl'
import brightPassSource from '../shaders/brightPass.glsl'
import blurSource from '../shaders/blur.glsl'
import compositeSource from '../shaders/composite.glsl'

const UNIFORM_NAMES = [
  'u_time', 'u_seed', 'u_resolution',
  'u_color1', 'u_color2', 'u_color3', 'u_color4',
  'u_colorOpacity1', 'u_colorOpacity2', 'u_colorOpacity3', 'u_colorOpacity4',
  'u_mouse', 'u_waveCount', 'u_speed', 'u_amplitude', 'u_frequency',
  'u_opacity', 'u_thickness', 'u_blur', 'u_concentration',
  'u_randomness', 'u_thicknessRandom', 'u_verticalOffset', 'u_rotation',
  'u_splitFill', 'u_lumen', 'u_twist', 'u_twistAmount',
  'u_glass', 'u_liquidMetal', 'u_lmLiquid',
]

// Bloom runs at 1/BLOOM_DOWNSAMPLE resolution. At 4x downsample and three
// H+V Gaussian iterations we get ~90-120px effective radius at 1440p.
// Lumen uses the widest halo; safe to keep 3 iterations always on.
const BLOOM_DOWNSAMPLE = 4
const BLOOM_ITERATIONS = 3

export class WebGLRenderer {
  constructor(canvas, gl, features = {}) {
    this.canvas = canvas
    this.gl = gl
    this.features = {
      glass: !!features.glass,
      liquidMetal: !!features.liquidMetal,
      bloom: !!features.bloom,
    }
    // Try to enable floating-point color attachments. When available the scene
    // FBO uses RGBA16F so HDR values > 1.0 from the lumen core feed the
    // bloom pipeline correctly (RGBA8 clamps to 1.0, killing the hot halo).
    this._hdrExt = gl.getExtension('EXT_color_buffer_float')
                || gl.getExtension('EXT_color_buffer_half_float')
    this._width = canvas.width
    this._height = canvas.height
    this._initBuffer()
    this._buildMainProgram()
    if (this.features.bloom) this._initBloom()
  }

  // --- Core quad ---

  _initBuffer() {
    const gl = this.gl
    this.buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  }

  // Bind the quad buffer and enable attribute location 0. We force all of
  // our programs (main + post-process) to use attribute location 0 for
  // `a_position` via bindAttribLocation before link, so a single attribute
  // setup works across every program.
  _bindQuad() {
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  }

  // --- Main wave program ---

  _buildMainProgram() {
    const gl = this.gl
    const defines =
      (this.features.glass ? '#define HAS_GLASS 1\n' : '') +
      (this.features.liquidMetal ? '#define HAS_LIQUID_METAL 1\n' : '')

    const program = this._linkProgram(vertexSource, defines + fragmentSource)
    if (this.program) gl.deleteProgram(this.program)
    this.program = program

    this.locs = {}
    UNIFORM_NAMES.forEach(n => { this.locs[n] = gl.getUniformLocation(this.program, n) })
  }

  _linkProgram(vsSource, fsSource) {
    const gl = this.gl
    const vs = this._compile(gl.VERTEX_SHADER, vsSource)
    const fs = this._compile(gl.FRAGMENT_SHADER, fsSource)
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    // Force attribute location 0 so the shared quad works across programs.
    gl.bindAttribLocation(program, 0, 'a_position')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('wave.js: shader link error:', gl.getProgramInfoLog(program))
    }
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return program
  }

  _compile(type, source) {
    const gl = this.gl
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('wave.js: shader compile error:', gl.getShaderInfoLog(shader))
    }
    return shader
  }

  // --- Feature toggles ---

  setFeatures({ glass, liquidMetal, bloom }) {
    const g = !!glass, lm = !!liquidMetal, bl = !!bloom
    const mainDirty = g !== this.features.glass || lm !== this.features.liquidMetal
    const bloomDirty = bl !== this.features.bloom
    if (!mainDirty && !bloomDirty) return
    this.features = { glass: g, liquidMetal: lm, bloom: bl }
    if (mainDirty) this._buildMainProgram()
    if (bloomDirty) {
      if (bl) this._initBloom()
      else this._destroyBloom()
    }
  }

  // --- Bloom pipeline ---
  //
  // Layout:
  //   sceneFBO   (fullres RGBA) <- main wave shader writes here
  //   brightFBO  (1/4 res)      <- luminance-thresholded copy of sceneFBO
  //   pingFBO    (1/4 res)      <- blur H target
  //   pongFBO    (1/4 res)      <- blur V target
  //
  // Render order per frame:
  //   sceneFBO := waveShader()
  //   brightFBO := brightPass(sceneFBO)
  //   for i in [0, BLOOM_ITERATIONS):
  //     pingFBO := blur(brightFBO or pongFBO, direction=(1,0))
  //     pongFBO := blur(pingFBO,              direction=(0,1))
  //   defaultFB := composite(sceneFBO, pongFBO)

  _initBloom() {
    const gl = this.gl
    this.brightProgram = this._linkProgram(postVertexSource, brightPassSource)
    this.blurProgram   = this._linkProgram(postVertexSource, blurSource)
    this.compositeProgram = this._linkProgram(postVertexSource, compositeSource)

    this.brightLocs = {
      u_scene: gl.getUniformLocation(this.brightProgram, 'u_scene'),
      u_threshold: gl.getUniformLocation(this.brightProgram, 'u_threshold'),
    }
    this.blurLocs = {
      u_tex: gl.getUniformLocation(this.blurProgram, 'u_tex'),
      u_texelSize: gl.getUniformLocation(this.blurProgram, 'u_texelSize'),
      u_direction: gl.getUniformLocation(this.blurProgram, 'u_direction'),
    }
    this.compositeLocs = {
      u_scene: gl.getUniformLocation(this.compositeProgram, 'u_scene'),
      u_bloom: gl.getUniformLocation(this.compositeProgram, 'u_bloom'),
      u_intensity: gl.getUniformLocation(this.compositeProgram, 'u_intensity'),
    }

    this._allocBloomTargets(this._width, this._height)
  }

  _destroyBloom() {
    const gl = this.gl
    ;['brightProgram', 'blurProgram', 'compositeProgram'].forEach(k => {
      if (this[k]) { gl.deleteProgram(this[k]); this[k] = null }
    })
    this._freeBloomTargets()
  }

  _allocBloomTargets(w, h) {
    this._freeBloomTargets()
    const dw = Math.max(1, Math.floor(w / BLOOM_DOWNSAMPLE))
    const dh = Math.max(1, Math.floor(h / BLOOM_DOWNSAMPLE))
    // Scene FBO is HDR (RGBA16F) when supported so > 1.0 values survive to
    // the bright-pass. Downsampled blur chain stays RGBA8 — bloom output
    // is post-threshold and fits in [0, intensity*cap] which LDR handles.
    this._sceneRT  = this._createRT(w, h, true)
    this._brightRT = this._createRT(dw, dh, false)
    this._pingRT   = this._createRT(dw, dh, false)
    this._pongRT   = this._createRT(dw, dh, false)
    this._bloomW = dw
    this._bloomH = dh
  }

  _createRT(w, h, wantHDR) {
    const gl = this.gl
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    let ok = false
    if (wantHDR && this._hdrExt && gl.RGBA16F !== undefined) {
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
        ok = true
      } catch (_) { ok = false }
    }
    if (!ok) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const fbo = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      // HDR path may fail on some GPUs even when extension is advertised —
      // fall back transparently to RGBA8.
      if (wantHDR) {
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          console.warn('wave.js: FBO incomplete even after LDR fallback')
        }
      } else {
        console.warn('wave.js: FBO incomplete', status.toString(16))
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    return { tex, fbo, w, h }
  }

  _freeBloomTargets() {
    const gl = this.gl
    ;['_sceneRT', '_brightRT', '_pingRT', '_pongRT'].forEach(k => {
      const rt = this[k]
      if (rt) {
        gl.deleteTexture(rt.tex)
        gl.deleteFramebuffer(rt.fbo)
        this[k] = null
      }
    })
  }

  _drawFullscreen() {
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
  }

  _bindRT(rt) {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fbo)
    gl.viewport(0, 0, rt.w, rt.h)
  }

  _bindDefaultFB() {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this._width, this._height)
  }

  // --- Render ---

  render(s) {
    const gl = this.gl
    this._bindQuad()

    // Pass 1: wave scene. Render into sceneFBO if bloom is on, else directly
    // to the default framebuffer (zero post-process cost when off).
    if (this.features.bloom) this._bindRT(this._sceneRT)
    else this._bindDefaultFB()

    gl.useProgram(this.program)
    this._bindMainUniforms(s)
    this._drawFullscreen()

    if (!this.features.bloom) return

    // Pass 2: bright pass (scene -> brightRT at 1/4 res).
    this._bindRT(this._brightRT)
    gl.useProgram(this.brightProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this._sceneRT.tex)
    gl.uniform1i(this.brightLocs.u_scene, 0)
    gl.uniform1f(this.brightLocs.u_threshold, s.bloomThreshold ?? 0.6)
    this._drawFullscreen()

    // Pass 3+: separable Gaussian blur, ping-pong, iterated.
    gl.useProgram(this.blurProgram)
    gl.uniform2f(this.blurLocs.u_texelSize, 1 / this._bloomW, 1 / this._bloomH)

    let src = this._brightRT
    for (let i = 0; i < BLOOM_ITERATIONS; i++) {
      // Horizontal -> pingRT
      this._bindRT(this._pingRT)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, src.tex)
      gl.uniform1i(this.blurLocs.u_tex, 0)
      gl.uniform2f(this.blurLocs.u_direction, 1, 0)
      this._drawFullscreen()

      // Vertical -> pongRT
      this._bindRT(this._pongRT)
      gl.bindTexture(gl.TEXTURE_2D, this._pingRT.tex)
      gl.uniform1i(this.blurLocs.u_tex, 0)
      gl.uniform2f(this.blurLocs.u_direction, 0, 1)
      this._drawFullscreen()

      src = this._pongRT
    }

    // Pass N: composite scene + bloom to the default framebuffer.
    this._bindDefaultFB()
    gl.useProgram(this.compositeProgram)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this._sceneRT.tex)
    gl.uniform1i(this.compositeLocs.u_scene, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this._pongRT.tex)
    gl.uniform1i(this.compositeLocs.u_bloom, 1)
    gl.uniform1f(this.compositeLocs.u_intensity, s.bloomIntensity ?? 1.4)
    this._drawFullscreen()
  }

  _bindMainUniforms(s) {
    const gl = this.gl
    const l = this.locs
    gl.uniform1f(l.u_time, s.time)
    gl.uniform1f(l.u_seed, s.seed)
    gl.uniform2f(l.u_resolution, s.width, s.height)
    gl.uniform3f(l.u_color1, s.colors[0][0], s.colors[0][1], s.colors[0][2])
    gl.uniform3f(l.u_color2, s.colors[1][0], s.colors[1][1], s.colors[1][2])
    gl.uniform3f(l.u_color3, s.colors[2][0], s.colors[2][1], s.colors[2][2])
    gl.uniform3f(l.u_color4, s.colors[3][0], s.colors[3][1], s.colors[3][2])
    gl.uniform1f(l.u_colorOpacity1, s.colorOpacities[0])
    gl.uniform1f(l.u_colorOpacity2, s.colorOpacities[1])
    gl.uniform1f(l.u_colorOpacity3, s.colorOpacities[2])
    gl.uniform1f(l.u_colorOpacity4, s.colorOpacities[3])
    gl.uniform2f(l.u_mouse, s.mouse.x, s.mouse.y)
    gl.uniform1f(l.u_waveCount, s.params.waveCount)
    gl.uniform1f(l.u_speed, s.params.speed)
    gl.uniform1f(l.u_amplitude, s.params.amplitude)
    gl.uniform1f(l.u_frequency, s.params.frequency)
    gl.uniform1f(l.u_opacity, s.params.opacity)
    gl.uniform1f(l.u_thickness, s.params.thickness)
    gl.uniform1f(l.u_blur, s.params.blur)
    gl.uniform1f(l.u_concentration, s.params.concentration)
    gl.uniform1f(l.u_randomness, s.params.randomness)
    gl.uniform1f(l.u_thicknessRandom, s.params.thicknessRandom)
    gl.uniform1f(l.u_verticalOffset, s.params.verticalOffset)
    gl.uniform1f(l.u_rotation, s.params.rotation * Math.PI / 180)
    gl.uniform1f(l.u_splitFill, s.splitFill ? 1 : 0)
    gl.uniform1f(l.u_lumen, s.lumen ? 1 : 0)
    gl.uniform1f(l.u_twist, s.twist ? 1 : 0)
    gl.uniform1f(l.u_twistAmount, s.params.twistAmount ?? 1)
    if (this.features.glass) gl.uniform1f(l.u_glass, s.glass ? 1 : 0)
    if (this.features.liquidMetal) {
      gl.uniform1f(l.u_liquidMetal, s.liquidMetal ? 1 : 0)
      gl.uniform1f(l.u_lmLiquid, s.params.lmLiquid)
    }
  }

  resize(w, h) {
    this.canvas.width = w
    this.canvas.height = h
    this._width = w
    this._height = h
    this.gl.viewport(0, 0, w, h)
    if (this.features.bloom) this._allocBloomTargets(w, h)
  }

  destroy() {
    const gl = this.gl
    if (this.program) gl.deleteProgram(this.program)
    if (this.buf) gl.deleteBuffer(this.buf)
    this._destroyBloom()
  }
}
