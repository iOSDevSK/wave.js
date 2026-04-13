export const COLOR_THEMES = {
  'pre-dawn': ['#1a0033', '#d91aff', '#ff6b35', '#ffb347'],
  'sunrise':  ['#2d0a4e', '#ff29b0', '#ff8c42', '#ffd166'],
  'daytime':  ['#0a1628', '#4361ee', '#48bfe3', '#72efdd'],
  'dusk':     ['#1a0533', '#7b2ff7', '#c77dff', '#e0aaff'],
  'sunset':   ['#1a0033', '#f394ff', '#ff6b6b', '#fca311'],
  'night':    ['#0d0221', '#3d1a78', '#6b3fa0', '#9d4edd'],
}

export const DEFAULTS = {
  waveCount: 8,
  speed: 0.3,
  amplitude: 0.06,
  frequency: 2.5,
  opacity: 0.6,
  thickness: 1,
  blur: 30,
  concentration: 0,
  randomness: 0,
  thicknessRandom: 0,
  verticalOffset: 0,
  rotation: 0,
  lmLiquid: 0.07,
}

export const SLIDER_DEFS = [
  { key: 'waveCount', label: 'Waves', min: 1, max: 100, step: 1 },
  { key: 'speed',     label: 'Speed', min: 0, max: 2, step: 0.01 },
  { key: 'amplitude', label: 'Amplitude', min: 0, max: 0.2, step: 0.001 },
  { key: 'frequency', label: 'Frequency', min: 0.5, max: 10, step: 0.1 },
  { key: 'opacity',   label: 'Opacity', min: 0, max: 1, step: 0.01 },
  { key: 'thickness', label: 'Thickness (px)', min: 1, max: 100, step: 1 },
  { key: 'blur',      label: 'Blur (px)', min: 0, max: 200, step: 1 },
  { key: 'concentration', label: 'Concentration', min: 0, max: 50, step: 0.1 },
  { key: 'randomness', label: 'Randomness', min: 0, max: 1, step: 0.01 },
  { key: 'thicknessRandom', label: 'Thickness Random', min: 0, max: 1, step: 0.01 },
  { key: 'verticalOffset', label: 'Vertical Offset', min: -0.5, max: 0.5, step: 0.01 },
  { key: 'rotation', label: 'Rotation (\u00B0)', min: 0, max: 360, step: 1 },
]

export function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 8) return 'pre-dawn'
  if (hour >= 8 && hour < 11) return 'sunrise'
  if (hour >= 11 && hour < 16) return 'daytime'
  if (hour >= 16 && hour < 20) return 'dusk'
  if (hour >= 20 && hour < 23) return 'sunset'
  return 'night'
}

export function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ]
}

export function lerpRgb(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return { h, s: max ? d / max : 0, v: max }
}

export function hsvToHex(h, s, v) {
  const f = (n) => {
    const k = (n + h * 6) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`
}
