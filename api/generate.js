// api/generate.js
// This file should be placed in the /api directory for serverless function deployment (e.g., on Vercel).
// It acts as a secure proxy to the Google Gemini API.

import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: The API key is read from server-side environment variables.
// It is NEVER exposed to the client.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  // In a production environment, you might want to restrict this to your app's domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return res.status(200).json({ text });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({ error: 'Failed to generate content from AI' });
  }
}
