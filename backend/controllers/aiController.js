import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_API_KEY');

// Legacy fallback dictionary in case of offline failure
const fallbackRules = {
  'E-Waste': ['battery','laptop','phone','mobile','charger','keyboard','mouse','cable','computer','electronic','earphone','tv'],
  'Hazardous': ['paint','chemical','pesticide','medicine','syringe','bulb','thermometer','oil'],
  'Wet/Organic': ['banana','apple','food','vegetable','peel','fruit','leaf','leaves','organic','bread','leftover'],
  'Dry/Recyclable': ['plastic','bottle','paper','cardboard','carton','can','metal','glass','newspaper','tin']
};

function fallbackIdentify(name) {
  let best = 'Dry/Recyclable', score = 0;
  for (const [cat, words] of Object.entries(fallbackRules)) {
    const hits = words.filter(w => name.includes(w)).length;
    if (hits > score) { score = hits; best = cat; }
  }
  const confidence = score ? Math.min(97, 72 + score * 7) : 55;
  const guidance = {
    'Wet/Organic': 'Put clean organic waste into the wet/green stream; avoid plastic contamination.',
    'Dry/Recyclable': 'Keep recyclable material dry and clean, then place it in the dry/recyclable stream.',
    'Hazardous': 'Do not mix with household waste. Use an authorised hazardous-waste collection point.',
    'E-Waste': 'Store safely and hand over to an authorised e-waste collection/recycling facility.'
  };
  return { category: best, confidence, guidance: guidance[best] };
}

export async function identify(req, res) {
  // If the user hasn't configured an API key in .env, gracefully fallback
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_google_ai_studio_api_key_here') {
    const resData = fallbackIdentify((req.file?.originalname || req.body?.label || '').toLowerCase());
    resData.note = "GEMINI_API_KEY missing in .env. Operating on limited prototype fallback rules.";
    return res.json(resData);
  }

  if (!req.file) {
    return res.status(400).json({ message: "No image payload transmitted for neural analysis." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are the EcoTrek AI, a highly strict waste classification engine. 
Look at the attached image and determine the primary waste item shown exactly.
Output ONLY a strict JSON object with EXACTLY these layout requirements:
{
  "category": "Must be exactly one of: 'Wet/Organic', 'Dry/Recyclable', 'Hazardous', 'E-Waste'",
  "confidence": A number representing your percentage confidence between 50 and 99,
  "guidance": "A short, authoritative instruction on how a citizen should dispose of this specific item",
  "note": "A short, one-sentence reasoning for why it was sorted into this category"
}
Do not include any other markdown or text outside the JSON.`;

    const imageParts = [{
      inlineData: {
        data: fs.readFileSync(req.file.path).toString("base64"),
        mimeType: req.file.mimetype
      }
    }];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Safely parse out any Markdown artifacts the AI might wrap the JSON in
    const jsonStr = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonStr);
    
    // Ensure the AI conforms exactly to our required UI categorization structure
    if (!['Wet/Organic', 'Dry/Recyclable', 'Hazardous', 'E-Waste'].includes(data.category)) {
      data.category = 'Dry/Recyclable';
    }

    res.json(data);
  } catch(e) {
    console.error("Gemini AI API Error:", e);
    const resData = fallbackIdentify((req.file?.originalname || 'error').toLowerCase());
    resData.note = "Google Gemini AI pipeline temporarily exhausted or failed to parse. Falling back to prototype rules. " + e.message;
    res.json(resData);
  }
}
