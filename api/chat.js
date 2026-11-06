const GALLA_SYSTEM_PROMPT = `You are an expert Indian Kirana store ledger AI ('Galla AI').
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

4. DUAL-LANGUAGE VOICE READBACK:
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
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'mixtral-8x7b-32768',
  'qwen/qwen3.8-27b'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Server configuration error: GROQ_API_KEY environment variable is missing on the server.' 
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const { transcript, customers = [], rateCard = [], language = 'hi' } = body || {};
    if (!transcript) {
      return res.status(400).json({ error: 'transcript parameter is required.' });
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
        console.log(`[API /chat] Calling Groq model: ${model}...`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: GALLA_SYSTEM_PROMPT },
              { role: 'user', content: userContext }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const completion = await response.json();
          const rawContent = completion.choices?.[0]?.message?.content || '{}';
          console.log(`[API /chat] Success with ${model}`);
          const parsed = JSON.parse(rawContent);
          return res.status(200).json(parsed);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`[API /chat] Groq ${model} failed (${response.status}):`, errData.error?.message);
          lastError = errData.error?.message || `Groq status ${response.status}`;
        }
      } catch (err) {
        console.warn(`[API /chat] Network error with ${model}:`, err.message);
        lastError = err.message;
      }
    }

    return res.status(502).json({ error: lastError || 'Chat completion failed across all candidate models.' });
  } catch (error) {
    console.error('API /chat error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
