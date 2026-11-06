/**
 * Google AI Studio Gemini Service (gemini-2.5-flash / gemini-1.5-flash)
 * Supports both text structured extraction and direct multimodal audio processing!
 */

import { GALLA_SYSTEM_PROMPT } from './groqService.js';

/**
 * Text structured JSON extraction using Gemini Flash
 */
export async function parseWithGeminiFlash({ apiKey, transcript, customers = [], rateCard = [], language = 'hi' }) {
  if (!apiKey) {
    throw new Error('Google Gemini API Key is missing. Please add your key in Settings or .env.local.');
  }

  const prompt = `
${GALLA_SYSTEM_PROMPT}

LANGUAGE PREFERENCE: ${language === 'hi' ? 'Hindi (Devanagari)' : 'English / Hinglish'}

EXISTING CUSTOMERS IN STORE DATABASE:
${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name, aliases: c.aliases })), null, 2)}

STORE RATE CARD (Price per unit in INR):
${JSON.stringify(rateCard.map(r => ({ name: r.name, unitPrice: r.unitPrice, unit: r.unit })), null, 2)}

RAW SPOKEN TRANSCRIPT FROM MICROPHONE:
"${transcript}"
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

/**
 * Multimodal Direct Audio Parsing using Gemini Flash (Audio Blob -> JSON in 1 shot)
 */
export async function parseAudioWithGemini({ apiKey, audioBlob, customers = [], rateCard = [], language = 'hi' }) {
  if (!apiKey) {
    throw new Error('Google Gemini API Key is missing.');
  }

  // Convert blob to base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  const mimeType = audioBlob.type || 'audio/webm';
  const prompt = `
${GALLA_SYSTEM_PROMPT}

LANGUAGE PREFERENCE: ${language === 'hi' ? 'Hindi (Devanagari)' : 'English / Hinglish'}

EXISTING CUSTOMERS IN STORE DATABASE:
${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name, aliases: c.aliases })), null, 2)}

STORE RATE CARD (Price per unit in INR):
${JSON.stringify(rateCard.map(r => ({ name: r.name, unitPrice: r.unitPrice, unit: r.unit })), null, 2)}

INSTRUCTIONS:
Listen carefully to this audio recording of a kirana shopkeeper speaking in Hindi, Hinglish, or English.
1. Transcribe the spoken words accurately into 'customer_spoken' or transcript.
2. Filter out side-chatter or background counter noise.
3. Extract customer, items, quantities, and total amount.
4. Output strictly valid JSON conforming to the schema.
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API Error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini Audio.');
  }

  return JSON.parse(rawText);
}
