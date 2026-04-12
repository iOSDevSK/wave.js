import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import WaveBackground from './WaveBackground'

const COLOR_THEMES = {
  'pre-dawn': ['#1a0033', '#d91aff', '#ff6b35', '#ffb347'],
  'sunrise':  ['#2d0a4e', '#ff29b0', '#ff8c42', '#ffd166'],
  'daytime':  ['#0a1628', '#4361ee', '#48bfe3', '#72efdd'],
  'dusk':     ['#1a0533', '#7b2ff7', '#c77dff', '#e0aaff'],
  'sunset':   ['#1a0033', '#f394ff', '#ff6b6b', '#fca311'],
  'night':    ['#0d0221', '#3d1a78', '#6b3fa0', '#9d4edd'],
}

const DEFAULTS = {
  waveCount: 8,
  speed: 0.3,
  amplitude: 0.06,
  frequency: 2.5,
  opacity: 0.6,
  thickness: 0.06,
  blur: 0.03,
  concentration: 0,
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 8) return 'pre-dawn'
  if (hour >= 8 && hour < 11) return 'sunrise'
  if (hour >= 11 && hour < 16) return 'daytime'
  if (hour >= 16 && hour < 20) return 'dusk'
  if (hour >= 20 && hour < 23) return 'sunset'
  return 'night'
}

const SLIDER_DEFS = [
  { key: 'waveCount', label: 'Waves', min: 1, max: 20, step: 1 },
  { key: 'speed',     label: 'Speed', min: 0, max: 2, step: 0.01 },
  { key: 'amplitude', label: 'Amplitude', min: 0, max: 0.2, step: 0.001 },
  { key: 'frequency', label: 'Frequency', min: 0.5, max: 10, step: 0.1 },
  { key: 'opacity',   label: 'Opacity', min: 0, max: 1, step: 0.01 },
  { key: 'thickness', label: 'Thickness', min: 0.01, max: 0.2, step: 0.001 },
  { key: 'blur',      label: 'Blur', min: 0, max: 0.3, step: 0.001 },
  { key: 'concentration', label: 'Concentration', min: 0, max: 10, step: 0.1 },
]

// --- Color helpers ---
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
  return `#${toHex(f(0))}${toHex(f(2))}${toHex(f(4))}`
}

// --- Draggable bar helper ---
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

