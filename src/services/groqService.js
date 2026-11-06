/**
 * Groq Cloud AI Service (Whisper Large v3 Turbo & Llama 3.3 70B Versatile)
 * Phase 2 Cloud Upgrade: Free ultra-fast LLM JSON extraction with 0 credit card required.
 */

export const GALLA_SYSTEM_PROMPT = `You are an expert Indian Kirana store ledger parser ('Galla AI'). Input comes from a noisy microphone where the shopkeeper speaks Hinglish/Hindi while sitting at the cash counter.
1. NOISE FILTERING: Strip out all mid-sentence interruptions, price quotes to other customers (e.g., 'dudh 40 ka ho gaya hai'), talk to helpers ('chhotu packet de'), and filler words, even if there are no transition markers like 'kaha tha me'.
2. ACCENT & PHONETIC MATCHING: Match accented customer names ('Rames', 'Ramess') against the provided existing_customers list.
3. ACCENT NUMBER CORRECTION: Disambiguate phonetic number confusions (e.g., 15 vs 50 vs 500, 'dedh sau'=150, 'dhai sau'=250, 'pav'=0.25, 'aadha'=0.5) by cross-checking with the store rate_card.
4. HINDI TTS GENERATION: Generate a natural Devanagari Hindi sentence ('tts_hindi_readback') summarizing the customer, items, total amount in rupees, and transaction type so the shopkeeper can verify by listening.

Respond ONLY with valid JSON conforming strictly to this schema:
{
  "intent": "CREATE_UDHAAR | RECEIVE_JAMA | CHECK_BALANCE | NOISE_ONLY",
  "customer_spoken": "string",
  "matched_customer_name": "string",
  "match_confidence": 0.95,
  "items": [
    {
      "name": "string",
      "quantity": "string",
      "calculated_price_inr": 0,
      "accent_correction_note": "string or null"
    }
  ],
  "total_amount_inr": 0,
  "transaction_type": "UDHAAR | JAMA",
  "ignored_side_chatter": "string",
  "tts_hindi_readback": "string (Devanagari Hindi sentence for voice readback)"
}`;

export async function parseWithGroqLlama({ apiKey, transcript, customers = [], rateCard = [] }) {
  if (!apiKey) {
    throw new Error('Groq API Key is missing. Please add your key in Settings or .env.local.');
  }

  const userContext = `
EXISTING CUSTOMERS IN STORE DATABASE:
${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name, aliases: c.aliases })), null, 2)}

STORE RATE CARD (Price per unit in INR):
${JSON.stringify(rateCard.map(r => ({ name: r.name, unitPrice: r.unitPrice, unit: r.unit, aliases: r.aliases })), null, 2)}

RAW SPOKEN TRANSCRIPT FROM GALLA MICROPHONE:
"${transcript}"
`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: GALLA_SYSTEM_PROMPT },
        { role: 'user', content: userContext }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Empty response received from Groq AI.');
  }

  return JSON.parse(rawContent);
}

/**
 * Transcribes audio blob using Groq Whisper Large v3 Turbo
 */
export async function transcribeWithGroqWhisper(apiKey, audioBlob) {
  if (!apiKey) throw new Error('Groq API Key is required for Whisper speech-to-text.');

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'hi'); // Hindi / Hinglish model guide
  formData.append('temperature', '0.0');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: formData
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq Whisper failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}
