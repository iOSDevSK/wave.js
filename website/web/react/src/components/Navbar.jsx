import { GithubLogo } from '@phosphor-icons/react'
import WaveLogo from './WaveLogo'

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WaveLogo size={32} />
          <span className="font-display font-bold tracking-tight text-lg">Wave.js</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#playground" className="hover:text-white transition-colors">Playground</a>
          <a href="#code" className="hover:text-white transition-colors">Documentation</a>
          <a href="https://github.com/iOSDevSK/wave.js" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-white/5 border border-white/10 text-zinc-300">
            v1.0.0
          </span>
          <a
            href="https://github.com/iOSDevSK/wave.js"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <GithubLogo size={20} />
            <span className="text-sm font-medium hidden sm:block">Star on GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  )
}
