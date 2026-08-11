import bcrypt from 'bcryptjs'; import crypto from 'crypto'; import jwt from 'jsonwebtoken'; import User from '../models/User.js'; import {memoryStore} from '../services/store.js';
const useMongo=()=>User.db?.readyState===1;
const token=u=>jwt.sign({id:u.id,role:u.role,name:u.name},process.env.JWT_SECRET||'dev_secret',{expiresIn:'7d'});
export async function register(req,res){
 const {name,email,password}=req.body; if(!name||!email||!password) return res.status(400).json({message:'Name, email and password are required'});
 if(useMongo()){ if(await User.findOne({email})) return res.status(409).json({message:'Email already registered'}); const u=await User.create({name,email,password:await bcrypt.hash(password,10)}); return res.status(201).json({token:token(u),user:{id:u.id,name:u.name,email:u.email,role:u.role,ecoPoints:u.ecoPoints}}); }
 if(memoryStore.users.some(u=>u.email===email)) return res.status(409).json({message:'Email already registered'}); const u={id:crypto.randomUUID(),name,email,password:await bcrypt.hash(password,10),role:'Citizen',ecoPoints:0}; memoryStore.users.push(u); res.status(201).json({token:token(u),user:{id:u.id,name,email,role:u.role,ecoPoints:0}});
}
export async function login(req,res){
 const {email,password}=req.body; let u=useMongo()?await User.findOne({email}):memoryStore.users.find(x=>x.email===email); if(!u||!(await bcrypt.compare(password,u.password))) return res.status(401).json({message:'Invalid email or password'}); res.json({token:token(u),user:{id:u.id,name:u.name,email:u.email,role:u.role,ecoPoints:u.ecoPoints}});
}
