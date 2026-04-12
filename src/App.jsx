import HeroWave from './HeroWave'
import './App.css'

function App() {
  return (
    <HeroWave>
      <h1 style={{
        fontSize: 'clamp(2rem, 6vw, 4.5rem)',
        fontWeight: 700,
        color: 'white',
        textAlign: 'center',
        maxWidth: '800px',
        lineHeight: 1.1,
        textShadow: '0 2px 40px rgba(0,0,0,0.3)',
        margin: '0 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        Financial infrastructure to grow your revenue.
      </h1>
      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '24px 24px 0',
        lineHeight: 1.5,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        Accept payments, offer financial services and implement custom revenue models.
      </p>
      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <button style={{
          padding: '14px 28px',
          fontSize: '1rem',
          fontWeight: 600,
          border: 'none',
          borderRadius: 999,
          background: '#635bff',
          color: 'white',
          cursor: 'pointer',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          Get started
        </button>
        <button style={{
          padding: '14px 28px',
          fontSize: '1rem',
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          cursor: 'pointer',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          Contact sales
        </button>
      </div>
    </HeroWave>
  )
}

export default App
