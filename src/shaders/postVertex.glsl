// Passthrough vertex shader for fullscreen post-process passes.
// Reuses the same input layout as waveVertex (a_position -> v_uv).
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
