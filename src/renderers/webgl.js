import vertexSource from '../shaders/waveVertex.glsl'
import fragmentSource from '../shaders/waveFragment.glsl'

const UNIFORM_NAMES = [
  'u_time', 'u_seed', 'u_resolution',
  'u_color1', 'u_color2', 'u_color3', 'u_color4',
  'u_colorOpacity1', 'u_colorOpacity2', 'u_colorOpacity3', 'u_colorOpacity4',
  'u_mouse', 'u_waveCount', 'u_speed', 'u_amplitude', 'u_frequency',
  'u_opacity', 'u_thickness', 'u_blur', 'u_concentration',
  'u_randomness', 'u_thicknessRandom', 'u_verticalOffset', 'u_rotation',
  'u_splitFill', 'u_glass', 'u_liquidMetal', 'u_lmLiquid',
]

export class WebGLRenderer {
  constructor(canvas, gl, features = {}) {
    this.canvas = canvas
    this.gl = gl
    this.features = { glass: !!features.glass, liquidMetal: !!features.liquidMetal }
    this._initBuffer()
    this._buildProgram()
  }

  _initBuffer() {
    const gl = this.gl
    this.buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  }

  _buildProgram() {
    const gl = this.gl
    const defines =
      (this.features.glass ? '#define HAS_GLASS 1\n' : '') +
      (this.features.liquidMetal ? '#define HAS_LIQUID_METAL 1\n' : '')

    const vs = this._compile(gl.VERTEX_SHADER, vertexSource)
    const fs = this._compile(gl.FRAGMENT_SHADER, defines + fragmentSource)
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader link error:', gl.getProgramInfoLog(program))
    }
    gl.deleteShader(vs)
    gl.deleteShader(fs)

    if (this.program) gl.deleteProgram(this.program)
    this.program = program
    gl.useProgram(this.program)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    const posLoc = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    this.locs = {}
    UNIFORM_NAMES.forEach(n => { this.locs[n] = gl.getUniformLocation(this.program, n) })
  }

  _compile(type, source) {
    const gl = this.gl
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    }
    return shader
  }

  setFeatures({ glass, liquidMetal }) {
    const g = !!glass, lm = !!liquidMetal
    if (g === this.features.glass && lm === this.features.liquidMetal) return
    this.features = { glass: g, liquidMetal: lm }
    this._buildProgram()
  }

  render(s) {
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
    if (this.features.glass) gl.uniform1f(l.u_glass, s.glass ? 1 : 0)
    if (this.features.liquidMetal) {
      gl.uniform1f(l.u_liquidMetal, s.liquidMetal ? 1 : 0)
      gl.uniform1f(l.u_lmLiquid, s.params.lmLiquid)
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  resize(w, h) {
    this.canvas.width = w
    this.canvas.height = h
    this.gl.viewport(0, 0, w, h)
  }

  destroy() {
    if (this.program) this.gl.deleteProgram(this.program)
    if (this.buf) this.gl.deleteBuffer(this.buf)
  }
}
