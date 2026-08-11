import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Truck, Info, Clock, AlertCircle } from 'lucide-react';
import Map from '../components/Map';
import { io } from 'socket.io-client';
import { API_URL } from '../api';

const SOCKET_URL = API_URL.replace('/api', '');

export default function Pickups() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ wasteType: 'E-Waste', estimatedWeight: '', address: '', slotDate: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [driverPos, setDriverPos] = useState(null);

  useEffect(() => {
    if (user) {
      const load = () => api('/pickups').then(res => Array.isArray(res) && setItems(res)).catch(() => {});
      load();
      const interval = setInterval(load, 3000); 
      
      const s = io(SOCKET_URL);
      s.on('fleet_radar', (coords) => setDriverPos(coords));

      return () => {
        clearInterval(interval);
        s.disconnect();
      };
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center border border-emerald-100 shadow-xl">
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-4">Login Required</h2>
          <p className="text-emerald-700/80 font-medium text-lg">You must navigate through the core authorization node first.</p>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api('/pickups', { method: 'POST', body: JSON.stringify(f) });
      setMsg('Logistics request acknowledged. Standby for fleet operator alignment.');
      setF({ ...f, estimatedWeight: '', address: '', slotDate: '' });
      const res = await api('/pickups');
      if(Array.isArray(res)) setItems(res);
    } catch(err) {
      setMsg(err.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      
      {/* Educational Header - Eco Style */}
      <div className="bg-emerald-900 rounded-3xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative z-10 w-full md:w-2/3">
          <div className="inline-flex items-center gap-2 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Info size={14} /> DYNAMIC FLEET ROUTING
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Schedule Decentralized Pickups</h1>
          <p className="text-emerald-100/90 font-medium text-sm md:text-base leading-relaxed">
            EcoTrek connects citizens directly to certified recycling fleets utilizing GPS-driven routing mechanics. Ideal for E-Waste (circuits, batteries) and Bulky Items (furniture, construction debris). Leaving massive footprints unmanaged severely impacts municipal workflow integrity. Schedule below to allocate resources immediately.
          </p>
        </div>
        <div className="relative z-10 w-full md:w-1/3 flex justify-end">
           <Truck size={120} className="text-emerald-500/20 -mr-6 -mb-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        <div>
          <form className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] h-full flex flex-col" onSubmit={submit}>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <Truck size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-emerald-950 tracking-tight">Initiate Delivery</h2>
                <p className="font-semibold text-emerald-700/80 mt-1">Submit resource payload specifications.</p>
              </div>
            </div>
            
            {msg && <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl font-medium text-sm shadow-sm flex gap-3 items-center"><AlertCircle size={20} className="text-emerald-600 shrink-0"/> {msg}</div>}
            
            <div className="space-y-6 flex-grow">
              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Categorization Node</label>
                <select className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold shadow-sm appearance-none" value={f.wasteType} onChange={e => setF({ ...f, wasteType: e.target.value })}>
                  <option>Dry/Recyclable</option>
                  <option>E-Waste</option>
                  <option>Bulky Waste</option>
                  <option>Hazardous</option>
                </select>
              </div>
              
              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Est. Metric Weight (kg)</label>
                <input type="number" min="0.1" step="0.1" className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold shadow-sm" value={f.estimatedWeight} onChange={e => setF({ ...f, estimatedWeight: e.target.value })} placeholder="4.5" required />
              </div>
              
              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Staging Address</label>
                <textarea rows="3" className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold shadow-sm" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} placeholder="123 Node Link, Central District..." required />
              </div>
              
              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Optimized Slot</label>
                <input type="datetime-local" className="w-full bg-slate-50 border border-emerald-100 rounded-xl px-5 py-4 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold shadow-sm" value={f.slotDate} onChange={e => setF({ ...f, slotDate: e.target.value })} required />
              </div>
              
              <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 px-6 py-4 rounded-xl text-white font-extrabold text-lg shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition transform hover:-translate-y-0.5 disabled:opacity-50 mt-8 flex justify-center items-center gap-2">
                {loading ? 'Processing...' : 'Engage Smart Driver Protocol'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="flex flex-col h-full">
          <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-emerald-100 shadow-[0_12px_44px_rgba(6,78,59,0.06)] h-full flex flex-col">
            <h2 className="text-2xl font-extrabold text-emerald-950 tracking-tight mb-8 flex items-center gap-3">
              <Clock size={24} className="text-emerald-500"/> Fleet Dispatches
            </h2>

            {driverPos && (
              <div className="mb-6 rounded-2xl overflow-hidden shadow-inner border border-emerald-300 h-48 relative shrink-0">
                <div className="absolute inset-0 z-0">
                  <Map position={driverPos} setPosition={() => {}} markers={[]} />
                </div>
                <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-lg animate-pulse shadow-lg flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-white animate-ping"></div> LIVE TRACKING
                </div>
              </div>
            )}
            
            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {items.map(p => (
                <div key={p._id || p.id} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <b className="text-emerald-950 font-extrabold text-lg group-hover:text-emerald-700 transition-colors">{p.wasteType}</b>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm ${p.status === 'Completed' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : p.status === 'Assigned' ? 'bg-lime-50 border-lime-200 text-lime-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-emerald-800/80 text-sm font-semibold mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{p.address}</p>
                  <div className="flex gap-6 text-sm text-emerald-700 font-bold border-t border-emerald-50 pt-3">
                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-800"></div>{p.estimatedWeight} kg Payload</span>
                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>{new Date(p.slotDate).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center p-12 text-emerald-800/50 font-bold bg-slate-50 rounded-3xl border border-dashed border-emerald-200">
                  No active fleet node instructions found in your registry layer.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
