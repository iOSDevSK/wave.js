import { hexToRgb } from '../themes.js'

export class Canvas2DRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  render(s) {
    const ctx = this.ctx
    const W = this.canvas.width
    const H = this.canvas.height
    const p = s.params
    const aspect = W / H
    const time = s.time * p.speed
    const mouseInf = (s.mouse.x - 0.5) * 0.08

    // Background
    const bg = s.colors[0]
    ctx.fillStyle = `rgb(${bg[0] * 255 | 0},${bg[1] * 255 | 0},${bg[2] * 255 | 0})`
    ctx.fillRect(0, 0, W, H)

    // Rotation — expand drawing area to cover full screen after rotation
    const hasRotation = p.rotation !== 0
    let drawW = W, drawH = H, offsetX = 0, offsetY = 0
    if (hasRotation) {
      const diag = Math.sqrt(W * W + H * H)
      drawW = diag
      drawH = diag
      offsetX = (diag - W) / 2
      offsetY = (diag - H) / 2
      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.rotate(p.rotation * Math.PI / 180)
      ctx.translate(-W / 2, -H / 2)
    }

    const range = 0.85 / (1 + p.concentration)
    const startY = 0.5 + p.verticalOffset - range / 2
    const waveCount = Math.min(p.waveCount, 100)
    const step = Math.max(2, Math.ceil(drawW / 400))

    for (let i = 0; i < waveCount; i++) {
      const fi = i
      const phase = fi * 0.7 + s.seed
      const baseY = startY + fi / Math.max(waveCount - 1, 1) * range

      const waveRand = fract(Math.sin(fi * 127.1 + s.seed * 311.7) * 43758.5453)
      const amp = p.amplitude * (1 - p.randomness + p.randomness * waveRand)

      // Color interpolation
      const cm = fi / Math.max(waveCount - 1, 1)
      let c1, c2, t
      if (cm < 0.333) { c1 = s.colors[1]; c2 = s.colors[2]; t = cm * 3 }
      else if (cm < 0.666) { c1 = s.colors[2]; c2 = s.colors[3]; t = (cm - 0.333) * 3 }
      else { c1 = s.colors[3]; c2 = s.colors[1]; t = (cm - 0.666) * 3 }

      const r = (c1[0] + (c2[0] - c1[0]) * t) * 255 | 0
      const g = (c1[1] + (c2[1] - c1[1]) * t) * 255 | 0
      const b = (c1[2] + (c2[2] - c1[2]) * t) * 255 | 0

      const layerAlpha = p.opacity * (0.25 + 0.75 * (fi / Math.max(waveCount - 1, 1)))
      const o1i = cm < 0.333 ? 1 : cm < 0.666 ? 2 : 3
      const o2i = cm < 0.333 ? 2 : cm < 0.666 ? 3 : 1
      const colorAlpha = s.colorOpacities[o1i] + (s.colorOpacities[o2i] - s.colorOpacities[o1i]) * t
      const alpha = layerAlpha * colorAlpha

      ctx.beginPath()
      const startPx = hasRotation ? -offsetX : 0
      const endPx = hasRotation ? W + offsetX : W
      for (let px = startPx; px <= endPx; px += step) {
        const x = px / W
        const xa = x * aspect
        let wave = Math.sin(xa * p.frequency + time * (0.8 + fi * 0.1) + phase) * amp
        wave += Math.sin(xa * p.frequency * 2 - time * (0.5 + fi * 0.15) + phase * 2) * amp * 0.4
        wave += Math.sin(xa * p.frequency * 0.5 + time * (0.3 + fi * 0.05) + phase * 3) * amp * 0.6
        wave += mouseInf * Math.sin(xa * 3 + fi) * 0.3
        const y = (1 - baseY - wave) * H
        if (px === startPx) ctx.moveTo(px, y)
        else ctx.lineTo(px, y)
      }

      if (s.splitFill) {
        ctx.lineTo(endPx, -offsetY)
        ctx.lineTo(startPx, -offsetY)
        ctx.closePath()
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fill()
      } else {
        ctx.lineWidth = Math.max(p.thickness, 1)
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.stroke()
      }
    }

    if (hasRotation) ctx.restore()
  }

  resize(w, h) {
    this.canvas.width = w
    this.canvas.height = h
  }

  destroy() {}
}

function fract(x) { return x - Math.floor(x) }
