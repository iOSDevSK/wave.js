# wave.js — Full Documentation

GPU-accelerated animated sine wave backgrounds. Vanilla JS + React. WebGL2 → Canvas 2D → CSS fallback.

---

## Table of Contents

- [Installation](#installation)
- [Vanilla JS Usage](#vanilla-js-usage)
- [React Usage](#react-usage)
- [WaveBackground API](#wavebackground-api)
- [HeroWave React Component](#herowave-react-component)
- [Parameters Reference](#parameters-reference)
- [Color Themes](#color-themes)
- [Rendering Modes](#rendering-modes)
- [Fallback Chain](#fallback-chain)
- [Architecture](#architecture)
- [Performance](#performance)

---

## Installation

```bash
npm install wave.js
```

For React users:
```bash
npm install wave.js react react-dom
```

---

## Vanilla JS Usage

```js
import { WaveBackground } from 'wave.js'

// Mount on any container element
const wave = new WaveBackground('#my-hero', {
  theme: 'sunset',
  waveCount: 12,
  speed: 0.5,
  amplitude: 0.08,
})

// Update at runtime
wave.setParam('waveCount', 20)
wave.setTheme('night')
wave.setColors(['#ff0000', '#00ff00', '#0000ff', '#ffff00'])

// Cleanup
wave.destroy()
```

### Plain HTML

```html
<!DOCTYPE html>
<html>
<body>
  <div id="hero" style="width: 100%; height: 100vh;"></div>
  <script type="module">
    import { WaveBackground } from 'wave.js'
    new WaveBackground('#hero', { theme: 'daytime' })
  </script>
</body>
</html>
```

No React, no Three.js, no dependencies required.

---

## React Usage

```jsx
import { HeroWave } from 'wave.js/react'

function App() {
  return (
    <HeroWave theme="sunset">
      <h1>Your content here</h1>
    </HeroWave>
  )
}
```

The React component includes a built-in control panel with sliders, color picker, and effect toggles.

### React Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string` | auto (time-of-day) | Color theme name |
| `style` | `object` | `{}` | Container inline styles |
| `className` | `string` | — | Container CSS class |
| `children` | `ReactNode` | — | Content overlay |

---

## WaveBackground API

### Constructor

```js
new WaveBackground(container, options?)
```

**container**: DOM element or CSS selector string. The wave canvas will be inserted as the first child.

**options**: All parameters from the [Parameters Reference](#parameters-reference), plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `string` | auto | Color theme name |
| `splitFill` | `boolean` | `false` | One-directional fill mode |
| `glass` | `boolean` | `false` | Glass transparency effect |
| `liquidMetal` | `boolean` | `false` | Chrome/metal effect |
| `colorOpacities` | `number[]` | `[1,1,1,1]` | Per-color opacity |

### Methods

| Method | Description |
|--------|-------------|
| `setTheme(name)` | Switch theme with 1500ms animated transition |
| `setColors(hexArray)` | Set 4 custom hex colors with animated transition |
| `setParam(key, value)` | Update any wave parameter instantly |
| `setColorOpacities(arr)` | Set per-color opacity array |
| `setSplitFill(bool)` | Toggle split fill mode |
| `setGlass(bool)` | Toggle glass effect |
| `setLiquidMetal(bool)` | Toggle liquid metal effect |
| `destroy()` | Stop animation, remove canvas, cleanup all listeners |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `renderMode` | `string` | Active renderer: `'webgl2'`, `'webgl'`, `'canvas2d'`, or `'css'` |
| `params` | `object` | Current parameter values |
| `theme` | `string` | Current theme name |

---

## Parameters Reference

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| Waves | `waveCount` | `8` | 1 | 100 | 1 | Number of sine wave layers |
| Speed | `speed` | `0.30` | 0 | 2 | 0.01 | Animation speed multiplier |
| Amplitude | `amplitude` | `0.060` | 0 | 0.2 | 0.001 | Maximum wave height |
| Frequency | `frequency` | `2.5` | 0.5 | 10 | 0.1 | Horizontal wave density |
| Opacity | `opacity` | `0.60` | 0 | 1 | 0.01 | Global wave transparency |
| Thickness (px) | `thickness` | `1` | 1 | 100 | 1 | Wave solid core width in pixels |
| Blur (px) | `blur` | `30` | 0 | 200 | 1 | Edge fade zone in pixels |
| Concentration | `concentration` | `0` | 0 | 50 | 0.1 | Vertical compression toward center |
| Randomness | `randomness` | `0` | 0 | 1 | 0.01 | Per-wave amplitude variation |
| Thickness Random | `thicknessRandom` | `0` | 0 | 1 | 0.01 | Per-wave thickness variation |
| Vertical Offset | `verticalOffset` | `0` | -0.5 | 0.5 | 0.01 | Shift waves up/down |
| Rotation (°) | `rotation` | `0` | 0 | 360 | 1 | Rotate around screen center |
| Liquify | `lmLiquid` | `0.07` | 0 | 0.2 | 0.001 | Liquid Metal flow intensity |

---

## Color Themes

| Theme | Auto Time | Background | Colors |
|-------|-----------|------------|--------|
| `pre-dawn` | 05–08 | `#1a0033` | Magenta, orange, gold |
| `sunrise` | 08–11 | `#2d0a4e` | Hot pink, orange, yellow |
| `daytime` | 11–16 | `#0a1628` | Blue, cyan, mint |
| `dusk` | 16–20 | `#1a0533` | Violet, lavender, light purple |
| `sunset` | 20–23 | `#1a0033` | Pink, coral, orange |
| `night` | 23–05 | `#0d0221` | Dark purple, medium purple, violet |

---

## Rendering Modes

### Symmetric Band (default)
Waves render as symmetric bands with solid core (thickness) and soft fade (blur).

### Split Fill
Waves fill upward from wave line. Creates layered "stacked fill" effect.

### Glass
Semi-transparent waves with refraction, caustic highlights, and Fresnel rim glow. WebGL only.

### Liquid Metal
Smooth 3D chrome effect with iridescent tinting and simplex noise distortion. WebGL only.

---

## Fallback Chain

```
WebGL2 available? → GPU shader (all effects, 60 FPS)
    ↓ no
WebGL1 available? → GPU shader (all effects, 60 FPS)
    ↓ no
Canvas 2D available? → CPU rendering (animated waves, no glass/metal)
    ↓ no
CSS gradient → Static background with theme colors
```

Detection is automatic. Check `wave.renderMode` to see which renderer is active.

---

## Architecture

```
wave.js (vanilla entry)
  └─ WaveBackground class
       ├─ WebGLRenderer (raw WebGL2/1, GLSL shaders)
       ├─ Canvas2DRenderer (CPU sine wave drawing)
       └─ CSS fallback (linear-gradient)

wave.js/react (React entry)
  └─ HeroWave component
       ├─ Uses WaveBackground internally via useRef/useEffect
       └─ Control panel UI (React)
```

### File Structure

```
src/
  themes.js              Shared constants, color themes, helpers
  WaveBackground.js      Vanilla JS API class
  HeroWave.jsx           React component with control panel
  renderers/
    webgl.js             Raw WebGL2/1 fullscreen quad renderer
    canvas2d.js          Canvas 2D fallback renderer
  shaders/
    waveVertex.glsl      Fullscreen quad vertex shader
    waveFragment.glsl    Main fragment shader (sine waves, effects)
  index.js               Vanilla export: { WaveBackground }
  react.js               React export: { HeroWave, WaveBackground }
```

---

## Performance

- WebGL: All computation on GPU via fragment shader
- Canvas 2D: CPU draws sine wave paths — lighter than pixel shaders
- CSS: Zero runtime cost (static gradient)
- Canvas DPR capped at 2x for Retina
- Mouse smoothing via lerp (0.05 factor)
- Color transitions: 1500ms eased interpolation
- No Three.js dependency — raw WebGL2 with fullscreen quad
