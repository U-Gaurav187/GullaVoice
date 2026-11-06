# MASTER.md — GallaVoice Agent-to-Agent Handoff & Architecture Blueprint

> **Notice for AI Coding Agents (Cursor, Windsurf, Claude, Copilot, Antigravity):**
> This file is the single source of truth for the entire GallaVoice repository. Read this file first to understand the system architecture, file map, data schemas, mathematical and regex algorithms, and extension points.

---

## 1. System Overview & Persona Constraints

- **Project Name:** GallaVoice (गल्ला वॉयस)
- **Tagline:** Noisy Cash-Counter Voice Khata for Bharat
- **Hackathon Track:** Scaler x Wispr Flow Hackathon ("India Runs on Voice")
- **Target Persona:** Indian Kirana Dukandaar (shopkeeper) sitting at a loud, chaotic cash counter (galla). Non-tech-savvy, prefers spoken Hindi/Hinglish, distrusts complex mobile screens, and fears double-charging or ledger errors.
- **Real-World Galla Constraints Solved:**
  1. **Mid-Sentence Interleaving (Side-Chatter):** Customers haggle over milk prices or the shopkeeper yells at a store helper midway through recording an entry, often **without** transition markers like *"kaha tha me"*.
  2. **Regional Dialect & Accent Inaccuracies:** Dialects confuse names (e.g. *Rames* vs *Ramesh*, *Sarma* vs *Sharma*) and quantities (*dedh sau* = 150, *dhai sau* = 250, *aadha kilo* = 0.5kg, *pav kilo* = 0.25kg, 15 vs 50 vs 500).
  3. **Zero-Tech Hesitation (Two-Icon Gate):** Shopkeepers will not read small tables before verifying. The app must read back the interpreted transaction in clear native Devanagari Hindi (TTS) and display **ONLY TWO giant, thumb-friendly icon buttons**: ❌ **RETRY** (Red) and ✅ **CONTINUE** (Green).

---

## 2. Architecture & Complete File Map

The application runs **100% client-side** using **Vite + React 18 + Tailwind CSS + Lucide React**. It runs immediately on `http://localhost:5173` without requiring Docker, Python, or a backend Node server.

```
c:\Kirana-Khata/
├── index.html                   # HTML entry point with Noto Sans Devanagari & Inter fonts
├── package.json                 # Dependencies (React, Lucide, Tailwind, Canvas-Confetti)
├── vite.config.js               # Vite config on port 5173 with host enabled
├── tailwind.config.js           # Kirana custom color palette (saffron, jama, udhaar, bahi)
├── postcss.config.js            # PostCSS configuration
├── MASTER.md                    # This developer & agent architecture blueprint
├── README.md                    # Hackathon project showcase & judges guide
├── .env.example                 # Optional free API key templates
├── test_runner.js               # CLI test suite for deterministic & phonetic engines
│
└── src/
    ├── main.jsx                 # React root renderer
    ├── App.jsx                  # Master controller: state orchestration, modals & panels
    ├── index.css                # Tailwind base styles, scrollbars & soundwave keyframes
    │
    ├── data/
    │   ├── initialCustomers.js  # Pre-seeded customer accounts (Ramesh Bhai, Sunita Bhabhi, etc.)
    │   ├── initialRateCard.js   # Pre-seeded store rate card (Cheeni ₹44, Tel ₹140, Dudh ₹40, etc.)
    │   ├── initialTransactions.js # Pre-seeded sample ledger entries
    │   └── noisyGallaPresets.js # Curated 1-click test sentences with realistic galla noise
    │
    ├── utils/
    │   ├── noiseFilter.js       # Regex & semantic stripper for counter chatter & helper shouts
    │   ├── phoneticMatcher.js   # Levenshtein distance + Hinglish phonetic transformer & soundex
    │   ├── numberNormalizer.js  # Hindi number words & colloquial fractions (dedh, dhai, pav)
    │   ├── rateCardSanity.js    # Cross-reference rate card to detect accent slips (e.g. 15 vs 1500)
    │   ├── hindiDevanagariHelper.js # Number-to-Hindi words & natural confirmation sentence builder
    │   ├── speechTTS.js         # Browser SpeechSynthesis wrapper (hi-IN voice with rate tuning)
    │   └── storage.js           # LocalStorage persistence, backup export to JSON & CSV
    │
    ├── services/
    │   ├── localParser.js       # Phase 1: Zero-key offline deterministic & fuzzy parsing pipeline
    │   ├── groqService.js       # Phase 2: Groq Cloud Llama-3.3-70b & Whisper-large-v3-turbo
    │   ├── geminiService.js     # Phase 2: Google AI Studio Gemini 2.5 Flash structured output
    │   └── parserEngine.js      # Unified switchboard connecting UI to Local or Cloud engines
    │
    └── components/
        ├── Header.jsx           # Live stats (Total Udhaar, Total Jama), branding & settings trigger
        ├── AudioPresetBar.jsx   # 1-Click "Simulate Noisy Galla Audio" test cards for judges
        ├── GallaVoiceController.jsx # Giant Mic button, live soundwave, transcript box & noise strikethrough
        ├── StagingCard.jsx      # Draft preview, phonetic badge, sanity alert & TWO GIANT ACTION BUTTONS
        ├── TransactionsTable.jsx # Tab 1: Live persistent transactions ledger with filter & delete
        ├── CustomerKhataTable.jsx # Tab 2: Customer accounts, running balance & WhatsApp reminder
        ├── RateCardModal.jsx    # Store rate card drawer with live inline price editing
        └── SettingsModal.jsx    # Phase 2 Free Keys modal (Groq & Gemini setup, live ping test)
```

