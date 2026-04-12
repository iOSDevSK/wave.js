precision highp float;

uniform float u_time;
uniform float u_seed;
uniform vec2 u_resolution;

uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;

uniform float u_colorOpacity1;
uniform float u_colorOpacity2;
uniform float u_colorOpacity3;
uniform float u_colorOpacity4;

uniform vec2 u_mouse;

// User-controllable params
uniform float u_waveCount;
uniform float u_speed;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_opacity;
uniform float u_thickness;
uniform float u_blur;
uniform float u_concentration;
uniform float u_randomness;
uniform float u_thicknessRandom;
uniform float u_verticalOffset;
uniform float u_splitFill;
uniform float u_metallic;

varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;

  float t = u_time * u_speed;

  // Mouse influence
  float mouseInfluence = (u_mouse.x - 0.5) * 0.08;

  int waveCount = int(u_waveCount);

  // Background color (not affected by per-color opacity)
  vec3 color = u_color1;

  // Wave distribution range — shrinks toward center with concentration
  float range = 0.85 / (1.0 + u_concentration);
  float startY = 0.5 + u_verticalOffset - range / 2.0;

  // Draw waves from back to front
  for (int i = 0; i < 20; i++) {
    if (i >= waveCount) break;

    float fi = float(i);
    float phase = fi * 0.7 + u_seed;

    // Base Y — distribute across screen, concentrated toward center
    float baseY = startY + fi / max(float(waveCount) - 1.0, 1.0) * range;

    // Per-wave amplitude: randomness scales each wave differently using seed
    float waveRand = fract(sin(fi * 127.1 + u_seed * 311.7) * 43758.5453);
    float amp = u_amplitude * (1.0 - u_randomness + u_randomness * waveRand);

    // Classic sine wave with layered harmonics
    float wave = 0.0;
    wave += sin(uv.x * aspect * u_frequency + t * (0.8 + fi * 0.1) + phase) * amp;
    wave += sin(uv.x * aspect * u_frequency * 2.0 - t * (0.5 + fi * 0.15) + phase * 2.0) * amp * 0.4;
    wave += sin(uv.x * aspect * u_frequency * 0.5 + t * (0.3 + fi * 0.05) + phase * 3.0) * amp * 0.6;

    // Mouse pushes waves
    wave += mouseInfluence * sin(uv.x * aspect * 3.0 + fi) * 0.3;

    float waveY = baseY + wave;

    // Per-wave thickness: thicknessRandom scales each wave differently
    float thickRand = fract(sin(fi * 253.3 + u_seed * 197.1) * 43758.5453);
    float thick = u_thickness * (1.0 - u_thicknessRandom + u_thicknessRandom * thickRand);

    // Edge calculation
    // thick = solid core half-width, blur = soft fade width on edges
    float edge;
    if (u_splitFill > 0.5) {
      // Split fill: solid above (waveY - thick), blur zone below that
      edge = smoothstep(waveY - thick - u_blur, waveY - thick, uv.y);
    } else {
      // Symmetric band: solid core of 'thick', then blur fade
      float halfExtent = range * 0.5 + thick;
      float dist = abs(uv.y - waveY);
      edge = 1.0 - smoothstep(halfExtent, halfExtent + u_blur, dist);
    }

    // Per-wave opacity — back waves more transparent, front more opaque
    float layerAlpha = u_opacity * (0.25 + 0.75 * (fi / max(float(waveCount) - 1.0, 1.0)));
    float alpha = edge * layerAlpha;

    // Color — smooth gradient across all waves
    float colorMix = fi / max(float(waveCount) - 1.0, 1.0);
    vec3 waveColor;
    float colorAlpha;
    if (colorMix < 0.333) {
      float t = colorMix * 3.0;
      waveColor = mix(u_color2, u_color3, t);
      colorAlpha = mix(u_colorOpacity2, u_colorOpacity3, t);
    } else if (colorMix < 0.666) {
      float t = (colorMix - 0.333) * 3.0;
      waveColor = mix(u_color3, u_color4, t);
      colorAlpha = mix(u_colorOpacity3, u_colorOpacity4, t);
    } else {
      float t = (colorMix - 0.666) * 3.0;
      waveColor = mix(u_color4, u_color2, t);
      colorAlpha = mix(u_colorOpacity4, u_colorOpacity2, t);
    }

    // Subtle brightness shimmer along wave
    float brightness = 0.95 + 0.1 * sin(uv.x * aspect * 3.0 + t * 0.5 + fi);
    waveColor *= brightness;

    // Metallic effect: horizontal specular highlights along wave crests
    if (u_metallic > 0.5) {
      float distFromWave = uv.y - waveY;
      float absDist = abs(distFromWave);
      float bandWidth = thick + u_blur + 0.02;

      // Sharp horizontal highlight at wave center line
      float centerLine = 1.0 - smoothstep(0.0, bandWidth * 0.3, absDist);
      float specular = pow(centerLine, 4.0);

      // Secondary highlight slightly offset (like chrome double-reflection)
      float secondaryLine = 1.0 - smoothstep(bandWidth * 0.2, bandWidth * 0.5, absDist);
      float secondary = pow(secondaryLine, 2.0) * 0.3;

      // Environment reflection: fake gradient mapped to wave surface position
      float envReflect = smoothstep(-bandWidth, bandWidth, distFromWave);
      vec3 envColor = mix(waveColor * 0.4, waveColor * 1.4 + vec3(0.15), envReflect);

      // Subtle horizontal variation from wave slope for organic feel
      float dx = cos(uv.x * aspect * u_frequency + t * (0.8 + fi * 0.1) + phase) * amp;
      float slopeVar = 0.85 + 0.15 * dx / max(amp, 0.001);

      // Combine: environment base + specular highlights
      vec3 highlight = mix(waveColor, vec3(1.0), 0.6);
      waveColor = mix(envColor, highlight, specular * 0.7 + secondary) * slopeVar;
      waveColor += vec3(specular * 0.2);
    }

    color = mix(color, waveColor, alpha * colorAlpha);
  }

  // Film grain
  float grain = fract(sin(dot(gl_FragCoord.xy * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.012;

  gl_FragColor = vec4(color, 1.0);
}
