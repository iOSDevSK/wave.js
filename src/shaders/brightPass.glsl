// Bright-pass filter: isolate bright pixels for bloom input.
// Uses Rec. 709 luminance with a smooth knee threshold so the transition
// between "dark" and "bloom" is gradient, not clipped. Emits the original
// colour scaled by the knee mask so bright hues are preserved.
precision highp float;

uniform sampler2D u_scene;
uniform float u_threshold;

varying vec2 v_uv;

void main() {
  vec3 c = texture2D(u_scene, v_uv).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // Soft knee: transition over 0.15 luminance units above the threshold.
  float mask = smoothstep(u_threshold, u_threshold + 0.15, lum);
  gl_FragColor = vec4(c * mask, 1.0);
}
