import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, BookOpen, Droplets, Zap, Trash2, Biohazard, Download } from 'lucide-react';

export default function Training() {
  const { user } = useAuth();
  const [qs, setQs] = useState([]);
  const [a, setA] = useState({});
  const [score, setScore] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      api('/training').then(res => {
        if(Array.isArray(res)) setQs(res);
        else setErr("Active Authority Node session expired. Please log out and back in to re-sync.");
      }).catch(e => setErr("Active Authority Node session expired. Please log out and back in to re-sync."));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 text-center border border-emerald-100 shadow-xl">
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-4">Login Required</h2>
          <p className="text-emerald-700/80 font-medium text-lg">Sign in to review the curriculum and take the quiz.</p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    try {
      const res = await api('/training/submit', { method: 'POST', body: JSON.stringify({ answers: a }) });
      setScore(res.score);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {
      console.error(e);
    }
  };

  const generateCertificate = () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#ecfdf5" rx="20"/>
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="#10b981" stroke-width="8" rx="10" stroke-dasharray="20,10"/>
        
        <circle cx="400" cy="120" r="50" fill="#10b981"/>
        <path d="M380 120 l15 15 l30 -30" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        
        <text x="400" y="240" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#064e3b" text-anchor="middle">CERTIFICATE OF EXCELLENCE</text>
        <text x="400" y="300" font-family="Arial, sans-serif" font-size="20" fill="#059669" text-anchor="middle">THIS PROUDLY CERTIFIES THAT</text>
        
        <text x="400" y="380" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#064e3b" text-anchor="middle">${user.name.toUpperCase()}</text>
        <line x1="200" y1="400" x2="600" y2="400" stroke="#10b981" stroke-width="2"/>
        
        <text x="400" y="440" font-family="Arial, sans-serif" font-size="18" fill="#047857" text-anchor="middle">HAS MASTERED THE SDG 11 WASTE CATEGORIZATION PROTOCOL</text>
        <text x="400" y="470" font-family="Arial, sans-serif" font-size="16" fill="#047857" text-anchor="middle">AND EARNED ${score} ECO-POINTS FOR THE SMART CITY INITATIVE</text>
        
        <text x="400" y="540" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#10b981" text-anchor="middle">ECOTREK AUTHORITY NODE</text>
      </svg>
    `;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EcoTrek_Certificate_${user.name.replace(/\s+/g,'_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      
      {/* Educational Curriculum Section */}
      <div className="mb-12">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs uppercase tracking-wider mb-4 border border-emerald-200 shadow-sm">
            <BookOpen size={14} /> Official SDG 12 Curriculum
          </span>
          <h1 className="text-4xl font-extrabold text-emerald-950 tracking-tight mb-4">Waste Categorization Protocol</h1>
          <p className="text-emerald-700/80 font-semibold text-lg max-w-2xl mx-auto">
            Before proceeding to your certification quiz, review the global standard protocols for municipal waste segregation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-200">
                <Droplets size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-emerald-950">Wet & Organic Waste</h3>
            </div>
            <p className="text-emerald-800/80 font-medium text-sm leading-relaxed mb-4 flex-grow">
              Biodegradable materials that naturally decompose. This includes vegetable peels, leftover food, eggshells, and garden waste.
            </p>
            <div className="bg-green-50/50 p-3 rounded-xl border border-green-100 text-xs font-bold text-green-700">
              Disposal: Green Bin &rarr; Municipal Composting
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">Dry & Recyclables</h3>
            </div>
            <p className="text-slate-600 font-medium text-sm leading-relaxed mb-4 flex-grow">
              Inorganic materials that can be processed and reused. Encompasses clean plastics, paper, cardboard, glass, and metals. Food contamination destroys recycling batches!
            </p>
            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs font-bold text-blue-700">
              Disposal: Blue Bin &rarr; Material Recovery Facilities
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 border border-red-200">
                <Biohazard size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-red-950">Hazardous Waste</h3>
            </div>
            <p className="text-red-800/70 font-medium text-sm leading-relaxed mb-4 flex-grow">
              Highly toxic or infectious materials requiring extreme care. Examples include medical waste (syringes), chemical paints, strong pesticides, and aerosols.
            </p>
            <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 text-xs font-bold text-red-700">
              Disposal: Red/Yellow Bins &rarr; Specialized Incineration
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-200">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-purple-900">E-Waste</h3>
            </div>
            <p className="text-purple-800/70 font-medium text-sm leading-relaxed mb-4 flex-grow">
              Electronic devices and circuitry. Contains precious metals but also toxic heavy metals like lead. Includes batteries, old phones, USB cables, and laptops.
            </p>
            <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-xs font-bold text-purple-700">
              Disposal: EcoTrek Fleet Schedule &rarr; E-Waste Dissolution
            </div>
          </div>
        </div>
      </div>


      {/* Quiz Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-10 w-40 h-40 bg-lime-100/50 blur-3xl rounded-full"></div>
        
        <span className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider mb-6 shadow-sm">
          <ShieldCheck size={14} /> CERTIFICATION EXAM
        </span>
        <h2 className="relative z-10 text-3xl font-extrabold text-emerald-950 mb-8 tracking-tight border-b border-emerald-100 pb-6">
          Test Your Knowledge
        </h2>
        
        {score !== null && (
          <div className="relative z-10 mb-10 overflow-hidden bg-white border border-emerald-200 rounded-3xl shadow-sm">
            <div className="bg-emerald-50 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 shadow-sm">
                  <Award size={40} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-emerald-950 mb-1">Certification Passed!</h3>
                  <p className="text-emerald-700 font-bold mb-1">You conquered the SDG 11 training.</p>
                  <span className="inline-block bg-white border border-emerald-200 px-3 py-1 rounded-lg text-emerald-600 font-extrabold text-sm shadow-sm">+{score} Eco-Points Awarded</span>
                </div>
              </div>
              <button 
                onClick={generateCertificate}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-4 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
              >
                <Download size={20} className="group-hover:animate-bounce" /> Print Certificate
              </button>
            </div>
          </div>
        )}

        {err && (
          <div className="relative z-10 mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-bold shadow-sm flex items-center gap-3">
            <span className="text-xl">⚠️</span> {err}
          </div>
        )}

        {qs.length === 0 && score === null && !err && (
          <div className="animate-pulse text-emerald-600 font-bold p-6 text-center">Loading encrypted examination items...</div>
        )}

        <div className="space-y-10 relative z-10">
          {qs.map((q, i) => (
            <div key={q._id || q.id} className="bg-white p-6 md:p-8 rounded-2xl border border-emerald-100 shadow-sm">
              <b className="text-xl font-bold text-emerald-950 block mb-6 leading-relaxed">
                <span className="text-emerald-600 mr-2">{i + 1}.</span>{q.question}
              </b>
              <div className="space-y-3">
                {q.options.map((o, j) => (
                  <label key={j} className={`block p-4 rounded-xl border transition-all cursor-pointer font-bold ${a[i] === j ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'}`}>
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        name={'q' + i} 
                        className="w-5 h-5 text-emerald-600 bg-white border-slate-300 focus:ring-emerald-500 focus:ring-2 mr-4"
                        checked={a[i] === j} 
                        onChange={() => setA({ ...a, [i]: j })} 
                        disabled={score !== null}
                      /> 
                      {o}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {qs.length > 0 && score === null && (
          <button 
            className="relative z-10 mt-12 w-full bg-emerald-600 hover:bg-emerald-700 px-8 py-4 rounded-2xl text-white font-extrabold text-lg shadow-md transition transform hover:-translate-y-0.5" 
            onClick={submit}
          >
            Submit Exam & Secure Eco-Points
          </button>
        )}
      </div>
    </div>
  );
}
