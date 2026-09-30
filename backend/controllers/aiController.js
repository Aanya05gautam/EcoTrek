import { classifyImage } from '../services/mlService.js';

export async function identify(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No image payload transmitted for neural analysis." });
  }

  try {
    const data = await classifyImage(req.file.path, req.file.originalname, req.file.mimetype);
    res.json(data);
  } catch(e) {
    console.error("ML service error:", e);
    res.status(503).json({
      message: "Image classification service is unavailable. Start the ML service and try again.",
      detail: e.message
    });
  }
}
