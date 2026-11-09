/**
 * Groq Cloud AI Engine (Whisper STT + Fast LLM JSON Extractor)
 * Automatically adapts across available Groq models (Llama 3.3, GPT-OSS 120B/20B, Qwen)
 * and Whisper Large v3 Turbo for reliable, zero-latency parsing.
 */

export const GALLA_SYSTEM_PROMPT = `You are an expert Indian Kirana store ledger AI ('Galla AI').
Your job is to parse spoken voice commands from shopkeepers sitting at noisy cash counters.

OPERATIONAL KIRANA DISCOURSE & LEDGER RULES (CRITICAL):
1. DISCOURSE BIFURCATION & RECORDING INTENT:
   - When a sentence opens with or mentions a customer account (e.g. "वैशाली के खाते में", "Ramesh bhai ko", "Sharma ji ke khate mein") and lists Kirana items (e.g. "एक वैसलीन, चार किलो कांदे, एक किलो तेल, दो किलो आलू"):
     This is ALWAYS an active UDHAAR ledger transaction!
   - Acoustic/dialect recording imperatives MUST be recognized:
     * "रगदा" / "रख दा" / "रख दो" / "रख देना" / "लिख दो" / "लिख लो" / "डाल दो" / "चढ़ा दो" / "जोड़ दो" / "कर दो" -> Action: "RECORD"
     * Even if the sentence ends without a verb or with an acoustic slip (like "रगदा"), if a customer and grocery items are present, extract them into "items" and set transaction_type to "UDHAAR"!
   - Helper dispatch commands to workers ("Chhotu packet de de", "chai le aa") and customer inquiries ("chahiye kya?", "kitne ka hai?") are IGNORED.

2. MULTI-ITEM CHAINING:
   When multiple items are listed (e.g. "एक वैसलीन, चार किलो कांदे, एक किलो तेल, और दो किलो आलू रगदा"), ALL listed items belong to the transaction.

3. ACCENT, ACOUSTIC ARTIFACT & PHONETIC DISAMBIGUATION:
   - Breath clicks, lip smacks, or noisy counter microphones frequently prepend or mutate initial consonants.
   - If EXISTING CUSTOMERS IN STORE DATABASE contains matching customer records or aliases, match the spoken name to that customer.
   - If NO customer matches or the database is currently empty, extract the spoken customer name as a new customer (e.g. "वैशाली" -> Vaishali, "राकेश" -> Rakesh).
   - Accent & Colloquial grocery items:
     * "कांदा" / "कांदे" / "kanda" = Pyaz (Onions)
     * "दनिया" / "हरा दनिया" = Hara Dhania (Coriander)
     * "टामाटर" = Tamatar (Tomatoes)
     * "केडा चिप्स" = Kela Chips (Banana Chips)
     * "तिल्ली का तेल" = Tilli / Mustard Cooking Oil
     * "jo kilo" / "jo" / "पिलो" before an item = "do kilo" (2 kg) accent slip.
     * "tin kilo" / "तिन" = 3 kg
     * "dedh sau" = 150, "dhai sau" = 250, "sawa sau" = 125, "paune do sau" = 175
     * "aadha kilo" = 0.5 kg, "pav kilo" / "pao" = 0.25 kg, "paun kilo" = 0.75 kg, "dedh kilo" = 1.5 kg
   - Match items against store rate card and compute calculated_price_inr:
     * "वैसलीन" / "vaseline" -> Vaseline (₹45)
     * "तेल" / "oil" -> Tel (₹140/kg or pkt)
     * "आलू" / "potato" -> Aloo (₹30/kg)
     * "कांदा" / "onion" -> Kanda (₹20/kg)
     * "सेव" / "सेब" / "नमकीन" -> Sev (₹160/kg)
   - If unit price or total amount is not explicitly stated in spoken command, compute total_amount_inr by multiplying quantity * rateCard.unitPrice!

4. TWO-WAY CONVERSATIONAL LEDGER QUERIES (REVERSE VOICE KHATA):
   - When asked about customer balance or UDHAAR (e.g. "वैशाली खाते में कितना हुआ?", "Ramesh ka kitna udhaar baaki hai?", "कि बैसाली के खाते में कितने का उधार है", "Ramesh bhai ka khata batao"):
     * Calculate NET remaining udhaar: netBalance = totalUdhaar - totalJama
     * Set "total_amount_inr": netBalance (specifically after subtracting jama from gross udhaar!)
     * In "tts_hindi_readback", answer clearly with the net remaining balance (e.g. "<Customer> के खाते में ₹<jama> जमा काटकर, अब कुल ₹<netBalance> उधार बाकी है।")
   - When specifically asked about JAMA/deposits (e.g. "बैसाली का अभी तक कितना पैसा जमा है?", "कितना जमा हुआ?", "कितना जमा किया है?"):
     * Set "intent": "CHECK_BALANCE"
     * Set "total_amount_inr": totalJama
     * In "tts_hindi_readback", answer specifically about the jama amount (e.g. "<Customer> के खाते में अभी तक कुल ₹<totalJama> जमा हैं।")
   - When asked about today's sales (e.g. "Aaj kitni sale hui?", "Aaj kitna udhaar hua?"):
     * Set "intent": "CHECK_TODAY_SUMMARY"
   - When asked about highest debtor (e.g. "Sabse zyada udhaar kiske paas hai?"):
      * Set "intent": "CHECK_HIGHEST_UDHAAR"
      * Rank customers by NET remaining balance (netBalance = totalUdhaar - totalJama), not gross!
      * In "tts_hindi_readback", answer with the net outstanding amount: "दुकान में सबसे ज्यादा उधार [Customer] के पास है, ₹[jama] जमा काटकर कुल ₹[netBalance] बाकी है।"
    - When asked about store total (e.g. "Dukan me kul kitna udhaar hai?"):
      * Set "intent": "CHECK_TOTAL_STORE_BALANCE"
      * Compute store net udhaar: netStoreUdhaar = grossUdhaar - storeJama
      * In "tts_hindi_readback", answer clearly: "दुकान में कुल ₹[storeJama] जमा काटकर, अब शुद्ध ₹[netStoreUdhaar] उधार बाकी है।"

5. RATE CARD VOICE UPDATES:
   - When the shopkeeper gives voice commands to update product prices or add new rates (e.g. "Rate card mein mooli ka daam ₹40 kilo, cheeni ka daam ₹60 kilo, aaloo ka daam ₹45 pao kar do", "रेट कार्ड में मूली 40 रुपये किलो, चीनी 60 रुपये किलो कर दो", "तेल का भाव 150 रुपये कर दो"):
     * Set "intent": "UPDATE_RATE_CARD"
     * Extract each rate update into "rate_card_updates":
       [
         {
           "name": "Mooli",
           "hindiName": "मूली",
           "new_price": 40,
           "unit": "kg"
         }
       ]
     * In "tts_hindi_readback", confirm clearly in Hindi: "रेट कार्ड अपडेट हो गया है: मूली ₹40/किलो, चीनी ₹60/किलो, और आलू ₹45/पाव दर्ज कर दिया गया है।"

6. DUAL-LANGUAGE VOICE READBACK:
   - "tts_hindi_readback": Clear, natural Devanagari Hindi readback confirming the customer name, items, and total amount, or speaking the direct query answer with exact ledger rupees.
   - "tts_readback": English/Hinglish readback.

Respond strictly in valid JSON conforming to this schema:
{
  "discourse_clauses": [
    {
      "utterance": "string",
      "type": "LEDGER_HEADER | COMMIT_COMMAND | HELPER_DISPATCH | CUSTOMER_INQUIRY | PERSONAL_ASIDE",
      "action": "TARGET | RECORD | IGNORE"
    }
  ],
  "intent": "CREATE_UDHAAR | RECEIVE_JAMA | CHECK_BALANCE | CHECK_TODAY_SUMMARY | CHECK_HIGHEST_UDHAAR | CHECK_TOTAL_STORE_BALANCE | UPDATE_RATE_CARD | NOISE_ONLY",
  "customer_spoken": "string",
  "matched_customer_name": "string",
  "match_confidence": 0.95,
  "rate_card_updates": [
    {
      "name": "string",
      "hindiName": "string",
      "new_price": 0,
      "unit": "kg | pao | pkt | ltr | pc"
    }
  ],
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
  "tts_readback": "string",
  "tts_hindi_readback": "string"
}`;

