# wave.js — Full Documentation

GPU-accelerated animated sine wave backgrounds. Vanilla JS + React. Automatic fallback: WebGL2 → Canvas 2D → CSS gradient → solid color.

---

## Table of Contents

- [Installation](#installation)
- [Vanilla JS Usage](#vanilla-js-usage)
- [React Usage](#react-usage)
- [WaveBackground API](#wavebackground-api)
- [HeroWave React Component](#herowave-react-component)
- [Parameters Reference](#parameters-reference)
- [Renderers](#renderers)
- [Color Themes](#color-themes)
- [Rendering Modes](#rendering-modes)
- [Examples](#examples)
- [Architecture](#architecture)
- [Performance](#performance)

---

## Installation

```bash
npm install @redesigner/wave.js
```

For React users:

```bash
npm install @redesigner/wave.js react react-dom
```

---

## Vanilla JS Usage

### Basic

```js
import { WaveBackground } from '@redesigner/wave.js'

const wave = new WaveBackground('#hero', {
  theme: 'sunset',
})
```

The wave canvas is automatically created and inserted into the container. WebGL2 is used if available, with automatic fallback to Canvas 2D, then CSS gradient.

### Specifying a renderer

```js
// Auto-detect (default)
new WaveBackground('#hero', { renderer: 'auto' })

// Force WebGL2
new WaveBackground('#hero', { renderer: 'webgl2' })

// Force Canvas 2D (no GPU required)
new WaveBackground('#hero', { renderer: 'canvas2d' })

// Static CSS gradient (no animation)
new WaveBackground('#hero', { renderer: 'css' })

// Solid background color only (zero cost)
new WaveBackground('#hero', { renderer: 'none' })
```

### Switching renderer at runtime

```js
const wave = new WaveBackground('#hero')

console.log(wave.renderMode) // 'webgl2' (auto-detected)

wave.setRenderMode('canvas2d') // Switch to CPU
wave.setRenderMode('css')      // Static gradient
wave.setRenderMode('none')     // Solid color
wave.setRenderMode('webgl2')   // Back to GPU
```

### Custom parameters

```js
const wave = new WaveBackground('#hero', {
  theme: 'night',
  waveCount: 20,
  speed: 0.8,
  amplitude: 0.1,
  frequency: 4,
  opacity: 0.8,
  thickness: 5,
  blur: 50,
  concentration: 10,
  randomness: 0.5,
  rotation: 30,
  glass: true,
})
```

### Updating parameters at runtime

```js
wave.setParam('waveCount', 50)
wave.setParam('speed', 1.5)
wave.setParam('rotation', 90)
wave.setParam('thickness', 20)
```

### Theme control

```js
// Switch with animated 1500ms transition
wave.setTheme('sunset')

// Set custom colors (also animated)
wave.setColors(['#1a0033', '#ff00ff', '#00ffff', '#ffff00'])

// Per-color opacity
wave.setColorOpacities([1, 0.5, 0.8, 1])
```

### Effect toggles

```js
wave.setSplitFill(true)
wave.setGlass(true)
wave.setLiquidMetal(true)
wave.setParam('lmLiquid', 0.15) // Adjust liquify intensity
```

### Cleanup

```js
wave.destroy()
```

Removes the canvas, stops the animation loop, and removes all event listeners.

### Plain HTML (no bundler)

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    #hero { width: 100%; height: 100vh; position: relative; }
    .content { position: relative; z-index: 5; color: white; text-align: center; padding-top: 40vh; }
  </style>
</head>
<body>
  <div id="hero">
    <div class="content">
      <h1>Hello World</h1>
    </div>
  </div>
  <script type="module">
    import { WaveBackground } from '@redesigner/wave.js'
    new WaveBackground('#hero', {
      theme: 'sunset',
      waveCount: 12,
    })
  </script>
</body>
</html>
```

---

## React Usage

### Basic

```jsx
import { HeroWave } from '@redesigner/wave.js/react'

function App() {
  return (
    <HeroWave theme="sunset">
      <h1>Your content here</h1>
    </HeroWave>
  )
}
```

The React component renders a full-viewport wave background with a built-in control panel. The panel includes sliders for all parameters, color theme selector, color picker, effect toggles, and a renderer selector.

### With a fixed theme

```jsx
<HeroWave theme="night">
  <h1>Always night</h1>
</HeroWave>
```

### Custom height

```jsx
<HeroWave style={{ height: '50vh' }}>
  <h1>Half screen</h1>
</HeroWave>
```

### Multiple sections

```jsx
function Page() {
  return (
    <>
      <HeroWave theme="daytime" style={{ height: '50vh' }}>
        <h1>Section One</h1>
      </HeroWave>
      <HeroWave theme="sunset" style={{ height: '50vh' }}>
        <h1>Section Two</h1>
      </HeroWave>
    </>
  )
}
```

### Pure background (no content)

```jsx
<HeroWave theme="night" />
```

### Glassmorphism card overlay

```jsx
<HeroWave theme="dusk">
  <div style={{
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: '40px 60px',
    border: '1px solid rgba(255,255,255,0.1)',
  }}>
    <h1 style={{ color: 'white' }}>Glass Card</h1>
    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Glassmorphism effect.</p>
  </div>
</HeroWave>
```

---

## WaveBackground API

### Constructor

```js
new WaveBackground(container, options?)
```

**container** — DOM element or CSS selector string. The wave canvas is inserted as the first child of this element.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderer` | `string` | `'auto'` | Renderer: `'auto'`, `'webgl2'`, `'canvas2d'`, `'css'`, `'none'` |
| `theme` | `string` | auto (time-of-day) | Color theme name |
| `waveCount` | `number` | `8` | Number of wave layers (1–100) |
| `speed` | `number` | `0.3` | Animation speed (0–2) |
| `amplitude` | `number` | `0.06` | Wave height (0–0.2) |
| `frequency` | `number` | `2.5` | Wave density (0.5–10) |
| `opacity` | `number` | `0.6` | Wave transparency (0–1) |
| `thickness` | `number` | `1` | Wave solid core in px (1–100) |
| `blur` | `number` | `30` | Edge fade in px (0–200) |
| `concentration` | `number` | `0` | Vertical compression (0–50) |
| `randomness` | `number` | `0` | Per-wave amplitude variation (0–1) |
| `thicknessRandom` | `number` | `0` | Per-wave thickness variation (0–1) |
| `verticalOffset` | `number` | `0` | Vertical shift (-0.5–0.5) |
| `rotation` | `number` | `0` | Rotation in degrees (0–360) |
| `splitFill` | `boolean` | `false` | One-directional fill mode |
| `glass` | `boolean` | `false` | Glass effect (WebGL only) |
| `liquidMetal` | `boolean` | `false` | Liquid metal effect (WebGL only) |
| `lmLiquid` | `number` | `0.07` | Liquid metal flow intensity (0–0.2) |
| `colorOpacities` | `number[]` | `[1,1,1,1]` | Per-color opacity |
| `pixelRatio` | `number` | `1` | Canvas pixel ratio cap. Higher values = sharper on retina but 4× GPU cost at 2×. Soft wave content looks identical at 1. |
| `maxFPS` | `number` | `60` | FPS throttle. Set `0` to uncap. Default 60 avoids doubled GPU work on 120Hz ProMotion displays. |

### Methods

| Method | Description |
|--------|-------------|
| `setRenderMode(mode)` | Switch renderer: `'webgl2'`, `'canvas2d'`, `'css'`, `'none'` |
| `setTheme(name)` | Switch theme with 1500ms animated transition |
| `setColors(hexArray)` | Set 4 custom hex colors with animated transition |
| `setParam(key, value)` | Update any parameter instantly |
| `setColorOpacities(arr)` | Set per-color opacity array |
| `setSplitFill(bool)` | Toggle split fill mode |
| `setGlass(bool)` | Toggle glass effect |
| `setLiquidMetal(bool)` | Toggle liquid metal effect |
| `setPixelRatio(ratio)` | Change canvas pixel ratio and resize. Useful for trading sharpness for GPU. |
| `setMaxFPS(fps)` | Change FPS cap at runtime. Pass `0` to uncap. |
| `destroy()` | Stop animation, remove canvas, cleanup listeners |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `renderMode` | `string` | Active renderer: `'webgl2'`, `'canvas2d'`, `'css'`, or `'none'` |
| `params` | `object` | Current parameter values |
| `theme` | `string` | Current theme name |

---

## HeroWave React Component

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string` | auto (time-of-day) | Color theme |
| `style` | `object` | `{}` | Container styles |
| `className` | `string` | — | Container CSS class |
| `children` | `ReactNode` | — | Content overlay |

The control panel is built into the component and includes:
- 12 parameter sliders with editable values (click to type)
- 6 color theme buttons
- 4 custom color swatches with RGBA picker
- Split Fill, Glass, Liquid Metal toggles
- Liquify sub-parameter (when Liquid Metal is on)
- Renderer selector (WebGL2 / Canvas 2D / CSS Gradient / None)
- Reset to defaults button

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
| Rotation | `rotation` | `0` | 0 | 360 | 1 | Rotate around screen center |
| Liquify | `lmLiquid` | `0.07` | 0 | 0.2 | 0.001 | Liquid Metal flow intensity |

---

## Renderers

| Mode | Description | GPU | Animated | Effects |
|------|-------------|-----|----------|---------|
| `webgl2` | Full GLSL fragment shader | Yes | Yes | All (glass, liquid metal, film grain, smoothstep edges) |
| `canvas2d` | CPU-based Canvas 2D line drawing | No | Yes | Waves, colors, opacity, thickness, rotation |
| `css` | Static CSS linear-gradient | No | No | 4-color gradient from theme |
| `none` | Solid background color | No | No | Background color only (first theme color) |

### Auto-detection (default)

When `renderer` is `'auto'` or omitted:

```
WebGL2 available? → webgl2
    ↓ no
Canvas 2D available? → canvas2d
    ↓ no
→ css
```

### Manual selection

```js
// At creation
new WaveBackground('#hero', { renderer: 'canvas2d' })

// At runtime
wave.setRenderMode('none')
```

Theme changes update all renderers:
- **webgl2** / **canvas2d** — animated color transition
- **css** — gradient updates immediately
- **none** — solid background color updates immediately

---

## Color Themes

| Theme | Auto Time | Background | Wave Colors |
|-------|-----------|------------|-------------|
| `pre-dawn` | 05:00–08:00 | `#1a0033` | `#d91aff`, `#ff6b35`, `#ffb347` |
| `sunrise` | 08:00–11:00 | `#2d0a4e` | `#ff29b0`, `#ff8c42`, `#ffd166` |
| `daytime` | 11:00–16:00 | `#0a1628` | `#4361ee`, `#48bfe3`, `#72efdd` |
| `dusk` | 16:00–20:00 | `#1a0533` | `#7b2ff7`, `#c77dff`, `#e0aaff` |
| `sunset` | 20:00–23:00 | `#1a0033` | `#f394ff`, `#ff6b6b`, `#fca311` |
| `night` | 23:00–05:00 | `#0d0221` | `#3d1a78`, `#6b3fa0`, `#9d4edd` |

Each theme has 4 colors: 1 background + 3 wave gradient stops.

When no theme is specified, auto-selection runs based on the user's local time and re-checks every 60 seconds. Manually selecting a theme disables auto-selection until reset.

---

## Rendering Modes

### Symmetric Band (default)

Waves render as symmetric bands with a solid core (thickness in px) and soft fade (blur in px):

```
edge = 1.0 - smoothstep(thick, thick + blur, distance)
```

### Split Fill

Waves fill upward from the wave line, creating a layered "stacked" look.

### Glass (WebGL only)

Semi-transparent waves with:
- Background bleed-through (40% transparency)
- Refraction tint from wave slope
- Caustic highlights (animated sine patterns)
- Fresnel rim glow
- Specular highlight on wave crest

### Liquid Metal (WebGL only)

Smooth 3D chrome effect with:
- Simplex noise surface distortion (3 layers)
- Fake environment reflection mapping
- Iridescent color tinting from wave hue
- Specular and Fresnel highlights
- Adjustable via `lmLiquid` parameter (0–0.2)

---

## Examples

### Vanilla JS — Low-power fallback

```js
import { WaveBackground } from '@redesigner/wave.js'

const wave = new WaveBackground('#hero', {
  renderer: 'canvas2d',
  theme: 'sunset',
  waveCount: 5,
  speed: 0.2,
})
```

### Vanilla JS — No effects for accessibility

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

new WaveBackground('#hero', {
  renderer: prefersReduced ? 'none' : 'auto',
  theme: 'daytime',
})
```

### Vanilla JS — Dynamic renderer based on device

```js
const isMobile = /Mobi|Android/i.test(navigator.userAgent)

new WaveBackground('#hero', {
  renderer: isMobile ? 'canvas2d' : 'webgl2',
  waveCount: isMobile ? 5 : 20,
})
```

### React — Conditional rendering

```jsx
import { HeroWave } from '@redesigner/wave.js/react'

function App() {
  return (
    <HeroWave theme="dusk">
      <h1>Welcome</h1>
      <p>Waves adapt to your device capabilities.</p>
    </HeroWave>
  )
}
```

---

## Architecture

```
@redesigner/wave.js (vanilla entry)
  └─ WaveBackground class
       ├─ WebGLRenderer (raw WebGL2, GLSL shaders, fullscreen quad)
       ├─ Canvas2DRenderer (CPU sine wave path drawing)
       ├─ CSS fallback (linear-gradient on container)
       └─ None fallback (solid background color)

@redesigner/wave.js/react (React entry)
  └─ HeroWave component
       ├─ Uses WaveBackground internally via useRef/useEffect
       └─ Control panel UI (sliders, color picker, toggles, renderer select)
```

### File Structure

```
src/
  themes.js              Shared constants, color themes, helper functions
  WaveBackground.js      Vanilla JS API class with renderer management
  HeroWave.jsx           React component with control panel
  renderers/
    webgl.js             Raw WebGL2 fullscreen quad renderer
    canvas2d.js          Canvas 2D fallback renderer
  shaders/
    waveVertex.glsl      Fullscreen quad vertex shader
    waveFragment.glsl    Fragment shader (waves, glass, liquid metal, grain)
  index.js               Vanilla export: { WaveBackground, COLOR_THEMES, DEFAULTS, getTimeOfDay }
  react.js               React export: { HeroWave, WaveBackground, COLOR_THEMES, DEFAULTS, getTimeOfDay }
```

---

## Performance

| Renderer | GPU | CPU per frame | Best for |
|----------|-----|---------------|----------|
| `webgl2` | Active | Minimal (uniform updates) | Desktop, modern mobile |
| `canvas2d` | None | Moderate (path drawing) | Older devices, no GPU |
| `css` | None | Zero | Static backgrounds |
| `none` | None | Zero | Accessibility, minimal mode |

- Canvas DPR capped at `min(devicePixelRatio, 2)` for Retina
- Mouse position smoothed via lerp (0.05 factor per frame)
- Color transitions: 1500ms eased cubic interpolation
- WebGL shader loop capped at 100 wave iterations
- No Three.js dependency — raw WebGL2 with a single fullscreen quad
