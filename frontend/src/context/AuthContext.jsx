import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ecotrek_user")) || null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    const res = await api('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify({ email, password }) 
    });
    
    if (res.token) localStorage.setItem('ecotrek_token', res.token);
    setUser(res.user);
    localStorage.setItem("ecotrek_user", JSON.stringify(res.user));
    return res.user;
  };

  const register = async (name, email, password) => {
    const res = await api('/auth/register', { 
      method: 'POST', 
      body: JSON.stringify({ name, email, password }) 
    });
    
    if (res.token) localStorage.setItem('ecotrek_token', res.token);
    setUser(res.user);
    localStorage.setItem("ecotrek_user", JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ecotrek_user");
    localStorage.removeItem("ecotrek_token");
  };

  const updateEcoPoints = (points) => {
    if (!user) return;
    const u = { ...user, ecoPoints: (user.ecoPoints || 0) + points };
    setUser(u);
    localStorage.setItem("ecotrek_user", JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateEcoPoints }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}