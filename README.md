# SinWaves

GPU-accelerated animated sine wave backgrounds for React. Built with Three.js and custom GLSL shaders. Runs at 60 FPS with minimal CPU usage.

> **Full documentation with API reference, all examples, and architecture details: [DOCS.md](DOCS.md)**

## Features

- Real-time sinusoidal wave animation rendered on the GPU via WebGL
- 11 adjustable parameters (wave count, speed, amplitude, frequency, opacity, thickness, blur, concentration, randomness, thickness randomness, vertical offset)
- 6 built-in color themes with automatic time-of-day selection
- Custom RGBA color picker with per-color opacity control
- Wave concentration control — compress waves toward the screen center
- Per-wave amplitude randomness for organic variation
- Split Fill rendering mode toggle
- Mouse-reactive wave distortion
- Smooth animated transitions between color themes
- Film grain post-processing
- Built-in control panel UI (toggleable)
- Fullscreen responsive layout
- Retina / HiDPI support

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

### Basic

```jsx
import HeroWave from './HeroWave'

function App() {
  return (
    <HeroWave>
      <h1>Your content here</h1>
    </HeroWave>
  )
}
```

### With a fixed color theme

```jsx
<HeroWave theme="sunset">
  <h1>Sunset vibes</h1>
</HeroWave>
```

Available themes: `pre-dawn`, `sunrise`, `daytime`, `dusk`, `sunset`, `night`

### With custom styles

```jsx
<HeroWave
  style={{ height: '50vh', borderRadius: 16 }}
  className="my-hero"
>
  <p>Half-height hero section</p>
</HeroWave>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string` | auto (time-of-day) | Color theme name. When omitted, automatically selects based on user's local time. |
| `style` | `object` | `{}` | Inline styles applied to the container div. |
| `className` | `string` | — | CSS class name for the container. |
| `children` | `ReactNode` | — | Content rendered on top of the wave background. |

## Parameters

All parameters are adjustable at runtime via the built-in control panel (top-right corner).

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Waves | `8` | 1 – 20 | Number of sine wave layers |
| Speed | `0.30` | 0 – 2 | Animation speed multiplier |
| Amplitude | `0.060` | 0 – 0.2 | Maximum wave height (vertical displacement) |
| Frequency | `2.5` | 0.5 – 10 | Horizontal density of the sine curve |
| Opacity | `0.60` | 0 – 1 | Wave layer transparency |
| Thickness | `0.060` | 0.01 – 0.2 | Sharpness of the wave edge |
| Blur | `0.030` | 0 – 0.3 | Softness / blur of wave edges |
| Concentration | `0` | 0 – 50 | Compresses wave distribution toward the vertical center. At 0, waves are spread evenly across the full screen height. Higher values shrink the wave band into a narrow strip around the center. |
| Randomness | `0` | 0 – 1 | Per-wave amplitude variation. At 0, all waves share the same amplitude. At 1, each wave gets a random amplitude between 0 and the Amplitude value. |
| Thickness Random | `0` | 0 – 1 | Per-wave thickness variation. At 0, all waves share the same thickness. At 1, each wave gets a random thickness between 0 and the Thickness value. |
| Vertical Offset | `0` | -0.5 – 0.5 | Shifts the entire wave group up or down from the screen center. Positive values move waves up, negative values move them down. Combines with Concentration. |

## Rendering Modes

### Symmetric Band (default)

Each wave renders color in a symmetric band around its position. The band width adapts to the wave distribution range — wider when waves are spread out, narrower when concentrated. This mode works well at all concentration levels.

### Split Fill

Toggle the **Split Fill** checkbox in the control panel to enable one-directional fill mode. In this mode, each wave fills color upward from its wave line to the top of the screen. This creates a layered "stacked fill" look and produces a visible horizontal split when waves are concentrated.

## Color Themes

Each theme defines 4 colors: background, and 3 wave gradient stops.

| Theme | Time | Colors |
|-------|------|--------|
| pre-dawn | 05–08 | Deep purple, magenta, orange, gold |
| sunrise | 08–11 | Dark purple, hot pink, orange, yellow |
| daytime | 11–16 | Navy, blue, cyan, mint |
| dusk | 16–20 | Dark purple, violet, lavender, light purple |
| sunset | 20–23 | Deep purple, pink, coral, orange |
| night | 23–05 | Near-black, dark purple, medium purple, violet |

When no `theme` prop is provided, the component automatically selects a theme based on the user's local time and updates every 60 seconds.

## Custom Colors

