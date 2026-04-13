import { COLOR_THEMES, DEFAULTS, getTimeOfDay, hexToRgb, lerpRgb } from './themes.js'
import { WebGLRenderer } from './renderers/webgl.js'
import { Canvas2DRenderer } from './renderers/canvas2d.js'

export default class WaveBackground {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container
    if (!this.container) throw new Error('wave.js: container not found')

    // State
    this.params = { ...DEFAULTS }
    Object.keys(DEFAULTS).forEach(k => { if (options[k] !== undefined) this.params[k] = options[k] })
    this.theme = options.theme || getTimeOfDay()
    const themeColors = COLOR_THEMES[this.theme] || COLOR_THEMES.sunrise
    this.colors = themeColors.map(hexToRgb)
    this.targetColors = this.colors.map(c => [...c])
    this.colorOpacities = options.colorOpacities ? [...options.colorOpacities] : [1, 1, 1, 1]
    this.splitFill = options.splitFill || false
    this.glass = options.glass || false
    this.liquidMetal = options.liquidMetal || false
    this.mouse = { x: 0.5, y: 0.5 }
    this._mouseTarget = { x: 0.5, y: 0.5 }
    this.seed = Math.random() * 100
    this._colorTransition = null
    this._destroyed = false

    this._createCanvas()
    this._createRenderer()
    this._bind()
    this._resize()
    this._startLoop()
  }

  // --- Public API ---

  get renderMode() { return this._renderMode }

  setTheme(name) {
    if (!COLOR_THEMES[name]) return
    this.theme = name
    this._animateColorsTo(COLOR_THEMES[name].map(hexToRgb))
  }

  setColors(hexColors) {
    this.theme = 'custom'
    this._animateColorsTo(hexColors.map(hexToRgb))
  }

  setParam(key, value) { this.params[key] = value }

  setColorOpacities(arr) { this.colorOpacities = [...arr] }
  setSplitFill(v) { this.splitFill = v }
  setGlass(v) { this.glass = v }
  setLiquidMetal(v) { this.liquidMetal = v }

  destroy() {
    this._destroyed = true
    if (this._raf) cancelAnimationFrame(this._raf)
    window.removeEventListener('resize', this._onResize)
    this.container.removeEventListener('mousemove', this._onMouseMove)
    this.container.removeEventListener('mouseleave', this._onMouseLeave)
    if (this.renderer) this.renderer.destroy()
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas)
  }

  // --- Private ---

  _createCanvas() {
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;'
    const pos = getComputedStyle(this.container).position
    if (pos === 'static' || !pos) this.container.style.position = 'relative'
    this.container.insertBefore(this.canvas, this.container.firstChild)
  }

  _createRenderer() {
    // Try WebGL2 → WebGL1 → Canvas 2D → CSS fallback
    let gl = this.canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    if (!gl) gl = this.canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    if (gl) {
      try {
        this.renderer = new WebGLRenderer(this.canvas, gl)
        this._renderMode = gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl'
        return
      } catch (e) {
        console.warn('wave.js: WebGL init failed, falling back to Canvas 2D', e)
      }
    }
    if (this.canvas.getContext('2d')) {
      this.renderer = new Canvas2DRenderer(this.canvas)
      this._renderMode = 'canvas2d'
      return
    }
    // CSS fallback
    this._applyCSSFallback()
    this._renderMode = 'css'
  }

  _applyCSSFallback() {
    const theme = COLOR_THEMES[this.theme] || COLOR_THEMES.sunrise
    this.container.style.background = `linear-gradient(135deg, ${theme[0]}, ${theme[1]}, ${theme[2]}, ${theme[3]})`
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas)
    this.canvas = null
  }

  _bind() {
    this._onResize = () => this._resize()
    this._onMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect()
      this._mouseTarget.x = (e.clientX - rect.left) / rect.width
      this._mouseTarget.y = 1 - (e.clientY - rect.top) / rect.height
    }
    this._onMouseLeave = () => { this._mouseTarget.x = 0.5; this._mouseTarget.y = 0.5 }
    window.addEventListener('resize', this._onResize)
    this.container.addEventListener('mousemove', this._onMouseMove)
    this.container.addEventListener('mouseleave', this._onMouseLeave)
  }

  _resize() {
    if (!this.canvas || !this.renderer) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.renderer.resize(w * dpr, h * dpr)
  }

  _animateColorsTo(targetRgb) {
    const startColors = this.colors.map(c => [...c])
    const startTime = performance.now()
    const duration = 1500
    this._colorTransition = { startColors, targetRgb, startTime, duration }
  }

  _tickColorTransition() {
    const ct = this._colorTransition
    if (!ct) return
    const elapsed = performance.now() - ct.startTime
    const raw = Math.min(elapsed / ct.duration, 1)
    const t = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2
    for (let i = 0; i < 4; i++) {
      this.colors[i] = lerpRgb(ct.startColors[i], ct.targetRgb[i], t)
    }
    if (raw >= 1) this._colorTransition = null
  }

  _startLoop() {
    if (this._renderMode === 'css') return
    this._startTime = performance.now()
    const loop = () => {
      if (this._destroyed) return
      this._tick()
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  _tick() {
    // Smooth mouse
    this.mouse.x += (this._mouseTarget.x - this.mouse.x) * 0.05
    this.mouse.y += (this._mouseTarget.y - this.mouse.y) * 0.05
    // Animate colors
    this._tickColorTransition()

    this.renderer.render({
      time: (performance.now() - this._startTime) / 1000,
      seed: this.seed,
      width: this.canvas.width,
      height: this.canvas.height,
      colors: this.colors,
      colorOpacities: this.colorOpacities,
      mouse: this.mouse,
      params: this.params,
      splitFill: this.splitFill,
      glass: this.glass,
      liquidMetal: this.liquidMetal,
    })
  }
}
