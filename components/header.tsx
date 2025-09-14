"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export default function Header() {
  const router = useRouter()

  // Reusable section scroll handler
  const scrollToSection = useCallback((id: string) => {
    const headerHeight = 80
    const section = document.getElementById(id)
    if (section) {
      window.scrollTo({
        top: section.offsetTop - headerHeight,
        behavior: "smooth",
      })
    }
  }, [])

  // Button click handlers
  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToSection("about")
  }
  const handleComparisonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToSection("comparison")
  }
  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToSection("features")
  }
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const navigateToDemo = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/trauma-site")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-black/30 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center">
        <button
          onClick={scrollToTop}
          className="text-white font-medium italic instrument text-xl hover:text-white/80 transition-colors duration-200 cursor-pointer"
        >
          TriageX
        </button>
      </div>
      <nav className="flex items-center space-x-2">
        <a href="#about" onClick={handleAboutClick} className="text-white hover:text-white/80 text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">About</a>
        <a href="#comparison" onClick={handleComparisonClick} className="text-white hover:text-white/80 text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Comparison</a>
        <a href="#features" onClick={handleFeaturesClick} className="text-white hover:text-white/80 text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200">Features</a>
      </nav>
      <div id="gooey-btn" className="relative flex items-center group" style={{ filter: "url(#gooey-filter)" }}>
        <button className="absolute right-0 px-2.5 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </button>
        <button
          onClick={navigateToDemo}
          className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10"
        >
          Demo
        </button>
      </div>
    </header>
  )
}