Click any of the 4 color swatches in the **Custom Colors** section to open the RGBA color picker. The picker includes:

- **Saturation / Brightness area** — drag to select color saturation and brightness
- **Hue bar** — rainbow strip to select the base hue
- **Alpha bar** — transparency slider with checkerboard background
- **R, G, B, A inputs** — numeric fields for precise values (A is in %)

Changing any custom color automatically switches to a "custom" theme. Per-color opacity is passed to the fragment shader as individual uniforms, allowing each of the 4 colors to independently control its contribution to the wave gradient. The background color (first swatch) is not affected by opacity — it always renders at full strength.

## How It Works

The animation is rendered entirely on the GPU using a custom GLSL fragment shader. Each frame:

1. Multiple sine waves with layered harmonics are computed per-pixel
2. Each wave gets a per-wave amplitude scaled by the randomness parameter
3. Wave positions are distributed within a range that shrinks with concentration
4. Each wave renders as a symmetric color band (or one-directional fill in Split Fill mode)
5. Waves are stacked back-to-front with increasing opacity
6. Colors are interpolated across the wave stack using the 4-color gradient, each scaled by its per-color opacity
7. Mouse position subtly distorts wave shapes in real-time
8. Film grain is added as a final post-processing pass

There is no DOM manipulation, no CSS animation, and no JavaScript-driven per-pixel computation. The CPU only passes uniform values (time, mouse position, parameters) to the GPU each frame.

## Shader Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `u_time` | `float` | Elapsed time for animation |
| `u_seed` | `float` | Random seed (set once on mount) |
| `u_resolution` | `vec2` | Viewport dimensions |
| `u_mouse` | `vec2` | Normalized mouse position |
| `u_color1..4` | `vec3` | Theme colors (background + 3 wave colors) |
| `u_colorOpacity1..4` | `float` | Per-color opacity (0–1) |
| `u_waveCount` | `float` | Number of wave layers |
| `u_speed` | `float` | Animation speed multiplier |
| `u_amplitude` | `float` | Maximum wave amplitude |
| `u_frequency` | `float` | Wave horizontal frequency |
| `u_opacity` | `float` | Global wave opacity |
| `u_thickness` | `float` | Wave edge sharpness |
| `u_blur` | `float` | Wave edge softness |
| `u_concentration` | `float` | Wave vertical compression |
| `u_randomness` | `float` | Per-wave amplitude variation |
| `u_thicknessRandom` | `float` | Per-wave thickness variation |
| `u_verticalOffset` | `float` | Vertical shift from center (-0.5 to 0.5) |
| `u_splitFill` | `float` | Rendering mode (0 = band, 1 = split fill) |

## Project Structure

```
src/
  HeroWave.jsx            Main component (Canvas, control panel, themes, RGBA picker)
  WaveBackground.jsx      Three.js mesh with shader material and uniform sync
  shaders/
    waveVertex.glsl       Vertex shader (passthrough)
    waveFragment.glsl     Fragment shader (sine waves, colors, grain)

test-all.mjs              93 unit + visual tests (Playwright)
test-visual.mjs           35 visual screenshot tests (Playwright)
screenshots/              Test screenshot output
```

## Testing

The project includes comprehensive Playwright-based tests.

### Unit Tests

```bash
node test-all.mjs
```

93 assertions covering: panel toggle, 10 slider defaults/bounds/changes, display formatting, reset behavior, 6 color themes, custom color picker (RGBA inputs, persistence), custom color preservation (bug fix verification), split fill toggle, vertical offset, vertical offset + concentration combos, WebGL canvas, theme stability, and 30+ visual screenshots across all parameter extremes and combinations.

### Visual Tests

```bash
node test-visual.mjs
```

Captures 35 screenshots across all parameter extremes, color themes, rendering modes, and combined scenarios. Screenshots are saved to `screenshots/`.

> Note: The dev server must be running (`npm run dev`) before executing tests.

## Dependencies

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `three` | WebGL abstraction |
| `@react-three/fiber` | React renderer for Three.js |
| `vite-plugin-glsl` | GLSL shader imports in Vite |
| `@playwright/test` | Browser testing (dev dependency) |

## Browser Support

Works in all browsers that support WebGL:

- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

Falls back gracefully if WebGL is unavailable (shows the background color).

## Build

```bash
npm run build
```

Output is in `dist/`. The production bundle is ~295 KB gzipped (majority is Three.js).

## License

See LICENSE file for terms.

Personal License: $5 USD — use in your own personal projects.
Commercial License: $25 USD — use in client work, agency projects, SaaS products, or any commercial application.
