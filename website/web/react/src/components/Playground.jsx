import { useState } from 'react'
import { Faders, Copy, Check } from '@phosphor-icons/react'

// Exact slider definitions from wave.js themes.js SLIDER_DEFS
const sliderDefs = [
  { key: 'waveCount', label: 'Waves', min: 1, max: 100, step: 1, default: 8 },
  { key: 'speed', label: 'Speed', min: 0, max: 2, step: 0.01, default: 0.3 },
  { key: 'amplitude', label: 'Amplitude', min: 0, max: 0.2, step: 0.001, default: 0.06 },
  { key: 'frequency', label: 'Frequency', min: 0.5, max: 10, step: 0.1, default: 2.5 },
  { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01, default: 0.6 },
  { key: 'thickness', label: 'Thickness (px)', min: 1, max: 100, step: 1, default: 1 },
  { key: 'blur', label: 'Blur (px)', min: 0, max: 200, step: 1, default: 30 },
  { key: 'concentration', label: 'Concentration', min: 0, max: 50, step: 0.1, default: 0 },
  { key: 'randomness', label: 'Randomness', min: 0, max: 1, step: 0.01, default: 0 },
  { key: 'thicknessRandom', label: 'Thickness Random', min: 0, max: 1, step: 0.01, default: 0 },
  { key: 'verticalOffset', label: 'Vertical Offset', min: -0.5, max: 0.5, step: 0.01, default: 0 },
  { key: 'rotation', label: 'Rotation (\u00B0)', min: 0, max: 360, step: 1, default: 0 },
]

// Real theme names from wave.js
const themes = [
  { name: 'sunset', label: 'Sunset', colors: ['from-purple-900', 'to-orange-400'] },
  { name: 'daytime', label: 'Daytime', colors: ['from-blue-900', 'to-emerald-300'] },
  { name: 'night', label: 'Night', colors: ['from-gray-950', 'to-violet-700'] },
  { name: 'sunrise', label: 'Sunrise', colors: ['from-purple-800', 'to-yellow-400'] },
  { name: 'dusk', label: 'Dusk', colors: ['from-purple-900', 'to-purple-300'] },
  { name: 'pre-dawn', label: 'Pre-Dawn', colors: ['from-purple-900', 'to-amber-600'] },
]

export default function Playground() {
  const [params, setParams] = useState(
    Object.fromEntries(sliderDefs.map(s => [s.key, s.default]))
  )
  const [activeTheme, setActiveTheme] = useState(0)
  const [mode, setMode] = useState('webgl2')
  const [copied, setCopied] = useState(false)

  const handleSlider = (key, val) => {
    setParams(prev => ({ ...prev, [key]: Number(val) }))
  }

  const formatValue = (def, val) => {
    if (def.step >= 1) return val
    if (def.step >= 0.01) return val.toFixed(2)
    return val.toFixed(3)
  }

  const handleCopy = () => {
    const config = JSON.stringify({
      renderer: mode,
      theme: themes[activeTheme].name,
      ...params
    }, null, 2)
    navigator.clipboard.writeText(config)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="playground" className="relative py-32 px-6 z-10 bg-void">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Design your wave.</h2>
          <p className="text-muted text-lg">Fine-tune all 12 parameters in real-time, then copy the config.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
          {/* Preview */}
          <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[700px] rounded-2xl border-gradient bg-surface overflow-hidden glow-box group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c101a] to-void" />
            <div
              className="absolute inset-0 opacity-80 transition-all duration-700 ease-in-out group-hover:opacity-100 group-hover:scale-105"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 70%, rgba(0, 240, 255, ${params.amplitude * 3}) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(139, 92, 246, ${params.frequency / 15}) 0%, transparent 50%)`,
                filter: `blur(${Math.max(params.blur * 0.3, 10)}px)`,
                transform: `rotate(${params.rotation}deg)`,
              }}
            />
            {/* HUD */}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <span className="px-2 py-1 bg-void/80 backdrop-blur border border-white/10 rounded text-[10px] font-mono text-teal">FPS: 60</span>
              <span className="px-2 py-1 bg-void/80 backdrop-blur border border-white/10 rounded text-[10px] font-mono text-muted">Waves: {params.waveCount}</span>
            </div>
            <div className="absolute bottom-4 right-4 text-xs font-mono text-white/20 z-10">
              Renderer: {mode === 'webgl2' ? 'WebGL2' : mode === 'canvas2d' ? 'Canvas 2D' : mode === 'css' ? 'CSS Gradient' : 'None'}
            </div>
            <div className="absolute bottom-4 left-4 text-xs font-mono text-white/20 z-10">
              Theme: {themes[activeTheme].name}
            </div>
          </div>

          {/* Controls */}
          <div className="border-gradient rounded-2xl bg-surface p-6 flex flex-col h-full max-h-[700px] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h3 className="font-display font-medium text-lg flex items-center gap-2">
                <Faders size={18} className="text-teal" /> Parameters
              </h3>
              <button
                onClick={handleCopy}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded transition-colors text-white font-medium flex items-center gap-2"
              >
                {copied ? <><Check size={12} className="text-teal" /> Copied</> : <><Copy size={12} /> Copy Config</>}
              </button>
            </div>

            {/* Renderer Mode */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider text-muted font-mono mb-3">Renderer</label>
              <div className="flex bg-void p-1 rounded-lg border border-white/5">
                {['webgl2', 'canvas2d', 'css', 'none'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${mode === m ? 'bg-white/10 text-white font-medium shadow' : 'text-muted hover:text-white'}`}
                  >
                    {m === 'webgl2' ? 'WebGL2' : m === 'canvas2d' ? 'Canvas' : m === 'css' ? 'CSS' : 'None'}
                  </button>
                ))}
              </div>
            </div>

            {/* All 12 Sliders */}
            <div className="space-y-4 flex-1">
              {sliderDefs.map(def => (
                <div key={def.key}>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-sm font-medium text-white/90">{def.label}</label>
                    <span className="text-xs font-mono text-muted">{formatValue(def, params[def.key])}</span>
                  </div>
                  <input
                    type="range"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={params[def.key]}
                    onChange={e => handleSlider(def.key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Color Themes */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <label className="block text-xs uppercase tracking-wider text-muted font-mono mb-3">Theme</label>
              <div className="grid grid-cols-6 gap-2">
                {themes.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => setActiveTheme(i)}
                    title={t.label}
                    className={`h-8 rounded-md bg-gradient-to-br ${t.colors.join(' ')} border-2 transition-all ${
                      activeTheme === i
                        ? 'border-white shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/50'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 text-[10px] font-mono text-muted text-center">
                {themes[activeTheme].label} — auto selects by time of day
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
