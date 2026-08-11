import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, LogIn, ChevronRight, Leaf, Quote } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      nav('/');
    } catch(x) {
      setErr(x.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex text-emerald-950">
      
      {/* Left visual column - Very Engaging */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 border-r border-emerald-800 overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1500" 
          alt="Lush green forest" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[10s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/50 to-transparent"></div>
        <div className="absolute inset-0 bg-emerald-950/30"></div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-16 pb-24 z-10">
          <div className="bg-emerald-950/60 backdrop-blur-md border border-emerald-500/20 p-8 rounded-3xl max-w-lg shadow-2xl">
            <Quote size={40} className="text-emerald-400 mb-6 opacity-80" />
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
              A cleaner city begins with your initiative.
            </h2>
            <p className="text-emerald-100/90 text-lg font-medium leading-relaxed mb-6">
              EcoTrek unites citizens and municipalities under a single vision. By reporting dumping hotspots or sorting your household waste, you directly contribute to global SDG 11 objectives.
            </p>
            <div className="flex items-center gap-4 border-t border-emerald-500/30 pt-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <Leaf size={24} className="text-emerald-400" />
              </div>
              <div className="font-bold text-white">
                EcoTrek Authority Node
                <div className="text-emerald-400 text-sm font-semibold">City Command Center</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-emerald-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="h-16 w-16 bg-white rounded-[1.25rem] flex items-center justify-center mb-6 text-emerald-600 shadow-sm border border-emerald-100">
              <Leaf size={32} />
            </div>
            <h2 className="text-4xl font-extrabold text-emerald-950 mb-3 tracking-tight">
              {mode === 'login' ? 'Welcome back.' : 'Create Account'}
            </h2>
            <p className="text-emerald-800/80 font-bold text-base">
              {mode === 'login' ? 'Enter your credentials to access the node.' : 'Join the SDG 11 smart city initiative.'}
            </p>
          </div>
          
          {err && <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl font-bold text-sm text-center shadow-sm flex items-center justify-center gap-2">⚠️ {err}</div>}
          
          <form className="space-y-6" onSubmit={submit}>
            {mode === 'register' && (
              <div>
                <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Full Name</label>
                <input 
                  className="w-full bg-white border border-emerald-200 rounded-xl px-5 py-4 text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm placeholder:text-emerald-300"
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  required={mode === 'register'} 
                  placeholder="e.g. John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-white border border-emerald-200 rounded-xl px-5 py-4 text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm placeholder:text-emerald-300"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                required 
                placeholder="citizen@ecotrek.com"
              />
            </div>
            
            <div>
              <label className="block text-emerald-950 font-extrabold mb-2 text-sm uppercase tracking-wider">Secure Password</label>
              <input 
                type="password" 
                minLength="6" 
                className="w-full bg-white border border-emerald-200 rounded-xl px-5 py-4 text-emerald-950 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold shadow-sm placeholder:text-emerald-300"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                required 
                placeholder="••••••••"
              />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 px-6 py-4 rounded-xl text-white font-extrabold text-lg shadow-[0_4px_20px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_30px_rgba(5,150,105,0.4)] transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5">
              {loading ? 'Authenticating...' : (mode === 'login' ? <><LogIn size={20}/> Access Station</> : <><UserPlus size={20} /> Initialize Node</>)}
            </button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-emerald-800 font-semibold font-sm">
              {mode === 'login' ? "Don't have an account?" : "Already part of the network?"} 
              <button 
                type="button" 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }} 
                className="ml-2 text-emerald-600 font-extrabold hover:text-emerald-800 transition-colors inline-flex items-center group"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </p>
          </div>
          
        </div>
      </div>
    
    </div>
  );
}
