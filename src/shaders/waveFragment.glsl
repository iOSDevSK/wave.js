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
uniform float u_glass;
uniform float u_liquidMetal;
uniform float u_lmRefraction;
uniform float u_lmEdge;
uniform float u_lmPatternBlur;
uniform float u_lmLiquid;
uniform float u_lmSpeed;
uniform float u_lmPatternScale;

varying vec2 v_uv;

// Simplex noise (from MetalFlow / Ashima Arts)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
               dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

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

    // Glass effect: transparency, refraction, caustic highlights, soft edges
    if (u_glass > 0.5) {
      float gDistFromWave = uv.y - waveY;
      float gAbsDist = abs(gDistFromWave);
      float gBandWidth = thick + u_blur + 0.02;

      waveColor = mix(waveColor, color, 0.4);

      float gDx = cos(uv.x * aspect * u_frequency + t * (0.8 + fi * 0.1) + phase) * amp;
      float refractedY = uv.y + gDx * 0.1;
      float refractTint = smoothstep(0.3, 0.7, refractedY);
      waveColor = mix(waveColor, waveColor * (0.8 + refractTint * 0.4), 0.5);

      float caustic1 = sin(uv.x * aspect * u_frequency * 3.0 + t * 1.2 + phase * 2.0) * 0.5 + 0.5;
      float caustic2 = sin(uv.x * aspect * u_frequency * 5.0 - t * 0.8 + phase * 3.0) * 0.5 + 0.5;
      float gNearCenter = 1.0 - smoothstep(0.0, gBandWidth * 0.6, gAbsDist);
      waveColor += vec3(pow(caustic1 * caustic2, 2.0) * gNearCenter * 0.15);

      float gEdge = smoothstep(0.0, gBandWidth, gAbsDist);
      waveColor += vec3(pow(gEdge, 0.8) * (1.0 - gEdge) * 0.25);

      waveColor += vec3(pow(max(0.0, 1.0 - gAbsDist / (gBandWidth * 0.15)), 6.0) * 0.12);

      alpha *= 0.75;
    }

    // Liquid metal effect: smooth 3D chrome with iridescent tint
    if (u_liquidMetal > 0.5) {
      float mDist = uv.y - waveY;
      float absDist = abs(mDist);
      float bandWidth = thick + u_blur + 0.02;
      float normDist = clamp(absDist / bandWidth, 0.0, 1.0);

      // Edge softness
      float edgeMask = smoothstep(1.0, 1.0 - u_lmEdge * 0.5, normDist);

      // Surface "normal" from wave slope and distance
      float lmT = u_time * u_lmSpeed;
      float dx = cos(uv.x * aspect * u_frequency + t * (0.8 + fi * 0.1) + phase) * amp;
      float slope = dx * u_lmPatternScale;

      // Simplex noise for organic liquid distortion
      float n1 = snoise(vec2(uv.x * aspect * 1.5 + fi, waveY * 4.0) - lmT * 0.5);
      float n2 = snoise(vec2(uv.x * aspect * 3.0 - fi * 0.5, waveY * 8.0) + lmT * 0.3);
      float n3 = snoise(vec2(uv.x * aspect * 0.8 + fi * 2.0, uv.y * 3.0) - lmT * 0.2);

      // Liquid distortion of surface normal
      float liquidSlope = slope + n1 * u_lmLiquid * 4.0 + n2 * u_lmLiquid * 2.0;
      float liquidDist = normDist + n3 * u_lmLiquid * 0.5;
      liquidDist = clamp(liquidDist, 0.0, 1.0);

      // Fake environment reflection: smooth gradient based on "reflected" angle
      float envAngle = liquidSlope * 0.3 + mDist / bandWidth * 0.5 + n1 * u_lmPatternBlur * 8.0;
      envAngle = envAngle * 0.5 + 0.5; // normalize to 0-1
      envAngle = clamp(envAngle, 0.0, 1.0);

      // Smooth environment: dark -> mid -> bright -> mid
      float envCurve = sin(envAngle * 3.14159) ;
      float envBright = pow(envCurve, 0.6 + u_lmPatternBlur * 10.0);

      // Base chrome from environment
      vec3 metalColor = mix(vec3(0.02, 0.02, 0.03), vec3(0.95, 0.93, 0.98), envBright);

      // Iridescent color tint from wave color
      vec3 tint = waveColor * 1.2 + vec3(0.1);
      // Shift tint hue based on angle for iridescence
      float hueShift = envAngle * 0.5 + liquidSlope * 0.2;
      vec3 iridescentTint = mix(tint, tint.gbr, smoothstep(0.3, 0.7, hueShift));
      metalColor = mix(metalColor, metalColor * iridescentTint, 0.5 + envBright * 0.3);

      // Chromatic aberration on edges
      float refrOffset = u_lmRefraction * 30.0 * (1.0 - envBright);
      float envR = sin((envAngle + refrOffset) * 3.14159);
      float envB = sin((envAngle - refrOffset * 1.3) * 3.14159);
      metalColor.r = mix(metalColor.r, pow(max(0.0, envR), 0.6) * 0.9, refrOffset * 2.0);
      metalColor.b = mix(metalColor.b, pow(max(0.0, envB), 0.6) * 0.9, refrOffset * 2.0);

      // Broad specular highlight on crest
      float spec = pow(max(0.0, 1.0 - liquidDist * 2.5), 3.0);
      metalColor += vec3(0.95, 0.9, 1.0) * spec * 0.4;

      // Secondary softer highlight
      float spec2 = pow(max(0.0, 1.0 - abs(liquidDist - 0.3) * 4.0), 2.0);
      metalColor += vec3(0.8, 0.75, 0.9) * spec2 * 0.15;

      // Fresnel: bright rim on wave edges
      float fresnel = pow(liquidDist, 0.4) * pow(1.0 - liquidDist, 0.8);
      metalColor += vec3(0.9, 0.85, 1.0) * fresnel * 0.5;

      // Depth: upper part brighter (like light from above)
      float depth = smoothstep(-bandWidth * 0.5, bandWidth * 0.5, mDist);
      metalColor *= 0.6 + depth * 0.6;

      // Contrast boost
      metalColor = pow(metalColor, vec3(0.9));

      // Apply with edge softness
      waveColor = mix(waveColor, metalColor, edgeMask);
    }

    color = mix(color, waveColor, alpha * colorAlpha);
  }

  // Film grain
  float grain = fract(sin(dot(gl_FragCoord.xy * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.012;

  gl_FragColor = vec4(color, 1.0);
}
