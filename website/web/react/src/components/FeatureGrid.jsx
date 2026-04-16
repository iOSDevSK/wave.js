import { Package, GraphicsCard, Plugs, Sliders, TextT, Handshake } from '@phosphor-icons/react'

const features = [
  {
    icon: Package,
    title: 'Zero Dependencies',
    desc: 'Written in pure WebGL and vanilla JS. ~7kb gzipped, zero external libraries. No bloat, just waves.',
    color: 'teal',
  },
  {
    icon: GraphicsCard,
    title: 'GPU Accelerated',
    desc: 'Offloads rendering entirely to the GPU via custom fragment shaders. Rock solid 60fps on mobile.',
    color: 'blue',
  },
  {
    icon: Plugs,
    title: 'React + Vanilla JS',
    desc: 'Full-featured React component with built-in control panel, or use vanilla JS with any framework or plain HTML.',
    color: 'purple',
  },
  {
    icon: Sliders,
    title: '12 Parameters',
    desc: 'Total control over amplitude, frequency, thickness, blur, concentration, rotation, and more.',
    color: 'teal',
  },
  {
    icon: TextT,
    title: 'Glass & Liquid Metal',
    desc: 'Built-in visual effects: frosted glass, chrome liquid metal, split fill, and film grain post-processing.',
    color: 'blue',
  },
  {
    icon: Handshake,
    title: 'MIT Licensed',
    desc: 'Truly open source. Free to use forever in personal, commercial, or client projects.',
    color: 'purple',
  },
]

const colorMap = {
  teal: {
    text: 'text-teal',
    hover: 'group-hover:bg-teal/10',
    bar: 'from-teal',
  },
  blue: {
    text: 'text-blue',
    hover: 'group-hover:bg-blue/10',
    bar: 'from-blue',
  },
  purple: {
    text: 'text-purple',
    hover: 'group-hover:bg-purple/10',
    bar: 'from-purple',
  },
}

export default function FeatureGrid() {
  return (
    <section id="why" className="pt-24 pb-32 px-6">
      <div className="max-w-7xl mx-auto rounded-2xl border border-white/[0.08] bg-surface/40 p-10 md:p-14">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-4">Architected for production.</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const c = colorMap[f.color]
            return (
              <div
                key={f.title}
                className="bg-surface border border-white/[0.05] p-8 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${c.bar} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 ${c.text} border border-white/10 ${c.hover} transition-colors`}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-display font-medium text-lg mb-2 text-white">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
