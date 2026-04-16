# wave.js — Vanilla JS Test

This is a minimal test project that demonstrates how to use `@redesigner/wave.js` with plain JavaScript (no framework).

## Installation

```bash
npm install
```

This installs `@redesigner/wave.js` from npm.

## Run

```bash
npm run dev
```

Opens at http://localhost:3001

## Implementation

### 1. Install the package

```bash
npm install @redesigner/wave.js
```

### 2. HTML structure

The only requirement is a container element. The wave canvas is automatically created inside it:

```html
<div id="hero" style="width: 100%; height: 100vh; position: relative;">
  <div class="content" style="position: relative; z-index: 5;">
    <h1>Your content here</h1>
  </div>
</div>
```

**Important:** Content inside the container must have `position: relative` and a `z-index` higher than 0 to appear above the wave canvas.

### 3. Initialize WaveBackground

```html
<script type="module">
  import { WaveBackground } from '@redesigner/wave.js'

  const wave = new WaveBackground('#hero', {
    theme: 'sunset',
    waveCount: 12,
    speed: 0.5,
    amplitude: 0.08,
  })
</script>
```

The first argument is a CSS selector string or DOM element. The second is an options object.

### 4. Constructor options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderer` | `string` | `'auto'` | `'auto'`, `'webgl2'`, `'canvas2d'`, `'css'`, `'none'` |
| `theme` | `string` | auto (time-of-day) | `'pre-dawn'`, `'sunrise'`, `'daytime'`, `'dusk'`, `'sunset'`, `'night'` |
| `waveCount` | `number` | `8` | Number of wave layers (1–100) |
| `speed` | `number` | `0.3` | Animation speed (0–2) |
| `amplitude` | `number` | `0.06` | Wave height (0–0.2) |
| `frequency` | `number` | `2.5` | Wave density (0.5–10) |
| `opacity` | `number` | `0.6` | Wave transparency (0–1) |
| `thickness` | `number` | `1` | Wave core width in px (1–100) |
| `blur` | `number` | `30` | Edge fade in px (0–200) |
| `concentration` | `number` | `0` | Vertical compression (0–50) |
| `randomness` | `number` | `0` | Per-wave amplitude variation (0–1) |
| `thicknessRandom` | `number` | `0` | Per-wave thickness variation (0–1) |
| `verticalOffset` | `number` | `0` | Vertical shift (-0.5–0.5) |
| `rotation` | `number` | `0` | Rotation in degrees (0–360) |
| `splitFill` | `boolean` | `false` | One-directional fill mode |
| `glass` | `boolean` | `false` | Glass effect (WebGL only) |
| `liquidMetal` | `boolean` | `false` | Liquid metal effect (WebGL only) |
| `lmLiquid` | `number` | `0.07` | Liquid metal intensity (0–0.2) |

### 5. Runtime API

Once created, the wave instance exposes methods for live control:

```javascript
// Switch theme (1500ms animated transition)
wave.setTheme('night')

// Set custom colors (array of 4 hex strings)
wave.setColors(['#000000', '#ff00ff', '#00ffff', '#ffff00'])

// Update any parameter instantly
wave.setParam('waveCount', 20)
wave.setParam('speed', 1.0)
wave.setParam('rotation', 45)

// Toggle effects
wave.setGlass(true)
wave.setLiquidMetal(true)
wave.setSplitFill(true)

// Switch renderer at runtime
wave.setRenderMode('canvas2d')  // CPU fallback
wave.setRenderMode('webgl2')    // Back to GPU
wave.setRenderMode('css')       // Static gradient
wave.setRenderMode('none')      // Solid color

// Read current state
console.log(wave.renderMode)  // 'webgl2'
console.log(wave.params)      // { waveCount: 20, speed: 1.0, ... }
console.log(wave.theme)       // 'night'

// Cleanup (removes canvas, stops animation, removes listeners)
wave.destroy()
```

### 6. Renderer fallback chain

When `renderer` is `'auto'` (default), the library auto-detects the best renderer:

```
WebGL2 available? → webgl2 (GPU, 60fps, all effects)
    ↓ no
Canvas 2D available? → canvas2d (CPU, animated, basic effects)
    ↓ no
→ css (static gradient, no animation)
```

### 7. Auto time-of-day themes

When no `theme` is specified, the library auto-selects based on the user's local time:

| Theme | Time |
|-------|------|
| `pre-dawn` | 05:00–08:00 |
| `sunrise` | 08:00–11:00 |
| `daytime` | 11:00–16:00 |
| `dusk` | 16:00–20:00 |
| `sunset` | 20:00–23:00 |
| `night` | 23:00–05:00 |

Re-checks every 60 seconds. Manually selecting a theme disables auto-selection.

## File structure

```
test/vanilla/
  index.html      — Single HTML file with inline module script
  package.json    — Only dependency: @redesigner/wave.js
  README.md       — This file
```

## Browser support

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+
