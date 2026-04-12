# SinWaves

GPU-accelerated animated sine wave backgrounds for React. Built with Three.js and custom GLSL shaders. Runs at 60 FPS with minimal CPU usage.

## Features

- Real-time sinusoidal wave animation rendered on the GPU via WebGL
- 7 adjustable parameters (wave count, speed, amplitude, frequency, opacity, thickness, blur)
- 6 built-in color themes with automatic time-of-day selection
- Custom color picker for full control over the palette
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
| Amplitude | `0.060` | 0 – 0.2 | Wave height (vertical displacement) |
| Frequency | `2.5` | 0.5 – 10 | Horizontal density of the sine curve |
| Opacity | `0.60` | 0 – 1 | Wave layer transparency |
| Thickness | `0.060` | 0.01 – 0.2 | Sharpness of the wave edge |
| Blur | `0.030` | 0 – 0.3 | Softness / blur of wave edges |

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

Custom colors can be set via the color picker in the control panel.

## How It Works

The animation is rendered entirely on the GPU using a custom GLSL fragment shader. Each frame:

1. Multiple sine waves with layered harmonics are computed per-pixel
2. Waves are stacked back-to-front with increasing opacity
3. Colors are interpolated across the wave stack using the 4-color gradient
4. Mouse position subtly distorts wave shapes in real-time
5. Film grain is added as a final post-processing pass

There is no DOM manipulation, no CSS animation, and no JavaScript-driven per-pixel computation. The CPU only passes uniform values (time, mouse position, parameters) to the GPU each frame.

## Project Structure

```
src/
  HeroWave.jsx            Main component (Canvas, control panel, themes)
  WaveBackground.jsx      Three.js mesh with shader material
  shaders/
    waveVertex.glsl       Vertex shader (passthrough)
    waveFragment.glsl     Fragment shader (sine waves, colors, grain)
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `three` | WebGL abstraction |
| `@react-three/fiber` | React renderer for Three.js |
| `vite-plugin-glsl` | GLSL shader imports in Vite |

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
