# wave.js

GPU-accelerated animated sine wave backgrounds. Works with **vanilla JS** and **React**. Built with raw WebGL2 + custom GLSL shaders. Automatic fallback: WebGL2 → Canvas 2D → CSS gradient.

> **Full documentation: [DOCS.md](DOCS.md)**

## Features

- **Zero dependencies** for vanilla JS (no Three.js, no React required)
- WebGL2 GPU rendering at 60 FPS
- Automatic fallback: WebGL2 → Canvas 2D (CPU) → CSS gradient (static)
- 12 adjustable parameters (waves, speed, amplitude, frequency, opacity, thickness, blur, concentration, randomness, thickness randomness, vertical offset, rotation)
- 6 built-in color themes with automatic time-of-day selection
- Custom RGBA color picker with per-color opacity
- Glass effect, Liquid Metal effect, Split Fill mode
- Rotation (0–360°) around screen center
- Mouse-reactive wave distortion
- Smooth color transitions between themes
- Film grain post-processing
- React component with built-in control panel (optional)
- Responsive on mobile
- Retina / HiDPI support

## Installation

```bash
npm install wave.js
```

## Vanilla JS

```js
import { WaveBackground } from 'wave.js'

const wave = new WaveBackground(document.getElementById('hero'), {
  theme: 'sunset',
  waveCount: 12,
  speed: 0.5,
})

// Update params at runtime
wave.setParam('amplitude', 0.1)
wave.setTheme('night')

// Cleanup
wave.destroy()
```

### Vanilla HTML

```html
<div id="hero" style="width: 100%; height: 100vh;"></div>
<script type="module">
  import { WaveBackground } from 'wave.js'
  new WaveBackground('#hero', { theme: 'daytime' })
</script>
```

## React

```bash
npm install wave.js react react-dom
```

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

The React component includes a built-in control panel for adjusting all parameters at runtime.

## API

### `new WaveBackground(container, options?)`

Creates animated wave background in the given container element.

**container**: DOM element or CSS selector string.

**options**:

| Option | Default | Description |
|--------|---------|-------------|
| `theme` | auto (time-of-day) | Color theme name |
| `waveCount` | `8` | Number of wave layers (1–100) |
| `speed` | `0.3` | Animation speed (0–2) |
| `amplitude` | `0.06` | Wave height (0–0.2) |
| `frequency` | `2.5` | Wave density (0.5–10) |
| `opacity` | `0.6` | Wave transparency (0–1) |
| `thickness` | `1` | Wave thickness in px (1–100) |
| `blur` | `30` | Edge blur in px (0–200) |
| `concentration` | `0` | Vertical compression (0–50) |
| `randomness` | `0` | Per-wave amplitude variation (0–1) |
| `thicknessRandom` | `0` | Per-wave thickness variation (0–1) |
| `verticalOffset` | `0` | Vertical shift (-0.5–0.5) |
| `rotation` | `0` | Rotation in degrees (0–360) |
| `splitFill` | `false` | One-directional fill mode |
| `glass` | `false` | Glass transparency effect |
| `liquidMetal` | `false` | Chrome/metal effect |
| `lmLiquid` | `0.07` | Liquid Metal flow intensity (0–0.2) |
| `colorOpacities` | `[1,1,1,1]` | Per-color opacity array |

### Methods

| Method | Description |
|--------|-------------|
| `setTheme(name)` | Switch color theme with smooth transition |
| `setColors(hexArray)` | Set custom colors `['#hex1', '#hex2', '#hex3', '#hex4']` |
| `setParam(key, value)` | Update any parameter |
| `setColorOpacities(arr)` | Set per-color opacity `[0-1, 0-1, 0-1, 0-1]` |
| `setSplitFill(bool)` | Toggle split fill mode |
| `setGlass(bool)` | Toggle glass effect |
| `setLiquidMetal(bool)` | Toggle liquid metal effect |
| `destroy()` | Remove canvas, stop animation, cleanup listeners |

### Properties

| Property | Description |
|----------|-------------|
| `renderMode` | Current renderer: `'webgl2'`, `'webgl'`, `'canvas2d'`, or `'css'` |

## Themes

| Theme | Auto Time | Colors |
|-------|-----------|--------|
| `pre-dawn` | 05–08 | Purple, magenta, orange, gold |
| `sunrise` | 08–11 | Purple, hot pink, orange, yellow |
| `daytime` | 11–16 | Navy, blue, cyan, mint |
| `dusk` | 16–20 | Purple, violet, lavender, light purple |
| `sunset` | 20–23 | Purple, pink, coral, orange |
| `night` | 23–05 | Near-black, dark purple, medium purple, violet |

## Fallback Chain

| Environment | Renderer | Features |
|-------------|----------|----------|
| WebGL2/WebGL available | GPU shader | All effects (glass, liquid metal, film grain) |
| No WebGL, Canvas available | Canvas 2D | Animated waves, colors, opacity (no glass/metal) |
| No Canvas | CSS gradient | Static gradient background with theme colors |

## Browser Support

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

## Build

```bash
npm run build
```

## License

[MIT](LICENSE)
