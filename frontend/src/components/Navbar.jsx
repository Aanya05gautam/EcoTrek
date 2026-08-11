import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Camera, MapPin, Truck, BookOpen, LogIn, LogOut, ChevronRight, Menu, X, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      <Link onClick={() => setIsOpen(false)} to="/identify" className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${mobile ? 'px-4 py-3 bg-emerald-50 text-base' : 'px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700'}`}>
        <Camera size={mobile ? 20 : 16} /> Identify
      </Link>
      <Link onClick={() => setIsOpen(false)} to="/reports" className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${mobile ? 'px-4 py-3 bg-emerald-50 text-base' : 'px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700'}`}>
        <MapPin size={mobile ? 20 : 16} /> Reports
      </Link>
      <Link onClick={() => setIsOpen(false)} to="/pickups" className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${mobile ? 'px-4 py-3 bg-emerald-50 text-base' : 'px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700'}`}>
        <Truck size={mobile ? 20 : 16} /> Pickups
      </Link>
      <Link onClick={() => setIsOpen(false)} to="/training" className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${mobile ? 'px-4 py-3 bg-emerald-50 text-base' : 'px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700'}`}>
        <BookOpen size={mobile ? 20 : 16} /> Training
      </Link>
      <Link onClick={() => setIsOpen(false)} to="/driver" className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${mobile ? 'px-4 py-3 bg-emerald-50 text-base' : 'px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700'}`}>
        <ShieldAlert size={mobile ? 20 : 16} className="text-red-500" /> Fleet Portal
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100 shadow-[0_4px_30px_rgba(6,78,59,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          
          {/* Enhanced Logo */}
          <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transform group-hover:rotate-12 transition-all duration-300">
              <Leaf size={22} fill="currentColor" className="text-emerald-50" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-950 to-emerald-600 bg-clip-text text-transparent">
              EcoTrek
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            <NavLinks />
          </div>

          {/* Auth Button Desktop & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center">
              {user ? (
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm border border-emerald-100 uppercase tracking-widest text-xs"
                >
                  Log Out <LogOut size={16} />
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 tracking-wide"
                >
                  <LogIn size={16} /> Log In
                  <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              )}
            </div>
            
            {/* Mobile Hamburger Toggle */}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="lg:hidden h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-emerald-100 shadow-2xl p-4 animate-in slide-in-from-top-2 origin-top">
          <div className="flex flex-col gap-2 mb-6">
            <NavLinks mobile={true} />
          </div>
          
          <div className="border-t border-emerald-100 pt-6 mb-2 flex justify-center md:hidden">
             {user ? (
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-5 py-4 rounded-xl font-bold transition-all shadow-sm border border-emerald-100 uppercase tracking-widest text-sm"
                >
                  Log Out <LogOut size={18} />
                </button>
              ) : (
                <Link 
                  onClick={() => setIsOpen(false)}
                  to="/login" 
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg text-lg"
                >
                  <LogIn size={20} /> Log In
                </Link>
              )}
          </div>
        </div>
      )}
    </nav>
  );
}
