export const API_URL=import.meta.env.VITE_API_URL||'http://127.0.0.1:5000/api';
const BASE=API_URL;
export async function api(path,options={}){const token=localStorage.getItem('ecotrek_token');const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(options.headers||{})};if(token)headers.Authorization=`Bearer ${token}`;const res=await fetch(BASE+path,{...options,headers});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'Request failed');return data;}
export const uploadUrl=(p)=>p?.startsWith('http')?p:(p?`${BASE.replace('/api','')}${p}`:'');