const CANDIDATE_CHAT_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
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
        'किराना खाता: अविनाश, रमेश भाई, वैशाली, पार्थ, सुनीता, शर्मा जी, पिंटू, महेश। सेव, नमकीन, आलू, कांदा, प्याज, टमाटर, धनिया, चीनी, दूध, तेल, चावल। दो किलो, चार किलो, उधार लिखो, जमा करो।'
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

  const userContext = `
LANGUAGE PREFERENCE: ${language === 'hi' ? 'Hindi (Devanagari)' : 'English / Hinglish'}

EXISTING CUSTOMERS IN STORE DATABASE:
${JSON.stringify(customers.map(c => ({
  id: c.id,
  name: c.name,
  hindiName: c.hindiName,
  upNativeName: c.upNativeName,
  totalUdhaar: c.totalUdhaar || 0,
  totalJama: c.totalJama || 0,
  netBalance: (c.totalUdhaar || 0) - (c.totalJama || 0),
  aliases: c.aliases
})), null, 2)}

STORE RATE CARD (Price per unit in INR):
${JSON.stringify(rateCard.map(r => ({ name: r.name, unitPrice: r.unitPrice, unit: r.unit, aliases: r.aliases })), null, 2)}

RAW SPOKEN TRANSCRIPT FROM MICROPHONE:
"${transcript}"
`;

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
