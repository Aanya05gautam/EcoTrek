import express from 'express'; import cors from 'cors'; import dotenv from 'dotenv'; import path from 'path'; import {fileURLToPath} from 'url'; import {connectDB} from './config/db.js';
import http from 'http'; import { Server } from 'socket.io';
import authRoutes from './routes/auth.js'; import aiRoutes from './routes/ai.js'; import reportRoutes from './routes/reports.js'; import pickupRoutes from './routes/pickups.js'; import trainingRoutes from './routes/training.js';
dotenv.config(); const app=express(); const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173'}));app.use(express.json());app.use('/uploads',express.static(path.join(__dirname,'uploads')));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'EcoTrek API',time:new Date().toISOString()}));
app.get('/api',(req,res)=>res.json({message:'Welcome to the EcoTrek API v1.0. Backend is fully operational.'}));
app.use('/api/auth',authRoutes);app.use('/api/ai',aiRoutes);app.use('/api/reports',reportRoutes);app.use('/api/pickups',pickupRoutes);app.use('/api/training',trainingRoutes);
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:err.message||'Server error'});});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Real-time Fleet Tracking Socket Event Bridge
io.on('connection', (socket) => {
  console.log('EcoTrek Live Client Connected:', socket.id);
  socket.on('driver_ping', (coords) => {
    // Broadcast Driver's GPS directly to all Citizens watching
    socket.broadcast.emit('fleet_radar', coords);
  });
});

const port=process.env.PORT||5000;
connectDB().finally(()=>server.listen(port,()=>console.log(`EcoTrek Smart API + WebSockets running on http://localhost:${port}`)));

// Trigger seamless nodemon restart to load .env variables - Offline Engine active (final)