---

## 3. Data Schemas & State Management

### A. Galla AI Ledger Output Schema (Embedded LLM & Local Engine Contract)
Every parser (local or cloud) MUST conform strictly to this specification:
```json
{
  "intent": "CREATE_UDHAAR | RECEIVE_JAMA | CHECK_BALANCE | NOISE_ONLY",
  "customer_spoken": "string",
  "matched_customer_name": "string",
  "match_confidence": 0.95,
  "items": [
    {
      "name": "string",
      "quantity": "string",
      "calculated_price_inr": 88,
      "accent_correction_note": "string or null"
    }
  ],
  "total_amount_inr": 228,
  "transaction_type": "UDHAAR | JAMA",
  "ignored_side_chatter": "string",
  "tts_hindi_readback": "string (Devanagari Hindi sentence for voice readback)"
}
```

### B. Customer Record Schema (`src/data/initialCustomers.js`)
```javascript
{
  id: 'CUST_01',
  name: 'Ramesh Bhai',
  hindiName: 'रमेश भाई',
  aliases: ['Rames', 'Ramess', 'Rameshwar', 'Ramesh', 'रमेश'],
  phone: '+91 98201 12345',
  totalUdhaar: 420,
  totalJama: 200,
  netBalance: 220, // Net debit owed by customer
  lastUpdated: '2026-11-06T10:15:00Z',
  notes: 'Regular customer'
}
```

### C. Rate Card Item Schema (`src/data/initialRateCard.js`)
```javascript
{
  id: 'ITEM_01',
  name: 'Cheeni',
  displayName: 'Cheeni (Sugar)',
  hindiName: 'चीनी',
  aliases: ['cheeni', 'chini', 'shakkar', 'sugar', 'चीनी'],
  unit: 'kg',
  unitPrice: 44,
  category: 'Groceries'
}
```

### D. Transaction Record Schema (`src/data/initialTransactions.js`)
```javascript
{
  id: 'TXN_1001',
  timestamp: '2026-11-06T08:30:15Z',
  customerSpoken: 'Ramesh bhai',
  matchedCustomerId: 'CUST_01',
  customerName: 'Ramesh Bhai',
  matchConfidence: 0.96,
  transactionType: 'UDHAAR', // 'UDHAAR' | 'JAMA'
  items: [...],
  totalAmount: 124,
  ignoredNoise: 'arre chhotu jhadu laga le',
  rawTranscript: '...',
  status: 'COMMITTED',
  ttsHindiText: '...'
}
```

---

## 4. Core Algorithms & Logic

### 1. Mid-Sentence Interruption Stripper (`src/utils/noiseFilter.js`)
Matches and extracts non-accounting chatter:
- Price quotes to other buyers: `/(dudh|doodh)\s+(aab|ab)?\s*\d+\s*ka\s+ho\s+gaya(\s+(he|hai))?/gi`
- Commands to helpers: `/chhotu\s+(packet\s+de|baraf\s+le\s+aa|chai\s+le\s+aa|theli\s+de)/gi`
- Change/exchange excuses: `/are?\s+bhai\s+khulle\s+nahi\s+hai\s+abhi/gi`
- Transition phrases: `/ha\s+kaha\s+tha\s+me/gi`, `/kaha\s+the\s+hum/gi`
Extracted segments are passed to the frontend and rendered in an explicit `<span class="line-through">` badge for transparency.

