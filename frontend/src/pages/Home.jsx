import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Truck, 
  Home as HomeIcon, 
  Building2, 
  ArrowRight, 
  BarChart3, 
  Recycle, 
  Leaf, 
  Globe2, 
  Layers, 
  Navigation,
  Sparkles
} from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-emerald-950">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000" 
            alt="Nature background" 
            className="w-full h-full object-cover opacity-20" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center mt-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-800/50 text-emerald-200 font-extrabold text-xs uppercase tracking-widest mb-8 border border-emerald-500/30 backdrop-blur-md">
            <Globe2 size={16} /> ALIGNED WITH UN SDG 11 & 12
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
            Capture. Detect. <br className="hidden md:block"/>
            <span className="text-emerald-400">Optimize Waste Routes.</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-50 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            EcoTrek leverages AI-driven visual detection to separate household waste recommendations from outdoor dumping reports, empowering municipalities with spatial hotspot analysis and dynamic route optimization.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <Link 
              to="/identify" 
              className="bg-emerald-500 px-8 py-4 rounded-xl text-white font-extrabold hover:bg-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Camera size={20} /> Capture / Upload Waste
            </Link>
            <Link 
              to="/admin" 
              className="bg-white/10 backdrop-blur-md border border-emerald-400/30 px-8 py-4 rounded-xl text-emerald-50 font-extrabold hover:bg-white/20 transition shadow-sm flex items-center justify-center gap-2"
            >
              <BarChart3 size={20} /> Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Primary Pipeline / Flow Tracker Metrics */}
      <section className="py-12 bg-emerald-900 border-b border-emerald-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-emerald-800/50 shadow-sm border border-emerald-800/50 rounded-3xl bg-emerald-950/50 p-8 backdrop-blur-sm">
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">Dual Path</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">Household vs Outdoor</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">Multi-Param</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">Type, Quantity, Severity</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">DBSCAN</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">Spatial-Temporal Hotspots</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-emerald-400 mb-1">CVRP</div>
              <div className="text-emerald-200/70 font-semibold text-sm uppercase tracking-wide">Capacity Route Optimization</div>
            </div>
          </div>
        </div>
      </section>

      {/* EcoTrek Step-by-Step Flow */}
      <section className="py-16 bg-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="text-emerald-600 font-extrabold text-xs uppercase tracking-[0.2em]">EcoTrek Core Architecture</p>
              <h2 className="text-3xl font-extrabold text-emerald-950 mt-2">End-to-End Waste Pipeline</h2>
            </div>
            <p className="text-emerald-800/70 font-medium max-w-xl">
              From image capture to automated collection route generation—powering smart municipal waste management.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              ['01', 'Capture Image', '/capture'],
              ['02', 'Household vs Outdoor', '/select-type'],
              ['03', 'AI Category / Severity', '/analyze'],
              ['04', 'Hotspot Identification', '/admin'],
              ['05', 'Optimized Route Pickup', '/route-fleet'],
            ].map(([number, label, href]) => (
              <Link key={number} to={href} className="group border border-emerald-100 bg-emerald-50/60 rounded-2xl p-5 hover:border-emerald-400 hover:bg-emerald-100 transition-colors">
                <span className="text-xs font-extrabold text-emerald-500">{number}</span>
                <div className="font-extrabold text-emerald-950 mt-3 group-hover:text-emerald-700">{label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Modules Section */}
      <section className="py-24 relative bg-emerald-50 text-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">System Modules</h2>
            <p className="text-lg text-emerald-800/80 font-medium">
              Choose your domain: Manage domestic waste sustainably at home or report public illegal dumpings for municipal fleet action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Household Module Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)] hover:shadow-xl transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 text-emerald-700">
                <HomeIcon size={30} />
              </div>
              <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Module 1
              </div>
              <h3 className="text-2xl font-extrabold text-emerald-950 mb-4">Household Waste Guidance</h3>
              <p className="text-emerald-800/70 text-sm leading-relaxed mb-6">
                Upload household waste to instantly classify items into <strong>Organic, Plastic, Paper, Dry, or E-Waste</strong>. Receive tailored home reuse recommendations (e.g., composting, DIY crafting) or auto-generate a pickup report if non-recyclable.
              </p>
              <ul className="space-y-2 mb-8 text-sm font-semibold text-emerald-900">
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-500" /> AI Classification Engine</li>
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-500" /> At-Home DIY Reuse Recommendations</li>
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-500" /> Automatic Pickup Report Generation</li>
              </ul>
              <Link to="/capture?mode=household" className="inline-flex items-center gap-2 text-emerald-600 font-extrabold hover:text-emerald-800 transition">
                Start Household Analysis <ArrowRight size={18} />
              </Link>
            </div>

            {/* Outdoor Waste Module Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)] hover:shadow-xl transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 text-emerald-700">
                <Building2 size={30} />
              </div>
              <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Module 2
              </div>
              <h3 className="text-2xl font-extrabold text-emerald-950 mb-4">Outdoor & Public Waste Detection</h3>
              <p className="text-emerald-800/70 text-sm leading-relaxed mb-6">
                Scan public garbage spots to detect multiple parameters: <strong>Type</strong> (plastic, organic, debris), <strong>Quantity</strong> (volume estimate), and <strong>Severity</strong> (Low to Critical). Generates geo-tagged incident payloads directly for municipal admins.
              </p>
              <ul className="space-y-2 mb-8 text-sm font-semibold text-emerald-900">
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-500" /> Multi-Parameter Visual Detection</li>
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-500" /> Severity Assessment (Low/Med/High/Critical)</li>
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-emerald-500" /> Automatic GPS & Timestamp Logging</li>
              </ul>
              <Link to="/capture?mode=outdoor" className="inline-flex items-center gap-2 text-emerald-600 font-extrabold hover:text-emerald-800 transition">
                Report Outdoor Spot <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Admin & Logistics Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/80 rounded-2xl p-6 border border-emerald-100 flex gap-4 items-start">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                <Layers size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950 text-lg mb-1">Spatial-Temporal Hotspots</h4>
                <p className="text-xs text-emerald-800/70 leading-relaxed">
                  Aggregates repeated reports in close proximity (e.g., Location C with 15 reports vs Location A with 2) into high-priority waste accumulation zones.
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-6 border border-emerald-100 flex gap-4 items-start">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                <Navigation size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950 text-lg mb-1">Route Optimization</h4>
                <p className="text-xs text-emerald-800/70 leading-relaxed">
                  Calculates capacity-constrained optimized pickup routes starting from the depot through critical hotspots to save fuel and collection time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture Explanation */}
      <section className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 bg-emerald-200/50 rounded-[3rem] transform rotate-3 scale-105"></div>
              <img 
                src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=1000" 
                alt="Recycling facility" 
                className="relative rounded-[3rem] shadow-2xl object-cover h-[500px] w-full" 
              />
              <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-3xl shadow-xl border border-emerald-100 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Truck size={28} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Efficiency Engine</div>
                    <div className="text-2xl font-extrabold text-emerald-950">Dynamic Fleet</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-xs uppercase tracking-wider border border-emerald-200">
                <Leaf size={14} /> Research Contribution
              </div>
              <h2 className="text-4xl font-extrabold text-emerald-950 tracking-tight">Driven by Intelligent Computer Vision & Spatial Data</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold">1</div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-950 mb-1">AI Identification</h4>
                    <p className="text-emerald-800/70 font-medium text-sm">Recognizes waste categories, estimates volume, and assigns initial severity ratings.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold">2</div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-950 mb-1">Hotspot Prioritization</h4>
                    <p className="text-emerald-800/70 font-medium text-sm">Spatial algorithms cluster recurring reports into high-priority municipal targets.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold">3</div>
                  <div>
                    <h4 className="text-xl font-bold text-emerald-950 mb-1">Capacitated Route Generation</h4>
                    <p className="text-emerald-800/70 font-medium text-sm">Generates ordered pickup schedules for collection trucks (Depot → Critical Spots → Depot).</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer Call to Action */}
      <section className="py-24 bg-emerald-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Recycle size={56} className="mx-auto text-emerald-400 mb-8" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white tracking-tight">Ready to test the EcoTrek Flow?</h2>
          <p className="text-emerald-100/80 text-xl mx-auto leading-relaxed mb-10 font-medium max-w-2xl">
            Capture or upload a waste image to trigger our AI identification pipeline today.
          </p>
          <Link 
            to="/capture" 
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-8 py-4 rounded-xl text-white font-extrabold text-lg shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition transform hover:-translate-y-0.5"
          >
            Capture Waste Image <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
