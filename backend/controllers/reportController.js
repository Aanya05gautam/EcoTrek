import crypto from 'crypto'; 
import Report from '../models/Report.js'; 
import User from '../models/User.js'; 
import { memoryStore } from '../services/store.js';

const mongo = () => Report.db?.readyState === 1;

export async function createReport(req, res) {
  const { title, description, aiCategory = 'Unknown', aiConfidence = 0, address, lat, lng } = req.body; 
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  
  // Using GeoJSON Point as strictly defined in updated Report schema
  const data = {
    reporter: req.user.id,
    title,
    description,
    imageUrl,
    aiCategory,
    aiConfidence: Number(aiConfidence),
    address,
    location: {
      type: 'Point',
      coordinates: [Number(lng), Number(lat)]
    },
    status: 'Pending'
  };
  
  if (mongo()) {
    const r = await Report.create(data); 
    await User.findByIdAndUpdate(req.user.id, { $inc: { ecoPoints: 10 } }); 
    return res.status(201).json(r);
  } 
  
  const r = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; 
  memoryStore.reports.push(r); 
  const u = memoryStore.users.find(x => x.id === req.user.id); 
  if (u) u.ecoPoints += 10; 
  res.status(201).json(r);
}

export async function listReports(req, res) {
  if (mongo()) return res.json(await Report.find().populate('reporter', 'name email').sort({ createdAt: -1 })); 
  res.json([...memoryStore.reports].reverse());
}

export async function updateReport(req, res) {
  const { status } = req.body;
  
  if (mongo()) {
    return res.json(await Report.findByIdAndUpdate(req.params.id, { status }, { new: true }));
  }
  
  const r = memoryStore.reports.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ message: 'Report not found' });
  r.status = status;
  res.json(r);
}
