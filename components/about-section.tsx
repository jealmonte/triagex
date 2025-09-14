export default function AboutSection() {
  return (
    <section id="about" className="relative min-h-screen flex flex-col justify-center items-center px-8">
      {/* Section Title */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white mb-6">
          <span className="font-medium italic instrument mr-2">About</span>
          TriageX
        </h2>
        <p className="text-lg font-light text-white/80 max-w-2xl mx-auto">
          Revolutionizing emergency medical response with AI-powered triage technology
        </p>
      </div>

      {/* Content Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-stretch">
        {/* Mission Statement with Dynamic Image Hover */}
        <div className="relative group bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl p-8 h-full overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105">
          {/* Background image overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-cover bg-center z-0"
            style={{
              backgroundImage: "url('https://img.freepik.com/premium-photo/people-paramedic-help-patient-road-scene-emergency-rescue-support-emt-team-healthcare-stretcher-injured-person-accident-with-medical-service-care-iv-bag_590464-395105.jpg')"
            }}
          ></div>
          {/* Box Content */}
          <div className="relative z-10">
            <h3 className="text-2xl font-light text-white mb-6">
              <span className="font-medium italic instrument mr-2">Our</span>
              Mission
            </h3>
            <p className="text-white/80 font-light leading-relaxed mb-6">
              TriageX addresses the urgent need for speed, precision, and reliability in emergency medical triage by
              equipping first responders with an advanced AI-powered diagnostic device. Traditional triage methods are
              often slow, prone to human error, and struggle to keep up during high-volume incidents—delaying life-saving
              interventions and accurate prioritization.
            </p>
            <p className="text-white/80 font-light leading-relaxed">
              With TriageX, emergency responders can deliver the decisive, data-driven care patients need—when every
              second counts.
            </p>
          </div>
        </div>

        {/* Technology Features with Dynamic Image Hover */}
        <div className="relative group bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl p-8 h-full overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105">
          {/* Background image overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-cover bg-center z-0"
            style={{
              backgroundImage: "url('https://media.istockphoto.com/id/1291088722/photo/black-african-american-ems-professional-paramedic-using-tablet-computer-to-fill-a.jpg?s=612x612&w=0&k=20&c=NsuW_4luWqmU0Q0UwS0CT9UjcVVlvCop5ja-clN6zGk=')"
            }}
          ></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-light text-white mb-6">
              <span className="font-medium italic instrument mr-2">Technology</span>
              Features
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80 font-light">Rugged, handheld kit with intuitive yes/no health questions</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80 font-light">Integrated vital sign sensors with on-device AI</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80 font-light">Rapid, evidence-based risk assessments—instantly and offline</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-white/80 font-light">Streamlined communication between EMS and hospitals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Statistics with Dynamic Image Hover */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="relative group bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105">
          {/* Background image overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-cover bg-center z-0"
            style={{
              backgroundImage: "url('https://cafemom.com/wp-content/uploads/2024/09/ambulance.png')"
            }}
          ></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-light text-white mb-6">
              <span className="font-medium italic instrument mr-2">Proven</span>
              Impact
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-medium text-white mb-3">60% Faster</h4>
                <p className="text-white/70 font-light text-sm">
                  Reduces time-to-treatment by up to 60% compared to traditional methods
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-white mb-3">99% Accuracy</h4>
                <p className="text-white/70 font-light text-sm">
                  Increases diagnostic accuracy to over 99% with AI-powered assessments
                </p>
              </div>
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Enhanced Efficiency</h4>
                <p className="text-white/70 font-light text-sm">
                  Empowers paramedics to save more lives and allocate resources with unmatched efficiency
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
