# SinWaves — Full Documentation

Complete API reference, usage examples, and integration guide.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Component API](#component-api)
- [Parameters Reference](#parameters-reference)
- [Color Themes](#color-themes)
- [Custom Colors & RGBA Picker](#custom-colors--rgba-picker)
- [Rendering Modes](#rendering-modes)
- [Shader Uniforms](#shader-uniforms)
- [Examples](#examples)
- [Architecture](#architecture)
- [Testing](#testing)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

---

## Installation

```bash
git clone <repo-url>
cd waves-component
npm install
```

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.x | UI framework |
| `react-dom` | ^19.x | React DOM renderer |
| `three` | ^0.183.x | WebGL abstraction layer |
| `@react-three/fiber` | ^9.x | React reconciler for Three.js |
| `vite-plugin-glsl` | ^1.6.x | Import `.glsl` files in Vite |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `vite` | Dev server & build tool |
| `@vitejs/plugin-react` | React Fast Refresh for Vite |
| `@playwright/test` | Browser-based testing |

---

## Quick Start

```bash
npm run dev
```

Opens a dev server (default `http://localhost:5173`). The demo page renders a full-screen wave background with a hero section overlay.

---

## Component API

### `<HeroWave>`

The main component. Renders a full-viewport WebGL wave background with an optional content overlay and control panel.

```jsx
import HeroWave from './HeroWave'
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string \| undefined` | `undefined` (auto) | One of: `'pre-dawn'`, `'sunrise'`, `'daytime'`, `'dusk'`, `'sunset'`, `'night'`. When omitted, the theme is selected automatically based on the user's local time and updates every 60 seconds. |
| `style` | `React.CSSProperties` | `{}` | Inline styles merged onto the container `<div>`. The container defaults to `width: 100%; height: 100vh; position: relative; overflow: hidden`. |
| `className` | `string` | `undefined` | CSS class applied to the container `<div>`. |
| `children` | `React.ReactNode` | `undefined` | Content rendered in a centered overlay on top of the wave canvas. Receives `pointer-events: auto` so buttons and links remain clickable. |

---

## Parameters Reference

All parameters are adjustable at runtime through the built-in control panel (top-right corner, click "Controls" to toggle).

### Wave Shape

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Waves** | `waveCount` | `8` | 1 | 20 | 1 | Number of sine wave layers rendered. More waves create a richer, denser visual. Each wave is a separate sine curve with its own phase offset, layered back-to-front with increasing opacity. Max 20 (hard limit in the shader loop). |
| **Speed** | `speed` | `0.30` | 0 | 2 | 0.01 | Animation speed multiplier applied to the time uniform. At 0, all wave motion freezes completely. At 1, waves move at base speed. At 2, double speed. Each wave layer moves at a slightly different rate (`0.8 + waveIndex * 0.1`) for natural variation. |
| **Amplitude** | `amplitude` | `0.060` | 0 | 0.2 | 0.001 | Maximum vertical displacement of wave sine curves. This is the upper bound — the actual amplitude per wave may be lower when Randomness > 0. At 0, all waves become perfectly flat horizontal lines. Each wave uses 3 layered harmonics (1x, 2x, 0.5x frequency) at 100%, 40%, and 60% of this amplitude. |
| **Frequency** | `frequency` | `2.5` | 0.5 | 10 | 0.1 | Horizontal density of the sine curve, scaled by viewport aspect ratio. Higher values = more oscillations visible. The shader also generates harmonics at 2x and 0.5x this frequency for organic wave shapes. |

### Appearance

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Opacity** | `opacity` | `0.60` | 0 | 1 | 0.01 | Global wave opacity. This is the master transparency for all wave layers. Each wave also has individual layered opacity that increases from back (25% of this value) to front (100% of this value), creating natural depth. At 0, waves are invisible. At 1, front waves are fully opaque. |
| **Thickness** | `thickness` | `0.060` | 0.01 | 0.2 | 0.001 | Width of the solid core of each wave band. This is the area where the wave color renders at full strength with a hard edge. Higher values make waves visually wider/thicker. In symmetric band mode, thickness expands the solid zone in both directions from the wave center. In split fill mode, it expands the solid fill below the wave line. Thickness does NOT affect edge softness — that is controlled by Blur. |
| **Blur** | `blur` | `0.030` | 0 | 0.3 | 0.001 | Width of the soft fade zone on the edges of each wave. This is applied AFTER the solid core defined by Thickness. At 0, wave edges are perfectly sharp (hard cutoff). Higher values create a smooth gradient from full color to transparent on the wave boundary. Blur is always uniform across all waves, even when Thickness Random is active. |

### Distribution

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Concentration** | `concentration` | `0` | 0 | 50 | 0.1 | Compresses the vertical range in which waves are distributed, centering them on screen. The range formula is `0.85 / (1 + concentration)`. At 0, waves span ~85% of screen height (0.075 to 0.925 in UV space). At 10, the range shrinks to ~0.077 (a narrow band at center). At 50, waves occupy ~1.7% of screen height. Waves are evenly spaced within this range. The band width of each wave also adapts — in symmetric mode, `halfExtent = range * 0.5 + thickness`, so concentrated waves have narrower bands. |
| **Randomness** | `randomness` | `0` | 0 | 1 | 0.01 | Per-wave amplitude variation. Each wave gets a stable pseudo-random factor (seeded by wave index + `u_seed`, so it's consistent per session but different each page load). Formula: `amplitude * (1 - randomness + randomness * random)` where `random` is 0–1 per wave. At 0, all waves have identical amplitude. At 0.5, amplitudes range from 50% to 100% of max. At 1, amplitudes range from 0% to 100%. This creates organic variation where some waves are calm and others are active. |
| **Thickness Random** | `thicknessRandom` | `0` | 0 | 1 | 0.01 | Per-wave thickness variation. Same formula as Randomness but applied to the solid core width: `thickness * (1 - thicknessRandom + thicknessRandom * random)`. Uses a different pseudo-random seed (`fi * 253.3 + seed * 197.1`) than amplitude randomness (`fi * 127.1 + seed * 311.7`), so thickness and amplitude vary independently — a thin wave can have high amplitude and vice versa. Only the solid core is randomized; the Blur fade zone remains uniform across all waves. |
| **Vertical Offset** | `verticalOffset` | `0` | -0.5 | 0.5 | 0.01 | Shifts the entire wave group up or down from the vertical center of the screen. The wave center position is `0.5 + verticalOffset`. Positive values move waves toward the top, negative toward the bottom. At extremes (-0.5 or 0.5), the wave center is at the screen edge. Combines additively with Concentration — e.g. concentration=10 creates a narrow band, and verticalOffset=0.3 positions that band in the upper third of the screen. |

---

## Color Themes

### Built-in Themes

Six predefined themes, each defining 4 colors: 1 background + 3 wave gradient stops.

| Theme | Auto Time | Background | Wave Color 1 | Wave Color 2 | Wave Color 3 |
|-------|-----------|------------|-------------|-------------|-------------|
| `pre-dawn` | 05:00–08:00 | `#1a0033` | `#d91aff` | `#ff6b35` | `#ffb347` |
| `sunrise` | 08:00–11:00 | `#2d0a4e` | `#ff29b0` | `#ff8c42` | `#ffd166` |
| `daytime` | 11:00–16:00 | `#0a1628` | `#4361ee` | `#48bfe3` | `#72efdd` |
| `dusk` | 16:00–20:00 | `#1a0533` | `#7b2ff7` | `#c77dff` | `#e0aaff` |
| `sunset` | 20:00–23:00 | `#1a0033` | `#f394ff` | `#ff6b6b` | `#fca311` |
| `night` | 23:00–05:00 | `#0d0221` | `#3d1a78` | `#6b3fa0` | `#9d4edd` |

### Auto Theme Selection

When the `theme` prop is not set, the component reads the user's local hour and selects the matching theme. It re-checks every 60 seconds via `setInterval`. Setting the `theme` prop disables auto-selection.

### Theme Transitions

Switching themes triggers a smooth 1500ms color transition using eased interpolation (`ease-in-out` cubic). Colors are interpolated in RGB space via Three.js `Color.lerp()`.

---

## Custom Colors & RGBA Picker

### Color Swatches

Four color swatches are shown in the **Custom Colors** section of the control panel. Each swatch represents one of the 4 theme colors (background + 3 wave colors). The swatch displays the current color at its current opacity.

### RGBA Picker

Click any swatch to open the picker popover:

| Component | Description |
|-----------|-------------|
| **SV Area** | Saturation (horizontal) and Brightness (vertical) selector. Drag to pick. Background color is the current hue at full saturation/brightness. |
| **Hue Bar** | Rainbow gradient strip. Drag to select the base hue (0–360). |
| **Alpha Bar** | Transparency slider with checkerboard background. Drag to set opacity (0–1). |
| **R input** | Red channel (0–255) |
| **G input** | Green channel (0–255) |
| **B input** | Blue channel (0–255) |
| **A input** | Alpha / opacity (0–100%) |

Changing any color value automatically switches the active theme to `"custom"`. Custom colors are stored in React state and persist during the session. The auto time-of-day timer will not override a custom theme — once you pick custom colors, they stay until you manually select a different theme or reset.

### Per-Color Opacity

Each of the 4 colors has its own opacity value, passed as separate uniforms (`u_colorOpacity1..4`) to the fragment shader. Opacity affects how much each color contributes to the wave gradient:

- **Color 1 (background)**: Opacity does NOT affect the background fill. The background always renders at full strength. Opacity only affects how Color 1 blends when used in wave gradients.
- **Colors 2–4 (wave colors)**: Opacity scales the wave's alpha when that color is used. Waves interpolate between colors, so opacity is also interpolated smoothly across the gradient.

### Closing the Picker

Click anywhere outside the picker popover to close it. The selected color and opacity persist.

---

## Rendering Modes

### Symmetric Band (default)

```
Split Fill: [ ] (unchecked)
```

Each wave renders color in a **symmetric band** centered on its wave position. The band has two zones:

1. **Solid core** — extends `thickness` beyond the base half-extent (`range * 0.5`). Full color, no fade.
2. **Blur fade** — extends `blur` beyond the solid core. Smooth gradient from full color to transparent.

```glsl
halfExtent = range * 0.5 + thickness;
edge = 1.0 - smoothstep(halfExtent, halfExtent + blur, dist);
```

At default settings (concentration 0), bands are wide and overlap significantly, creating a smooth gradient across the entire screen. At high concentration, bands shrink to narrow strips clustered at the center. When `blur = 0`, edges are perfectly hard. When `thickness = min`, the solid core is minimal and the wave is mostly defined by its blur fade.

### Split Fill

```
Split Fill: [x] (checked)
```

Each wave fills color **upward** from its wave line. The fill has two zones:

1. **Solid fill** — everything above `waveY - thickness` is fully colored.
2. **Blur fade** — from `waveY - thickness - blur` to `waveY - thickness`, color fades in from transparent.

```glsl
edge = smoothstep(waveY - thickness - blur, waveY - thickness, uv.y);
```

This creates a layered "stacked fill" effect. With concentration, it produces a visible horizontal split — colored above, background below. Useful for sharp horizon-like divides.

---

## Shader Uniforms

Complete list of uniforms passed from `WaveBackground.jsx` to `waveFragment.glsl`:

| Uniform | Type | Updated | Description |
|---------|------|---------|-------------|
| `u_time` | `float` | Every frame | Elapsed time from Three.js clock |
| `u_seed` | `float` | Once (mount) | Random seed for wave phase and per-wave randomness |
| `u_resolution` | `vec2` | On resize | Viewport width and height in pixels |
| `u_mouse` | `vec2` | Every frame | Normalized mouse position (0–1), smoothed with `lerp(current, target, 0.05)` |
| `u_color1` | `vec3` | On theme change | Background color (animated over 1500ms) |
| `u_color2` | `vec3` | On theme change | Wave gradient color 1 |
| `u_color3` | `vec3` | On theme change | Wave gradient color 2 |
| `u_color4` | `vec3` | On theme change | Wave gradient color 3 |
| `u_colorOpacity1` | `float` | Every frame | Per-color opacity for color 1 |
| `u_colorOpacity2` | `float` | Every frame | Per-color opacity for color 2 |
| `u_colorOpacity3` | `float` | Every frame | Per-color opacity for color 3 |
| `u_colorOpacity4` | `float` | Every frame | Per-color opacity for color 4 |
| `u_waveCount` | `float` | Every frame | Number of wave layers (cast to `int` in shader) |
| `u_speed` | `float` | Every frame | Speed multiplier applied to time |
| `u_amplitude` | `float` | Every frame | Maximum wave displacement |
| `u_frequency` | `float` | Every frame | Sine wave horizontal frequency |
| `u_opacity` | `float` | Every frame | Global wave opacity |
| `u_thickness` | `float` | Every frame | Wave edge sharpness |
| `u_blur` | `float` | Every frame | Wave edge softness |
| `u_concentration` | `float` | Every frame | Wave vertical compression |
| `u_randomness` | `float` | Every frame | Per-wave amplitude variation |
| `u_thicknessRandom` | `float` | Every frame | Per-wave thickness variation |
| `u_verticalOffset` | `float` | Every frame | Vertical shift from center (-0.5 to 0.5) |
| `u_splitFill` | `float` | Every frame | Rendering mode (0.0 = band, 1.0 = split fill) |

---

## Examples

### 1. Basic Hero Section

```jsx
import HeroWave from './HeroWave'

function Hero() {
  return (
    <HeroWave>
      <h1>Welcome to our platform</h1>
      <p>Build something amazing.</p>
    </HeroWave>
  )
}
```

### 2. Fixed Theme

```jsx
<HeroWave theme="sunset">
  <h1>Always sunset</h1>
</HeroWave>
```

Disables auto time-of-day selection. The theme stays `sunset` regardless of the user's local time.

### 3. Half-Height Section

```jsx
<HeroWave style={{ height: '50vh' }}>
  <h1>Half the screen</h1>
</HeroWave>
```

### 4. Rounded Card

```jsx
<HeroWave style={{ height: 400, borderRadius: 24, overflow: 'hidden' }}>
  <h2>Wave card</h2>
</HeroWave>
```

### 5. Multiple Sections with Different Themes

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

### 6. No Content (Pure Background)

```jsx
<HeroWave theme="night" />
```

Renders a full-screen animated wave background with no overlay content. The control panel is still accessible.

### 7. Custom Styled Content

```jsx
<HeroWave theme="dusk">
  <div style={{
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: '40px 60px',
    border: '1px solid rgba(255,255,255,0.1)',
  }}>
    <h1 style={{ color: 'white', margin: 0 }}>Glass Card</h1>
    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
      Content with glassmorphism effect.
    </p>
  </div>
</HeroWave>
```

---

## Architecture

### File Structure

```
src/
  HeroWave.jsx              Main export. Contains:
                             - ColorSwatch component (RGBA picker)
                             - Slider component
                             - HeroWave component (state, Canvas, control panel)

  WaveBackground.jsx         Three.js scene component. Contains:
                             - Shader material with all uniforms
                             - Color transition animation (useEffect)
                             - Per-frame uniform sync (useFrame)
                             - Resolution tracking (useThree)

  shaders/
    waveVertex.glsl          Passthrough vertex shader (sets v_uv)
    waveFragment.glsl        Main fragment shader:
                             - Wave position calculation with concentration
                             - Per-wave amplitude with randomness
                             - Sine wave harmonics (3 layers per wave)
                             - Mouse-reactive distortion
                             - Symmetric band or split fill rendering
                             - 4-color gradient with per-color opacity
                             - Film grain post-processing
```

### Data Flow

```
User interaction (sliders, theme buttons, color picker)
  → React state (params, currentTheme, customColors, colorOpacities, splitFill)
    → Props to WaveBackground
      → Three.js uniforms (synced every frame via useFrame)
        → GLSL fragment shader (runs per-pixel on GPU)
          → Screen output
```

### Color Transition Flow

```
Theme change (click or auto)
  → setCurrentTheme(name)
    → colors array derived from COLOR_THEMES[name]
      → useEffect in WaveBackground triggers
        → 1500ms requestAnimationFrame loop
          → lerp from current uniform colors to target colors
            → Eased cubic interpolation per frame
```

---

## Testing

### Prerequisites

```bash
npm run dev          # Start the dev server first
npx playwright install chromium  # One-time browser install
```

### Unit + Visual Tests

```bash
node test-all.mjs
```

**93 assertions** plus **30+ screenshots** across 18 test groups:

1. Panel visibility toggle (open/close/reopen)
2. All 10 slider default values (including Vertical Offset)
3. All 10 slider min/max bounds (20 checks)
4. Setting each slider to a non-default value
5. Displayed value formatting (integers, 2-decimal, 3-decimal, negative values)
6. Reset to defaults (all 10 sliders)
7. 6 color theme buttons with correct titles and activation
8. 4 custom color swatches
9. Color picker (SV area, hue bar, alpha bar, RGBA inputs, color changes, opacity changes, persistence)
10. Custom color preservation (verifies the auto-timer doesn't overwrite custom theme)
11. Split Fill checkbox toggle and reset
12. Vertical Offset at multiple values (-0.5, -0.3, 0, 0.3, 0.5) with screenshots
13. Vertical Offset + Concentration combined
14. WebGL canvas (visible, dimensions, context active)
15. Theme stability (no auto-change after 5 seconds)
16. All 6 color theme screenshots
17. Visual parameter tests (waves, amplitude, concentration, randomness, split fill extremes)
18. Custom colors + Vertical Offset + Concentration combined

### Visual Tests

```bash
node test-visual.mjs
```

**35 screenshots** saved to `screenshots/`:

- Default state
- Each slider at min and max values
- Concentration at 0, 25, and 50
- Randomness at 0, 0.5, and 1
- All 6 color themes
- Split Fill on vs off (with amplitude 0, concentration 10)
- Color picker open
- 3 combined parameter scenarios
- Theme stability (sunset at t=0 and t=5s)

---

## Performance

- All wave computation runs on the GPU in the fragment shader
- CPU work per frame: update ~20 uniform floats + 1 `lerp` for mouse smoothing
- No DOM manipulation or CSS animation during rendering
- Canvas DPR capped at `min(devicePixelRatio, 2)` for Retina without over-rendering
- `powerPreference: 'high-performance'` hints the browser to use the discrete GPU
- The wave loop in GLSL has a hard cap of 20 iterations (max waves)

### Bundle Size

```bash
npm run build
```

Production output: ~295 KB gzipped (majority is Three.js).

---

## Troubleshooting

### Waves not visible

- Check that WebGL is supported in your browser (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)
- Verify Opacity is not set to 0
- Check that Amplitude is not 0 (waves would be flat lines, possibly hidden by thin Thickness)

### Black screen

- Ensure the background color (first custom color swatch) is not black
- If using per-color opacity, check that at least one wave color has opacity > 0

### Performance issues

- Reduce the Waves count (fewer GPU iterations)
- Lower the browser window size or DPR
- The shader caps at 20 waves maximum regardless of the slider

### Theme keeps changing

- If you don't set the `theme` prop, auto-selection runs every 60 seconds based on local time
- Pass a fixed `theme` prop to lock it: `<HeroWave theme="daytime" />`

### Color picker not opening

- Click directly on the color swatch square, not the label
- Ensure the control panel is open (click "Controls" button)
