import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import meshVertexShader from './shaders/meshVertex.glsl'
import meshFragmentShader from './shaders/meshFragment.glsl'

export default function WaveMesh({ colors, mouse }) {
  const meshRef = useRef()
  const baseRotation = useRef(new THREE.Euler(-0.4, -0.3, 0.15))

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_colorA: { value: new THREE.Color(colors[0]) },
    u_colorB: { value: new THREE.Color(colors[3]) },
    u_fresnelColor: { value: new THREE.Color('#ffffff') },
    u_fresnelStrength: { value: 1.5 },
    u_fresnelPower: { value: 2.0 },
    u_opacity: { value: 0.4 },
    u_gradientContrast: { value: 1.6 },
    u_gradientOffset: { value: -0.15 },
  }), [])

  // Update colors when theme changes
  useEffect(() => {
    const targetA = new THREE.Color(colors[0])
    const targetB = new THREE.Color(colors[3])
    const startA = uniforms.u_colorA.value.clone()
    const startB = uniforms.u_colorB.value.clone()
    let progress = 0
    let frame
    const animate = () => {
      progress += 16
      const t = Math.min(progress / 1500, 1)
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      uniforms.u_colorA.value.copy(startA).lerp(targetA, ease)
      uniforms.u_colorB.value.copy(startB).lerp(targetB, ease)
      if (t < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [colors])

  useFrame((state) => {
    if (!meshRef.current) return
    uniforms.u_time.value = state.clock.elapsedTime

    uniforms.u_mouse.value.lerp(mouse.current, 0.03)

    // Gentle mouse-driven rotation layered on base rotation
    const targetRotX = baseRotation.current.x + (mouse.current.y - 0.5) * 0.12
    const targetRotY = baseRotation.current.y + (mouse.current.x - 0.5) * 0.15
    meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.015
    meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * 0.015
  })

  return (
    <mesh ref={meshRef} position={[2, -0.8, 0.5]} rotation={[-0.4, -0.3, 0.15]}>
      <planeGeometry args={[14, 14, 150, 150]} />
      <shaderMaterial
        vertexShader={meshVertexShader}
        fragmentShader={meshFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
