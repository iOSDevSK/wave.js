# wave.js — React Test

This is a minimal test project that demonstrates how to use `@redesigner/wave.js` with React via the `HeroWave` component.

## Installation

```bash
npm install
```

This installs `@redesigner/wave.js`, `react`, and `react-dom` from npm.

## Run

```bash
npm run dev
```

Opens at http://localhost:3002

## Implementation

### 1. Install the package

```bash
npm install @redesigner/wave.js react react-dom
```

React is an optional peer dependency — only needed when using the `HeroWave` component.

### 2. Import the React component

```jsx
import { HeroWave } from '@redesigner/wave.js/react'
```

Note the `/react` subpath — this imports the React component, not the vanilla class.

### 3. Basic usage

```jsx
function App() {
  return (
    <HeroWave theme="sunset">
      <h1>Your content here</h1>
    </HeroWave>
  )
}
```

This renders a full-viewport animated wave background with your content centered on top. A built-in control panel appears in the top-right corner.

### 4. HeroWave props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string` | auto (time-of-day) | Color theme name |
| `style` | `object` | `{}` | Container inline styles |
| `className` | `string` | — | Container CSS class |
| `children` | `ReactNode` | — | Content rendered on top of waves |

### 5. Examples used in this test

#### Full-screen with glassmorphism card

```jsx
<HeroWave theme="sunset">
  <div style={{
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: '40px 60px',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  }}>
    <h1 style={{ color: 'white' }}>React Test</h1>
    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
      @redesigner/wave.js installed from npm
    </p>
  </div>
</HeroWave>
```

The glass card floats above the wave animation. `backdropFilter: blur(20px)` creates the frosted glass effect using the waves as the blurred background.

#### Half-height section with fixed theme

```jsx
<HeroWave theme="night" style={{ height: '50vh' }}>
  <h2 style={{ color: 'white' }}>Night Theme — 50vh</h2>
</HeroWave>
```

Override the default full-viewport height with `style={{ height: '50vh' }}`. The theme is locked to `'night'` and won't auto-change by time of day.

#### Pure background (no content)

```jsx
<HeroWave theme="daytime" style={{ height: '50vh' }} />
```

No children — renders just the animated wave background. Useful as a decorative section divider.

#### Multiple sections

```jsx
function Page() {
  return (
    <>
      <HeroWave theme="sunset">
        <h1>Section 1</h1>
      </HeroWave>
      <HeroWave theme="night" style={{ height: '50vh' }}>
        <h2>Section 2</h2>
      </HeroWave>
      <HeroWave theme="daytime" style={{ height: '50vh' }} />
    </>
  )
}
```

Each `HeroWave` creates its own independent `WaveBackground` instance with separate animation, theme, and controls.

### 6. Built-in control panel

The `HeroWave` component includes a full control panel (top-right corner) with:

- **12 parameter sliders** — Waves, Speed, Amplitude, Frequency, Opacity, Thickness, Blur, Concentration, Randomness, Thickness Random, Vertical Offset, Rotation
- **Click-to-edit values** — Click any slider value to type a precise number
- **6 color theme buttons** — pre-dawn, sunrise, daytime, dusk, sunset, night
- **4 custom color swatches** — Click to open HSV color picker with RGB inputs and opacity slider
- **3 effect toggles** — Split Fill, Glass, Liquid Metal
- **Liquify sub-slider** — Appears when Liquid Metal is enabled
- **Renderer selector** — WebGL2 (GPU), Canvas 2D (CPU), CSS Gradient (Static), None (Solid Color)
- **Reset to defaults** — Restores all parameters, colors, and toggles

The panel can be toggled with the "Controls" button.

### 7. How it works internally

The `HeroWave` component:

1. Creates a container `<div>` with `position: relative; overflow: hidden`
2. On mount, instantiates a vanilla `WaveBackground` inside it via `useRef` + `useEffect`
3. Renders children with `position: relative; z-index: 5` so they appear above the canvas
4. Syncs all React state (sliders, toggles, colors) to the vanilla instance via `useEffect`
5. Calls `wave.destroy()` on unmount to clean up canvas, animation loop, and event listeners

### 8. Using vanilla API in React

If you need more control, you can use the vanilla `WaveBackground` class directly in React:

```jsx
import { useRef, useEffect } from 'react'
import { WaveBackground } from '@redesigner/wave.js'

function CustomWave() {
  const containerRef = useRef()
  const waveRef = useRef()

  useEffect(() => {
    const wave = new WaveBackground(containerRef.current, {
      theme: 'dusk',
      waveCount: 20,
      glass: true,
    })
    waveRef.current = wave
    return () => wave.destroy()
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 5, color: 'white', padding: '2rem' }}>
        <h1>Custom implementation</h1>
        <button onClick={() => waveRef.current?.setTheme('night')}>
          Switch to Night
        </button>
      </div>
    </div>
  )
}
```

This gives you full control over the wave instance without the built-in control panel.

### 9. Loading settings from JSON (React)

When you want the "one config, many renders" flow — e.g. you exported settings
from the playground's **Copy JSON** button — import the JSON and hand it
straight to the constructor. The shape matches the options 1-to-1:

```jsx
import { useEffect, useRef } from 'react'
import { WaveBackground } from '@redesigner/wave.js'
import config from './config.json'

export default function AppFromJson() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const wave = new WaveBackground(containerRef.current, config)
    return () => wave.destroy()
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
```

See `src/AppFromJson.jsx` + `src/config.json` in this folder. To swap configs
at runtime without remounting, use `wave.setConfig(newJson)`.

## File structure

```
examples/react/
  src/
    App.jsx           — Three HeroWave sections (sunset, night, daytime)
    AppFromJson.jsx   — Loads settings from config.json (JSON-driven usage)
    config.json       — Example exported settings (Twist preset)
    main.jsx          — React entry point
    index.css         — Minimal reset
  index.html          — HTML shell
  package.json        — Dependencies: @redesigner/wave.js, react, react-dom
  vite.config.js      — Vite config with React plugin
  README.md           — This file
```

## Browser support

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+
