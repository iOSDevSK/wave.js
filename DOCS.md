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
| **Waves** | `waveCount` | `8` | 1 | 20 | 1 | Number of sine wave layers rendered. More waves = richer visual, slightly higher GPU cost. |
| **Speed** | `speed` | `0.30` | 0 | 2 | 0.01 | Animation speed multiplier. At 0, waves freeze. At 2, waves animate at double speed. |
| **Amplitude** | `amplitude` | `0.060` | 0 | 0.2 | 0.001 | Maximum vertical displacement of waves. At 0, waves are flat horizontal lines. This is the upper bound — actual per-wave amplitude may vary based on the Randomness parameter. |
| **Frequency** | `frequency` | `2.5` | 0.5 | 10 | 0.1 | Horizontal density of the sine curve. Higher values = more oscillations visible on screen. |

### Appearance

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Opacity** | `opacity` | `0.60` | 0 | 1 | 0.01 | Global wave transparency. Each wave layer also has individual opacity that increases from back to front (25%–100% of this value). |
| **Thickness** | `thickness` | `0.060` | 0.01 | 0.2 | 0.001 | Controls the sharpness of the wave edge transition. Higher = thicker, more visible wave edges. |
| **Blur** | `blur` | `0.030` | 0 | 0.3 | 0.001 | Softness added to wave edges. Combined with Thickness to determine the total edge width (`edgeWidth = thickness + blur`). |

### Distribution

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Concentration** | `concentration` | `0` | 0 | 50 | 0.1 | Compresses wave distribution toward the vertical center. The wave range is calculated as `0.85 / (1 + concentration)`. At 0, waves span ~85% of screen height. At 50, waves occupy a narrow ~1.7% strip at the center. |
| **Randomness** | `randomness` | `0` | 0 | 1 | 0.01 | Per-wave amplitude variation. Each wave gets a stable pseudo-random factor. The actual amplitude per wave is: `amplitude * (1 - randomness + randomness * random)` where `random` is 0–1 per wave. At 0, all waves are identical. At 1, waves range from 0 to full amplitude. |

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

Changing any color value automatically switches the active theme to `"custom"`. Custom colors are stored in React state and persist during the session.

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

Each wave renders color in a **symmetric band** centered on its wave position. The band extends equally above and below the wave line. The band width is:

```
halfExtent = (range * 0.5) + edgeWidth
```

Where `range = 0.85 / (1 + concentration)` and `edgeWidth = thickness + blur`.

At default settings (concentration 0), bands are wide (~0.5 screen height) and overlap significantly, creating a smooth gradient across the entire screen. At high concentration, bands shrink to narrow strips clustered at the center.

### Split Fill

```
Split Fill: [x] (checked)
```

Each wave fills color **upward** from its wave line position to the top of the screen:

```glsl
edge = smoothstep(waveY - edgeWidth, waveY, uv.y);
```

This creates a layered "stacked fill" effect. With concentration, it produces a visible horizontal split — waves above the center are colored, below is the background. This mode is useful for creating sharp horizon-like divides.

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

### Unit Tests

```bash
node test-comprehensive.mjs
```

**136 assertions** across 22 test groups:

1. Panel visibility toggle (open/close/reopen)
2. All 9 slider default values
3. All 9 slider min/max bounds (18 checks)
4. Setting each slider to a non-default value
5. Displayed value formatting (integers, 2-decimal, 3-decimal)
6. Reset to defaults (all 9 sliders)
7. 6 color theme buttons with correct titles
8. Theme visual activation (scale transform, deactivation of others)
9. 4 custom color swatches
10. Color picker popup open/close
11. Picker internals (SV area, hue bar, alpha bar, R/G/B/A inputs)
12. Changing R value updates swatch color
13. Changing A value updates swatch opacity
14. Color persistence after close/reopen
15. Split Fill checkbox toggle
16. Reset clears Split Fill
17. WebGL canvas dimensions
18. WebGL context active (not lost)
19. Randomness slider (0 and 1)
20. Concentration at max (50)
21. Theme stability (no change after 5 seconds)
22. Multiple parameter combinations

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
