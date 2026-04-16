import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Copy, Check, ShieldCheck, Gauge, FileZip, Package, CaretDown, Faders, ArrowCounterClockwise, CaretUp } from '@phosphor-icons/react'
import { WaveBackground } from 'wave.js'
import PRESETS from '../presets'

// Default effect on page load — Canvas 2D daytime waves with split fill
const DEFAULT_PRESET = {
  name: 'Default',
  colors: ['#07070f', '#3730a3', '#06b6d4', '#34d399'],
  params: {
    waveCount: 24, speed: 0.12, amplitude: 0.045, frequency: 5.10,
    opacity: 0.02, thickness: 1, blur: 0, concentration: 50.00,
    randomness: 0.07, thicknessRandom: 0.00, verticalOffset: 0.42, rotation: 360,
    lmLiquid: 0.07,
  },
  splitFill: true,
  glass: false,
  liquidMetal: false,
  renderer: 'canvas2d',
}

// --- Color helpers (from wave.js themes.js) ---
const COLOR_THEMES = {
  'pre-dawn': ['#07070f', '#d91aff', '#ff6b35', '#ffb347'],
  'sunrise':  ['#07070f', '#ff29b0', '#ff8c42', '#ffd166'],
  'daytime':  ['#07070f', '#4361ee', '#48bfe3', '#72efdd'],
  'dusk':     ['#07070f', '#7b2ff7', '#c77dff', '#e0aaff'],
  'sunset':   ['#07070f', '#f394ff', '#ff6b6b', '#fca311'],
  'night':    ['#07070f', '#3d1a78', '#6b3fa0', '#9d4edd'],
}

const DEFAULTS = {
  waveCount: 8, speed: 0.3, amplitude: 0.06, frequency: 2.5,
  opacity: 0.6, thickness: 1, blur: 30, concentration: 0,
  randomness: 0, thicknessRandom: 0, verticalOffset: 0, rotation: 0,
  lmLiquid: 0.07,
}

const SLIDER_DEFS = [
  { key: 'waveCount', label: 'Waves', min: 1, max: 100, step: 1 },
  { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01 },
  { key: 'amplitude', label: 'Amplitude', min: 0, max: 0.2, step: 0.001 },
  { key: 'frequency', label: 'Frequency', min: 0.5, max: 10, step: 0.1 },
  { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
  { key: 'thickness', label: 'Thickness (px)', min: 1, max: 100, step: 1 },
  { key: 'blur', label: 'Blur (px)', min: 0, max: 200, step: 1 },
  { key: 'concentration', label: 'Concentration', min: 0, max: 50, step: 0.1 },
  { key: 'randomness', label: 'Randomness', min: 0, max: 1, step: 0.01 },
  { key: 'thicknessRandom', label: 'Thickness Random', min: 0, max: 1, step: 0.01 },
  { key: 'verticalOffset', label: 'Vertical Offset', min: -0.5, max: 0.5, step: 0.01 },
  { key: 'rotation', label: 'Rotation (\u00B0)', min: 0, max: 360, step: 1 },
]

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5 && h < 8) return 'pre-dawn'
  if (h >= 8 && h < 11) return 'sunrise'
  if (h >= 11 && h < 16) return 'daytime'
  if (h >= 16 && h < 20) return 'dusk'
  if (h >= 20 && h < 23) return 'sunset'
  return 'night'
}

