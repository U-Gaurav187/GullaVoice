/**
 * Groq Cloud AI Engine (Whisper STT + Fast LLM JSON Extractor)
 * Automatically adapts across available Groq models (Llama 3.3, GPT-OSS 120B/20B, Qwen)
 * and Whisper Large v3 Turbo for reliable, zero-latency parsing.
 */

export const GALLA_SYSTEM_PROMPT = `You are Galla AI, an Indian Kirana shop voice ledger parser.
Extract structured JSON from noisy Hindi/Hinglish cash-counter speech.

RULES:
1. DISCOURSE & CHATTER SOP:
- Separate counter chatter from the ledger instruction into "ignored_side_chatter" and "discourse_clauses" (TARGET | RECORD | IGNORE).
- IGNORE worker commands ("छोटू थैली दे दे", "राजू बर्फ लाना"), side price questions ("ये कितने का है?"), change banter ("खुल्ले नहीं हैं"), and resumption fillers ("हाँ कहाँ था मैं", "अच्छा सुनो").
- Imperatives ("लिख दो", "रख दो", "रगदा", "डाल दो", "कर दो") -> CREATE_UDHAAR; "जमा", "दिए", "पैसा आ चुका", "चुकता" -> RECEIVE_JAMA.

2. ITEMS, ACCENTS & RATE CARD:
- Colloquial fractions/slips: "aadha"=0.5, "pav/pao"=0.25, "paun"=0.75, "dedh"=1.5, "dhai"=2.5, "dedh sau"=150; "कांदा"=Kanda/Pyaz, "दनिया"=Dhania, "टामाटर"=Tamatar, "सेव/सेब"=Sev.
- Compute item prices from STORE RATE CARD (qty * unitPrice). If spoken rupee figure looks like an extreme slip vs rate card, prefer rate card and add "accent_correction_note".

3. LEDGER QUERIES (NET AFTER JAMA):
- Specific customer udhaar ("<Name> का कितना उधार बाकी है?"): CHECK_BALANCE using netBalance=(totalUdhaar-totalJama).
- Specific customer jama ("<Name> का कितना जमा है?"): CHECK_BALANCE answering totalJama.
- Store/plural queries ("कितने ग्राहकों का कितना उधार बचा है", "मुझे कितना उधार है", "सबका कितना बाकी है", "Dukan me kul kitna udhaar hai?"): CHECK_TOTAL_STORE_BALANCE (NEVER treat "ग्राहकों"/"मुझे"/"सबका" as a customer name).
- Highest debtor: CHECK_HIGHEST_UDHAAR (rank by netBalance). Today summary: CHECK_TODAY_SUMMARY.

4. RATE CARD VOICE UPDATES:
- Rate changes ("Rate card mein mooli 40 kilo, cheeni 60 kilo kar do"): intent "UPDATE_RATE_CARD" with "rate_card_updates":[{name,hindiName,new_price,unit}].

5. DYNAMIC STAGING CORRECTIONS:
- If input begins with "CURRENT STAGED DRAFT:", restructure the draft per USER VOICE CORRECTION (replace items/name/quantity if restated, e.g. "no, वैशाली का 2 packet तेल हुआ था"), compute prices from rate card, and end "tts_hindi_readback" with "क्या इसे सेव करें?".

6. READBACK:
- Always provide natural Devanagari "tts_hindi_readback" and English "tts_readback".

Return valid JSON only:
{
  "discourse_clauses":[{"utterance":"str","type":"LEDGER_HEADER|COMMIT_COMMAND|HELPER_DISPATCH|CUSTOMER_INQUIRY","action":"TARGET|RECORD|IGNORE"}],
  "intent":"CREATE_UDHAAR|RECEIVE_JAMA|CHECK_BALANCE|CHECK_TODAY_SUMMARY|CHECK_HIGHEST_UDHAAR|CHECK_TOTAL_STORE_BALANCE|UPDATE_RATE_CARD|NOISE_ONLY",
  "customer_spoken":"str",
  "matched_customer_name":"str",
  "match_confidence":0.95,
  "rate_card_updates":[{"name":"str","hindiName":"str","new_price":0,"unit":"kg|pao|pkt|ltr|pc"}],
  "items":[{"name":"str","quantity":"str","calculated_price_inr":0,"accent_correction_note":null}],
  "total_amount_inr":0,
  "transaction_type":"UDHAAR|JAMA",
  "ignored_side_chatter":"str",
  "tts_readback":"str",
  "tts_hindi_readback":"str"
}`;

const CANDIDATE_CHAT_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3.8-27b'
];

/**
 * Helper to encode Audio Blob as Base64 for secure serverless API proxy
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe Audio Blob using Groq Whisper Large v3 Turbo
 * Uses secure serverless proxy (/api/transcribe) if no client key is provided
 */
