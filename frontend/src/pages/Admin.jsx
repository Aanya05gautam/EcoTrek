import React, { useEffect, useState } from 'react';
import { api } from '../api';
import Map from '../components/Map';
import { useAuth } from '../context/AuthContext';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [pickups, setPickups] = useState([]);

  const load = async () => {
    setReports(await api('/reports'));
    setPickups(await api('/pickups'));
  };

  useEffect(() => {
    if (user?.role === 'Admin') load();
  }, [user]);

  if (user?.role !== 'Admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 text-center border border-red-100 shadow-xl">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">RESTRICTED AUTHORITY ZONE</h2>
          <p className="text-slate-600 font-medium text-lg">Your clearance is insufficient. A MongoDB superuser must assign your node the 'Admin' role.</p>
        </div>
      </div>
    );
  }

  const updateR = async (id, status) => {
    await api('/reports/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  };

  const updateP = async (id, status) => {
    await api('/pickups/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-950">Central Authority Engine</h1>
          <p className="text-emerald-700/80 font-bold mt-1">SIH-25060 Compliance Dashboard</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 font-extrabold text-sm shadow-sm">
          <Activity size={16} className="animate-pulse" />
          SYSTEM LIVE
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-800 text-sm font-bold mb-1 uppercase tracking-wider">Total Incidents</p>
            <b className="text-4xl font-extrabold text-emerald-950">{reports.length}</b>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Activity size={24} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-800 text-sm font-bold mb-1 uppercase tracking-wider">Fleet Nodes</p>
            <b className="text-4xl font-extrabold text-emerald-950">{pickups.length}</b>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <CheckCircle size={24} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-red-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-red-100/50 blur-xl rounded-full pointer-events-none"></div>
          <div>
            <p className="text-red-700 text-sm font-bold mb-1 uppercase tracking-wider">Critical Unresolved</p>
            <b className="text-4xl font-extrabold text-red-600">{reports.filter(r => r.status === 'Pending').length}</b>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 relative z-10 shadow-sm">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)]">
          <h2 className="text-xl font-extrabold text-emerald-950 mb-6 flex items-center gap-2"><MapPin size={20} className="text-emerald-500"/> Geospatial Heatmap</h2>
          <div className="h-[400px] rounded-2xl overflow-hidden border border-emerald-200 shadow-inner">
            <Map markers={reports} position={null} setPosition={() => {}} />
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-[0_8px_30px_rgba(6,78,59,0.04)] flex flex-col h-[480px]">
          <h2 className="text-xl font-extrabold text-emerald-950 mb-6">Hotspot Index Log</h2>
          <div className="overflow-x-auto flex-grow custom-scrollbar pr-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-emerald-100 text-sm font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-50/50">
                  <th className="py-3 px-3 rounded-tl-lg">Identifier</th>
                  <th className="py-3 px-2">AI Tag</th>
                  <th className="py-3 px-3 rounded-tr-lg">Mutate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {reports.map(r => (
                  <tr key={r._id || r.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="py-4 px-3 font-bold text-emerald-900">{r.title}</td>
                    <td className="py-4 px-2">
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                        {r.aiCategory}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <select 
                        className="bg-white border border-emerald-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-emerald-900 font-bold shadow-sm"
                        value={r.status} 
                        onChange={e => updateR(r._id || r.id, e.target.value)}
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-blue-100 shadow-[0_8px_30px_rgba(37,99,235,0.04)]">
        <h2 className="text-xl font-extrabold text-slate-800 mb-6">Logistics / Fleet Assignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pickups.map(p => (
            <div key={p._id || p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
              <div>
                <b className="text-blue-700 font-extrabold text-lg mb-1 block">{p.wasteType}</b>
                <p className="text-slate-600 text-sm font-semibold line-clamp-2 mb-4">{p.address}</p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border shadow-sm ${p.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{p.status}</span>
                <select 
                  className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 font-bold shadow-sm"
                  value={p.status} 
                  onChange={e => updateP(p._id || p.id, e.target.value)}
                >
                  <option>Requested</option>
                  <option>Assigned</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
          ))}
          {pickups.length === 0 && <p className="text-slate-500 font-medium">No pickup dispatches open.</p>}
        </div>
      </div>
    </div>
  );
}
