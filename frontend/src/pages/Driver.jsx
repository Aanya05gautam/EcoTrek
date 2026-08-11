import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api';

const SOCKET_URL = API_URL.replace('/api', '');

export default function Driver() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Idle');
  const [socket, setSocket] = useState(null);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  const toggle = () => {
    if (status === 'Tracking Active') {
      navigator.geolocation.clearWatch(watchId);
      setStatus('Idle');
    } else {
      setStatus('Tracking Active');
      const id = navigator.geolocation.watchPosition((pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        if (socket) socket.emit('driver_ping', { lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (e) => {
        alert("GPS Error: " + e.message);
        setStatus('Idle');
      }, { enableHighAccuracy: true });
      setWatchId(id);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold text-emerald-950 mb-6 flex items-center justify-center gap-3">
        <ShieldAlert className="text-red-500"/> Fleet Operations Terminal
      </h1>
      <div className="bg-emerald-950 text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
        <h2 className="text-xl font-bold mb-4 relative z-10">Command Identity: {user?.name || 'Dispatcher_01'}</h2>
        <p className="text-emerald-400 font-mono mb-8 relative z-10 flex items-center justify-center gap-2">
           Status: {status} {status === 'Tracking Active' && <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
        </p>
        
        {lat !== 0 && (
          <div className="bg-black/40 p-5 rounded-2xl font-mono text-sm mb-8 text-left text-emerald-300 relative z-10 border border-emerald-800 shadow-inner">
            <span className="text-white font-bold opacity-50 mb-2 block">[SYSTEM_LOGS] GPS UPLINK ACQUIRED</span>
            LATITUDE: {lat.toFixed(6)}<br/>
            LONGITUDE: {lng.toFixed(6)}<br/>
            <span className="text-yellow-400 mt-2 block animate-pulse">BROADCASTING COORDINATES TO CITIZEN RADAR...</span>
          </div>
        )}

        <button onClick={toggle} className={`relative z-10 w-full py-5 rounded-2xl font-extrabold text-xl shadow-lg transition-transform hover:-translate-y-1 ${status === 'Idle' ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950' : 'bg-red-500 hover:bg-red-400 text-white'}`}>
           {status === 'Idle' ? 'INITIATE ROUTE TRACKING' : 'TERMINATE UPLINK CONNECTION'}
        </button>
      </div>
    </div>
  );
}
