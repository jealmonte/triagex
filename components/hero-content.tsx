"use client"

import type React from "react"
import { useRouter } from "next/navigation"

export default function HeroContent() {
  const router = useRouter()

  const scrollToAbout = (e: React.MouseEvent) => {
    e.preventDefault()
    const aboutSection = document.querySelector("#about") as HTMLElement
    if (aboutSection) {
      const headerHeight = 80
      const elementPosition = aboutSection.offsetTop - headerHeight
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="w-full max-w-lg text-left">
      <div
        className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm mb-4 relative"
        style={{ filter: "url(#glass-effect)" }}
      >
        <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
        <span className="text-white text-xs font-light relative z-10">
          ✨ Scroll To See How We Revolutionize Trauma Response
        </span>
      </div>
      <h1 className="text-4xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
        <span className="font-medium italic instrument">TriageX:</span> Rapid
        <br />
        <span className="font-light tracking-tight text-white">Triage Kit</span>
      </h1>
      <p className="text-base font-light text-white/70 mb-6 leading-relaxed">
        Introducing TriageX—the AI-powered triage kit designed for paramedics and first responders, delivering
        instant, lifesaving diagnostics when every second counts. Make critical decisions faster, smarter, and with
        confidence, transforming emergency care in the moments that matter most.
      </p>
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={scrollToAbout}
          className="px-8 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer"
        >
          About
        </button>
        <button
          onClick={() => router.push('/trauma-site')}
          className="px-8 py-3 rounded-full bg-white text-black font-normal text-xs transition-all duration-200 hover:bg-white/90 cursor-pointer"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
