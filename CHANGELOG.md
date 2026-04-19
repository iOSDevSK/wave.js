# Changelog

## 1.2.0 — 2026-04-19

New **Twist** effect and default bloom tuning.

### Added
- **Twist effect.** Renders each wave as a flat chrome/glass ribbon rotating around its own horizontal axis. Width swells face-on and collapses edge-on, a specular streak sweeps across as the ribbon turns, rim highlight on the silhouette, dark "glass" back face.
- `twist` option + `setTwist(v)` runtime method.
- `twistAmount` param (0–1) — scales the effect intensity.

### Changed
- Default `bloomThreshold` lowered from `0.85` to `0.6` so bloom is visible on non-HDR (non-Lumen) scenes without slider tweaking.

### Notes
- Twist is WebGL2-only. Disabled in Lumen mode (the two effects drive the full render pipeline).

## 1.1.0 — 2026-04-18

Major GPU performance overhaul. Default state drops from ~20 W to ~1–2 W GPU on Apple Silicon; 4–8× lower thermals in typical use.

### Added
- `pixelRatio` option (default `1`) — caps canvas DPR. Retina rendered at 2× produced 4× the pixel count with no visual benefit on soft gradient content.
- `maxFPS` option (default `60`) — throttles the render loop. Stops 120 Hz ProMotion displays from doubling GPU work.
- `setPixelRatio(ratio)` and `setMaxFPS(fps)` runtime methods.
- Automatic pause when the page is hidden (`visibilitychange`) or the wave container is scrolled offscreen (`IntersectionObserver`). GPU drops to 0 W while not visible.

### Changed
- **Shader variants.** Glass, Liquid Metal, and the simplex noise functions are now wrapped in `#ifdef` blocks and stripped from the compiled shader when the features are off. Toggling a feature recompiles the program — no per-frame cost for unused effects. Liquid Metal alone was ~75 % of the shader budget (3 simplex noise evaluations per wave per pixel).
- **Canvas 2D renderer.** Rotation transform and diagonal draw-area expansion are now skipped when `rotation ≡ 0 (mod 360)`. Sample density halved (smooth sine curves don't need 400 points across). ~2–3× faster on the default website preset.
- Default `pixelRatio` changed from implicit `min(devicePixelRatio, 2)` to `1`.

### Performance
Apple M4 Max, 1440×900 viewport, 60 fps, WebGL2 renderer:

| Preset | Before | After |
|---|---|---|
| Default (8 waves, no effects) | ~20 W | ~1 W |
| 16 waves + Glass + Liquid Metal | n/a (uncapped) | ~5 W |
| 100 waves + all effects + Split Fill | — | ~35 W (compute bound) |

For extreme configurations (e.g. 100 waves + Liquid Metal), call `wave.setPixelRatio(0.5)` for another ~4× reduction.

## 1.0.2

- Updated README/DOCS on npm, renderer fix, color picker portal.

## 1.0.1

- Initial public release.
