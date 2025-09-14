"use client"

import Image from "next/image"

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="min-h-screen flex flex-col items-center justify-center relative px-4 py-20"
    >
      <div className="max-w-6xl mx-auto relative">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light text-white mb-2 sm:mb-4 font-sans">
            <span className="font-medium italic instrument">
              Revolutionary
            </span>{" "}
            Features
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-xs sm:max-w-2xl mx-auto font-light">
            Discover the advanced capabilities that make the Rapid Triage Kit an
            essential tool for emergency medical response teams.
          </p>
        </div>

        {/* Main product image + feature boxes */}
        <div className="flex justify-center items-center">
          <div className="relative w-[220px] h-[300px] sm:w-[400px] sm:h-[600px] md:w-[600px] md:h-[800px]">
            <Image
              src="/images/rapid-triage-kit.png"
              alt="Rapid Triage Kit - Emergency Medical Device"
              fill
              sizes="(max-width: 640px) 220px, (max-width: 1024px) 400px, 600px"
              className="object-contain max-w-full h-auto relative z-10"
              priority
              style={{
                animation: "float 3s ease-in-out infinite"
              }}
            />

            {/* Desktop floating feature boxes */}
            <div className="hidden sm:block">
              <div className="absolute -top-4 -left-2 sm:-top-6 sm:-left-24 bg-gray-500/80 backdrop-blur-sm border border-white/20 rounded-lg p-2 sm:p-6 max-w-[140px] sm:max-w-xs shadow-md sm:shadow-2xl transition-all duration-300 hover:border-white/50 hover:shadow-lg sm:hover:shadow-white/20 z-20 text-xs sm:text-base">
                <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-3 font-sans">
                  <span className="font-medium italic instrument text-base sm:text-xl inline-block mr-1.5">
                    Rapid
                  </span>
                  <span className="font-light">Assessment</span>
                </h3>
                <p className="text-white/90 leading-relaxed">
                  Advanced algorithms provide instant medical triage decisions in critical situations.
                </p>
              </div>
              <div className="absolute top-2/3 -right-24 sm:-right-40 bg-gray-500/80 backdrop-blur-sm border border-white/20 rounded-lg p-2 sm:p-6 max-w-[140px] sm:max-w-xs shadow-md sm:shadow-2xl transition-all duration-300 hover:border-white/50 hover:shadow-lg sm:hover:shadow-white/20 z-20 text-xs sm:text-base">
                <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-3 font-sans">
                  <span className="font-medium italic instrument text-base sm:text-xl inline-block mr-1.5">
                    Portable
                  </span>
                  <span className="font-light">Design</span>
                </h3>
                <p className="text-white/90 leading-relaxed">
                  Compact, battery-powered device designed for field deployment.
                </p>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 -left-16 sm:-left-72 bg-gray-500/80 backdrop-blur-sm border border-white/20 rounded-lg p-2 sm:p-6 max-w-[140px] sm:max-w-xs shadow-md sm:shadow-2xl transition-all duration-300 hover:border-white/50 hover:shadow-lg sm:hover:shadow-white/20 z-20 text-xs sm:text-base">
                <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-3 font-sans">
                  <span className="font-medium italic instrument text-base sm:text-xl inline-block mr-1.5">
                    Real-time
                  </span>
                  <span className="font-light">Data</span>
                </h3>
                <p className="text-white/90 leading-relaxed">
                  Continuous monitoring and data collection with wireless connectivity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stacked feature boxes */}
        <div className="flex flex-col sm:hidden w-full items-center gap-4 mt-6">
          <div className="bg-gray-500/80 backdrop-blur-sm border border-white/20 rounded-lg p-2 max-w-full shadow-md transition-all duration-300 hover:border-white/50 hover:shadow-lg z-20 text-xs">
            <h3 className="text-white font-semibold text-base mb-1 font-sans">
              <span className="font-medium italic instrument text-base inline-block mr-1.5">
                Rapid
              </span>
              <span className="font-light">Assessment</span>
            </h3>
            <p className="text-white/90 leading-relaxed">
              Advanced algorithms provide instant medical triage decisions in critical situations.
            </p>
          </div>
          <div className="bg-gray-500/80 backdrop-blur-sm border border-white/20 rounded-lg p-2 max-w-full shadow-md transition-all duration-300 hover:border-white/50 hover:shadow-lg z-20 text-xs">
            <h3 className="text-white font-semibold text-base mb-1 font-sans">
              <span className="font-medium italic instrument text-base inline-block mr-1.5">
                Portable
              </span>
              <span className="font-light">Design</span>
            </h3>
            <p className="text-white/90 leading-relaxed">
              Compact, battery-powered device designed for field deployment.
            </p>
          </div>
          <div className="bg-gray-500/80 backdrop-blur-sm border border-white/20 rounded-lg p-2 max-w-full shadow-md transition-all duration-300 hover:border-white/50 hover:shadow-lg z-20 text-xs">
            <h3 className="text-white font-semibold text-base mb-1 font-sans">
              <span className="font-medium italic instrument text-base inline-block mr-1.5">
                Real-time
              </span>
              <span className="font-light">Data</span>
            </h3>
            <p className="text-white/90 leading-relaxed">
              Continuous monitoring and data collection with wireless connectivity.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}
