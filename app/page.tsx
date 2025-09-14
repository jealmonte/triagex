"use client"

import Header from "@/components/header"
import HeroContent from "@/components/hero-content"
import PulsingCircle from "@/components/pulsing-circle"
import ShaderBackground from "@/components/shader-background"
import dynamic from "next/dynamic"

// Lazy load AboutSection for better performance
const AboutSection = dynamic(() => import("@/components/about-section"), {
  loading: () => null,   // Or a skeleton loader
  ssr: false
})

// Lazy load ComparisonSection for better performance
const ComparisonSection = dynamic(() => import("@/components/comparison-section"), {
  loading: () => null,
  ssr: false
})

// Lazy load FeaturesSection for better performance
const FeaturesSection = dynamic(() => import("@/components/features-section"), {
  loading: () => null,
  ssr: false
})

export default function ShaderShowcase() {
  return (
    <ShaderBackground>
      <Header />
      <section className="relative min-h-screen z-20">
        <div className="flex flex-col min-h-screen justify-end items-start px-6 pb-12 md:hidden">
          <HeroContent />
        </div>
        <div className="hidden md:block">
          <div className="absolute bottom-8 left-8 max-w-lg w-full">
            <HeroContent />
          </div>
        </div>
        <div className="hidden sm:block">
          <PulsingCircle />
        </div>
      </section>
      <AboutSection />          {/* Lazy loaded */}
      <ComparisonSection />     {/* Lazy loaded */}
      <FeaturesSection />       {/* Lazy loaded */}
    </ShaderBackground>
  )
}
