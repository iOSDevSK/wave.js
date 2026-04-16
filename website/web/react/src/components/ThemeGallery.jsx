import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useState, useRef, useEffect } from 'react'
import PRESETS from '../presets'

const GAP = 24

export default function ThemeGallery({ onApplyPreset }) {
  const [offset, setOffset] = useState(0)
  const [activeIdx, setActiveIdx] = useState(null)
  const canLeft = offset > 0
  const canRight = offset + 3 < PRESETS.length
  const thumbsRef = useRef(null)
  const [thumbH, setThumbH] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (thumbsRef.current) {
        const first = thumbsRef.current.querySelector('[data-thumb]')
        if (first) setThumbH(first.offsetHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const trackTransform = `translateX(calc(-${offset} * (100% + ${GAP}px) / 3))`

  const handleClick = (idx) => {
    setActiveIdx(idx)
    onApplyPreset?.(PRESETS[idx])
  }

  return (
    <section id="themes" className="py-24 border-y border-white/[0.02] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold mb-2">Sample Themes</h2>
          <p className="text-muted">Click a theme to apply it live.</p>
        </div>

        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => canLeft && setOffset(o => o - 1)}
            className={`absolute z-10 w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center transition-all -left-16 ${
              canLeft ? 'hover:bg-white/10 hover:border-white/40 text-white/80 hover:text-white cursor-pointer' : 'text-white/15 border-white/10 cursor-default'
            }`}
            style={{ top: thumbH ? thumbH / 2 - 24 : 0 }}
          >
            <ArrowLeft size={18} weight="bold" />
          </button>

          {/* Right arrow */}
          <button
            onClick={() => canRight && setOffset(o => o + 1)}
            className={`absolute z-10 w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center transition-all -right-16 ${
              canRight ? 'hover:bg-white/10 hover:border-white/40 text-white/80 hover:text-white cursor-pointer' : 'text-white/15 border-white/10 cursor-default'
            }`}
            style={{ top: thumbH ? thumbH / 2 - 24 : 0 }}
          >
            <ArrowRight size={18} weight="bold" />
          </button>

          {/* Thumbnails */}
          <div className="overflow-hidden" ref={thumbsRef}>
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ gap: GAP, transform: trackTransform }}
            >
              {PRESETS.map((p, i) => (
                <div
                  key={p.name}
                  data-thumb
                  onClick={() => handleClick(i)}
                  className={`shrink-0 aspect-video rounded-xl overflow-hidden relative cursor-pointer transition-all duration-300 ${
                    activeIdx === i ? 'ring-2 ring-teal shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'hover:ring-1 hover:ring-white/30'
                  }`}
                  style={{ width: `calc((100% - ${GAP * 2}px) / 3)` }}
                >
                  <div
                    className="w-full h-full transition-transform duration-700 hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]}, ${p.colors[2]}, ${p.colors[3]})` }}
                  />
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />
                  {activeIdx === i && (
                    <div className="absolute top-2 right-2 bg-teal text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">ACTIVE</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out mt-4"
              style={{ gap: GAP, transform: trackTransform }}
            >
              {PRESETS.map((p, i) => (
                <div
                  key={p.name}
                  className="shrink-0 cursor-pointer"
                  style={{ width: `calc((100% - ${GAP * 2}px) / 3)` }}
                  onClick={() => handleClick(i)}
                >
                  <h4 className={`font-medium transition-colors ${activeIdx === i ? 'text-teal' : 'text-white hover:text-teal'}`}>
                    {p.name}
                    <span className="text-xs text-muted font-mono ml-2">{p.desc}</span>
                  </h4>
                  <div className="flex gap-1.5 mt-1.5">
                    {p.colors.map((c, ci) => (
                      <div key={ci} className="w-4 h-4 rounded-sm border border-white/20" style={{ background: c }} />
                    ))}
                    <span className="text-[10px] text-muted font-mono ml-1 self-center">
                      {p.renderer === 'webgl2' ? 'WebGL2' : p.renderer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
