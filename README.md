# wave.js

GPU-accelerated animated sine wave backgrounds for React. Built with Three.js and custom GLSL shaders. Runs at 60 FPS with minimal CPU usage.

> **Full documentation with API reference, all examples, and architecture details: [DOCS.md](DOCS.md)**

## Features

- Real-time sinusoidal wave animation rendered on the GPU via WebGL
- 12 adjustable parameters (wave count, speed, amplitude, frequency, opacity, thickness, blur, concentration, randomness, thickness randomness, vertical offset, rotation)
- Thickness and blur in pixel units for intuitive control
- 6 built-in color themes with automatic time-of-day selection
- Custom RGBA color picker with per-color opacity control
- Wave concentration control — compress waves toward the screen center
- Per-wave amplitude and thickness randomness for organic variation
- Split Fill rendering mode toggle
- Glass effect (transparency, refraction, caustics)
- Liquid Metal effect with Liquify control (smooth 3D chrome with iridescent tint)
- Rotation control (0–360°) around the screen center
- Mouse-reactive wave distortion
- Smooth animated transitions between color themes
- Film grain post-processing
- Built-in control panel UI (toggleable, responsive on mobile)
- Editable slider values — click any value to type a precise number
- Fullscreen responsive layout
- Retina / HiDPI support

## Quick Start

```bash
npm install
npm run dev -- --host 0.0.0.0
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

All parameters are adjustable at runtime via the built-in control panel (top-right corner). Click any slider value to type a precise number.

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Waves | `8` | 1 – 100 | Number of sine wave layers |
| Speed | `0.30` | 0 – 2 | Animation speed multiplier |
| Amplitude | `0.060` | 0 – 0.2 | Maximum wave height (vertical displacement) |
| Frequency | `2.5` | 0.5 – 10 | Horizontal density of the sine curve |
| Opacity | `0.60` | 0 – 1 | Wave layer transparency |
| Thickness (px) | `1` | 1 – 100 | Width of the solid core of each wave in pixels |
| Blur (px) | `30` | 0 – 200 | Soft fade zone on wave edges in pixels |
| Concentration | `0` | 0 – 50 | Compresses wave distribution toward the vertical center |
| Randomness | `0` | 0 – 1 | Per-wave amplitude variation |
| Thickness Random | `0` | 0 – 1 | Per-wave thickness variation |
| Vertical Offset | `0` | -0.5 – 0.5 | Shifts waves up or down from the screen center |
| Rotation (°) | `0` | 0 – 360 | Rotates the entire wave pattern around the screen center |

## Rendering Modes

### Symmetric Band (default)

Each wave renders color in a symmetric band around its position. Thickness controls the solid core width in pixels, blur adds a soft fade zone beyond it.

### Split Fill

Toggle the **Split Fill** checkbox to enable one-directional fill mode. Each wave fills color upward from its wave line, creating a layered "stacked fill" look.

### Glass

Toggle the **Glass** checkbox for a transparent, refractive look with caustic highlights, Fresnel rim glow, and refraction-based color shifting.

### Liquid Metal

Toggle the **Liquid Metal** checkbox for a smooth 3D chrome effect with iridescent tint. One sub-parameter controls the effect:

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Liquify | `0.07` | 0 – 0.2 | Flow intensity from simplex noise distortion |

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

When no `theme` prop is provided, the component automatically selects a theme based on the user's local time. Manually selecting a theme disables auto-selection until reset.

## Custom Colors

Click any of the 4 color swatches to open the RGBA color picker. The picker includes:

- **Saturation / Brightness area** — drag to select color saturation and brightness
- **Hue bar** — rainbow strip to select the base hue
- **Alpha bar** — transparency slider with checkerboard background
- **R, G, B, A inputs** — numeric fields for precise values (A is in %)

Changing any custom color automatically switches to a "custom" theme that persists until manually changed.

## How It Works

The animation is rendered entirely on the GPU using a custom GLSL fragment shader. Each frame:

1. Multiple sine waves with layered harmonics are computed per-pixel
2. Each wave gets per-wave amplitude and thickness scaled by randomness parameters
3. Wave positions are distributed within a range that shrinks with concentration
4. Optional rotation is applied around the screen center
5. Thickness and blur are converted from pixels to UV space using the viewport resolution
6. Each wave renders as a symmetric color band (or one-directional fill in Split Fill mode)
7. Waves are stacked back-to-front with increasing opacity
8. Colors are interpolated across the wave stack using the 4-color gradient
9. Mouse position subtly distorts wave shapes in real-time
10. Film grain is added as a final post-processing pass

There is no DOM manipulation, no CSS animation, and no JavaScript-driven per-pixel computation. The CPU only passes uniform values to the GPU each frame.

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

Output is in `dist/`.

## License

[MIT](LICENSE)
