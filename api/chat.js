const GALLA_SYSTEM_PROMPT = `You are Galla AI, an Indian Kirana shop voice ledger parser.
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

6. STRICT ALPHABET & NAME DIARY:
- Differentiate every single letter/consonant in customer names (e.g. Vaishali/वैशाली vs Vaisali/वैसाली vs Vaishari/वैशारी vs Vaisari/वैसारी). NEVER merge customers differing in श/स, ल/र, ब/व unless in customer aliases. Align spelling with NAME_DIARY ONLY on exact match or unambiguous slip when strict=false.

7. READBACK:
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY missing on server.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const { transcript, customers = [], rateCard = [], nameDiary = [], accentToleranceLevel = 'STRICT', language = 'hi' } = body || {};
    if (!transcript) return res.status(400).json({ error: 'transcript required.' });

    const compactCustomers = (customers || []).map(c =>
      `${c.name}(hi:${c.hindiName || c.name},U:${c.totalUdhaar || 0},J:${c.totalJama || 0},Net:${(c.totalUdhaar || 0) - (c.totalJama || 0)})`
    ).join('; ') || 'None';

    const compactRateCard = (rateCard || []).map(r =>
      `${r.name}${r.hindiName ? `(${r.hindiName})` : ''}=${r.unitPrice}/${r.unit}`
    ).join(', ');

    const compactDiary = (nameDiary || []).slice(0, 30).map(d =>
      `${d.name}${d.hindiName ? `(${d.hindiName})` : ''}`
    ).join(', ') || 'Default';

    const userContext = `LANG: ${language === 'hi' ? 'Hindi' : 'English'} | STRICT_ALPHABET: ${accentToleranceLevel === 'STRICT' ? 'true' : 'false'}
CUSTOMERS: ${compactCustomers}
NAME_DIARY: ${compactDiary}
RATES: ${compactRateCard}
SPEECH: "${transcript}"`;

    let lastError = null;
    for (const model of CANDIDATE_CHAT_MODELS) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
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
          return res.status(200).json(JSON.parse(rawContent));
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `Groq status ${response.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(502).json({ error: lastError || 'Chat completion failed.' });
  } catch (error) {
    console.error('API /chat error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
