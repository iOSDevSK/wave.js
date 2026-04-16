import WaveLogo from './WaveLogo'

export default function Footer() {
  return (
    <footer className="bg-black w-full border-t border-white/[0.05] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-3 opacity-80">
            <WaveLogo size={20} />
            <span className="font-display font-bold text-sm tracking-tight">Wave.js</span>
            <span className="text-xs text-muted ml-2">&mdash; Open source, MIT licensed.</span>
          </div>

          <div className="flex gap-6 text-sm font-medium text-muted">
            <a href="https://github.com/iOSDevSK/wave.js" target="_blank" rel="noopener noreferrer" className="hover:text-teal transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/wave.js" target="_blank" rel="noopener noreferrer" className="hover:text-teal transition-colors">npm</a>
            <a href="#code" className="hover:text-teal transition-colors">Docs</a>
            <a href="#features" className="hover:text-teal transition-colors">Features</a>
          </div>
        </div>

        <div className="text-center border-t border-white/5 pt-8">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Filip Dvoran &middot; Released under the MIT License
          </p>
          <p className="text-[11px] text-muted/50 mt-2">
            Browser support: Chrome 56+ &middot; Firefox 51+ &middot; Safari 15+ &middot; Edge 79+
          </p>
        </div>
      </div>
    </footer>
  )
}
