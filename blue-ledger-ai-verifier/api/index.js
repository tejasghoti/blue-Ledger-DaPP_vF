const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_API_KEY || "AIzaSyCUbPh9D7Kt8G15FAutSIxGpCVdR7m1uJk";
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

async function urlToGenerativePart(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(response.data, 'binary');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
      },
    };
  } catch (error) {
    throw new Error("Could not fetch satellite image.");
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', aiActive: !!genAI, timestamp: new Date().toISOString() });
});

app.post('/api/analyze-image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  if (!genAI) {
    const mockSaplings = 1450;
    const mockCanopy = 88;
    return res.json({
      saplingCount: { detected: mockSaplings, estimated: mockSaplings + 120, confidence: 0.95 },
      canopyHealth: { percentage: mockCanopy, status: "Excellent" },
      anomalies: [],
      carbonCapture: 650,
      isSimulated: true
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      Analyze this aerial image of a coastal mangrove ecosystem.
      Respond ONLY with valid JSON with keys:
      - "saplingCount": {"detected": int, "estimated": int, "confidence": float}
      - "canopyHealth": {"percentage": int, "status": "Excellent" | "Good" | "Fair" | "Poor"}
      - "anomalies": array of {"location": str, "type": str, "severity": "Low" | "Medium" | "High"}
      - "carbonCapture": int
    `;

    let imageParts = [];
    try {
      imageParts = [await urlToGenerativePart(imageUrl)];
    } catch (err) {}

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json\n|```/g, '').trim();
    
    res.json(JSON.parse(jsonString));
  } catch (error) {
    res.status(500).json({ error: 'AI analysis failed', details: error.message });
  }
});

module.exports = app;
