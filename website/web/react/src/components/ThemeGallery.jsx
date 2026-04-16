import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { useState } from 'react'

// Real themes from wave.js themes.js with exact time-of-day ranges
const presets = [
  {
    name: 'Pre-Dawn',
    time: '05:00 – 08:00',
    desc: 'Deep purple, magenta, orange, gold',
    gradient: 'from-[#1a0033] via-[#d91aff] to-[#ffb347]',
  },
  {
    name: 'Sunrise',
    time: '08:00 – 11:00',
    desc: 'Dark purple, hot pink, orange, yellow',
    gradient: 'from-[#2d0a4e] via-[#ff29b0] to-[#ffd166]',
  },
  {
    name: 'Daytime',
    time: '11:00 – 16:00',
    desc: 'Navy, blue, cyan, mint',
    gradient: 'from-[#0a1628] via-[#4361ee] to-[#72efdd]',
  },
  {
    name: 'Dusk',
    time: '16:00 – 20:00',
    desc: 'Deep purple, violet, lavender',
    gradient: 'from-[#1a0533] via-[#7b2ff7] to-[#e0aaff]',
  },
  {
    name: 'Sunset',
    time: '20:00 – 23:00',
    desc: 'Purple, pink, coral, orange',
    gradient: 'from-[#1a0033] via-[#f394ff] to-[#fca311]',
  },
  {
    name: 'Night',
    time: '23:00 – 05:00',
    desc: 'Near-black, dark purple, violet',
    gradient: 'from-[#0d0221] via-[#3d1a78] to-[#9d4edd]',
  },
]

const GAP = 24

export default function ThemeGallery() {
  const [offset, setOffset] = useState(0)
  const canLeft = offset > 0
  const canRight = offset + 3 < presets.length

  const trackTransform = `translateX(calc(-${offset} * (100% + ${GAP}px) / 3))`

  return (
    <section className="py-24 border-y border-white/[0.02] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold mb-2">Sample Themes</h2>
          <p className="text-muted">Auto time-of-day detection or pick your own.</p>
        </div>

        {/* Row: arrow — thumbnails only — arrow, items-center = perfect Y center */}
        <div className="flex items-center">
          <button
            onClick={() => canLeft && setOffset(o => o - 1)}
            className={`shrink-0 w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center transition-all mr-4 ${
              canLeft ? 'hover:bg-white/10 hover:border-white/40 text-white/80 hover:text-white cursor-pointer' : 'text-white/15 border-white/10 cursor-default'
            }`}
          >
            <ArrowLeft size={18} weight="bold" />
          </button>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ gap: GAP, transform: trackTransform }}
            >
              {presets.map((p) => (
                <div
                  key={p.name}
                  className="shrink-0 aspect-video rounded-xl overflow-hidden border-gradient relative"
                  style={{ width: `calc((100% - ${GAP * 2}px) / 3)` }}
                >
                  <div className={`w-full h-full bg-gradient-to-br ${p.gradient} hover:scale-110 transition-transform duration-700`} />
                  <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => canRight && setOffset(o => o + 1)}
            className={`shrink-0 w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center transition-all ml-4 ${
              canRight ? 'hover:bg-white/10 hover:border-white/40 text-white/80 hover:text-white cursor-pointer' : 'text-white/15 border-white/10 cursor-default'
            }`}
          >
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>

        {/* Labels — same sliding offset, aligned under thumbnails */}
        <div className="overflow-hidden" style={{ marginLeft: 64, marginRight: 64 }}>
          <div
            className="flex transition-transform duration-500 ease-out mt-4"
            style={{ gap: GAP, transform: trackTransform }}
          >
            {presets.map((p) => (
              <div
                key={p.name}
                className="shrink-0"
                style={{ width: `calc((100% - ${GAP * 2}px) / 3)` }}
              >
                <h4 className="font-medium text-white">
                  {p.name} <span className="text-xs text-muted font-mono ml-1">{p.time}</span>
                </h4>
                <p className="text-sm font-mono text-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
