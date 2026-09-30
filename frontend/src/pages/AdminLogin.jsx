import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';

export default function AdminLogin() {
  const { adminLogin, adminRegister } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', setupKey: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupKey, setShowSetupKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'setup') await adminRegister(form.name, form.email, form.password, form.setupKey);
      else await adminLogin(form.email, form.password);
      navigate('/admin');
    } catch (requestError) {
      setError(requestError.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-emerald-200">
        <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
          <ShieldAlert size={30} />
        </div>
        <p className="text-emerald-600 font-extrabold text-xs uppercase tracking-[0.2em]">Municipal access</p>
        <h1 className="text-3xl font-extrabold text-slate-950 mt-2">{mode === 'setup' ? 'Create First Admin' : 'Admin Portal Login'}</h1>
        <p className="text-slate-600 font-medium mt-3">{mode === 'setup' ? 'Create the first administrator directly from the application. This setup closes automatically afterward.' : 'This station accepts administrator accounts only. Citizen accounts cannot enter this portal.'}</p>

        {error && <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-bold">{error}</div>}

        <form onSubmit={submit} className="space-y-5 mt-8">
          {mode === 'setup' && <label className="block text-slate-800 font-extrabold text-sm">
            Admin name
            <input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-emerald-500" placeholder="Municipal Authority" />
          </label>}
          <label className="block text-slate-800 font-extrabold text-sm">
            Admin email
            <input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-emerald-500" placeholder="authority@ecotrek.com" />
          </label>
          <label className="block text-slate-800 font-extrabold text-sm">
            Password
            <span className="relative block mt-2">
              <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 font-semibold focus:outline-none focus:border-emerald-500" placeholder="Enter administrator password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-700" aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {mode === 'setup' && <label className="block text-slate-800 font-extrabold text-sm">
            First-admin setup key
            <span className="relative block mt-2">
              <input type={showSetupKey ? 'text' : 'password'} required value={form.setupKey} onChange={event => setForm({ ...form, setupKey: event.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 font-semibold focus:outline-none focus:border-emerald-500" placeholder="Configured by the server owner" />
              <button type="button" onClick={() => setShowSetupKey(!showSetupKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-700" aria-label={showSetupKey ? 'Hide setup key' : 'Show setup key'} title={showSetupKey ? 'Hide setup key' : 'Show setup key'}>
                {showSetupKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>}
          <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl py-4 font-extrabold flex items-center justify-center gap-2">
            {loading ? 'Verifying access...' : <><LogIn size={18} /> {mode === 'setup' ? 'Create Admin Account' : 'Enter Admin Portal'}</>}
          </button>
        </form>

        <button type="button" onClick={() => { setMode(mode === 'login' ? 'setup' : 'login'); setError(''); }} className="w-full mt-5 text-emerald-700 font-extrabold text-sm hover:text-emerald-900">
          {mode === 'login' ? 'First admin? Create it here' : 'Already have an admin account? Sign in'}
        </button>

        <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500 flex items-center gap-2">
          <Activity size={16} className="text-emerald-600" /> Citizen waste requests do not require an account.
        </div>
      </div>
    </div>
  );
}
