import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import WaveBackground from './WaveBackground.js'
import { COLOR_THEMES, DEFAULTS, SLIDER_DEFS, getTimeOfDay, hexToHsv, hsvToHex } from './themes.js'

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
function ColorSwatch({ color, opacity, onColorChange, onOpacityChange, isMobile, panelRef }) {
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(() => hexToHsv(color))
  const ref = useRef()
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
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close popup when panel scrolls (desktop fixed positioning)
  useEffect(() => {
    if (!open || isMobile) return
    const panel = panelRef?.current
    if (!panel) return
    const onScroll = () => setOpen(false)
    panel.addEventListener('scroll', onScroll)
    return () => panel.removeEventListener('scroll', onScroll)
  }, [open, isMobile, panelRef])

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
  const pickerSize = 160

  // Compute fixed position for desktop popup, clamped within panel bounds
  let fixedPos = {}
  if (open && !isMobile && ref.current) {
    const swatchRect = ref.current.getBoundingClientRect()
    const popupW = pickerSize + 16
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
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{ width: 30, height: 30, borderRadius: 6, background: color, opacity, border: open ? '2px solid white' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'border-color 0.2s' }} />
      {open && (
        <div style={{ position: 'fixed', ...(isMobile ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : fixedPos), background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: 8, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8, width: isMobile ? 'min(80vw, 260px)' : pickerSize + 16 }}>
          <div ref={areaRef} onPointerDown={onAreaPointerDown} onPointerMove={onAreaPointerMove} onPointerUp={onAreaPointerUp} style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 6, background: hueColor, cursor: 'crosshair', touchAction: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #fff, transparent)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000, transparent)' }} />
            <div style={{ position: 'absolute', left: hsv.s * 100 + '%', top: (1 - hsv.v) * 100 + '%', width: 12, height: 12, borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 3px rgba(0,0,0,0.5)', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
          </div>
          <div {...hueBind} style={{ position: 'relative', width: '100%', height: 12, borderRadius: 6, background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)', cursor: 'pointer', touchAction: 'none' }}>
            <div style={{ position: 'absolute', left: hsv.h * 100 + '%', top: '50%', width: 14, height: 14, borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 3px rgba(0,0,0,0.5)', background: hueColor, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
          </div>
          <div {...alphaBind} style={{ position: 'relative', width: '100%', height: 12, borderRadius: 6, background: `linear-gradient(to right, transparent, ${currentColor})`, cursor: 'pointer', touchAction: 'none' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 6, zIndex: -1, backgroundImage: 'repeating-conic-gradient(rgba(255,255,255,0.12) 0% 25%, transparent 0% 50%)', backgroundSize: '8px 8px' }} />
            <div style={{ position: 'absolute', left: opacity * 100 + '%', top: '50%', width: 14, height: 14, borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 3px rgba(0,0,0,0.5)', background: currentColor, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['R', 'G', 'B'].map((ch, ci) => {
              const val = parseInt(currentColor.slice(1 + ci * 2, 3 + ci * 2), 16)
              return (
                <div key={ch} style={{ flex: 1, textAlign: 'center' }}>
                  <input type="number" min={0} max={255} value={val} onChange={(e) => {
                    const v = Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                    const parts = [parseInt(currentColor.slice(1, 3), 16), parseInt(currentColor.slice(3, 5), 16), parseInt(currentColor.slice(5, 7), 16)]
                    parts[ci] = v
                    const hex = '#' + parts.map(p => p.toString(16).padStart(2, '0')).join('')
                    setHsv(hexToHsv(hex)); onColorChange(hex)
                  }} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, color: 'white', fontSize: 11, textAlign: 'center', padding: '3px 0', fontFamily: 'monospace', outline: 'none' }} />
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{ch}</div>
                </div>
              )
            })}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <input type="number" min={0} max={100} value={Math.round(opacity * 100)} onChange={(e) => onOpacityChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, color: 'white', fontSize: 11, textAlign: 'center', padding: '3px 0', fontFamily: 'monospace', outline: 'none' }} />
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>A</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange }) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const decimals = step < 0.0001 ? 5 : step < 0.001 ? 4 : step < 0.01 ? 3 : step < 1 ? 2 : 0
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        <span>{label}</span>
        {editing ? (
          <input autoFocus type="number" min={min} max={max} step={step} value={editVal} onChange={e => setEditVal(e.target.value)} onBlur={() => { const v = parseFloat(editVal); if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v))); setEditing(false) }} onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }} style={{ width: 60, fontFamily: 'monospace', fontSize: 12, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 4, color: 'white', padding: '1px 4px', outline: 'none', textAlign: 'right' }} />
        ) : (
          <span onClick={(e) => { e.preventDefault(); setEditVal(decimals ? value.toFixed(decimals) : String(value)); setEditing(true) }} style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)', cursor: 'text', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>
            {decimals ? value.toFixed(decimals) : value}
          </span>
        )}
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%', height: 4, appearance: 'none', background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`, borderRadius: 2, outline: 'none', cursor: 'pointer' }} />
    </label>
  )
}

