import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useState, useRef, useEffect } from 'react'
import PRESETS from '../presets'

const GAP = 24

function ThemeCard({ preset, isActive, onClick, isMobile }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {/* Gradient thumbnail */}
      <div
        className={`rounded-2xl overflow-hidden relative transition-all duration-300 ${
          isActive ? 'ring-2 ring-teal shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'ring-1 ring-white/10 hover:ring-white/25'
        }`}
      >
        <div
          className={`w-full ${isMobile ? 'aspect-[16/10]' : 'aspect-video'} hover:scale-105 transition-transform duration-700`}
          style={{ background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]}, ${preset.colors[2]}, ${preset.colors[3]})` }}
        />
        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.7)] pointer-events-none rounded-2xl" />
        {isActive && (
          <div className="absolute top-2 right-2 bg-teal text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">ACTIVE</div>
        )}
      </div>

      {/* Info — fixed height so all cards are same size */}
      <div className={`mt-3 ${isMobile ? 'h-[88px]' : 'h-[76px]'}`}>
        <h4 className={`font-medium transition-colors ${isMobile ? 'text-base' : 'text-sm'} ${isActive ? 'text-teal' : 'text-white'}`}>
          {preset.name}
        </h4>
        <p className="text-[11px] text-muted font-mono mt-0.5 truncate">{preset.desc}</p>
        <div className="flex gap-1.5 mt-2">
          {preset.colors.map((c, i) => (
            <div key={i} className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} rounded-md border border-white/20`} style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ThemeGallery({ onApplyPreset }) {
  const [offset, setOffset] = useState(0)
  const [activeIdx, setActiveIdx] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const touchStart = useRef(null)
  const touchDelta = useRef(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const visibleCount = isMobile ? 1 : 3
  const canLeft = offset > 0
  const canRight = offset + visibleCount < PRESETS.length

  const handleClick = (idx) => {
    setActiveIdx(idx)
    onApplyPreset?.(PRESETS[idx])
  }

  const goLeft = () => {
    if (!canLeft) return
    setOffset(o => o - 1)
  }
  const goRight = () => {
    if (!canRight) return
    setOffset(o => o + 1)
  }

  return (
    <section id="themes" className="py-16 md:py-24 border-y border-white/[0.02] relative overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 md:mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Sample Themes</h2>
          <p className="text-muted text-sm md:text-base">Tap a theme to apply it live.</p>
        </div>

        {isMobile ? (
          /* ===== MOBILE: sliding track with touch swipe ===== */
          <div>
            <div
              className="overflow-hidden"
              onTouchStart={e => { touchStart.current = e.touches[0].clientX; touchDelta.current = 0 }}
              onTouchMove={e => { touchDelta.current = e.touches[0].clientX - touchStart.current }}
              onTouchEnd={() => {
                if (touchDelta.current < -50 && canRight) goRight()
                else if (touchDelta.current > 50 && canLeft) goLeft()
                touchStart.current = null
                touchDelta.current = 0
              }}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ gap: GAP, transform: `translateX(calc(-${offset} * (100% + ${GAP}px)))` }}
              >
                {PRESETS.map((p, i) => (
                  <div key={p.name} className="shrink-0 w-full">
                    <ThemeCard
                      preset={p}
                      isActive={activeIdx === i}
                      onClick={() => handleClick(i)}
                      isMobile
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center items-center gap-5 mt-6">
              <button
                onClick={goLeft}
                className={`w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center transition-all ${
                  canLeft ? 'text-white/80 active:bg-white/10' : 'text-white/15 border-white/10'
                }`}
              >
                <ArrowLeft size={16} weight="bold" />
              </button>
              <span className="text-sm font-mono text-muted min-w-[3rem] text-center">{offset + 1} / {PRESETS.length}</span>
              <button
                onClick={goRight}
                className={`w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center transition-all ${
                  canRight ? 'text-white/80 active:bg-white/10' : 'text-white/15 border-white/10'
                }`}
              >
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        ) : (
          /* ===== DESKTOP: 3 cards with arrows inline ===== */
          <div className="flex items-start gap-4">
            {/* Left arrow */}
            <div className="shrink-0 pt-[calc((100%-80px)/3*9/16/2-24px)]">
              <button
                onClick={goLeft}
                className={`w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center transition-all ${
                  canLeft ? 'hover:bg-white/10 hover:border-white/40 text-white/80 hover:text-white cursor-pointer' : 'text-white/15 border-white/10 cursor-default'
                }`}
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
            </div>

            {/* Cards track */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ gap: GAP, transform: `translateX(calc(-${offset} * (100% + ${GAP}px) / 3))` }}
              >
                {PRESETS.map((p, i) => (
                  <div
                    key={p.name}
                    className="shrink-0"
                    style={{ width: `calc((100% - ${GAP * 2}px) / 3)` }}
                  >
                    <ThemeCard
                      preset={p}
                      isActive={activeIdx === i}
                      onClick={() => handleClick(i)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right arrow */}
            <div className="shrink-0 pt-[calc((100%-80px)/3*9/16/2-24px)]">
              <button
                onClick={goRight}
                className={`w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center transition-all ${
                  canRight ? 'hover:bg-white/10 hover:border-white/40 text-white/80 hover:text-white cursor-pointer' : 'text-white/15 border-white/10 cursor-default'
                }`}
              >
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
