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

    // Liquid metal effect (MetalFlow-inspired)
    if (u_liquidMetal > 0.5) {
      float mDist = uv.y - waveY;
      float absDist = abs(mDist);
      float bandWidth = thick + u_blur + 0.02;
      float normDist = clamp(absDist / bandWidth, 0.0, 1.0);

      // Edge softness
      float edgeMask = smoothstep(1.0, 1.0 - u_lmEdge * 0.5, normDist);

      // Chrome base colors (MetalFlow: near-white and near-black)
      vec3 chromeLight = vec3(0.98, 0.98, 1.0);
      vec3 chromeDark = vec3(0.1, 0.1, 0.12);

      // Wave slope for bulge
      float dx = cos(uv.x * aspect * u_frequency + t * (0.8 + fi * 0.1) + phase) * amp;
      float bulge = clamp(1.0 - normDist * 1.2, 0.0, 1.0);

      // Simplex noise for liquid flow
      float lmT = u_time * u_lmSpeed;
      float noise = snoise(vec2(uv.x * aspect * 2.0 + fi * 1.5, waveY * 6.0) - lmT * 0.7);
      float noise2 = snoise(vec2(uv.x * aspect * 4.0 - fi * 0.7, waveY * 10.0) + lmT * 0.5);

      // Liquify: noise distorts the edge detection
      float liquidEdge = normDist + (1.0 - normDist) * u_lmLiquid * noise;

      // Stripe direction along wave
      float diagonal = uv.x * aspect - uv.y;
      float dir = diagonal + dx * 3.0 + waveY * 2.0;
      dir += noise * u_lmLiquid * 3.0 * bulge;
      dir -= lmT;
      dir *= (0.1 + (1.1 - liquidEdge) * bulge);
      dir *= u_lmPatternScale * 0.4;

      // Pattern cycle
      float cycleWidth = 1.0;
      float thinStrip1 = 0.12 / cycleWidth * (1.0 - 0.4 * bulge);
      float thinStrip2 = 0.07 / cycleWidth * (1.0 + 0.4 * bulge);
      float wideStrip = 1.0 - thinStrip1 - thinStrip2;
      float pb = u_lmPatternBlur * 16.0 + 0.01;

      // Chromatic aberration per channel
      float refrR = u_lmRefraction * 33.0 * (1.0 - bulge + 0.03 * bulge * noise);
      float refrB = u_lmRefraction * 43.0;

      float stripe_r = mod(dir + refrR, cycleWidth);
      float stripe_g = mod(dir, cycleWidth);
      float stripe_b = mod(dir - refrB, cycleWidth);

      // MetalFlow-style multi-band stripe blending
      float w1 = thinStrip1;
      float w12 = thinStrip1 + thinStrip2;

      float r = mix(chromeDark.r, chromeLight.r, smoothstep(0.0, pb, stripe_r));
      r = mix(r, chromeDark.r, smoothstep(w1 - pb, w1 + pb, stripe_r));
      r = mix(r, chromeLight.r, smoothstep(w12 - pb, w12 + pb, stripe_r));
      float gradR = mix(chromeLight.r, chromeDark.r, smoothstep(0.0, 1.0, (stripe_r - w12) / wideStrip));
      r = mix(r, gradR, smoothstep(w12 - pb, w12 + pb, stripe_r));

      float g = mix(chromeDark.g, chromeLight.g, smoothstep(0.0, pb, stripe_g));
      g = mix(g, chromeDark.g, smoothstep(w1 - pb, w1 + pb, stripe_g));
      g = mix(g, chromeLight.g, smoothstep(w12 - pb, w12 + pb, stripe_g));
      float gradG = mix(chromeLight.g, chromeDark.g, smoothstep(0.0, 1.0, (stripe_g - w12) / wideStrip));
      g = mix(g, gradG, smoothstep(w12 - pb, w12 + pb, stripe_g));

      float b = mix(chromeDark.b, chromeLight.b, smoothstep(0.0, pb, stripe_b));
      b = mix(b, chromeDark.b, smoothstep(w1 - pb, w1 + pb, stripe_b));
      b = mix(b, chromeLight.b, smoothstep(w12 - pb, w12 + pb, stripe_b));
      float gradB = mix(chromeLight.b, chromeDark.b, smoothstep(0.0, 1.0, (stripe_b - w12) / wideStrip));
      b = mix(b, gradB, smoothstep(w12 - pb, w12 + pb, stripe_b));

      vec3 metalColor = vec3(r, g, b);

      // Tint chrome with wave color (subtle)
      metalColor = mix(metalColor, metalColor * (waveColor * 1.5 + vec3(0.3)), 0.35);

      // Depth gradient
      float depthGrad = smoothstep(-bandWidth, bandWidth, mDist);
      metalColor = mix(metalColor * 0.75, metalColor * 1.15, depthGrad);

      // Fresnel edge glow
      float fresnel = pow(normDist, 0.5) * (1.0 - normDist);
      metalColor += chromeLight * fresnel * 0.25;

      // Specular on crest
      float spec = pow(max(0.0, 1.0 - normDist * 4.0), 5.0);
      metalColor += vec3(spec * 0.12);

      // Apply edge softness
      waveColor = mix(waveColor, metalColor, edgeMask);
    }

    color = mix(color, waveColor, alpha * colorAlpha);
  }

  // Film grain
  float grain = fract(sin(dot(gl_FragCoord.xy * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.012;

  gl_FragColor = vec4(color, 1.0);
}