export default function HeroWave({ theme: themeProp, className, style, children }) {
  const containerRef = useRef()
  const waveRef = useRef(null)
  const panelRef = useRef()
  const [currentTheme, setCurrentTheme] = useState(themeProp || getTimeOfDay())
  const userPickedTheme = useRef(false)
  const [customColors, setCustomColors] = useState(null)
  const [colorOpacities, setColorOpacities] = useState([1, 1, 1, 1])
  const [panelOpen, setPanelOpen] = useState(true)
  const [params, setParams] = useState({ ...DEFAULTS })
  const [splitFill, setSplitFill] = useState(false)
  const [glass, setGlass] = useState(false)
  const [liquidMetal, setLiquidMetal] = useState(false)

  const [renderMode, setRenderMode] = useState('auto')

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const colors = currentTheme === 'custom' && customColors
    ? customColors
    : COLOR_THEMES[currentTheme] || COLOR_THEMES['sunrise']

  // Mount vanilla WaveBackground
  useEffect(() => {
    if (!containerRef.current) return
    const wave = new WaveBackground(containerRef.current, {
      theme: themeProp || getTimeOfDay(),
    })
    waveRef.current = wave
    setRenderMode(wave.renderMode)
    return () => wave.destroy()
  }, [])

  // Sync renderMode change
  const handleRenderModeChange = (mode) => {
    const w = waveRef.current
    if (!w) return
    w.setRenderMode(mode)
    setRenderMode(w.renderMode)
  }

  // Sync params to vanilla instance
  useEffect(() => {
    const w = waveRef.current
    if (!w) return
    Object.keys(params).forEach(k => w.setParam(k, params[k]))
    w.setSplitFill(splitFill)
    w.setGlass(glass)
    w.setLiquidMetal(liquidMetal)
    w.setColorOpacities(colorOpacities)
  }, [params, splitFill, glass, liquidMetal, colorOpacities])

  // Sync theme/colors
  useEffect(() => {
    const w = waveRef.current
    if (!w) return
    if (currentTheme === 'custom' && customColors) {
      w.setColors(customColors)
    } else if (COLOR_THEMES[currentTheme]) {
      w.setTheme(currentTheme)
    }
  }, [currentTheme, customColors])

  // Auto time-of-day
  useEffect(() => {
    if (themeProp) return
    const interval = setInterval(() => {
      if (!userPickedTheme.current) setCurrentTheme(getTimeOfDay())
    }, 60000)
    return () => clearInterval(interval)
  }, [themeProp])

  const setParam = (key, value) => setParams(p => ({ ...p, [key]: value }))
  const resetDefaults = () => {
    setParams({ ...DEFAULTS })
    setColorOpacities([1, 1, 1, 1])
    setSplitFill(false)
    setGlass(false)
    setLiquidMetal(false)
    userPickedTheme.current = false
    setCurrentTheme(getTimeOfDay())
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', ...style }}
    >
      {/* Control Panel */}
      <div style={{ position: 'absolute', top: isMobile ? 8 : 16, right: isMobile ? 8 : 16, left: isMobile ? 8 : 'auto', zIndex: 20, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <button onClick={() => setPanelOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: isMobile ? '100%' : 'auto', padding: '8px 14px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginLeft: isMobile ? 0 : 'auto' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Controls
        </button>

        {panelOpen && (
          <div ref={panelRef} style={{ marginTop: 8, width: isMobile ? '100%' : 260, maxHeight: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 80px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? 10 : 14, padding: isMobile ? '12px 14px' : '16px 18px', display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 14 }}>
            {SLIDER_DEFS.map(s => (
              <Slider key={s.key} label={s.label} value={params[s.key]} min={s.min} max={s.max} step={s.step} onChange={v => setParam(s.key, v)} />
            ))}

            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Color Theme</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.keys(COLOR_THEMES).map((name) => (
                  <button key={name} onClick={() => { userPickedTheme.current = true; setCurrentTheme(name) }} style={{ width: 30, height: 30, borderRadius: '50%', border: currentTheme === name ? '2px solid white' : '2px solid rgba(255,255,255,0.15)', background: `linear-gradient(135deg, ${COLOR_THEMES[name][1]}, ${COLOR_THEMES[name][2]})`, cursor: 'pointer', padding: 0, transition: 'border-color 0.2s, transform 0.2s', transform: currentTheme === name ? 'scale(1.15)' : 'scale(1)' }} title={name} />
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Custom Colors</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {colors.map((c, i) => (
                  <ColorSwatch key={i} color={c} opacity={colorOpacities[i]} isMobile={isMobile} panelRef={panelRef} onColorChange={(val) => {
                    const newColors = [...colors]; newColors[i] = val; setCustomColors(newColors)
                    userPickedTheme.current = true; setCurrentTheme('custom')
                  }} onOpacityChange={(val) => {
                    const newOpacities = [...colorOpacities]; newOpacities[i] = val; setColorOpacities(newOpacities)
                  }} />
                ))}
              </div>
            </div>

            {[{ label: 'Split Fill', value: splitFill, toggle: setSplitFill },
              { label: 'Glass', value: glass, toggle: setGlass },
              { label: 'Liquid Metal', value: liquidMetal, toggle: setLiquidMetal }].map(({ label, value, toggle }) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div onClick={() => toggle(v => !v)} style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid rgba(255,255,255,0.25)', background: value ? 'rgba(255,255,255,0.25)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {value && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
              </label>
            ))}

            {liquidMetal && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <Slider label="Liquify" value={params.lmLiquid} min={0} max={0.2} step={0.001} onChange={v => setParam('lmLiquid', v)} />
              </div>
            )}

            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Renderer</div>
              <select
                value={renderMode}
                onChange={e => handleRenderModeChange(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}
              >
                <option value="webgl2" style={{ background: '#222' }}>WebGL2 (GPU)</option>
                <option value="canvas2d" style={{ background: '#222' }}>Canvas 2D (CPU)</option>
                <option value="css" style={{ background: '#222' }}>CSS Gradient (Static)</option>
                <option value="none" style={{ background: '#222' }}>None (Solid Color)</option>
              </select>
            </div>

            <button onClick={resetDefaults} style={{ padding: '7px 0', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {children && (
        <div style={{ position: 'relative', zIndex: 5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>{children}</div>
        </div>
      )}
    </div>
  )
}
