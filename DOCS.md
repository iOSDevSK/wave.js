# wave.js — Full Documentation

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
git clone https://github.com/iOSDevSK/wave.js.git
cd wave.js
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
npm run dev -- --host 0.0.0.0
```

Opens a dev server (default `http://localhost:5173`), accessible from LAN/mobile devices. The demo page renders a full-screen wave background with a hero section overlay.

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

All parameters are adjustable at runtime through the built-in control panel (top-right corner, click "Controls" to toggle). Click any slider value to type a precise number.

### Wave Shape

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Waves** | `waveCount` | `8` | 1 | 100 | 1 | Number of sine wave layers rendered. More waves create a richer, denser visual. Each wave is a separate sine curve with its own phase offset, layered back-to-front with increasing opacity. |
| **Speed** | `speed` | `0.30` | 0 | 2 | 0.01 | Animation speed multiplier applied to the time uniform. At 0, all wave motion freezes completely. Each wave layer moves at a slightly different rate for natural variation. |
| **Amplitude** | `amplitude` | `0.060` | 0 | 0.2 | 0.001 | Maximum vertical displacement of wave sine curves. At 0, all waves become perfectly flat horizontal lines. Each wave uses 3 layered harmonics (1x, 2x, 0.5x frequency) at 100%, 40%, and 60% of this amplitude. |
| **Frequency** | `frequency` | `2.5` | 0.5 | 10 | 0.1 | Horizontal density of the sine curve, scaled by viewport aspect ratio. Higher values = more oscillations visible. |

### Appearance

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Opacity** | `opacity` | `0.60` | 0 | 1 | 0.01 | Global wave opacity. Each wave also has individual layered opacity that increases from back (25%) to front (100%), creating natural depth. |
| **Thickness (px)** | `thickness` | `1` | 1 | 100 | 1 | Width of the solid core of each wave in pixels. Converted to UV space in the shader using viewport resolution. At 1px, waves are thin lines. At 100px, waves are wide bands. |
| **Blur (px)** | `blur` | `30` | 0 | 200 | 1 | Soft fade zone on wave edges in pixels. At 0, wave edges are perfectly sharp. Higher values create smooth gradients from full color to transparent. |

### Distribution

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Concentration** | `concentration` | `0` | 0 | 50 | 0.1 | Compresses the vertical range in which waves are distributed, centering them on screen. The range formula is `0.85 / (1 + concentration)`. At 0, waves span ~85% of screen height. At 50, waves occupy ~1.7% of screen height. |
| **Randomness** | `randomness` | `0` | 0 | 1 | 0.01 | Per-wave amplitude variation. At 0, all waves have identical amplitude. At 1, amplitudes range from 0% to 100% of max. |
| **Thickness Random** | `thicknessRandom` | `0` | 0 | 1 | 0.01 | Per-wave thickness variation. Uses a different pseudo-random seed than amplitude randomness, so thickness and amplitude vary independently. |
| **Vertical Offset** | `verticalOffset` | `0` | -0.5 | 0.5 | 0.01 | Shifts the entire wave group up or down from the vertical center. Combines with Concentration. |

### Transform

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Rotation (°)** | `rotation` | `0` | 0 | 360 | 1 | Rotates the entire wave pattern around the screen center. Applied in UV space before wave computation, preserving aspect ratio. |

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

When the `theme` prop is not set, the component reads the user's local hour and selects the matching theme. It re-checks every 60 seconds via `setInterval`. Manually selecting a theme via the control panel disables auto-selection until "Reset to defaults" is clicked. Setting the `theme` prop disables auto-selection entirely.

### Theme Transitions

Switching themes triggers a smooth 1500ms color transition using eased interpolation (`ease-in-out` cubic). Colors are interpolated in RGB space via Three.js `Color.lerp()`.

---

## Custom Colors & RGBA Picker

### Color Swatches

