import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

function hasConfiguredKey(apiKey) {
  return apiKey && !apiKey.startsWith('your_');
}

function parseJson(text) {
  const normalized = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(normalized);
  return {
    headline: typeof parsed.headline === 'string' ? parsed.headline : '',
    guidance: typeof parsed.guidance === 'string' ? parsed.guidance : '',
    action: typeof parsed.action === 'string' ? parsed.action : '',
    reuseIdeas: Array.isArray(parsed.reuseIdeas) ? parsed.reuseIdeas.filter(item => typeof item === 'string').slice(0, 4) : [],
    steps: Array.isArray(parsed.steps) ? parsed.steps.filter(item => typeof item === 'string').slice(0, 5) : [],
    whyItMatters: typeof parsed.whyItMatters === 'string' ? parsed.whyItMatters : '',
    safetyNote: typeof parsed.safetyNote === 'string' ? parsed.safetyNote : ''
  };
}

export async function generateHouseholdRecommendation({ filePath, mimeType, category, confidence }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!hasConfiguredKey(apiKey)) return null;

  const imageBytes = await fs.readFile(filePath);
  const client = new GoogleGenerativeAI(apiKey);
  const prompt = `You are EcoTrek's friendly household waste advisor. The local classifier predicted category "${category}" with ${confidence}% confidence. Analyze the image and return only valid JSON with this exact shape: {"headline":"warm short title","guidance":"two short friendly sentences explaining what to do","action":"one clear next action","reuseIdeas":["up to four practical reuse or recycle ideas"],"steps":["up to five short numbered actions"],"whyItMatters":"one simple environmental benefit","safetyNote":"short safety note or empty string"}. Make advice specific to what is visible, practical for a household, and encouraging. Prefer reuse or recycling when safe. Never invent hazardous handling instructions; for hazardous items recommend an authorized facility.`;
  const modelNames = [...new Set([
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ].filter(Boolean))];
  let lastError;

  for (const modelName of modelNames) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data: imageBytes.toString('base64') } }
      ]);
      return parseJson(result.response.text());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}