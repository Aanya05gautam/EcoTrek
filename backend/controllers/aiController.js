import { classifyImage } from '../services/mlService.js';
import { generateHouseholdRecommendation } from '../services/geminiService.js';

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

    if (!recommendation) {
      return res.status(503).json({ message: 'Gemini recommendations are not configured.' });
    }

    return res.json({
      ...recommendation,
      category: req.body.category || 'Unknown',
      confidence: Number(req.body.confidence) || 0,
      aiProvider: 'Gemini recommendation',
      workflow: 'household'
    });
  } catch (error) {
    console.error('Gemini recommendation failed:', error.message);
    return res.status(503).json({ message: 'The recommendation service is temporarily unavailable.' });
  }
}
