import { useState } from 'react'
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

  return (
    <div className="selection:bg-teal/30 selection:text-white">
      {/* Global Grid Overlay */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 w-full flex flex-col items-center">
        <Hero activePreset={activePreset} onPresetApplied={() => setActivePreset(null)} />

        <ThemeGallery onApplyPreset={setActivePreset} />

        <BentoFeatures />

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <CodeSection />

        <FeatureGrid />

        <Footer />
      </main>
    </div>
  )
}