Four color swatches are shown in the **Custom Colors** section of the control panel. Each swatch represents one of the 4 theme colors (background + 3 wave colors).

### RGBA Picker

Click any swatch to open the picker popover. On desktop, it opens below the swatch. On mobile, it opens as a centered overlay.

| Component | Description |
|-----------|-------------|
| **SV Area** | Saturation (horizontal) and Brightness (vertical) selector. Drag to pick. |
| **Hue Bar** | Rainbow gradient strip. Drag to select the base hue (0–360). |
| **Alpha Bar** | Transparency slider with checkerboard background. Drag to set opacity (0–1). |
| **R input** | Red channel (0–255) |
| **G input** | Green channel (0–255) |
| **B input** | Blue channel (0–255) |
| **A input** | Alpha / opacity (0–100%) |

Changing any color value automatically switches the active theme to `"custom"`. Custom colors persist during the session. The auto time-of-day timer will not override a manually selected or custom theme.

### Per-Color Opacity

Each of the 4 colors has its own opacity value, passed as separate uniforms (`u_colorOpacity1..4`) to the fragment shader:

- **Color 1 (background)**: Opacity does NOT affect the background fill. It only affects how Color 1 blends in wave gradients.
- **Colors 2–4 (wave colors)**: Opacity scales the wave's alpha when that color is used.

---

## Rendering Modes

### Symmetric Band (default)

Each wave renders color in a **symmetric band** centered on its wave position:

1. **Solid core** — extends `thickness` (in pixels, converted to UV) from the wave center. Full color, no fade.
2. **Blur fade** — extends `blur` (in pixels) beyond the solid core. Smooth gradient from full color to transparent.

```glsl
dist = abs(uv.y - waveY);
edge = 1.0 - smoothstep(thick, thick + blurUV, dist);
```

### Split Fill

Each wave fills color **upward** from its wave line:

```glsl
edge = smoothstep(waveY - thick - blurUV, waveY - thick, uv.y);
```

This creates a layered "stacked fill" effect. With concentration, it produces a visible horizontal split.

### Glass

Semi-transparent waves with optical effects:

- Background bleed-through (40% transparency)
- Refraction — wave slope shifts perceived color
- Caustic highlights — animated bright spots near wave center
- Fresnel rim glow — bright edges where the surface curves away
- Specular highlight — soft bright line along wave crest

Glass reduces overall wave opacity by 25%.

### Liquid Metal

Smooth 3D chrome effect with iridescent color tinting. When enabled, one sub-parameter appears:

| Parameter | Key | Default | Min | Max | Step | Description |
|-----------|-----|---------|-----|-----|------|-------------|
| **Liquify** | `lmLiquid` | `0.07` | 0 | 0.2 | 0.001 | Flow intensity from simplex noise. Distorts the surface "normal" creating organic, flowing liquid quality. At 0, surface is smooth. At max, highly turbulent. |

The effect uses three layers of simplex noise at different frequencies for organic liquid distortion. A fake environment reflection maps wave slope to a smooth bright/dark gradient. Iridescent color tinting shifts the wave color's hue based on surface angle.

---

## Shader Uniforms

Complete list of uniforms passed from `WaveBackground.jsx` to `waveFragment.glsl`:

