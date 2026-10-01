import { classifyImage } from '../services/mlService.js';
import { generateHouseholdRecommendation } from '../services/geminiService.js';

function fallbackRecommendation(category) {
  const recommendations = {
    Organic: {
      headline: 'Return organic waste to the soil',
      guidance: 'Keep food and garden waste free from plastic and other contaminants. Compost it at home or place it in the wet waste stream.',
      action: 'Separate it into your organic waste container.',
      reuseIdeas: ['Compost fruit and vegetable scraps', 'Use clean leaves as garden mulch'],
      steps: ['Remove plastic and other contaminants', 'Keep the waste in a ventilated container', 'Add it to a compost or organic collection stream'],
      whyItMatters: 'Organic waste can become useful compost instead of producing methane in a landfill.',
      safetyNote: ''
    },
    Recyclable: {
      headline: 'Keep this material in circulation',
      guidance: 'Clean and dry the item before sorting it. Separate attached food residue or non-recyclable parts where possible.',
      action: 'Place it in the clean, dry recyclable stream.',
      reuseIdeas: ['Reuse the container for storage', 'Flatten cardboard for collection', 'Repurpose sturdy packaging for organizing'],
      steps: ['Empty and rinse the item', 'Let it dry completely', 'Separate mixed materials', 'Place it in the recyclable stream'],
      whyItMatters: 'Clean recycling is easier to process and helps replace new raw materials.',
      safetyNote: ''
    },
    Hazardous: {
      headline: 'Handle this waste with care',
      guidance: 'Keep it away from children, pets, drains, and regular waste. Do not open, burn, or mix it with other materials.',
      action: 'Take it to an authorized hazardous-waste facility.',
      reuseIdeas: [],
      steps: ['Keep the original container closed', 'Store it separately in a secure place', 'Contact an authorized collection facility'],
      whyItMatters: 'Safe handling prevents contamination, fires, and exposure to people and wildlife.',
      safetyNote: 'Do not handle leaking or damaged hazardous items; contact local emergency or waste authorities.'
    },
    'Non-Recyclable': {
      headline: 'Dispose of it separately',
      guidance: 'This item should not enter the recycling or organic stream. Keep it contained and follow your local disposal guidance.',
      action: 'Place it in the approved general-waste stream or request formal disposal.',
      reuseIdeas: ['Check whether a local take-back program accepts it', 'Reuse it only if it is clean and safe'],
      steps: ['Remove recyclable parts if safe', 'Seal loose or sharp pieces', 'Use the approved general-waste collection'],
      whyItMatters: 'Correct sorting prevents contamination and protects the value of recyclable materials.',
      safetyNote: ''
    }
  };
  return recommendations[category] || {
    headline: 'Review the item before disposal',
    guidance: 'Keep the item separate while you confirm the correct local waste stream.',
    action: 'Check your local waste-sorting guidance.',
    reuseIdeas: [],
    steps: ['Inspect the material and condition', 'Keep it separate from food and recyclables', 'Use the recommended local collection stream'],
    whyItMatters: 'Correct sorting keeps useful materials in circulation and reduces contamination.',
    safetyNote: ''
  };
}

export async function identify(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No image payload transmitted for neural analysis." });
  }

  try {
    const data = await classifyImage(req.file.path, req.file.originalname, req.file.mimetype);
    res.json({
      category: data.category,
      confidence: data.confidence,
      workflow: 'household',
      imageUrl: `/uploads/${req.file.filename}`
    });
  } catch(e) {
    console.error("ML service error:", e);
    res.status(503).json({
      message: "Image classification service is unavailable. Start the ML service and try again.",
      detail: e.message
    });
  }
}

export async function recommend(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Upload the image again to generate a recommendation.' });
  }

  try {
    const recommendation = await generateHouseholdRecommendation({
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      category: req.body.category || 'Unknown',
      confidence: req.body.confidence || 0
    });

    const advice = recommendation || fallbackRecommendation(req.body.category || 'Unknown');

    return res.json({
      ...advice,
      category: req.body.category || 'Unknown',
      confidence: Number(req.body.confidence) || 0,
      aiProvider: recommendation ? 'Gemini recommendation' : 'Local category guidance',
      workflow: 'household'
    });
  } catch (error) {
    console.error('Gemini recommendation failed:', error.message);
    return res.json({
      ...fallbackRecommendation(req.body.category || 'Unknown'),
      category: req.body.category || 'Unknown',
      confidence: Number(req.body.confidence) || 0,
      aiProvider: 'Local category guidance',
      workflow: 'household'
    });
  }
}
