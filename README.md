# wave.js

GPU-accelerated animated sine wave backgrounds. Works with **vanilla JS** and **React**. Built with raw WebGL2 + custom GLSL shaders. Automatic fallback chain: WebGL2 → Canvas 2D → CSS gradient → solid color.

> **Full documentation: [DOCS.md](DOCS.md)**

## Features

- **Zero dependencies** for vanilla JS — no Three.js, no React required
- WebGL2 GPU rendering at 60 FPS
- Automatic fallback: WebGL2 → Canvas 2D (CPU) → CSS gradient (static) → solid color (none)
- User-selectable renderer via `renderer` option or `setRenderMode()` at runtime
- 12 adjustable parameters (waves, speed, amplitude, frequency, opacity, thickness, blur, concentration, randomness, thickness randomness, vertical offset, rotation)
- 6 built-in color themes with automatic time-of-day selection
- Custom RGBA color picker with per-color opacity
- Glass effect, Liquid Metal effect, Split Fill mode
- Rotation (0–360°) around screen center
- Mouse-reactive wave distortion
- Smooth 1500ms color transitions between themes
- Film grain post-processing (WebGL only)
- React component with built-in control panel
- Responsive on mobile
- Retina / HiDPI support (capped at 2x)

## Installation

```bash
npm install @redesigner/wave.js
```

## Vanilla JS

```js
import { WaveBackground } from '@redesigner/wave.js'

const wave = new WaveBackground('#hero', {
  theme: 'sunset',
  waveCount: 12,
  speed: 0.5,
})
```

### Force a specific renderer

```js
// Force Canvas 2D (no GPU)
const wave = new WaveBackground('#hero', {
  renderer: 'canvas2d',
})

// Force no effects at all
const wave = new WaveBackground('#hero', {
  renderer: 'none',
  theme: 'night',
})
```

### Switch renderer at runtime

```js
wave.setRenderMode('canvas2d')  // Switch to CPU rendering
wave.setRenderMode('css')       // Static gradient
wave.setRenderMode('none')      // Solid background color
wave.setRenderMode('webgl2')    // Back to GPU
```

### Update parameters

```js
wave.setParam('waveCount', 20)
wave.setParam('amplitude', 0.1)
wave.setParam('rotation', 45)
wave.setTheme('night')
wave.setColors(['#ff0000', '#00ff00', '#0000ff', '#ffff00'])
wave.setSplitFill(true)
wave.setGlass(true)
wave.setLiquidMetal(true)
```

### Cleanup

```js
wave.destroy()
```

### Plain HTML (no bundler)

```html
<div id="hero" style="width: 100%; height: 100vh;"></div>
<script type="module">
  import { WaveBackground } from '@redesigner/wave.js'
  new WaveBackground('#hero', { theme: 'daytime' })
</script>
```

## React

```bash
npm install @redesigner/wave.js react react-dom
```

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

The React component includes a built-in control panel with all sliders, color picker, effect toggles, and renderer selector.

### Available props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string` | auto (time-of-day) | Color theme name |
| `style` | `object` | `{}` | Container inline styles |
| `className` | `string` | — | Container CSS class |
| `children` | `ReactNode` | — | Content rendered on top of the wave background |

## API Reference

### `new WaveBackground(container, options?)`

Creates an animated wave background in the given container.

**container** — DOM element or CSS selector string (e.g. `'#hero'`).

**options**:

| Option | Default | Description |
|--------|---------|-------------|
| `renderer` | `'auto'` | Renderer to use: `'auto'`, `'webgl2'`, `'canvas2d'`, `'css'`, or `'none'` |
| `theme` | auto (time-of-day) | Color theme: `'pre-dawn'`, `'sunrise'`, `'daytime'`, `'dusk'`, `'sunset'`, `'night'` |
| `waveCount` | `8` | Number of wave layers (1–100) |
| `speed` | `0.3` | Animation speed (0–2) |
| `amplitude` | `0.06` | Wave height (0–0.2) |
| `frequency` | `2.5` | Wave density (0.5–10) |
| `opacity` | `0.6` | Wave transparency (0–1) |
| `thickness` | `1` | Wave solid core width in px (1–100) |
| `blur` | `30` | Edge fade zone in px (0–200) |
| `concentration` | `0` | Vertical compression toward center (0–50) |
| `randomness` | `0` | Per-wave amplitude variation (0–1) |
| `thicknessRandom` | `0` | Per-wave thickness variation (0–1) |
| `verticalOffset` | `0` | Shift waves up/down (-0.5–0.5) |
| `rotation` | `0` | Rotation in degrees (0–360) |
| `splitFill` | `false` | One-directional fill mode |
| `glass` | `false` | Glass transparency effect (WebGL only) |
| `liquidMetal` | `false` | Chrome/metal effect (WebGL only) |
| `lmLiquid` | `0.07` | Liquid Metal flow intensity (0–0.2) |
| `colorOpacities` | `[1,1,1,1]` | Per-color opacity array |

### Methods

| Method | Description |
|--------|-------------|
| `setRenderMode(mode)` | Switch renderer: `'webgl2'`, `'canvas2d'`, `'css'`, or `'none'` |
| `setTheme(name)` | Switch color theme with 1500ms animated transition |
| `setColors(hexArray)` | Set 4 custom hex colors with animated transition |
| `setParam(key, value)` | Update any wave parameter instantly |
| `setColorOpacities(arr)` | Set per-color opacity `[0-1, 0-1, 0-1, 0-1]` |
| `setSplitFill(bool)` | Toggle split fill mode |
| `setGlass(bool)` | Toggle glass effect |
| `setLiquidMetal(bool)` | Toggle liquid metal effect |
| `destroy()` | Stop animation, remove canvas, cleanup all event listeners |

### Properties

| Property | Description |
|----------|-------------|
| `renderMode` | Current active renderer: `'webgl2'`, `'canvas2d'`, `'css'`, or `'none'` |
| `params` | Current parameter values object |
| `theme` | Current theme name |

## Renderers

| Mode | Description | GPU | Animated | Effects |
|------|-------------|-----|----------|---------|
| `webgl2` | Full GPU shader rendering | Yes | Yes | All (glass, liquid metal, film grain) |
| `canvas2d` | CPU-based line drawing | No | Yes | Waves, colors, opacity, rotation |
| `css` | Static CSS gradient | No | No | Theme colors as gradient |
| `none` | Solid background color | No | No | Background color only |

When `renderer` is set to `'auto'` (default), the fallback chain is:

```
WebGL2 available? → GPU shader (60 FPS, all effects)
    ↓ no
Canvas 2D available? → CPU rendering (animated waves)
    ↓ no
CSS gradient (static theme colors)
```

You can check which renderer is active via `wave.renderMode`.

## Themes

| Theme | Auto Time | Colors |
|-------|-----------|--------|
| `pre-dawn` | 05:00–08:00 | Deep purple, magenta, orange, gold |
| `sunrise` | 08:00–11:00 | Dark purple, hot pink, orange, yellow |
| `daytime` | 11:00–16:00 | Navy, blue, cyan, mint |
| `dusk` | 16:00–20:00 | Dark purple, violet, lavender, light purple |
| `sunset` | 20:00–23:00 | Deep purple, pink, coral, orange |
| `night` | 23:00–05:00 | Near-black, dark purple, medium purple, violet |

When no theme is specified, the component automatically selects based on the user's local time.

## Browser Support

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

Fallback renderers ensure the component works even in environments without WebGL.

## Build

```bash
npm run build
```

## License

[MIT](LICENSE)
