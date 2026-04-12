uniform float u_time;
uniform vec2 u_mouse;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vFresnel;
varying float vGradient;
varying vec2 vUv;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
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
  vUv = uv;

  vec3 pos = position;
  float t = u_time * 0.08;

  // Large flowing wave displacement
  float wave1 = snoise(pos.xy * 0.25 + t * 0.7) * 1.5;
  float wave2 = snoise(pos.xy * 0.5 + t * 1.0 + 50.0) * 0.6;
  float wave3 = snoise(pos.xy * 1.0 + t * 0.5 + 200.0) * 0.2;

  // Combine waves — flowing fabric effect
  float displacement = wave1 + wave2 + wave3;

  // Mouse influence: gentle push in the area near mouse
  vec2 mouseInfluence = (u_mouse - 0.5) * 0.4;
  displacement += snoise(pos.xy * 0.4 + mouseInfluence * 3.0) * 0.25;

  pos.z += displacement;

  // Compute perturbed normal via finite differences
  float eps = 0.08;
  float dRight = snoise((position.xy + vec2(eps, 0.0)) * 0.25 + t * 0.7) * 1.5
               + snoise((position.xy + vec2(eps, 0.0)) * 0.5 + t + 50.0) * 0.6;
  float dLeft  = snoise((position.xy - vec2(eps, 0.0)) * 0.25 + t * 0.7) * 1.5
               + snoise((position.xy - vec2(eps, 0.0)) * 0.5 + t + 50.0) * 0.6;
  float dUp    = snoise((position.xy + vec2(0.0, eps)) * 0.25 + t * 0.7) * 1.5
               + snoise((position.xy + vec2(0.0, eps)) * 0.5 + t + 50.0) * 0.6;
  float dDown  = snoise((position.xy - vec2(0.0, eps)) * 0.25 + t * 0.7) * 1.5
               + snoise((position.xy - vec2(0.0, eps)) * 0.5 + t + 50.0) * 0.6;

  vec3 perturbedNormal = normalize(vec3(
    -(dRight - dLeft) / (2.0 * eps),
    -(dUp - dDown) / (2.0 * eps),
    1.0
  ));

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPosition.xyz;
  vPosition = pos;
  vNormal = normalize(normalMatrix * perturbedNormal);

  // Fresnel
  vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
  vFresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);

  // Gradient — diagonal flow
  vGradient = (pos.x * 0.6 + pos.y * 0.4) * 0.1 + 0.5;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
