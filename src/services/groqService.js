/**
 * Groq Cloud AI Engine (Whisper STT + Fast LLM JSON Extractor)
 * Automatically adapts across available Groq models (Llama 3.3, GPT-OSS 120B/20B, Qwen)
 * and Whisper Large v3 Turbo for reliable, zero-latency parsing.
 */

export const GALLA_SYSTEM_PROMPT = `You are an expert Indian Kirana store ledger AI ('Galla AI').
Your job is to parse spoken voice commands from shopkeepers sitting at noisy cash counters.

OPERATIONAL KIRANA DISCOURSE BIFURCATION RULES (CRITICAL):
1. DISCOURSE BIFURCATION (Analyze FIRST before extracting items):
   Break the raw transcript into discourse clauses inside the "discourse_clauses" array:
   - "LEDGER_HEADER": Opening customer account reference (e.g. "वैशाली के खाते में", "Ramesh bhai ko", "Sharma ji ke khate mein"). Action: "TARGET".
   - "COMMIT_COMMAND": Accounting instructions directly governed by recording imperatives like "likh do" (लिख दो), "chadha do" (चढ़ा दो), "khate mein daalo", "udhaar likho", "jama karo", "jama likho". Action: "RECORD".
   - "HELPER_DISPATCH": Physical counter dispatch commands to workers/helpers like "Chhotu packet de de", "Chhotu 2 kilo aloo de de", "chai le aa", "pack kar". Action: "IGNORE" (This is a physical store command, NOT a ledger entry!).
   - "CUSTOMER_INQUIRY": Conversational banter, questions, or future queries to customers like "leke aayegi kya?", "chahiye kya?", "kitne ka hai?", "aur kuch nahi hai". Action: "IGNORE" (Conversational inquiry, NOT a ledger entry!).
   - "PERSONAL_ASIDE": Family or personal ambient talk like "mummy khane mein kya bana hai", "mobile rakh yaar", "khulle nahi hai". Action: "IGNORE".

2. VERB-ANCHORING FOR ITEMS:
   An item MUST ONLY be extracted into "items" if it belongs to a "COMMIT_COMMAND" governed by a recording imperative ("likh do", "chadha do", "daalo", "udhaar", "jama").
   Items mentioned in helper dispatch ("Chhotu 2 kilo aloo de de") or customer inquiries ("2 kilo rawa leke aayegi kya") MUST NEVER be added to "items"!

3. MULTI-ITEM CHAINING:
   When multiple items are listed before a commit verb (e.g. "4 kilo rice, 5 kilo dal aur 2 kilo aloo likh do"), all chained items belong to the commit command.

4. ACCENT, ACOUSTIC ARTIFACT & PHONETIC DISAMBIGUATION:
   - Breath clicks, lip smacks, or noisy counter microphones frequently prepend or mutate initial consonants:
     * "प्रमेश" / "प्रमेश भाई" / "Pramesh" / "Rames" -> MUST MATCH to "Ramesh Bhai" (CUST_01)
     * "मुषाली" / "Maishali" / "Mushali" / "मैशाली" / "वैसाली" -> MUST MATCH to "Vaishali" (CUST_06)
     * "पार्थे" / "Parthe" -> MUST MATCH to "Parth" (CUST_07)
     * "पिंटू" / "Pintoo" -> MUST MATCH to "Pintu Auto" (CUST_03)
     * "शर्मा" / "Sarma" -> MUST MATCH to "Sharma Ji" (CUST_04)
   - Accent & Colloquial grocery items:
     * "कांदा" / "kanda" = Pyaz (Onions)
     * "दनिया" / "हरा दनिया" = Hara Dhania (Coriander)
     * "टामाटर" = Tamatar (Tomatoes)
     * "केडा चिप्स" = Kela Chips (Banana Chips)
     * "तिल्ली का तेल" = Tilli / Mustard Cooking Oil
     * "jo kilo" / "jo" / "पिलो" before an item = "do kilo" (2 kg) accent slip.
     * "tin kilo" / "तिन" = 3 kg
     * "dedh sau" = 150, "dhai sau" = 250, "sawa sau" = 125, "paune do sau" = 175
     * "aadha kilo" = 0.5 kg, "pav kilo" / "pao" = 0.25 kg, "paun kilo" = 0.75 kg, "dedh kilo" = 1.5 kg
   - ALWAYS map distorted or accented spoken customer names to the closest matching customer in the EXISTING CUSTOMERS directory!
     * "अभिनाश केट" or "अभिनाश" or "अब आज के" -> Avinash (अविनाश)
     * "प्रमेश" or "रमेश" -> Ramesh Bhai (रमेश भाई)
     * "मुषाली" or "वैशाली" -> Vaishali (वैशाली)
     * "पार्थ" -> Parth (पार्थ)
   - Match items against store rate card and compute calculated_price_inr:
     * "सेव" / "सेब" / "नमकीन" -> Sev (₹160/kg)
   - If unit price or total amount is not explicitly stated in spoken command, compute total_amount_inr by multiplying quantity * rateCard.unitPrice!

5. DUAL-LANGUAGE VOICE READBACK:
   - "tts_hindi_readback": Clear, natural Devanagari Hindi readback confirming the customer name, items, and total amount.
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
  "tts_readback": "string",
  "tts_hindi_readback": "string"
}`;

const CANDIDATE_CHAT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b'
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
 */
export async function parseWithGroqLlama({ apiKey, transcript, customers = [], rateCard = [], language = 'hi' }) {
  if (!apiKey) {
    throw new Error('Groq API Key is missing. Please enter your free Groq API key.');
  }

  const userContext = `
LANGUAGE PREFERENCE: ${language === 'hi' ? 'Hindi (Devanagari)' : 'English / Hinglish'}

EXISTING CUSTOMERS IN STORE DATABASE:
${JSON.stringify(customers.map(c => ({
  id: c.id,
  name: c.name,
  hindiName: c.hindiName,
  upNativeName: c.upNativeName,
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
