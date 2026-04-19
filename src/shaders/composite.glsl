// Bloom composite: add blurred bright channel back onto the scene.
// Bloom texture is sampled from a quarter-resolution buffer using bilinear
// filtering, which gives us a free upsample.
precision highp float;

uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_intensity;

varying vec2 v_uv;

void main() {
  vec3 scene = texture2D(u_scene, v_uv).rgb;
  vec3 bloom = texture2D(u_bloom, v_uv).rgb;
  // Additive blend. The default framebuffer clamps to [0,1] on write so
  // very hot pixels get a "blown out" look, which is what we want for
  // the Lumen specular core.
  gl_FragColor = vec4(scene + bloom * u_intensity, 1.0);
}
