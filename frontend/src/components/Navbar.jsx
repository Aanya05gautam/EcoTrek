import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Leaf,
  Home as HomeIcon,
  Camera,
  MapPin,
  ShieldAlert,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      {/* 1. Home */}
      <Link
        onClick={() => setIsOpen(false)}
        to="/"
        className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${
          mobile
            ? "px-4 py-3 bg-emerald-50 text-base"
            : "px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <HomeIcon size={mobile ? 20 : 16} /> Home
      </Link>

      {/* 2. Capture Waste */}
      <Link
        onClick={() => setIsOpen(false)}
        to="/identify"
        className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${
          mobile
            ? "px-4 py-3 bg-emerald-50 text-base"
            : "px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <Camera size={mobile ? 20 : 16} className="text-emerald-600" /> Capture
        Waste
      </Link>

      {/* 3. Reports */}
      <Link
        onClick={() => setIsOpen(false)}
        to="/reports"
        className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${
          mobile
            ? "px-4 py-3 bg-emerald-50 text-base"
            : "px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <MapPin size={mobile ? 20 : 16} /> Reports
      </Link>

      {/* 4. Admin Portal */}
      <Link
        onClick={() => setIsOpen(false)}
        to={user?.role === "Admin" ? "/admin" : "/admin"}
        className={`flex items-center gap-2 rounded-xl text-emerald-900 font-bold transition-colors ${
          mobile
            ? "px-4 py-3 bg-emerald-50 text-base"
            : "px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <ShieldAlert size={mobile ? 20 : 16} className="text-emerald-600" />{" "}
        Admin Portal
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100 shadow-[0_4px_30px_rgba(6,78,59,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transform group-hover:rotate-12 transition-all duration-300">
              <Leaf size={22} fill="currentColor" className="text-emerald-50" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-950 to-emerald-600 bg-clip-text text-transparent">
              EcoTrek
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            <NavLinks />
          </div>

          {/* Admin access and mobile toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              {user?.role === "Admin" ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm border border-emerald-100 uppercase tracking-widest text-xs"
                >
                  Log Out <LogOut size={16} />
                </button>
              ) : (
                <Link
                  to="/admin/login"
                >
                  <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm border border-emerald-100">
                    Admin access
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
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
            {user?.role === "Admin" ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-5 py-4 rounded-xl font-bold transition-all shadow-sm border border-emerald-100 uppercase tracking-widest text-sm"
              >
                Log Out <LogOut size={18} />
              </button>
            ) : (
              <Link
                onClick={() => setIsOpen(false)}
                to="/admin/login"
                className="w-full flex items-center justify-center gap-2 text-emerald-800 hover:text-emerald-600 px-5 py-4 rounded-xl font-bold transition-all text-sm uppercase tracking-wider"
              >
                Admin access
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
