import crypto from 'crypto'; 
import Report from '../models/Report.js'; 
import User from '../models/User.js'; 
import { memoryStore } from '../services/store.js';
import { classifyImage } from '../services/mlService.js';

const mongo = () => Report.db?.readyState === 1;

export async function createReport(req, res) {
  const {
    title,
    description,
    aiCategory = 'Unknown',
    aiConfidence = 0,
    address,
    lat,
    lng,
    reportType = 'Outdoor/Public',
    quantity = 'Medium',
    severity = 'Medium'
  } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  let aiResult = { category: aiCategory, confidence: Number(aiConfidence) || 0 };

  if (req.file) {
    try {
      aiResult = await classifyImage(req.file.path, req.file.originalname, req.file.mimetype);
    } catch (error) {
      console.error('Image classification failed, falling back to submitted values:', error);
    }
  }
  
  // Using GeoJSON Point as strictly defined in updated Report schema
  const data = {
    reporter: req.user?.id || null,
    title,
    description,
    imageUrl,
    aiCategory: aiResult.category || aiCategory,
    aiConfidence: Number(aiResult.confidence ?? aiConfidence) || 0,
    reportType,
    quantity,
    severity,
    priority: calculatePriority({ quantity, severity }),
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
  const u = req.user && memoryStore.users.find(x => x.id === req.user.id);
  if (u) u.ecoPoints += 10; 
  res.status(201).json(r);
}

const severityWeight = { Low: 1, Medium: 2, High: 3, Critical: 4 };
const quantityWeight = { Low: 1, Medium: 2, High: 3 };

function calculatePriority({ quantity, severity, reportCount = 1 }) {
  const score = (severityWeight[severity] || 1) * 2
    + (quantityWeight[quantity] || 1)
    + Math.min(reportCount, 5);
  if (score >= 12) return 'Critical';
  if (score >= 9) return 'High';
  if (score >= 6) return 'Medium';
  return 'Low';
}

function distanceKm(first, second) {
  const earthRadiusKm = 6371;
  const latDelta = (second[1] - first[1]) * Math.PI / 180;
  const lngDelta = (second[0] - first[0]) * Math.PI / 180;
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(first[1] * Math.PI / 180)
    * Math.cos(second[1] * Math.PI / 180)
    * Math.sin(lngDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getHotspots(radiusKm) {
  const reports = mongo()
    ? await Report.find({ status: { $ne: 'Resolved' } }).lean()
    : memoryStore.reports.filter(report => report.status !== 'Resolved');
  const clusters = [];

  for (const report of reports) {
    const coordinates = report.location?.coordinates || [Number(report.lng), Number(report.lat)];
    if (!Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) continue;
    let cluster = clusters.find(item => distanceKm(item.center, coordinates) <= radiusKm);
    if (!cluster) {
      cluster = { center: coordinates, reports: [] };
      clusters.push(cluster);
    }
    cluster.reports.push(report);
    const total = cluster.reports.length;
    cluster.center = [
      cluster.reports.reduce((sum, item) => sum + (item.location?.coordinates?.[0] ?? coordinates[0]), 0) / total,
      cluster.reports.reduce((sum, item) => sum + (item.location?.coordinates?.[1] ?? coordinates[1]), 0) / total
    ];
  }

  return clusters.map(cluster => {
    const highestSeverity = cluster.reports.reduce((highest, report) =>
      (severityWeight[report.severity] || 1) > (severityWeight[highest] || 1) ? report.severity : highest, 'Low');
    const highestQuantity = cluster.reports.reduce((highest, report) =>
      (quantityWeight[report.quantity] || 1) > (quantityWeight[highest] || 1) ? report.quantity : highest, 'Low');
    return {
      center: { lat: cluster.center[1], lng: cluster.center[0] },
      reportCount: cluster.reports.length,
      priority: calculatePriority({ quantity: highestQuantity, severity: highestSeverity, reportCount: cluster.reports.length }),
      severity: highestSeverity,
      quantity: highestQuantity,
      reports: cluster.reports
    };
  }).sort((first, second) => (severityWeight[second.priority] || 0) - (severityWeight[first.priority] || 0));
}

export async function listHotspots(req, res) {
  const radiusKm = Math.max(0.05, Math.min(Number(req.query.radiusKm) || 0.5, 10));
  res.json(await getHotspots(radiusKm));
}

export async function planRoute(req, res) {
  const depot = [Number(req.query.lng), Number(req.query.lat)];
  if (!Number.isFinite(depot[0]) || !Number.isFinite(depot[1])) {
    return res.status(400).json({ message: 'Provide valid depot lat and lng query parameters.' });
  }

  const capacity = Math.max(1, Math.min(Number(req.query.capacity) || 20, 1000));
  const radiusKm = Math.max(0.05, Math.min(Number(req.query.radiusKm) || 0.5, 10));
  const priorityWeight = { Low: 1, Medium: 2, High: 3, Critical: 4 };
  const remaining = (await getHotspots(radiusKm)).map(hotspot => ({
    ...hotspot,
    distanceFromCurrent: distanceKm(depot, [hotspot.center.lng, hotspot.center.lat])
  }));
  const stops = [];
  let current = depot;
  let capacityUsed = 0;

  while (remaining.length) {
    const available = remaining.filter(hotspot => capacityUsed + hotspot.reportCount <= capacity);
    if (!available.length) break;
    available.sort((first, second) => {
      const priorityDifference = (priorityWeight[second.priority] || 0) - (priorityWeight[first.priority] || 0);
      return priorityDifference || distanceKm(current, [first.center.lng, first.center.lat]) - distanceKm(current, [second.center.lng, second.center.lat]);
    });
    const next = available[0];
    const index = remaining.indexOf(next);
    remaining.splice(index, 1);
    const stopDistance = distanceKm(current, [next.center.lng, next.center.lat]);
    stops.push({ sequence: stops.length + 1, ...next, distanceFromPreviousKm: Number(stopDistance.toFixed(2)) });
    capacityUsed += next.reportCount;
    current = [next.center.lng, next.center.lat];
  }

  const returnDistance = stops.length ? distanceKm(current, depot) : 0;
  res.json({
    depot: { lat: depot[1], lng: depot[0] },
    capacity,
    capacityUsed,
    totalDistanceKm: Number((stops.reduce((sum, stop) => sum + stop.distanceFromPreviousKm, 0) + returnDistance).toFixed(2)),
    returnToDepotKm: Number(returnDistance.toFixed(2)),
    unassignedHotspots: remaining.length,
    stops
  });
}

export async function listReports(req, res) {
  const query = !req.user || req.user.role === 'Admin' ? {} : { reporter: req.user.id };
  if (mongo()) return res.json(await Report.find(query).populate('reporter', 'name email').sort({ createdAt: -1 }));
  const reports = !req.user || req.user.role === 'Admin' ? memoryStore.reports : memoryStore.reports.filter(report => report.reporter === req.user.id);
  res.json([...reports].reverse());
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
