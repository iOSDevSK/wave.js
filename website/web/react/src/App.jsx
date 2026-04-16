import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import BentoFeatures from './components/BentoFeatures'
import ThemeGallery from './components/ThemeGallery'
import CodeSection from './components/CodeSection'
import FeatureGrid from './components/FeatureGrid'
import Footer from './components/Footer'

export default function App() {
  const [activePreset, setActivePreset] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="selection:bg-teal/30 selection:text-white overflow-x-hidden">
      {/* Global Grid Overlay */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 w-full flex flex-col items-center overflow-x-hidden">
        <Hero activePreset={activePreset} onPresetApplied={() => setActivePreset(null)} />

        <ThemeGallery onApplyPreset={setActivePreset} />

        <BentoFeatures />

        <CodeSection />

        <FeatureGrid />

        <Footer />
      </main>
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 hover:scale-110 bg-blue/20 text-blue border border-blue/30 hover:bg-blue/30 hover:border-blue/50 backdrop-blur-md ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  )
}
