import crypto from 'crypto';
import HouseholdDisposal from '../models/HouseholdDisposal.js';
import { memoryStore } from '../services/store.js';

const mongo = () => HouseholdDisposal.db?.readyState === 1;

export async function createHouseholdDisposal(req, res) {
  const { category, confidence, headline = '', guidance, action, reuseIdeas = [], steps = [], whyItMatters = '', safetyNote = '', aiProvider = 'Keras local fallback', imageUrl = '' } = req.body;
  if (!category || !guidance || !action) {
    return res.status(400).json({ message: 'A complete household recommendation is required.' });
  }

  const data = {
    reporter: req.user?.id || null,
    imageUrl,
    category,
    confidence: Number(confidence) || 0,
    headline,
    guidance,
    action,
    reuseIdeas: Array.isArray(reuseIdeas) ? reuseIdeas.filter(item => typeof item === 'string').slice(0, 4) : [],
    steps: Array.isArray(steps) ? steps.filter(item => typeof item === 'string').slice(0, 5) : [],
    whyItMatters,
    safetyNote,
    aiProvider,
    status: 'Recorded'
  };

  if (mongo()) return res.status(201).json(await HouseholdDisposal.create(data));

  const disposal = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  memoryStore.householdDisposals.push(disposal);
  return res.status(201).json(disposal);
}

export async function listHouseholdDisposals(req, res) {
  if (mongo()) {
    const query = req.user?.role === 'Admin' ? {} : { reporter: req.user?.id || null };
    return res.json(await HouseholdDisposal.find(query).sort({ createdAt: -1 }));
  }

  const disposals = req.user?.role === 'Admin'
    ? memoryStore.householdDisposals
    : memoryStore.householdDisposals.filter(disposal => disposal.reporter === (req.user?.id || null));
  return res.json([...disposals].reverse());
}