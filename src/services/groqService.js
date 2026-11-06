/**
 * Groq Cloud AI Engine (Whisper STT + Fast LLM JSON Extractor)
 * Automatically adapts across available Groq models (Llama 3.3, GPT-OSS 120B/20B, Qwen)
 * and Whisper Large v3 Turbo for reliable, zero-latency parsing.
 */

export const GALLA_SYSTEM_PROMPT = `You are an expert Indian Kirana store ledger AI ('Galla AI').
Your job is to parse spoken voice commands from shopkeepers sitting at noisy cash counters.

RULES:
1. NOISE & DISTURBANCE FILTERING:
   Strip out all ambient counter side-chatter, customer haggling (e.g., 'dudh 40 ka ho gaya', 'wo 2 rupee ki hai'), shouts to store helpers ('chhotu packet de de', 'chhotu chai le aa'), and filler words even if there is no resumption marker like 'kaha tha me'.

2. CUSTOMER MATCHING:
   Match accented spoken names (e.g., 'Rames', 'Ramess', 'Rameshwar', 'Sarma') against the provided existing_customers list.

3. ACCENT NUMBER & COLLOQUIAL DISAMBIGUATION:
   Convert colloquial Hindi/Indian terms:
   - 'dedh sau' = 150, 'dhai sau' = 250, 'sawa sau' = 125, 'paune do sau' = 175
   - 'aadha kilo' = 0.5 kg, 'pav kilo' / 'pao' = 0.25 kg, 'paun kilo' = 0.75 kg, 'dedh kilo' = 1.5 kg
   - Catch phonetically ambiguous numbers (15 vs 50 vs 500) using the store rate card.

4. DUAL-LANGUAGE VOICE READBACK:
   - If language is 'hi', generate 'tts_readback' in clear, natural Devanagari Hindi (e.g. 'रमेश भाई के खाते में दो किलो चीनी और एक पैकेट तेल, कुल दो सौ अट्ठाईस रुपये उधार। क्या इसे सेव करें?').
   - If language is 'en', generate 'tts_readback' in natural Indian English (e.g. 'Added 2 kg Sugar and 1 packet Oil to Ramesh Bhai ledger, total 228 rupees credit. Should I save this?').

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
  "tts_readback": "string (Voice confirmation sentence in requested language)",
  "tts_hindi_readback": "string (Always provide Hindi version as well)"
}`;

const CANDIDATE_CHAT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile'
];

/**
 * Transcribe Audio Blob using Groq Whisper Large v3 Turbo (with fallback to v3)
 */
export async function transcribeWithGroqWhisper(apiKey, audioBlob, language = 'hi') {
  if (!apiKey) {
    throw new Error('Groq API Key is missing. Please enter your free Groq API key.');
  }

  const whisperModels = ['whisper-large-v3-turbo', 'whisper-large-v3'];
  let lastError = null;

  for (const model of whisperModels) {
    try {
      const formData = new FormData();
      const isWav = audioBlob.type?.includes('wav');
      const filename = isWav ? 'counter_recording.wav' : 'counter_recording.webm';
      formData.append('file', audioBlob, filename);
      formData.append('model', model);
      // Natural language auto-detection: allows seamless Hinglish, Hindi, and English counter speech
      formData.append('prompt', 'Kirana ledger, Ramesh bhai, Sunita bhabhi, Sharma ji, cheeni, tel, dudh, chawal, atta, dal, udhaar, jama, khata, rupaye, kilo, packet');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return (data.text || '').trim();
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = new Error(errData.error?.message || `Whisper error ${response.status}`);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('Whisper audio transcription failed on Groq.');
}

/**
 * Extract structured ledger transaction JSON from transcript using Groq models
 */
export async function parseWithGroqLlama({ apiKey, transcript, customers = [], rateCard = [], language = 'hi' }) {
  if (!apiKey) {
    throw new Error('Groq API Key is missing. Please enter your free Groq API key.');
  }

  const userContext = `
LANGUAGE PREFERENCE: ${language === 'hi' ? 'Hindi (Devanagari)' : 'English / Hinglish'}

EXISTING CUSTOMERS IN STORE DATABASE:
${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name, aliases: c.aliases })), null, 2)}

STORE RATE CARD (Price per unit in INR):
${JSON.stringify(rateCard.map(r => ({ name: r.name, unitPrice: r.unitPrice, unit: r.unit, aliases: r.aliases })), null, 2)}

RAW SPOKEN TRANSCRIPT FROM MICROPHONE:
"${transcript}"
`;

  let lastError = null;

  for (const model of CANDIDATE_CHAT_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: GALLA_SYSTEM_PROMPT },
            { role: 'user', content: userContext }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          return JSON.parse(rawContent);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = new Error(errData.error?.message || `Groq Error ${response.status}`);
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('Groq AI parsing failed on all candidate models.');
}
