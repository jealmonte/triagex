export default function ComparisonSection() {
  return (
    <section id="comparison" className="relative min-h-screen flex flex-col justify-center items-center px-8">
      {/* Section Title */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white mb-6">
          <span className="font-medium italic instrument mr-2">TriageX </span>
          vs Traditional
        </h2>
        <p className="text-lg font-light text-white/70 max-w-2xl mx-auto">
          See how our AI-powered triage system outperforms traditional methods
        </p>
      </div>

      {/* Comparison Chart */}
      <div className="max-w-5xl mx-auto w-full">
        <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-black/60 border-b border-white/20">
            <div className="p-6 text-xs sm:text-lg text-white font-light">Metric</div>
            <div className="p-6 text-xs sm:text-lg text-white font-light border-l border-white/20 text-center">
              <span className="font-medium italic instrument">TriageX</span> AI Kit
            </div>
            <div className="p-6 text-xs sm:text-lg text-white font-light border-l border-white/20 text-center">
              Traditional Kit
            </div>
          </div>

          {/* Table Rows */}
          <div className="grid grid-cols-3 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="p-6 text-xs sm:text-lg text-white/90 font-light">Triage Patients/Hour</div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center">
              <span className="text-green-400 font-medium">Up to 3x more</span>
            </div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center text-white/70">Baseline</div>
          </div>

          <div className="grid grid-cols-3 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="p-6 text-xs sm:text-lg text-white/90 font-light">Diagnostic Accuracy</div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center">
              <span className="text-green-400 font-medium">Up to 99.1%</span>
            </div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center text-white/70">~80.5-90%</div>
          </div>

          <div className="grid grid-cols-3 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="p-6 text-xs sm:text-lg text-white/90 font-light">Under-/Over-Triage Rate</div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center">
              <span className="text-green-400 font-medium">As low as 0.9%</span>
            </div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center text-white/70">1.2% or higher</div>
          </div>

          <div className="grid grid-cols-3 border-b border-white/10 hover:bg-white/5 transition-colors">
            <div className="p-6 text-xs sm:text-lg text-white/90 font-light">Power Usage</div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center">
              <span className="text-green-400 font-medium">8x less</span>
            </div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center text-white/70">High (manual/e-paper)</div>
          </div>

          <div className="grid grid-cols-3 hover:bg-white/5 transition-colors">
            <div className="p-6 text-xs sm:text-lg text-white/90 font-light">Real-time Alerts</div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center">
              <span className="text-green-400 font-medium">Yes, instant</span>
            </div>
            <div className="p-6 text-xs sm:text-lg border-l border-white/20 text-center text-white/70">No, often delayed</div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-12 text-center">
          <p className="text-lg text-white/80 font-light max-w-3xl mx-auto">
            TriageX delivers superior performance across all critical metrics, enabling faster, more accurate patient assessment while reducing power consumption and human error.
          </p>
        </div>
      </div>
    </section>
  )
}
