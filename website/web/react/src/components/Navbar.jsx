import { useState } from 'react'
import { GithubLogo, List, X } from '@phosphor-icons/react'
import WaveLogo from './WaveLogo'

function NavLink({ href, children, external, onClick }) {
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <a
      href={href}
      className="relative text-muted hover:text-white transition-colors py-1 group"
      onClick={onClick}
      {...props}
    >
      {children}
      <span className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300 rounded-full bg-gradient-to-r from-teal to-blue" />
    </a>
  )
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WaveLogo size={32} />
          <span className="font-display font-bold tracking-tight text-lg">Wave.js</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <NavLink href="#">Home</NavLink>
          <NavLink href="#themes">Themes</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#code">Code</NavLink>
          <NavLink href="#why">Why Wave.js</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-white/5 border border-white/10 text-zinc-300">
            v1.0.2
          </span>
          <a
            href="https://github.com/iOSDevSK/wave.js"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <GithubLogo size={20} />
            <span className="text-sm font-medium hidden sm:block">GitHub</span>
          </a>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden flex items-center justify-center w-10 h-10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-void/95 backdrop-blur-xl">
          <div className="flex flex-col gap-1 px-6 py-4 text-sm font-medium">
            <NavLink href="#" onClick={closeMenu}>Home</NavLink>
            <NavLink href="#themes" onClick={closeMenu}>Themes</NavLink>
            <NavLink href="#features" onClick={closeMenu}>Features</NavLink>
            <NavLink href="#code" onClick={closeMenu}>Code</NavLink>
            <NavLink href="#why" onClick={closeMenu}>Why Wave.js</NavLink>
            <NavLink href="https://github.com/iOSDevSK/wave.js" external onClick={closeMenu}>GitHub</NavLink>
          </div>
        </div>
      )}
    </nav>
  )
}