### 2. Phonetic & Levenshtein Customer Matching (`src/utils/phoneticMatcher.js`)
- Strips honorifics: `bhai`, `bhabhi`, `ji`, `bhaiya`, `seth`, `uncle`.
- Transforms Hinglish sounds: `sh` $\rightarrow$ `s`, `v` $\leftrightarrow$ `w`, `ph` $\leftrightarrow$ `f`, `z` $\rightarrow$ `j`, `bh` $\rightarrow$ `b`, `dh` $\rightarrow$ `d`, double vowels collapsed (`ee` $\rightarrow$ `i`, `oo` $\rightarrow$ `u`).
- Computes weighted Levenshtein similarity: $\text{Score} = 0.65 \times \text{PhoneticSim} + 0.35 \times \text{RawSim}$.
- Threshold $\ge 0.70$ maps to registered customer ID with visual match badge.

### 3. Colloquial Quantities & Multipliers (`src/utils/numberNormalizer.js`)
- Currency: `dedh sau` $\rightarrow$ 150, `dhai sau` $\rightarrow$ 250, `sawa sau` $\rightarrow$ 125, `paune do sau` $\rightarrow$ 175.
- Fractions: `aadha kilo` $\rightarrow$ 0.5 kg, `pav kilo` $\rightarrow$ 0.25 kg, `paun kilo` $\rightarrow$ 0.75 kg, `sawa kilo` $\rightarrow$ 1.25 kg, `dedh kilo` $\rightarrow$ 1.5 kg, `dhai kilo` $\rightarrow$ 2.5 kg.

### 4. Rate-Card Accent Price Sanity Check (`src/utils/rateCardSanity.js`)
- Computes standard price = $\text{Qty} \times \text{RateCard.UnitPrice}$.
- If spoken price / standard price $> 2.5$ or $< 0.4$, triggers an accent discrepancy warning:
  *Example:* Spoken *"1500 rupaye"* for 1 packet oil ($\text{Standard} = ₹140$) $\rightarrow$ Flags accent slip, auto-adjusts to ₹140, and highlights discrepancy.

### 5. Native Hindi Voice Readback (`src/utils/hindiDevanagariHelper.js` & `speechTTS.js`)
- Translates number to natural Hindi words (e.g. 228 $\rightarrow$ *"दो सौ अट्ठाईस"*).
- Generates respectful confirmation sentence:
  *"रमेश भाई के खाते में दो किलो चीनी और एक पैकेट तेल, कुल दो सौ अट्ठाईस रुपये उधार। क्या इसे सेव करें?"*
- Synthesizes via `SpeechSynthesisUtterance` set to `hi-IN` at `rate = 0.95`.

---

## 5. Phase 1 (Active) vs Phase 2 (Extension Points)

| Feature | AI-First Cloud Engine (Primary) | Local Zero-Key Fallback |
|---|---|---|
| **Speech-to-Text** | Direct `MediaRecorder` Audio Blob $\rightarrow$ Groq `whisper-large-v3-turbo` | Test Presets & Manual Spoken Text Fallback |
| **Parsing Engine** | Groq `llama-3.3-70b-versatile` (Temperature 0.1, JSON Object mode) | `src/services/localParser.js` (Regex + Phonetic Fuzzy Normalizer) |
| **Language Selection** | Startup Modal: 🇮🇳 Hindi (Devanagari) or 🇬🇧 Indian English | Dual-language TTS voice & readback sentence |
| **Price Sanity** | Local Rate Card Table embedded into prompt | Local Rate Card Table cross-checker |
| **TTS Readback** | Native Browser `speechSynthesis` (`hi-IN` or `en-IN`) | Native Browser `speechSynthesis` |
| **Persistence** | `localStorage` (`gallavoice_transactions_v1`) | `localStorage` + CSV/JSON Exporters |

### How to Toggle Engines:
1. Open the web app on `http://localhost:5173`.
2. Click the **"⚡ AI Engine Settings"** icon in the header.
3. Select **Groq Cloud** or **Gemini 2.5 Flash**, paste your free API key, and click **"कनेक्शन जांचें (Ping Test)"**.
4. Click **"सेव करें"**. The orchestrator (`src/services/parserEngine.js`) will immediately route speech to the Cloud LLM while keeping the local parser as an automatic fallback if network drops!
