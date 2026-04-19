import { useId } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { Package, GraphicsCard, Plugs, Sliders, TextT, Handshake } from '@phosphor-icons/react'

const features = [
  {
    icon: Package,
    title: 'Zero Dependencies',
    desc: 'Written in pure WebGL and vanilla JS. ~11kb gzipped, zero external libraries. No bloat, just waves.',
    color: 'teal',
    pattern: { y: 16, squares: [[0, 1], [1, 3]] },
  },
  {
    icon: GraphicsCard,
    title: 'GPU Accelerated',
    desc: 'Offloads rendering entirely to the GPU via custom fragment shaders. Rock solid 60fps on mobile.',
    color: 'blue',
    pattern: { y: -6, squares: [[-1, 2], [1, 3]] },
  },
  {
    icon: Plugs,
    title: 'React + Vanilla JS',
    desc: 'Full-featured React component with built-in control panel, or use vanilla JS with any framework or plain HTML.',
    color: 'purple',
    pattern: { y: 22, squares: [[0, 2], [1, 4]] },
  },
  {
    icon: Sliders,
    title: '12 Parameters',
    desc: 'Total control over amplitude, frequency, thickness, blur, concentration, rotation, and more.',
    color: 'teal',
    pattern: { y: -2, squares: [[1, 1], [0, 3]] },
  },
  {
    icon: TextT,
    title: 'Glass & Liquid Metal',
    desc: 'Built-in visual effects: frosted glass, chrome liquid metal, split fill, and film grain post-processing.',
    color: 'blue',
    pattern: { y: 32, squares: [[0, 2], [1, 0]] },
  },
  {
    icon: Handshake,
    title: 'MIT Licensed',
    desc: 'Truly open source. Free to use forever in personal, commercial, or client projects.',
    color: 'purple',
    pattern: { y: 10, squares: [[-1, 1], [1, 3]] },
  },
]

const colorMap = {
  teal: {
    text: 'text-teal',
    gradientFrom: '#07303a',
    gradientTo: '#0a2a2a',
    iconHoverBg: 'group-hover:bg-teal/10',
    iconHoverRing: 'group-hover:ring-teal/40',
    gridFill: 'fill-teal/[0.03]',
    gridStroke: 'stroke-teal/[0.07]',
    gridHoverFill: 'fill-teal/[0.06]',
    gridHoverStroke: 'stroke-teal/10',
  },
  blue: {
    text: 'text-blue',
    gradientFrom: '#0a1a3a',
    gradientTo: '#0f1a30',
    iconHoverBg: 'group-hover:bg-blue/10',
    iconHoverRing: 'group-hover:ring-blue/40',
    gridFill: 'fill-blue/[0.03]',
    gridStroke: 'stroke-blue/[0.07]',
    gridHoverFill: 'fill-blue/[0.06]',
    gridHoverStroke: 'stroke-blue/10',
  },
  purple: {
    text: 'text-purple',
    gradientFrom: '#1a0a3a',
    gradientTo: '#1a0f30',
    iconHoverBg: 'group-hover:bg-purple/10',
    iconHoverRing: 'group-hover:ring-purple/40',
    gridFill: 'fill-purple/[0.03]',
    gridStroke: 'stroke-purple/[0.07]',
    gridHoverFill: 'fill-purple/[0.06]',
    gridHoverStroke: 'stroke-purple/10',
  },
}

function GridPattern({ width, height, x, y, squares, ...props }) {
  const patternId = useId()
  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([sx, sy]) => (
            <rect key={`${sx}-${sy}`} strokeWidth="0" width={width + 1} height={height + 1} x={sx * width} y={sy * height} />
          ))}
        </svg>
      )}
    </svg>
  )
}

function SpotlightPattern({ mouseX, mouseY, color }) {
  const maskImage = useMotionTemplate`radial-gradient(200px at ${mouseX}px ${mouseY}px, white, transparent)`
  const style = { maskImage, WebkitMaskImage: maskImage }
  const c = colorMap[color]

  return (
    <div className="pointer-events-none">
      {/* Gradient spotlight following mouse */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ ...style, background: `linear-gradient(to right, ${c.gradientFrom}, ${c.gradientTo})` }}
      />
    </div>
  )
}

function FeatureCard({ feature }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const c = colorMap[feature.color]

  function onMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      onMouseMove={onMouseMove}
      className="group relative flex rounded-2xl bg-surface transition-shadow duration-300 hover:shadow-md hover:shadow-black/20"
    >
      <SpotlightPattern mouseX={mouseX} mouseY={mouseY} color={feature.color} />

      {/* Ring border */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06] transition duration-300 group-hover:ring-white/[0.12]" />

      {/* Content */}
      <div className="relative rounded-2xl p-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-1 ring-white/15 backdrop-blur-sm transition duration-300 ${c.text} bg-white/5 ${c.iconHoverBg} ${c.iconHoverRing}`}>
          <feature.icon size={20} />
        </div>
        <h3 className="mt-5 font-display font-medium text-lg text-white">{feature.title}</h3>
        <p className="mt-2 text-muted text-sm leading-relaxed">{feature.desc}</p>
      </div>
    </div>
  )
}

export default function FeatureGrid() {
  return (
    <section id="why" className="pt-16 md:pt-24 pb-20 md:pb-32 px-4 sm:px-6 w-full scroll-mt-[58px]">
      <div className="max-w-7xl mx-auto rounded-2xl border border-white/[0.08] bg-surface/40 p-10 md:p-14">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-4">Architected for production.</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </div>
    </section>
  )
}
