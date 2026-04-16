import { Cpu, Atom, FileJs, MagicWand } from '@phosphor-icons/react'

export default function BentoFeatures() {
  return (
    <section id="features" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-32 z-20 scroll-mt-[58px]">
      <div className="mb-16">
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Architecture of fluid.</h2>
        <p className="text-muted font-light max-w-2xl text-lg">
          Designed from the ground up for modern JS runtimes. Wave.js bypasses standard DOM manipulation to write directly to the GPU via custom GLSL shaders.
        </p>
      </div>

      <div className="bento-grid rounded-xl overflow-hidden grid-cols-1 md:grid-cols-3 md:grid-rows-2">
        {/* Performance */}
        <div className="bento-item p-8 md:col-span-2 relative overflow-hidden group flex flex-col justify-end min-h-[300px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-teal/10 transition-colors duration-700" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded flex items-center justify-center mb-6">
              <Cpu size={24} className="text-teal" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Steady 60 FPS</h3>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
              Highly optimized draw calls. Calculations are batched and executed natively on the GPU, leaving your main thread entirely free for application logic.
            </p>
          </div>
        </div>

        {/* Size */}
        <div className="bento-item p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="h-full flex flex-col justify-between relative z-10">
            <div>
              <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-600 mb-2">
                ~7<span className="text-2xl text-zinc-500">kb</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-4">Micro Footprint</h3>
            </div>
            <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
              ~7kb gzipped, zero dependencies. Tree-shakeable exports mean you only bundle what you render.
            </p>
          </div>
        </div>

        {/* Frameworks */}
        <div className="bento-item p-8 relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex gap-4 mb-6 text-2xl text-zinc-600 group-hover:text-white transition-colors duration-500">
              <Atom size={28} className="hover:text-[#61dafb] cursor-pointer transition-colors" />
              <FileJs size={28} className="hover:text-[#f7df1e] cursor-pointer transition-colors" />
            </div>
            <div className="mt-auto">
              <h3 className="text-lg font-bold text-white mb-2">React + Vanilla JS</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Full-featured React component with built-in control panel. Or use vanilla JS — works with any framework.
              </p>
            </div>
          </div>
        </div>

        {/* Renderer Fallbacks */}
        <div className="bento-item p-0 md:col-span-2 relative overflow-hidden group flex flex-col md:flex-row border-l border-white/5">
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center relative z-10 bg-[#0a0a0a]">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded flex items-center justify-center mb-4">
              <MagicWand size={20} className="text-blue" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Fallbacks</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Automatic renderer chain: WebGL2 &rarr; Canvas 2D &rarr; CSS Gradient &rarr; Solid color. Every device gets the best experience.
            </p>
          </div>

          <div className="w-full md:w-1/2 bg-[#050505] relative overflow-hidden border-t md:border-t-0 md:border-l border-white/5 flex items-center justify-center min-h-[200px]">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]" />
            <div className="w-48 h-32 border border-teal/30 rounded flex flex-col p-2 bg-[#0a0a0a]/80 backdrop-blur z-10 shadow-[0_0_30px_rgba(0,240,255,0.1)] group-hover:shadow-[0_0_40px_rgba(0,240,255,0.2)] transition-shadow">
              <div className="text-[8px] font-mono text-teal mb-2">RENDERER_CHAIN</div>
              <div className="w-full h-1 bg-white/10 rounded mb-1 overflow-hidden"><div className="w-full h-full bg-teal" /></div>
              <div className="w-full h-1 bg-white/10 rounded mb-1 overflow-hidden"><div className="w-3/4 h-full bg-blue" /></div>
              <div className="w-full h-1 bg-white/10 rounded mb-1 overflow-hidden"><div className="w-1/2 h-full bg-purple" /></div>
              <div className="w-full h-1 bg-white/10 rounded mb-1 overflow-hidden"><div className="w-1/4 h-full bg-zinc-500" /></div>
              <div className="mt-auto flex justify-between items-end">
                <span className="text-[9px] font-mono text-zinc-500">WebGL2</span>
                <span className="text-[9px] font-mono text-zinc-500">Canvas</span>
                <span className="text-[9px] font-mono text-zinc-500">CSS</span>
                <span className="text-[9px] font-mono text-zinc-500">Solid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
