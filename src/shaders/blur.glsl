// Separable 9-tap Gaussian blur using the linear-sampling trick (5 fetches).
// Run twice: first with u_direction=(1,0), then (0,1). Run the pair twice
// more for a wider effective radius (the renderer does 2 H+V iterations).
// Sigma ~2.5 at the sampled resolution — at 1/4 scene resolution this gives
// ~40px effective blur radius on a 1440p viewport.
precision highp float;

uniform sampler2D u_tex;
uniform vec2 u_texelSize;   // (1/width, 1/height) of u_tex
uniform vec2 u_direction;   // (1,0) horizontal, (0,1) vertical

varying vec2 v_uv;

void main() {
  vec2 off1 = u_direction * u_texelSize * 1.3846153846;
  vec2 off2 = u_direction * u_texelSize * 3.2307692308;

  vec4 c  = texture2D(u_tex, v_uv) * 0.2270270270;
  c      += texture2D(u_tex, v_uv + off1) * 0.3162162162;
  c      += texture2D(u_tex, v_uv - off1) * 0.3162162162;
  c      += texture2D(u_tex, v_uv + off2) * 0.0702702703;
  c      += texture2D(u_tex, v_uv - off2) * 0.0702702703;

  gl_FragColor = c;
}