export async function transcribeWithGroqWhisper(apiKey, audioBlob, language = 'hi') {
  // If NO apiKey provided, route securely through serverless API proxy (zero key exposure)
  if (!apiKey) {
    console.log('🔒 Using secure serverless proxy /api/transcribe (API key hidden on server)...');
    const base64 = await blobToBase64(audioBlob);
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64,
        mimeType: audioBlob.type || 'audio/wav',
        language: language === 'en' ? 'en' : 'hi'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return (data.text || '').trim();
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Serverless Whisper error ${response.status}`);
  }

  const whisperModels = ['whisper-large-v3-turbo', 'whisper-large-v3'];
  let lastError = null;

  for (const model of whisperModels) {
    try {
      const formData = new FormData();
      const isWav = audioBlob.type?.includes('wav');
      const filename = isWav ? 'counter_recording.wav' : 'counter_recording.webm';
      const cleanMime = isWav ? 'audio/wav' : 'audio/webm';
      // Strip codec parameters so Whisper multipart parser never rejects with 400
      const cleanBlob = new Blob([audioBlob], { type: cleanMime });
      formData.append('file', cleanBlob, filename);
      formData.append('model', model);

      // CRITICAL: Explicitly set language so Whisper never misidentifies Hindi as Arabic/Turkish/Urdu
      formData.append('language', language === 'en' ? 'en' : 'hi');

      // Concise vocabulary anchor prompt for Whisper decoder
      formData.append('prompt',
        'किराना खाता: अविनाश, रमेश भाई, वैशाली, पार्थ, सुनीता, शर्मा जी, पिंटू। सेव, नमकीन, आलू, कांदा, प्याज, टमाटर, धनिया, चीनी, दूध, तेल, चावल। कितने ग्राहकों का कितना उधार बचा है, मुझे कितना उधार है, कन्फर्म करो, ग्राहक का नाम वैशाली लिखो, जमा करो।'
      );

      // temperature=0 eliminates hallucination on quiet/noisy audio
      formData.append('temperature', '0');
      // Get word-level timestamps for debugging
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // verbose_json returns segments, language, duration alongside text
        console.log(`🗣️ Whisper [${model}] detected language: "${data.language || 'auto'}", duration: ${data.duration || '?'}s, segments: ${data.segments?.length || 0}`);
        if (data.segments && data.segments.length > 0) {
          console.log('📊 Whisper segments:', data.segments.map(s => `[${s.start?.toFixed(1)}s-${s.end?.toFixed(1)}s] "${s.text}" (no_speech_prob=${s.no_speech_prob?.toFixed(3)})`).join(' | '));
        }
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
 * Uses secure serverless proxy (/api/chat) if no client key is provided
 */
export async function parseWithGroqLlama({ apiKey, transcript, customers = [], rateCard = [], language = 'hi' }) {
  // If NO apiKey provided, route securely through serverless API proxy (zero key exposure)
  if (!apiKey) {
    console.log('🔒 Using secure serverless proxy /api/chat (API key hidden on server)...');
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        customers,
        rateCard,
        language
      })
    });

    if (response.ok) {
      return await response.json();
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Serverless Groq Chat error ${response.status}`);
  }

  const compactCustomers = (customers || []).map(c =>
    `${c.name}(hi:${c.hindiName || c.name},U:${c.totalUdhaar || 0},J:${c.totalJama || 0},Net:${(c.totalUdhaar || 0) - (c.totalJama || 0)})`
  ).join('; ') || 'None';

  const compactRateCard = (rateCard || []).map(r =>
    `${r.name}${r.hindiName ? `(${r.hindiName})` : ''}=${r.unitPrice}/${r.unit}`
  ).join(', ');

  const userContext = `LANG: ${language === 'hi' ? 'Hindi' : 'English'}
CUSTOMERS: ${compactCustomers}
RATES: ${compactRateCard}
SPEECH: "${transcript}"`;

  let lastError = null;

  for (const model of CANDIDATE_CHAT_MODELS) {
    try {
      console.log(`⚡ Trying Groq chat model: ${model}...`);
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
          console.log(`✅ Groq model ${model} responded successfully!`);
          return JSON.parse(rawContent);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Groq Error ${response.status}`;
        console.warn(`⚠️ Groq model ${model} returned error (${response.status}): ${errMsg}. Attempting failover model...`);
        lastError = new Error(errMsg);
      }
    } catch (e) {
      console.warn(`⚠️ Groq model ${model} network error: ${e.message}. Attempting failover...`);
      lastError = e;
    }
  }

  throw lastError || new Error('Groq AI parsing failed on all candidate models.');
}
