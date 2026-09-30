import React, { useEffect, useState } from 'react';
import { api, uploadUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import Map from '../components/Map';
import { MapPin, Navigation, Info, ExternalLink } from 'lucide-react';

export default function Reports() {
  const { user, updateEcoPoints } = useAuth();
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', address: '', lat: '28.6139', lng: '77.2090', aiCategory: 'Unknown', aiConfidence: 0, reportType: 'Outdoor/Public', quantity: 'Medium', severity: 'Medium' });
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [pos, setPos] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api('/reports').then(res => Array.isArray(res) && setReports(res)).catch(() => {});
  
  useEffect(() => {
    load();
  }, []);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPos({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            setForm(prev => ({ ...prev, address: data.display_name }));
          }
        } catch (e) {
          console.error("Reverse geocoding explicitly failed", e);
        }
      }, (err) => {
        alert("Failed to acquire GPS target: " + err.message + ". Please ensure your browser has given this site location permissions!");
      }, { enableHighAccuracy: true });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleFileChange = async (selectedFile) => {
    setFile(selectedFile);
    setErr('');

    if (!selectedFile) {
      setAnalysis(null);
      return;
    }

    setAnalysisLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', selectedFile);
      const result = await api('/ai/identify', { method: 'POST', body: fd });
      setAnalysis(result);
      setForm(prev => ({
        ...prev,
        aiCategory: result.category || 'Unknown',
        aiConfidence: Number(result.confidence) || 0
      }));
    } catch (classificationError) {
      setAnalysis(null);
      console.error('Image classification preview failed:', classificationError);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    Object.entries({ ...form, ...(pos || {}) }).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('image', file);
    try {
      await api('/reports', { method: 'POST', body: fd });
      setForm({ ...form, title: '', description: '' });
      setFile(null);
      updateEcoPoints(10);
      load();
    } catch(x) {
      setErr(x.message || 'Transmission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      
      {/* Educational Header */}
      <div className="bg-emerald-900 rounded-3xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Geospatial Logging Protocol</h1>
          <p className="text-emerald-100/90 font-medium text-sm md:text-base max-w-3xl leading-relaxed">
            Every submitted hotspot is transmitted directly to Municipal Authorities mapping interfaces utilizing 2dsphere indexing. Verified resolutions will grant you <strong>+10 Eco-Points</strong> towards your Smart Citizen ranking. Provide photographic evidence for rapid verification.
          </p>
        </div>
        <div className="relative z-10 shrink-0 bg-emerald-950 px-6 py-4 rounded-xl border border-emerald-700 shadow-inner flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">Your Total</span>
          <span className="text-3xl font-extrabold text-white">{user?.ecoPoints || 0} pts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 flex flex-col h-full">
          <form className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] h-full flex flex-col" onSubmit={submit}>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                <MapPin size={24} />
              </div>
              <h2 className="text-3xl font-extrabold text-emerald-950">{form.reportType === 'Household' ? 'Household Waste Report' : 'Outdoor Waste Hotspot'}</h2>
            </div>
            
            {err && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2">⚠️ {err}</div>}
            
            <div className="space-y-6 flex-grow">
              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Severity Title</label>
                <input className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Broken Glass Bulk" required />
              </div>
              
              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Status Details</label>
                <textarea rows="3" className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Provide scene context..." required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Report mode
                  <select className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold" value={form.reportType} onChange={e => setForm({ ...form, reportType: e.target.value })}>
                    <option>Outdoor/Public</option>
                    <option>Household</option>
                  </select>
                </label>
                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Quantity
                  <select className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>
                <label className="text-emerald-950 font-extrabold text-xs uppercase tracking-wider">
                  Severity
                  <select className="mt-2 w-full bg-slate-50 border border-emerald-100 rounded-xl px-3 py-3 text-emerald-950 font-semibold" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </label>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Attach Photo</label>
                  <div className="relative w-full">
                    <input type="file" accept="image/*" className="absolute opacity-0 inset-0 cursor-pointer w-full h-full z-10" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
                    <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 text-emerald-700 font-bold text-center truncate hover:bg-emerald-100 transition-colors shadow-sm">
                      {file ? file.name : 'Upload file...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="text-emerald-950 font-extrabold text-sm uppercase tracking-wider">AI Preview</div>
                  <span className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1 rounded-full">
                    {analysisLoading ? 'Analyzing...' : 'Auto-classified'}
                  </span>
                </div>
                {analysis ? (
                  <div className="space-y-2 text-sm font-semibold text-emerald-900">
                    <div>Category: <span className="font-extrabold">{analysis.category}</span></div>
                    <div>Confidence: <span className="font-extrabold">{analysis.confidence}%</span></div>
                    {analysis.guidance && <div className="text-emerald-700">{analysis.guidance}</div>}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-emerald-700/80">
                    Upload a photo to preview the model’s prediction before submitting the report.
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-emerald-950 font-extrabold text-sm uppercase tracking-wider">Physical Address</label>
                  <button type="button" onClick={detectLocation} className="text-emerald-700 text-xs font-extrabold flex items-center gap-1 hover:text-emerald-900 hover:bg-emerald-100 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                    <Navigation size={14} /> Detect GPS Target
                  </button>
                </div>
                <input className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Smart Alley" />
              </div>

              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider flex items-center gap-2">Geolocation Targeting <Info size={14} className="text-emerald-500"/></label>
                <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-inner h-[250px] relative">
                   <div className="absolute inset-0">
                     <Map position={pos} setPosition={p => setPos(p)} markers={[]} />
                   </div>
                </div>
              </div>
            </div>
            
            <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg py-4 rounded-xl transition-transform shadow-[0_4px_20px_rgba(5,150,105,0.3)] disabled:opacity-50 hover:-translate-y-0.5 mt-8 flex items-center justify-center gap-2">
              {loading ? 'Transmitting Data...' : 'Submit Resolution Request'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-8 h-full">
          <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] h-[400px] flex flex-col">
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Active Incident Radar</h2>
               <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live View</span>
             </div>
             <div className="rounded-3xl overflow-hidden border border-emerald-200 flex-grow shadow-inner relative h-64 md:h-auto min-h-[300px]">
               <div className="absolute inset-0">
                 <Map position={null} setPosition={() => {}} markers={reports} />
               </div>
             </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] flex-grow hidden lg:flex lg:flex-col overflow-hidden">
            <h2 className="text-2xl font-extrabold text-emerald-950 tracking-tight mb-6 flex items-center gap-2">City Feed <ExternalLink size={18} className="text-emerald-400"/></h2>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {reports.length === 0 ? (
                <div className="p-10 border border-dashed border-emerald-200 bg-emerald-50 rounded-3xl text-center text-emerald-700 font-bold">
                   No incidents reported in the cluster yet.
                </div>
              ) : (
                reports.map(r => (
                  <div key={r._id || r.id} className="bg-white p-5 rounded-2xl border border-emerald-100 flex gap-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
                    {r.imageUrl && (
                      <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden shrink-0 border border-emerald-200 shadow-sm relative">
                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={uploadUrl(r.imageUrl)} alt="Report Log" />
                      </div>
                    )}
                    <div className="flex-grow flex flex-col justify-center">
                      <h3 className="text-xl font-extrabold text-emerald-950 group-hover:text-emerald-700 transition-colors line-clamp-1">{r.title}</h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${r.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                          {r.status}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {r.aiCategory}
                        </span>
                      </div>
                      <p className="text-emerald-700/80 text-sm mt-3 font-semibold line-clamp-1 truncate">{r.address || r.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
