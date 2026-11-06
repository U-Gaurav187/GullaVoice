/**
 * Google AI Studio Gemini Service (gemini-2.5-flash)
 * Phase 2 Free Cloud LLM with native structured JSON output.
 */

import { GALLA_SYSTEM_PROMPT } from './groqService.js';

export async function parseWithGeminiFlash({ apiKey, transcript, customers = [], rateCard = [] }) {
  if (!apiKey) {
    throw new Error('Google Gemini API Key is missing. Please add your key in Settings.');
  }

  const prompt = `
${GALLA_SYSTEM_PROMPT}

EXISTING CUSTOMERS IN STORE DATABASE:
${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name, aliases: c.aliases })), null, 2)}

STORE RATE CARD (Price per unit in INR):
${JSON.stringify(rateCard.map(r => ({ name: r.name, unitPrice: r.unitPrice, unit: r.unit })), null, 2)}

RAW SPOKEN TRANSCRIPT FROM GALLA MICROPHONE:
"${transcript}"
`;

  // Use Gemini 2.5 Flash (or 1.5 Flash fallback)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response received from Gemini API.');
  }

  return JSON.parse(rawText);
}
