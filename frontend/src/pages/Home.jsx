import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, Truck, BookOpen, Recycle, ArrowRight, BarChart3, Users, Leaf, Globe2 } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-emerald-950">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000" alt="Nature background" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center mt-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-800/50 text-emerald-200 font-extrabold text-xs uppercase tracking-widest mb-8 border border-emerald-500/30 backdrop-blur-md">
            <Globe2 size={16} /> ALIGNED WITH UN SDG 11
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
            Empowering Citizens.<br className="hidden md:block"/>
            <span className="text-emerald-400">Revolutionizing Waste.</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-50 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            EcoTrek is a comprehensive Smart City ecosystem connecting citizens to municipal authorities through AI-driven waste identification, geo-tagged incidence logging, and gamified recycling workflows.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <Link to="/identify" className="bg-emerald-500 px-8 py-4 rounded-xl text-white font-extrabold hover:bg-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
              Try AI Identifier <ArrowRight size={18} />
            </Link>
            <Link to="/reports" className="bg-white/10 backdrop-blur-md border border-emerald-400/30 px-8 py-4 rounded-xl text-emerald-50 font-extrabold hover:bg-white/20 transition shadow-sm flex items-center justify-center gap-2">
              <MapPin size={18} /> Report Hotspot
            </Link>
          </div>
        </div>
      </section>

      {/* Global Impact Metrics */}
      <section className="py-12 bg-emerald-900 border-b border-emerald-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-emerald-800/50 shadow-sm border border-emerald-800/50 rounded-3xl bg-emerald-950/50 p-8 backdrop-blur-sm">
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">2.4M</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">Tons Diverted</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">15k+</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">Active Nodes</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">98%</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">AI Accuracy</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">11</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">Cities Adopted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Information Curriculum / Core Tools */}
      <section className="py-24 relative bg-emerald-50 text-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-extrabold mb-6 tracking-tight">The Decentralized Solution</h2>
            <p className="text-lg text-emerald-800/80 font-medium">
              We replace inefficient manual waste collection with a data-driven municipal engine. By granting citizens 4 robust tools, we drastically decrease processing overhead and eradicate localized dumping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link to="/identify" className="block group">
              <div className="h-full bg-white rounded-[2rem] p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(6,78,59,0.08)]">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm text-emerald-600">
                  <Camera size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-emerald-950">AI Identifier</h3>
                <p className="text-emerald-700/70 font-medium leading-relaxed text-sm">
                  Utilize convolutional neural networks to classify waste in milliseconds. Never be confused between organic, hazardous, or recyclable bins again.
                </p>
              </div>
            </Link>

            <Link to="/reports" className="block group">
              <div className="h-full bg-white rounded-[2rem] p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(6,78,59,0.08)]">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm text-emerald-600">
                  <MapPin size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-emerald-950">Geo-Reports</h3>
                <p className="text-emerald-700/70 font-medium leading-relaxed text-sm">
                  Spotted an unattended hotspot? Drop a 2dsphere GPS pin containing photographic evidence straight onto the Municipal Authorities' live dashboard.
                </p>
              </div>
            </Link>

            <Link to="/pickups" className="block group">
              <div className="h-full bg-white rounded-[2rem] p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(6,78,59,0.08)]">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm text-emerald-600">
                  <Truck size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-emerald-950">Fleet Routing</h3>
                <p className="text-emerald-700/70 font-medium leading-relaxed text-sm">
                  Schedule direct pickups for e-waste or bulky items. Our dynamic logistics engine assigns optimized routes to fleet drivers instantly.
                </p>
              </div>
            </Link>

            <Link to="/training" className="block group">
              <div className="h-full bg-white rounded-[2rem] p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(6,78,59,0.08)]">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm text-emerald-600">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-emerald-950">Citizen Training</h3>
                <p className="text-emerald-700/70 font-medium leading-relaxed text-sm">
                  Pass our rigorous Waste Categorization Protocol exam to earn authoritative Eco-Points and download your custom scalable AI Certificate.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works / Architecture */}
      <section className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 bg-emerald-200/50 rounded-[3rem] transform rotate-3 scale-105"></div>
              <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=1000" alt="Recycling facility" className="relative rounded-[3rem] shadow-2xl object-cover h-[500px] w-full" />
              <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-3xl shadow-xl border border-emerald-100 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <BarChart3 size={28} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Efficiency</div>
                    <div className="text-2xl font-extrabold text-emerald-950">+41% Output</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-xs uppercase tracking-wider border border-emerald-200">
                <Leaf size={14} /> Workflow Protocol
              </div>
              <h2 className="text-4xl font-extrabold text-emerald-950 tracking-tight">Structured municipal scaling.</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold">1</div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-950 mb-1">Digital Submission</h4>
                    <p className="text-emerald-800/70 font-medium">Citizens verify items via AI or drop geospatial coordinate pins regarding unmanaged waste.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold">2</div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-950 mb-1">Administrative Triage</h4>
                    <p className="text-emerald-800/70 font-medium">The Authority Engine maps out 2dsphere indexes to organize optimized cluster paths.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold">3</div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-950 mb-1">Gamified Closing</h4>
                    <p className="text-emerald-800/70 font-medium">Tokens are distributed upon task completion, building a competitive smart-citizen ranking.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-24 bg-emerald-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Recycle size={56} className="mx-auto text-emerald-400 mb-8" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">Are you ready to join the network?</h2>
          <p className="text-emerald-100/80 text-xl mx-auto leading-relaxed mb-10 font-medium max-w-2xl">
            Authenticate your citizen node today and begin your impact on global sustainability protocols.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-8 py-4 rounded-xl text-white font-extrabold text-lg shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition transform hover:-translate-y-0.5">
            Initialize Access <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
