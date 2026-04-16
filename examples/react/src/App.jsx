import { HeroWave } from '@redesigner/wave.js/react'

function App() {
  return (
    <HeroWave theme="sunset">
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        padding: '40px 60px',
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}>
        <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
          React Test
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: '1.1rem' }}>
          @redesigner/wave.js installed from npm
        </p>
      </div>
    </HeroWave>
  )
}

export default App