function hexToHsv(hex) {
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

function hsvToHex(h, s, v) {
  const f = (n) => {
    const k = (n + h * 6) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`
}

// --- Draggable bar helper (from HeroWave.jsx) ---
function useBarDrag(onChange) {
  const dragging = useRef(false)
  const onPointerDown = (e) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    update(e)
  }
  const onPointerMove = (e) => { if (dragging.current) update(e) }
  const onPointerUp = () => { dragging.current = false }
  const update = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onChange(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
  }
  return { onPointerDown, onPointerMove, onPointerUp }
}

// --- RGBA Color Picker (from HeroWave.jsx, restyled) ---
function ColorSwatch({ color, opacity, onColorChange, onOpacityChange, panelRef }) {
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(() => hexToHsv(color))
  const ref = useRef()
  const popupRef = useRef()
  const areaRef = useRef()
  const areaDragging = useRef(false)

  const prevColor = useRef(color)
  if (color !== prevColor.current) {
    prevColor.current = color
    const newHsv = hexToHsv(color)
    if (hsvToHex(hsv.h, hsv.s, hsv.v) !== color) setHsv(newHsv)
  }

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      const inSwatch = ref.current && ref.current.contains(e.target)
      const inPopup = popupRef.current && popupRef.current.contains(e.target)
      if (!inSwatch && !inPopup) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    const panel = panelRef?.current
    if (!panel) return
    const onScroll = () => setOpen(false)
    panel.addEventListener('scroll', onScroll)
    return () => panel.removeEventListener('scroll', onScroll)
  }, [open, panelRef])

  const emitColor = (h, s, v) => { setHsv({ h, s, v }); onColorChange(hsvToHex(h, s, v)) }
  const onAreaPointerDown = (e) => { areaDragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); updateArea(e) }
  const onAreaPointerMove = (e) => { if (areaDragging.current) updateArea(e) }
  const onAreaPointerUp = () => { areaDragging.current = false }
  const updateArea = (e) => {
    const rect = areaRef.current.getBoundingClientRect()
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
    emitColor(hsv.h, s, v)
  }
  const hueBind = useBarDrag((val) => emitColor(val, hsv.s, hsv.v))
  const alphaBind = useBarDrag((val) => onOpacityChange(val))
  const hueColor = hsvToHex(hsv.h, 1, 1)
  const currentColor = hsvToHex(hsv.h, hsv.s, hsv.v)

  let fixedPos = {}
  if (open && ref.current) {
    const swatchRect = ref.current.getBoundingClientRect()
    const popupW = 176
    let top = swatchRect.bottom + 4
    let left = swatchRect.left
    if (panelRef?.current) {
      const panelRect = panelRef.current.getBoundingClientRect()
      if (left + popupW > panelRect.right - 8) left = panelRect.right - 8 - popupW
      if (left < panelRect.left + 8) left = panelRect.left + 8
      if (top + popupW > panelRect.bottom - 8) top = swatchRect.top - popupW - 4
    }
    fixedPos = { top, left }
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(o => !o)}
        className="w-[30px] h-[30px] rounded-md cursor-pointer transition-all"
        style={{
          background: color,
          opacity,
          border: open ? '2px solid white' : '2px solid rgba(255,255,255,0.2)',
        }}
      />
      {open && createPortal(
        <div ref={popupRef} className="fixed z-[200] flex flex-col gap-2 p-2 rounded-xl border border-white/15" style={{ ...fixedPos, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', width: 176, pointerEvents: 'auto' }}>
          {/* SV area */}
          <div ref={areaRef} onPointerDown={onAreaPointerDown} onPointerMove={onAreaPointerMove} onPointerUp={onAreaPointerUp}
            className="relative w-full rounded-md overflow-hidden cursor-crosshair" style={{ aspectRatio: '4/3', background: hueColor, touchAction: 'none' }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }} />
            <div className="absolute w-3 h-3 rounded-full border-2 border-white pointer-events-none" style={{ left: hsv.s * 100 + '%', top: (1 - hsv.v) * 100 + '%', transform: 'translate(-50%,-50%)', boxShadow: '0 0 3px rgba(0,0,0,0.5)' }} />
          </div>
          {/* Hue */}
          <div {...hueBind} className="relative w-full h-3 rounded-md cursor-pointer"
            style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)', touchAction: 'none' }}>
            <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none" style={{ left: hsv.h * 100 + '%', top: '50%', transform: 'translate(-50%,-50%)', background: hueColor, boxShadow: '0 0 3px rgba(0,0,0,0.5)' }} />
          </div>
          {/* Alpha */}
          <div {...alphaBind} className="relative w-full h-3 rounded-md cursor-pointer"
            style={{ background: `linear-gradient(to right, transparent, ${currentColor})`, touchAction: 'none' }}>
            <div className="absolute inset-0 rounded-md -z-10" style={{ backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.12) 0% 25%, transparent 0% 50%)', backgroundSize: '8px 8px' }} />
            <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none" style={{ left: opacity * 100 + '%', top: '50%', transform: 'translate(-50%,-50%)', background: currentColor, boxShadow: '0 0 3px rgba(0,0,0,0.5)' }} />
          </div>
          {/* RGB + A inputs */}
          <div className="flex gap-1">
            {['R', 'G', 'B'].map((ch, ci) => {
              const val = parseInt(currentColor.slice(1 + ci * 2, 3 + ci * 2), 16)
              return (
                <div key={ch} className="flex-1 text-center">
                  <input type="number" min={0} max={255} value={val} onChange={(e) => {
                    const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                    const parts = [parseInt(currentColor.slice(1, 3), 16), parseInt(currentColor.slice(3, 5), 16), parseInt(currentColor.slice(5, 7), 16)]
                    parts[ci] = v
                    const hex = '#' + parts.map(p => p.toString(16).padStart(2, '0')).join('')
                    setHsv(hexToHsv(hex)); onColorChange(hex)
                  }} className="w-full bg-white/[0.08] border border-white/[0.12] rounded text-white text-[11px] text-center py-0.5 font-mono outline-none" />
                  <div className="text-[9px] text-white/40 mt-0.5">{ch}</div>
                </div>
              )
            })}
            <div className="flex-1 text-center">
              <input type="number" min={0} max={100} value={Math.round(opacity * 100)} onChange={(e) => onOpacityChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)}
                className="w-full bg-white/[0.08] border border-white/[0.12] rounded text-white text-[11px] text-center py-0.5 font-mono outline-none" />
              <div className="text-[9px] text-white/40 mt-0.5">A</div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// --- Slider with click-to-edit (styled with website CSS) ---
function ParamSlider({ label, value, min, max, step, onChange }) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const decimals = step < 0.001 ? 4 : step < 0.01 ? 3 : step < 1 ? 2 : 0

  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <label className="text-[11px] font-medium text-white/80">{label}</label>
        {editing ? (
          <input
            autoFocus type="number" min={min} max={max} step={step} value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={() => { const v = parseFloat(editVal); if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v))); setEditing(false) }}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
            className="w-14 font-mono text-[11px] bg-white/15 border border-white/30 rounded text-white text-right px-1 py-0.5 outline-none"
          />
        ) : (
          <span
            onClick={() => { setEditVal(decimals ? value.toFixed(decimals) : String(value)); setEditing(true) }}
            className="text-[11px] font-mono text-white/90 cursor-text border-b border-dashed border-white/30 hover:border-teal/50 transition-colors"
          >
            {decimals ? value.toFixed(decimals) : value}
          </span>
        )}
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  )
}

// --- Toggle checkbox ---
function Toggle({ label, value, onToggle }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={() => onToggle(!value)}
        className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${
          value ? 'bg-teal/30 border-teal/60' : 'bg-transparent border-white/25 group-hover:border-white/40'
        }`}
      >
        {value && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        )}
      </div>
      <span className="text-xs text-white/70">{label}</span>
    </label>
  )
}

