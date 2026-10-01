import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, ShieldCheck, Activity, Sparkles, Navigation, Layers } from 'lucide-react';

export default function AdminLogin() {
  const { adminLogin, adminRegister } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', setupKey: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupKey, setShowSetupKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'setup') {
        await adminRegister(form.name, form.email, form.password, form.setupKey);
      } else {
        await adminLogin(form.email, form.password);
      }
      navigate('/admin');
    } catch (requestError) {
      setError(requestError.message || 'Invalid municipal administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-emerald-950 px-4 py-16 flex items-center justify-center relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-emerald-100 relative z-10">
        
        {/* Header Icon */}
        <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 shadow-sm">
          <ShieldCheck size={32} />
        </div>
        
        <p className="text-emerald-600 font-extrabold text-xs uppercase tracking-[0.2em]">Municipal Authority Node</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
          {mode === 'setup' ? 'Setup First Admin' : 'Admin Portal Login'}
        </h1>
        <p className="text-slate-600 font-medium text-sm mt-2 leading-relaxed">
          {mode === 'setup' 
            ? 'Initialize the primary municipal administrator account with your system setup key.' 
            : 'Access hotspot analysis, spatial accumulation maps, and optimized pickup route dispatch.'}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-bold flex items-start gap-2">
            <span className="shrink-0">•</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login/Registration Form */}
        <form onSubmit={submit} className="space-y-5 mt-6">
          {mode === 'setup' && (
            <label className="block text-slate-800 font-extrabold text-sm">
              Administrator Name
              <input 
                required 
                type="text"
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition" 
                placeholder="e.g. City Waste Officer" 
              />
            </label>
          )}

          <label className="block text-slate-800 font-extrabold text-sm">
            Admin Email
            <input 
              type="email" 
              required 
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition" 
              placeholder="authority@ecotrek.org" 
            />
          </label>

          <label className="block text-slate-800 font-extrabold text-sm">
            Password
            <span className="relative block mt-2">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition" 
                placeholder="••••••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {mode === 'setup' && (
            <label className="block text-slate-800 font-extrabold text-sm">
              Server Setup Key
              <span className="relative block mt-2">
                <input 
                  type={showSetupKey ? 'text' : 'password'} 
                  required 
                  value={form.setupKey} 
                  onChange={e => setForm({ ...form, setupKey: e.target.value })} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition" 
                  placeholder="Enter server key" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowSetupKey(!showSetupKey)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition"
                  aria-label={showSetupKey ? 'Hide setup key' : 'Show setup key'}
                >
                  {showSetupKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
          )}

          <button 
            disabled={loading} 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl py-4 font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
          >
            {loading ? 'Authenticating Access...' : (
              <>
                <LogIn size={18} /> {mode === 'setup' ? 'Create Admin Account' : 'Access Admin Portal'}
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <button 
          type="button" 
          onClick={() => { setMode(mode === 'login' ? 'setup' : 'login'); setError(''); }} 
          className="w-full mt-5 text-emerald-700 font-extrabold text-sm hover:text-emerald-900 transition text-center"
        >
          {mode === 'login' ? 'First-time setup? Create primary admin' : 'Already registered? Sign in to portal'}
        </button>

        {/* Features Summary / Footer Note */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Layers size={14} className="text-emerald-600" /> Spatial Hotspot Detection Enabled
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Navigation size={14} className="text-emerald-600" /> Collection Fleet Route Optimization Active
          </div>
        </div>
      </div>
    </div>
  );
}