// --- RGBA Color Picker ---
function ColorSwatch({ color, opacity, onColorChange, onOpacityChange }) {
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(() => hexToHsv(color))
  const ref = useRef()
  const areaRef = useRef()
  const areaDragging = useRef(false)

  // Sync HSV when color prop changes externally (e.g. theme switch)
  const prevColor = useRef(color)
  if (color !== prevColor.current) {
    prevColor.current = color
    const newHsv = hexToHsv(color)
    if (hsvToHex(hsv.h, hsv.s, hsv.v) !== color) {
      setHsv(newHsv)
    }
  }

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const emitColor = (h, s, v) => {
    setHsv({ h, s, v })
    onColorChange(hsvToHex(h, s, v))
  }

  // SV area drag
  const onAreaPointerDown = (e) => {
    areaDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateArea(e)
  }
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
  const pickerSize = 160

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: 30, height: 30,
          borderRadius: 6,
          background: color,
          opacity,
          border: open ? '2px solid white' : '2px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
      />
      {open && (
        <div style={{
          position: 'absolute',
          top: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10,
          padding: 8,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: pickerSize + 16,
        }}>
          {/* SV area */}
          <div
            ref={areaRef}
            onPointerDown={onAreaPointerDown}
            onPointerMove={onAreaPointerMove}
            onPointerUp={onAreaPointerUp}
            style={{
              position: 'relative',
              width: pickerSize,
              height: pickerSize * 0.75,
              borderRadius: 6,
              background: hueColor,
              cursor: 'crosshair',
              touchAction: 'none',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #fff, transparent)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000, transparent)' }} />
            {/* Thumb */}
            <div style={{
              position: 'absolute',
              left: hsv.s * 100 + '%',
              top: (1 - hsv.v) * 100 + '%',
              width: 12, height: 12,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 0 3px rgba(0,0,0,0.5)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Hue bar */}
          <div
            {...hueBind}
            style={{
              position: 'relative',
              width: pickerSize,
              height: 12,
              borderRadius: 6,
              background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
              cursor: 'pointer',
              touchAction: 'none',
            }}
          >
            <div style={{
              position: 'absolute',
              left: hsv.h * 100 + '%',
              top: '50%',
              width: 14, height: 14,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 0 3px rgba(0,0,0,0.5)',
              background: hueColor,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Alpha bar */}
          <div
            {...alphaBind}
            style={{
              position: 'relative',
              width: pickerSize,
              height: 12,
              borderRadius: 6,
              background: `linear-gradient(to right, transparent, ${color})`,
              cursor: 'pointer',
              touchAction: 'none',
            }}
          >
            {/* Checkerboard behind alpha */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 6, zIndex: -1,
              backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.12) 0% 25%, transparent 0% 50%)',
              backgroundSize: '8px 8px',
            }} />
            <div style={{
              position: 'absolute',
              left: opacity * 100 + '%',
              top: '50%',
              width: 14, height: 14,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 0 3px rgba(0,0,0,0.5)',
              background: color,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* RGBA values */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['R', 'G', 'B'].map((ch, ci) => {
              const val = parseInt(color.slice(1 + ci * 2, 3 + ci * 2), 16)
              return (
                <div key={ch} style={{ flex: 1, textAlign: 'center' }}>
                  <input
                    type="number"
                    min={0} max={255}
                    value={val}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                      const parts = [
                        parseInt(color.slice(1, 3), 16),
                        parseInt(color.slice(3, 5), 16),
                        parseInt(color.slice(5, 7), 16),
                      ]
                      parts[ci] = v
                      const hex = '#' + parts.map(p => p.toString(16).padStart(2, '0')).join('')
                      setHsv(hexToHsv(hex))
                      onColorChange(hex)
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 4,
                      color: 'white',
                      fontSize: 11,
                      textAlign: 'center',
                      padding: '3px 0',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{ch}</div>
                </div>
              )
            })}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <input
                type="number"
                min={0} max={100}
                value={Math.round(opacity * 100)}
                onChange={(e) => onOpacityChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4,
                  color: 'white',
                  fontSize: 11,
                  textAlign: 'center',
                  padding: '3px 0',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>A</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>
          {Number.isInteger(step) || step >= 1 ? value : value.toFixed(step < 0.01 ? 3 : 2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 4,
          appearance: 'none',
          background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`,
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </label>
  )
}

export default function HeroWave({ theme: themeProp, className, style, children }) {
  const containerRef = useRef()
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5))
  const [currentTheme, setCurrentTheme] = useState(themeProp || getTimeOfDay())
  const [customColors, setCustomColors] = useState(null)
  const [colorOpacities, setColorOpacities] = useState([1, 1, 1, 1])
  const [panelOpen, setPanelOpen] = useState(true)
  const [params, setParams] = useState({ ...DEFAULTS })

  const colors = currentTheme === 'custom' && customColors
    ? customColors
    : COLOR_THEMES[currentTheme] || COLOR_THEMES['sunrise']

  useEffect(() => {
    if (themeProp) return
    const interval = setInterval(() => setCurrentTheme(getTimeOfDay()), 60000)
    return () => clearInterval(interval)
  }, [themeProp])

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseRef.current.set(
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height
    )
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.set(0.5, 0.5)
  }, [])

  const setParam = (key, value) => setParams(p => ({ ...p, [key]: value }))
  const resetDefaults = () => {
    setParams({ ...DEFAULTS })
    setColorOpacities([1, 1, 1, 1])
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Canvas
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <WaveBackground colors={colors} colorOpacities={colorOpacities} mouse={mouseRef} params={params} />
      </Canvas>

      {/* ---- Control Panel ---- */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <button
          onClick={() => setPanelOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          Controls
        </button>

        {panelOpen && (
          <div style={{
            marginTop: 8,
            width: 260,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {/* Sliders */}
            {SLIDER_DEFS.map(s => (
              <Slider
                key={s.key}
                label={s.label}
                value={params[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={v => setParam(s.key, v)}
              />
            ))}

            {/* Color theme */}
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Color Theme</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.keys(COLOR_THEMES).map((name) => (
                  <button
                    key={name}
                    onClick={() => setCurrentTheme(name)}
                    style={{
                      width: 30, height: 30,
                      borderRadius: '50%',
                      border: currentTheme === name ? '2px solid white' : '2px solid rgba(255,255,255,0.15)',
                      background: `linear-gradient(135deg, ${COLOR_THEMES[name][1]}, ${COLOR_THEMES[name][2]})`,
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'border-color 0.2s, transform 0.2s',
                      transform: currentTheme === name ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* Custom colors */}
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Custom Colors</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {colors.map((c, i) => (
                  <ColorSwatch
                    key={i}
                    color={c}
                    opacity={colorOpacities[i]}
                    onColorChange={(val) => {
                      const newColors = [...colors]
                      newColors[i] = val
                      setCustomColors(newColors)
                      setCurrentTheme('custom')
                    }}
                    onOpacityChange={(val) => {
                      const newOpacities = [...colorOpacities]
                      newOpacities[i] = val
                      setColorOpacities(newOpacities)
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={resetDefaults}
              style={{
                padding: '7px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Content overlay */}
      {children && (
        <div style={{
          position: 'relative',
          zIndex: 5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
