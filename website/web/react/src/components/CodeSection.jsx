import { useState } from 'react'
import { Copy, Check, Atom, FileJs } from '@phosphor-icons/react'

const codeVanilla = [
  { type: 'comment', text: '// 1. Import the library' },
  { type: 'code', parts: [
    { cls: 'token-keyword', text: 'import' },
    { text: ' { WaveBackground } ' },
    { cls: 'token-keyword', text: 'from' },
    { text: ' ' },
    { cls: 'token-string', text: "'wave.js'" },
  ]},
  { type: 'blank' },
  { type: 'comment', text: '// 2. Initialize on a container' },
  { type: 'code', parts: [
    { cls: 'token-keyword', text: 'const' },
    { text: ' wave = ' },
    { cls: 'token-keyword', text: 'new' },
    { text: ' ' },
    { cls: 'token-function', text: 'WaveBackground' },
    { text: "(" },
    { cls: 'token-string', text: "'#hero'" },
    { text: ', {' },
  ]},
  { type: 'code', parts: [
    { text: '  theme: ' },
    { cls: 'token-string', text: "'sunset'" },
    { text: ',' },
  ]},
  { type: 'code', parts: [
    { text: '  waveCount: ' },
    { cls: 'token-number', text: '12' },
    { text: ',' },
  ]},
  { type: 'code', parts: [
    { text: '  speed: ' },
    { cls: 'token-number', text: '0.5' },
    { text: ',' },
  ]},
  { type: 'code', parts: [
    { text: '  glass: ' },
    { cls: 'token-keyword', text: 'true' },
  ]},
  { type: 'code', parts: [{ text: '})' }] },
]

const codeReact = [
  { type: 'comment', text: '// React component with built-in controls' },
  { type: 'code', parts: [
    { cls: 'token-keyword', text: 'import' },
    { text: ' { HeroWave } ' },
    { cls: 'token-keyword', text: 'from' },
    { text: ' ' },
    { cls: 'token-string', text: "'wave.js/react'" },
  ]},
  { type: 'blank' },
  { type: 'code', parts: [
    { cls: 'token-keyword', text: 'function' },
    { text: ' ' },
    { cls: 'token-function', text: 'App' },
    { text: '() {' },
  ]},
  { type: 'code', parts: [
    { text: '  ' },
    { cls: 'token-keyword', text: 'return' },
    { text: ' (' },
  ]},
  { type: 'code', parts: [
    { text: '    <' },
    { cls: 'token-function', text: 'HeroWave' },
  ]},
  { type: 'code', parts: [
    { text: '      theme=' },
    { cls: 'token-string', text: '"sunset"' },
  ]},
  { type: 'code', parts: [
    { text: '      style={{ height: ' },
    { cls: 'token-string', text: "'50vh'" },
    { text: ' }}' },
  ]},
  { type: 'code', parts: [{ text: '    >' }] },
  { type: 'code', parts: [
    { text: '      <' },
    { cls: 'token-function', text: 'h1' },
    { text: '>Your Content</' },
    { cls: 'token-function', text: 'h1' },
    { text: '>' },
  ]},
  { type: 'code', parts: [
    { text: '    </' },
    { cls: 'token-function', text: 'HeroWave' },
    { text: '>' },
  ]},
  { type: 'code', parts: [{ text: '  )' }] },
  { type: 'code', parts: [{ text: '}' }] },
]

const rawVanilla = `import { WaveBackground } from 'wave.js'

const wave = new WaveBackground('#hero', {
  theme: 'sunset',
  waveCount: 12,
  speed: 0.5,
  glass: true
})`

const rawReact = `import { HeroWave } from 'wave.js/react'

function App() {
  return (
    <HeroWave theme="sunset" style={{ height: '50vh' }}>
      <h1>Your Content</h1>
    </HeroWave>
  )
}`

export default function CodeSection() {
  const [tab, setTab] = useState('vanilla')
  const [copied, setCopied] = useState(false)

  const lines = tab === 'vanilla' ? codeVanilla : codeReact

  const handleCopy = () => {
    navigator.clipboard.writeText(tab === 'vanilla' ? rawVanilla : rawReact)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="code" className="py-32 px-6 relative overflow-hidden">

      <div className="max-w-4xl mx-auto text-center mb-16 relative z-10">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
          Simple to use.<br />Endlessly customizable.
        </h2>
        <p className="text-lg text-muted">Initialize the shader on any DOM element. Framework agnostic design.</p>
      </div>

      <div className="max-w-3xl mx-auto relative z-10 border-gradient rounded-xl bg-[#02040a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-void-light border-b border-white/5">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <button
              onClick={() => setTab('vanilla')}
              className={`pb-1 transition-colors ${tab === 'vanilla' ? 'text-teal border-b border-teal' : 'text-muted hover:text-white'}`}
            >
              Vanilla JS
            </button>
            <button
              onClick={() => setTab('react')}
              className={`pb-1 transition-colors ${tab === 'react' ? 'text-teal border-b border-teal' : 'text-muted hover:text-white'}`}
            >
              React
            </button>
          </div>
          <button onClick={handleCopy} className="text-muted hover:text-white transition-colors">
            {copied ? <Check size={16} className="text-teal" /> : <Copy size={16} />}
          </button>
        </div>

        <div className="p-6 overflow-x-auto text-sm font-mono leading-relaxed text-white/80">
          {lines.map((line, i) => (
            <div key={i} className={line.type === 'blank' ? 'h-5' : ''}>
              {line.type === 'comment' && <span className="token-comment">{line.text}</span>}
              {line.type === 'code' && line.parts.map((part, j) => (
                <span key={j} className={part.cls || ''}>{part.text}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Framework selector buttons */}
      <div className="max-w-3xl mx-auto mt-12 flex flex-wrap justify-center gap-6">
        <button
          onClick={() => setTab('vanilla')}
          className={`flex items-center gap-2 font-display font-medium px-5 py-2.5 rounded-lg border transition-all duration-300 ${
            tab === 'vanilla'
              ? 'text-white bg-white/10 border-teal/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              : 'text-muted border-white/10 hover:text-white hover:border-white/25 hover:bg-white/5'
          }`}
        >
          <FileJs size={20} className={tab === 'vanilla' ? 'text-teal' : ''} /> Vanilla JS
        </button>
        <button
          onClick={() => setTab('react')}
          className={`flex items-center gap-2 font-display font-medium px-5 py-2.5 rounded-lg border transition-all duration-300 ${
            tab === 'react'
              ? 'text-white bg-white/10 border-teal/50 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              : 'text-muted border-white/10 hover:text-white hover:border-white/25 hover:bg-white/5'
          }`}
        >
          <Atom size={20} className={tab === 'react' ? 'text-teal' : ''} /> React Component
        </button>
      </div>
    </section>
  )
}
