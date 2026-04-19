import { useEffect, useRef } from 'react'
import { WaveBackground } from '@redesigner/wave.js'
import config from './config.json'

// Same idea as the vanilla `from-json.html` example: the JSON shape matches
// the WaveBackground constructor options, so you drop it straight in.
//
// Use this component as your hero section; swap `config.json` for your own
// settings exported via the playground's "Copy JSON" button or via
// `wave.toJSON()` at runtime.
export default function AppFromJson() {
  const containerRef = useRef(null)
  const waveRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const wave = new WaveBackground(containerRef.current, config)
    waveRef.current = wave
    // Expose for devtools:
    window.wave = wave
    return () => wave.destroy()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100vh', background: '#000' }}
    >
      <div style={{
        position: 'relative', zIndex: 5, textAlign: 'center', paddingTop: '35vh',
        color: 'white', fontFamily: '-apple-system, sans-serif',
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: 0 }}>React + JSON</h1>
        <p style={{ marginTop: 8, opacity: 0.7 }}>
          Settings loaded from <code style={{ color: '#34d399' }}>src/config.json</code>.
        </p>
      </div>
    </div>
  )
}
