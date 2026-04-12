import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import waveVertexShader from './shaders/waveVertex.glsl'
import waveFragmentShader from './shaders/waveFragment.glsl'

export default function WaveBackground({ colors, colorOpacities, mouse, params, splitFill }) {
  const meshRef = useRef()
  const { viewport, size } = useThree()

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_seed: { value: Math.random() * 100 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_color1: { value: new THREE.Color(colors[0]) },
    u_color2: { value: new THREE.Color(colors[1]) },
    u_color3: { value: new THREE.Color(colors[2]) },
    u_color4: { value: new THREE.Color(colors[3]) },
    u_colorOpacity1: { value: colorOpacities[0] },
    u_colorOpacity2: { value: colorOpacities[1] },
    u_colorOpacity3: { value: colorOpacities[2] },
    u_colorOpacity4: { value: colorOpacities[3] },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_waveCount: { value: params.waveCount },
    u_speed: { value: params.speed },
    u_amplitude: { value: params.amplitude },
    u_frequency: { value: params.frequency },
    u_opacity: { value: params.opacity },
    u_thickness: { value: params.thickness },
    u_blur: { value: params.blur },
    u_concentration: { value: params.concentration },
    u_randomness: { value: params.randomness },
    u_thicknessRandom: { value: params.thicknessRandom },
    u_verticalOffset: { value: params.verticalOffset },
    u_splitFill: { value: splitFill ? 1.0 : 0.0 },
  }), [])

  // Animate color transitions
  useEffect(() => {
    const targets = colors.map(c => new THREE.Color(c))
    const current = [
      uniforms.u_color1.value,
      uniforms.u_color2.value,
      uniforms.u_color3.value,
      uniforms.u_color4.value,
    ]
    let frame
    let progress = 0
    const duration = 1500
    const startColors = current.map(c => c.clone())

    const animate = () => {
      progress += 16
      const t = Math.min(progress / duration, 1)
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      current.forEach((c, i) => {
        c.copy(startColors[i]).lerp(targets[i], ease)
      })
      if (t < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [colors])

  // Update resolution on resize
  useEffect(() => {
    uniforms.u_resolution.value.set(size.width, size.height)
  }, [size])

  // Sync params to uniforms every frame
  useFrame((state) => {
    if (!meshRef.current) return
    uniforms.u_time.value = state.clock.elapsedTime
    uniforms.u_mouse.value.lerp(mouse.current, 0.05)
    uniforms.u_waveCount.value = params.waveCount
    uniforms.u_speed.value = params.speed
    uniforms.u_amplitude.value = params.amplitude
    uniforms.u_frequency.value = params.frequency
    uniforms.u_opacity.value = params.opacity
    uniforms.u_thickness.value = params.thickness
    uniforms.u_blur.value = params.blur
    uniforms.u_concentration.value = params.concentration
    uniforms.u_randomness.value = params.randomness
    uniforms.u_thicknessRandom.value = params.thicknessRandom
    uniforms.u_verticalOffset.value = params.verticalOffset
    uniforms.u_splitFill.value = splitFill ? 1.0 : 0.0
    uniforms.u_colorOpacity1.value = colorOpacities[0]
    uniforms.u_colorOpacity2.value = colorOpacities[1]
    uniforms.u_colorOpacity3.value = colorOpacities[2]
    uniforms.u_colorOpacity4.value = colorOpacities[3]
  })

  const scale = 1.2

  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <planeGeometry args={[viewport.width * scale, viewport.height * scale, 1, 1]} />
      <shaderMaterial
        vertexShader={waveVertexShader}
        fragmentShader={waveFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}
