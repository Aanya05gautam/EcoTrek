import React, { useState } from 'react';
import { api } from '../api';
import { Camera, CheckCircle, UploadCloud, ShieldAlert, BadgeCheck, Lightbulb, Zap, Truck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Identify() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [pickupForm, setPickupForm] = useState({ estimatedWeight: '', address: '', slotDate: '' });
  const [pickupMessage, setPickupMessage] = useState('');
  const [pickupLoading, setPickupLoading] = useState(false);

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setErr('');
    const fd = new FormData();
    fd.append('image', file);
    try {
      setResult(await api('/ai/identify', { method: 'POST', body: fd }));
    } catch(e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-5 h-full space-y-6">
          <div className="bg-emerald-900 rounded-[2.5rem] p-8 md:p-10 border border-emerald-800 shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 -m-16 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/80 rounded-full text-emerald-200 font-bold text-xs uppercase tracking-widest mb-6 border border-emerald-500/30">
                <Camera size={14} /> Keras Vision Model
              </span>
              <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight leading-tight">Local Waste Classifier</h2>
              <p className="text-emerald-100/90 font-medium text-lg leading-relaxed mb-6">
                Upload a waste image and let the exported Keras model classify it into the correct disposal category.
              </p>
              
              <ul className="space-y-4 border-t border-emerald-500/30 pt-6 mt-auto">
                <li className="flex items-start gap-4">
                  <BadgeCheck className="text-emerald-400 shrink-0 mt-1" size={20} />
                  <span className="text-emerald-50 font-medium">Model-backed image classification</span>
                </li>
                <li className="flex items-start gap-4">
                  <Zap className="text-emerald-400 shrink-0 mt-1" size={20} />
                  <span className="text-emerald-50 font-medium">Instant preview from the local service</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <section className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-emerald-100 shadow-[0_8px_40px_rgba(6,78,59,0.06)] relative h-full flex flex-col items-center justify-center">
            
            <div className="w-full max-w-lg">
              <div className="relative border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-400 transition-all p-12 flex flex-col items-center justify-center cursor-pointer group shadow-sm text-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={e => {
                    setFile(e.target.files[0]);
                    setResult(null);
                  }} 
                />
                <UploadCloud size={56} className="text-emerald-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-4" />
                <div className="text-xl font-bold text-emerald-950 group-hover:text-emerald-700 transition-colors mb-2">Upload Waste Image</div>
                <div className="text-sm font-semibold text-emerald-600/70">Tap or drag and drop an image here for Keras inference</div>
              </div>
              
              {file && (
                <div className="mt-8 bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Target Scanned</div>
                  <img className="max-w-full max-h-64 rounded-2xl mx-auto object-contain" src={URL.createObjectURL(file)} alt="Preview" />
                </div>
              )}
              
              <button 
                className="mt-8 w-full bg-emerald-600 px-6 py-4 rounded-2xl text-white font-extrabold text-lg hover:bg-emerald-700 shadow-[0_4px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_30px_rgba(5,150,105,0.4)] transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                disabled={!file || loading} 
                onClick={submit}
              >
                {loading ? <span className="animate-pulse">Processing via AI Authority Node...</span> : <><Camera size={20}/> Run Neural Analysis</>}
              </button>
              
              {err && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-left font-bold text-sm flex items-center gap-3">
                  <ShieldAlert size={20} className="shrink-0" /> {err}
                </div>
              )}
              
              {result && (
                <div className="mt-8 bg-emerald-950 p-8 rounded-3xl text-left shadow-2xl relative overflow-hidden text-emerald-50">
                  <div className="absolute top-0 right-0 -m-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10 border-b border-emerald-800 pb-6">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-800/80 flex items-center justify-center text-emerald-400 border border-emerald-600/50 shadow-inner">
                      <CheckCircle size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-white">{result.category}</h3>
                      <div className="text-emerald-400 font-bold text-sm uppercase tracking-wider">{result.confidence}% Confidence</div>
                    </div>
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb size={20} className="text-emerald-400 shrink-0 mt-1" />
                      <p className="text-emerald-100 font-medium leading-relaxed">{result.guidance}</p>
                    </div>
                    {result.note && (
                      <div className="ml-8 mt-2 inline-block px-4 py-2 bg-emerald-900 rounded-xl text-emerald-300 text-sm font-bold border border-emerald-800">
                        System Note: {result.note}
                      </div>
                    )}
                    <div className="ml-8 rounded-xl bg-emerald-900/80 border border-emerald-800 px-4 py-3 text-sm font-semibold text-emerald-200">
                      <span className="font-extrabold text-emerald-300">Recommended action: </span>{result.action || result.guidance}
                    </div>
                    {result.requiresPickup && (
                      <div className="ml-8 mt-4 rounded-2xl bg-white/10 border border-emerald-700 p-4">
                        <div className="flex items-center gap-2 font-extrabold text-white"><Truck size={18} className="text-emerald-400" /> Request household disposal pickup</div>
                        <div className="grid gap-3 mt-4">
                            <input type="number" min="0.1" step="0.1" required placeholder="Estimated weight (kg)" value={pickupForm.estimatedWeight} onChange={e => setPickupForm({ ...pickupForm, estimatedWeight: e.target.value })} className="rounded-lg px-3 py-2 text-slate-900 font-semibold" />
                            <input required placeholder="Pickup address" value={pickupForm.address} onChange={e => setPickupForm({ ...pickupForm, address: e.target.value })} className="rounded-lg px-3 py-2 text-slate-900 font-semibold" />
                            <input type="datetime-local" required value={pickupForm.slotDate} onChange={e => setPickupForm({ ...pickupForm, slotDate: e.target.value })} className="rounded-lg px-3 py-2 text-slate-900 font-semibold" />
                            <button type="button" disabled={pickupLoading} onClick={async () => {
                              setPickupLoading(true);
                              setPickupMessage('');
                              try {
                                await api('/pickups', { method: 'POST', body: JSON.stringify({ wasteType: result.category, source: 'Household', ...pickupForm }) });
                                setPickupMessage('Pickup request sent to the municipal admin portal.');
                              } catch (pickupError) {
                                setPickupMessage(pickupError.message || 'Pickup request failed.');
                              } finally {
                                setPickupLoading(false);
                              }
                            }} className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-2 font-extrabold disabled:opacity-50">{pickupLoading ? 'Submitting...' : 'Submit pickup request'}</button>
                            {pickupMessage && <p className="text-sm text-emerald-200 font-semibold">{pickupMessage}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