// =============================================================
export default function Hero({ activePreset, onPresetApplied }) {
  const [copied, setCopied] = useState(false)
  const panelRef = useRef()
  const heroRef = useRef()
  const waveRef = useRef(null)

  // --- Full params state — initialized from DEFAULT_PRESET (Purple Beam) ---
  const [params, setParams] = useState({ ...DEFAULTS, ...DEFAULT_PRESET.params })
  const [currentTheme, setCurrentTheme] = useState('custom')
  const userPickedTheme = useRef(true)
  const [customColors, setCustomColors] = useState(DEFAULT_PRESET.colors)
  const [colorOpacities, setColorOpacities] = useState([1, 1, 1, 1])
  const [splitFill, setSplitFill] = useState(DEFAULT_PRESET.splitFill)
  const [glass, setGlass] = useState(DEFAULT_PRESET.glass)
  const [liquidMetal, setLiquidMetal] = useState(DEFAULT_PRESET.liquidMetal)
  const [renderMode, setRenderMode] = useState(DEFAULT_PRESET.renderer)
  const [panelOpen, setPanelOpen] = useState(true)
  const panelWrapRef = useRef()
  const [panelTopPx, setPanelTopPx] = useState(null)

  const colors = currentTheme === 'custom' && customColors
    ? customColors
    : COLOR_THEMES[currentTheme] || COLOR_THEMES['sunrise']

  const setParam = (key, value) => setParams(p => ({ ...p, [key]: value }))

  const resetDefaults = () => {
    const w = waveRef.current
    const p = DEFAULT_PRESET

    // Apply default preset to wave instance
    if (w) {
      if (p.renderer) {
        w.setRenderMode(p.renderer)
        setRenderMode(w.renderMode)
        fixCanvas()
      }
      const allParams = { ...DEFAULTS, ...p.params }
      Object.keys(allParams).forEach(k => w.setParam(k, allParams[k]))
      w.setSplitFill(p.splitFill)
      w.setGlass(p.glass)
      w.setLiquidMetal(p.liquidMetal)
      w.setColorOpacities([1, 1, 1, 1])
      const rgbColors = p.colors.map(hex => [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      ])
      w.colors = rgbColors.map(c => [...c])
      w.targetColors = rgbColors.map(c => [...c])
      w._colorTransition = null
    }

    // Update React state
    setParams({ ...DEFAULTS, ...p.params })
    setColorOpacities([1, 1, 1, 1])
    setSplitFill(p.splitFill)
    setGlass(p.glass)
    setLiquidMetal(p.liquidMetal)
    setCustomColors(p.colors)
    userPickedTheme.current = true
    setCurrentTheme('custom')
  }

  // Mount WaveBackground with default preset
  useEffect(() => {
    if (!heroRef.current) return
    const p = DEFAULT_PRESET
    const wave = new WaveBackground(heroRef.current, {
      ...p.params,
      splitFill: p.splitFill,
      glass: p.glass,
      liquidMetal: p.liquidMetal,
    })
    waveRef.current = wave
    setRenderMode(wave.renderMode)
    // Immediately set preset colors (skip 1500ms animation)
    const rgbColors = p.colors.map(hex => [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ])
    wave.colors = rgbColors.map(c => [...c])
    wave.targetColors = rgbColors.map(c => [...c])
    wave._colorTransition = null
    // Set renderer from preset
    if (p.renderer) {
      wave.setRenderMode(p.renderer)
      setRenderMode(wave.renderMode)
    }
    // Make canvas non-blocking for pointer events and full-width
    const setupCanvas = () => {
      const canvas = heroRef.current.querySelector('canvas')
      if (canvas) {
        canvas.style.pointerEvents = 'none'
        canvas.style.position = 'absolute'
        canvas.style.inset = '0'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.zIndex = '0'
      }
    }
    setupCanvas()
    // Re-check after renderer switch (new canvas may be created)
    requestAnimationFrame(setupCanvas)
    return () => wave.destroy()
  }, [])

  // Sync params to wave instance
  useEffect(() => {
    const w = waveRef.current
    if (!w) return
    Object.keys(params).forEach(k => w.setParam(k, params[k]))
    w.setSplitFill(splitFill)
    w.setGlass(glass)
    w.setLiquidMetal(liquidMetal)
    w.setColorOpacities(colorOpacities)
  }, [params, splitFill, glass, liquidMetal, colorOpacities])

  // Sync theme/colors — always use our COLOR_THEMES (with #000000 bg)
  useEffect(() => {
    const w = waveRef.current
    if (!w) return
    if (currentTheme === 'custom' && customColors) {
      w.setColors(customColors)
    } else if (COLOR_THEMES[currentTheme]) {
      w.setColors(COLOR_THEMES[currentTheme])
    }
  }, [currentTheme, customColors])

  // Fix canvas styling after renderer switch
  const fixCanvas = () => {
    requestAnimationFrame(() => {
      const canvas = heroRef.current?.querySelector('canvas')
      if (canvas) {
        canvas.style.pointerEvents = 'none'
        canvas.style.position = 'absolute'
        canvas.style.inset = '0'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.zIndex = '0'
      }
    })
  }

  // Sync renderer
  const handleRenderModeChange = (mode) => {
    const w = waveRef.current
    if (!w) return
    w.setRenderMode(mode)
    setRenderMode(w.renderMode)
    fixCanvas()
  }

  // Apply preset from ThemeGallery
  useEffect(() => {
    if (!activePreset) return
    const w = waveRef.current
    if (!w) return

    // 1. Switch renderer first (may create new canvas)
    if (activePreset.renderer) {
      w.setRenderMode(activePreset.renderer)
      setRenderMode(w.renderMode)
      fixCanvas()
    }

    // 2. Apply all params directly on wave instance
    const allParams = { ...DEFAULTS, ...activePreset.params }
    Object.keys(allParams).forEach(k => w.setParam(k, allParams[k]))
    w.setSplitFill(activePreset.splitFill)
    w.setGlass(activePreset.glass)
    w.setLiquidMetal(activePreset.liquidMetal)
    w.setColorOpacities([1, 1, 1, 1])

    // 3. Set colors immediately (no animation)
    const rgbColors = activePreset.colors.map(hex => [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ])
    w.colors = rgbColors.map(c => [...c])
    w.targetColors = rgbColors.map(c => [...c])
    w._colorTransition = null

    // 4. Update React state to match (for panel display)
    setParams(allParams)
    setSplitFill(activePreset.splitFill)
    setGlass(activePreset.glass)
    setLiquidMetal(activePreset.liquidMetal)
    setColorOpacities([1, 1, 1, 1])
    setCustomColors(activePreset.colors)
    userPickedTheme.current = true
    setCurrentTheme('custom')

    onPresetApplied?.()
  }, [activePreset])

  // Lock panel Y position after first render (centered), so collapse doesn't shift it
  useEffect(() => {
    if (panelTopPx != null || !panelWrapRef.current) return
    requestAnimationFrame(() => {
      const el = panelWrapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const parentRect = el.offsetParent?.getBoundingClientRect()
      if (parentRect) {
        setPanelTopPx(rect.top - parentRect.top)
      }
    })
  }, [panelTopPx])

  // Auto time-of-day
  useEffect(() => {
    const interval = setInterval(() => {
      if (!userPickedTheme.current) setCurrentTheme(getTimeOfDay())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install wave.js')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
    <section ref={heroRef} className="relative min-h-screen w-full flex items-center justify-center pt-20 overflow-hidden bg-void">
      {/* Grid overlay — always visible above wave canvas */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-10" />
      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6">

        {/* Left: Copy */}
        <div className="max-w-3xl flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-8 transition-colors ${
            renderMode === 'webgl2'
              ? 'bg-blue/10 border border-blue/20 text-teal'
              : 'bg-white/5 border border-white/10 text-zinc-500'
          }`}>
            <span className="relative flex h-2 w-2">
              {renderMode === 'webgl2' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600" />
              )}
            </span>
            {renderMode === 'webgl2' ? 'GPU-accelerated WebGL rendering' : `Renderer: ${renderMode === 'canvas2d' ? 'Canvas 2D (CPU)' : renderMode === 'css' ? 'CSS Gradient' : 'None'}`}
          </div>

          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-8xl tracking-tighter leading-[0.9]">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30">
              Mesmerizing wave{' '}
            </span>
            <br className="hidden md:block" />
            <span className="text-gradient-accent">backgrounds.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30">
              One line of code.
            </span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-muted max-w-lg font-light leading-relaxed">
            GPU-accelerated animated sine wave backgrounds. Liquid metal, frosted glass, split fill effects — MIT licensed, zero dependencies.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-auto relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal to-blue rounded blur opacity-20 group-hover:opacity-50 transition duration-500" />
              <div className="relative flex items-center bg-wave-panel border border-white/10 rounded px-4 py-3 cursor-text">
                <span className="text-muted mr-3 font-mono text-sm">$</span>
                <code className="font-mono text-sm text-zinc-300">npm install wave.js</code>
                <button onClick={handleCopy} className="ml-6 text-zinc-500 hover:text-white transition-colors" title="Copy to clipboard">
                  {copied ? <Check size={18} className="text-teal" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
            <a href="#features" className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-sm font-semibold tracking-wide rounded hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)]">
              Get Started
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Mobile: Button to scroll to params */}
          <a
            href="#params-mobile"
            className="md:hidden mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-teal border border-teal/30 bg-teal/10 active:bg-teal/20 transition-colors"
          >
            <Faders size={16} /> Customize Parameters
          </a>

          {/* Trust Bar */}
          <div className="mt-8 lg:mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-[10px] sm:text-xs font-mono text-muted/60 uppercase tracking-widest">
            <span className="flex items-center gap-2"><ShieldCheck size={14} /> MIT Licensed</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-2"><Gauge size={14} /> 60fps</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-2"><FileZip size={14} /> ~7kb gzip</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-2"><Package size={14} /> Zero Deps</span>
          </div>
        </div>

        {/* Desktop: Parameters Panel — absolute */}
        <div ref={panelWrapRef} className="absolute right-6 hidden md:block" style={{ width: '22%', top: panelTopPx != null ? panelTopPx : '50%', transform: panelTopPx != null ? 'none' : 'translateY(-50%)' }}>
          {renderPanel(false)}
        </div>
      </div>

      {/* Scroll */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-zinc-500 z-20">
        <span className="text-[10px] font-mono tracking-widest uppercase">Scroll</span>
        <CaretDown size={16} className="animate-bounce" />
      </div>
    </section>

    {/* Mobile: Parameters Panel — below hero, full width */}
    <div id="params-mobile" className="md:hidden relative z-20 pb-8 overflow-hidden scroll-mt-[72px] w-full px-6">
      {renderPanel(true)}
    </div>
    </>
  )

  function renderPanel(isMobile) {
    return (
      <div
        className="relative rounded-[14px] w-full"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2.5 ${panelOpen ? 'border-b border-white/10' : ''}`}>
          <h3 className="text-sm font-medium flex items-center gap-2 text-white">
            <Faders size={16} className="text-teal" /> Parameters
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={resetDefaults} className="text-[10px] font-mono text-zinc-500 hover:text-teal transition-colors flex items-center gap-1" title="Reset to defaults">
              <ArrowCounterClockwise size={12} /> Reset
            </button>
            <button onClick={() => setPanelOpen(o => !o)} className="text-zinc-500 hover:text-white transition-colors" title={panelOpen ? 'Collapse' : 'Expand'}>
              <CaretUp size={16} className={`transition-transform duration-300 ${panelOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="transition-all duration-400 ease-in-out overflow-hidden"
          style={{ maxHeight: panelOpen ? 2000 : 0, opacity: panelOpen ? 1 : 0 }}
        >
          <div ref={isMobile ? undefined : panelRef} className={`${isMobile ? 'p-4 space-y-3' : 'p-4 space-y-2'}`}>

            {/* 12 Sliders */}
            {SLIDER_DEFS.map(s => (
              <ParamSlider key={s.key} label={s.label} value={params[s.key]} min={s.min} max={s.max} step={s.step} onChange={v => setParam(s.key, v)} />
            ))}

            {/* Color Theme */}
            <div className="border-t border-white/5 pt-2">
              <div className="text-[10px] uppercase tracking-wider text-muted font-mono mb-1.5">Color Theme</div>
              <div className="flex gap-1.5 flex-wrap">
                {Object.keys(COLOR_THEMES).map(name => (
                  <button
                    key={name}
                    onClick={() => { userPickedTheme.current = true; setCurrentTheme(name) }}
                    title={name}
                    className="w-[30px] h-[30px] rounded-full cursor-pointer transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${COLOR_THEMES[name][1]}, ${COLOR_THEMES[name][2]})`,
                      border: currentTheme === name ? '2px solid white' : '2px solid rgba(255,255,255,0.15)',
                      transform: currentTheme === name ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted font-mono mb-1.5">Custom Colors</div>
              <div className="flex gap-1.5">
                {colors.map((c, i) => (
                  <ColorSwatch
                    key={i}
                    color={c}
                    opacity={colorOpacities[i]}
                    panelRef={panelRef}
                    onColorChange={(val) => {
                      const newColors = [...colors]; newColors[i] = val; setCustomColors(newColors)
                      userPickedTheme.current = true; setCurrentTheme('custom')
                    }}
                    onOpacityChange={(val) => {
                      const newOpacities = [...colorOpacities]; newOpacities[i] = val; setColorOpacities(newOpacities)
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="border-t border-white/5 pt-2 space-y-1.5">
              <Toggle label="Split Fill" value={splitFill} onToggle={setSplitFill} />
              <Toggle label="Glass" value={glass} onToggle={setGlass} />
              <Toggle label="Liquid Metal" value={liquidMetal} onToggle={setLiquidMetal} />
            </div>

            {/* Conditional Liquify */}
            {liquidMetal && (
              <div className="pl-2 border-l-2 border-white/10">
                <ParamSlider label="Liquify" value={params.lmLiquid} min={0} max={0.2} step={0.001} onChange={v => setParam('lmLiquid', v)} />
              </div>
            )}

            {/* Renderer */}
            <div className="border-t border-white/5 pt-2">
              <div className="text-[10px] uppercase tracking-wider text-muted font-mono mb-1.5">Renderer</div>
              <select
                value={renderMode}
                onChange={e => handleRenderModeChange(e.target.value)}
                className="w-full py-1.5 px-2 bg-white/[0.08] border border-white/[0.12] rounded-md text-white text-xs cursor-pointer font-mono outline-none appearance-none"
              >
                <option value="webgl2" style={{ background: '#111' }}>WebGL2 (GPU)</option>
                <option value="canvas2d" style={{ background: '#111' }}>Canvas 2D (CPU)</option>
                <option value="css" style={{ background: '#111' }}>CSS Gradient (Static)</option>
                <option value="none" style={{ background: '#111' }}>None (Solid Color)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