| Uniform | Type | Updated | Description |
|---------|------|---------|-------------|
| `u_time` | `float` | Every frame | Elapsed time from Three.js clock |
| `u_seed` | `float` | Once (mount) | Random seed for wave phase and per-wave randomness |
| `u_resolution` | `vec2` | On resize | Viewport width and height in pixels |
| `u_mouse` | `vec2` | Every frame | Normalized mouse position (0–1), smoothed with lerp |
| `u_color1` | `vec3` | On theme change | Background color (animated over 1500ms) |
| `u_color2` | `vec3` | On theme change | Wave gradient color 1 |
| `u_color3` | `vec3` | On theme change | Wave gradient color 2 |
| `u_color4` | `vec3` | On theme change | Wave gradient color 3 |
| `u_colorOpacity1..4` | `float` | Every frame | Per-color opacity (0–1) |
| `u_waveCount` | `float` | Every frame | Number of wave layers (cast to int in shader) |
| `u_speed` | `float` | Every frame | Speed multiplier applied to time |
| `u_amplitude` | `float` | Every frame | Maximum wave displacement |
| `u_frequency` | `float` | Every frame | Sine wave horizontal frequency |
| `u_opacity` | `float` | Every frame | Global wave opacity |
| `u_thickness` | `float` | Every frame | Wave thickness in pixels (converted to UV in shader) |
| `u_blur` | `float` | Every frame | Wave blur in pixels (converted to UV in shader) |
| `u_concentration` | `float` | Every frame | Wave vertical compression |
| `u_randomness` | `float` | Every frame | Per-wave amplitude variation |
| `u_thicknessRandom` | `float` | Every frame | Per-wave thickness variation |
| `u_verticalOffset` | `float` | Every frame | Vertical shift from center |
| `u_rotation` | `float` | Every frame | Rotation angle in radians |
| `u_splitFill` | `float` | Every frame | Rendering mode (0 = band, 1 = split fill) |
| `u_glass` | `float` | Every frame | Glass effect toggle (0 or 1) |
| `u_liquidMetal` | `float` | Every frame | Liquid Metal effect toggle (0 or 1) |
| `u_lmLiquid` | `float` | Every frame | Liquid Metal flow intensity |

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
                             - Slider component (with editable values)
                             - HeroWave component (state, Canvas, control panel)

  WaveBackground.jsx         Three.js scene component. Contains:
                             - Shader material with all uniforms
                             - Color transition animation (useEffect)
                             - Per-frame uniform sync (useFrame)
                             - Resolution tracking (useThree)

  shaders/
    waveVertex.glsl          Passthrough vertex shader (sets v_uv)
    waveFragment.glsl        Main fragment shader:
                             - UV rotation around screen center
                             - Wave position calculation with concentration
                             - Per-wave amplitude with randomness
                             - Sine wave harmonics (3 layers per wave)
                             - Pixel-based thickness and blur conversion
                             - Mouse-reactive distortion
                             - Symmetric band or split fill rendering
                             - Glass and Liquid Metal effects
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

---

## Testing

### Prerequisites

```bash
npm run dev -- --host 0.0.0.0   # Start the dev server first
npx playwright install chromium  # One-time browser install
```

### Unit + Visual Tests

```bash
node test-all.mjs
```

### Visual Tests

```bash
node test-visual.mjs
```

Screenshots are saved to `screenshots/`.

---

## Performance

- All wave computation runs on the GPU in the fragment shader
- CPU work per frame: update uniform floats + 1 lerp for mouse smoothing
- No DOM manipulation or CSS animation during rendering
- Canvas DPR capped at `min(devicePixelRatio, 2)` for Retina without over-rendering
- `powerPreference: 'high-performance'` hints the browser to use the discrete GPU
- The wave loop in GLSL has a hard cap of 100 iterations (max waves)

### Bundle Size

```bash
npm run build
```

Production output in `dist/`.

---

## Troubleshooting

### Waves not visible

- Check that WebGL is supported in your browser (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)
- Verify Opacity is not set to 0
- Check that Amplitude is not 0 (waves would be flat lines)

### Black screen

- Ensure the background color (first custom color swatch) is not black
- If using per-color opacity, check that at least one wave color has opacity > 0

### Performance issues

- Reduce the Waves count (fewer GPU iterations)
- Lower the browser window size or DPR

### Theme keeps changing

- If you don't set the `theme` prop and haven't manually selected a theme, auto-selection runs every 60 seconds
- Manually selecting a theme disables auto-selection
- Pass a fixed `theme` prop to lock it: `<HeroWave theme="daytime" />`
- "Reset to defaults" re-enables auto-selection
