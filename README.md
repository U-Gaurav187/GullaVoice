# 🛒 GallaVoice (गल्ला वॉयस)
### *Noisy Cash-Counter Voice Khata for Bharat*
**Built for the Scaler x Wispr Flow Hackathon ("India Runs on Voice")**

[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zero Key Mode](https://img.shields.io/badge/Offline_Engine-Zero_Key_Ready-10b981)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)

---

## 🇮🇳 The Problem: Why Voice-First Khata Apps Fail at Indian Counters

India's 13+ million Kirana shopkeepers (dukandaars) process dozens of credit (*Udhaar*) and payment (*Jama*) transactions daily while sitting at a noisy cash counter (*galla*). Existing voice ledger apps fail miserably because of four harsh ground realities:

1. **Mid-Sentence Interleaving (Side-Chatter):** While speaking a ledger entry, a customer interrupts with *"bhaiya doodh kitne ka hai?"* or the dukandaar yells at a helper *"chhotu theli de de"*. Most AI models treat this side-chatter as ledger items or crash completely. Crucially, **there is often NO transition phrase** like *"kaha tha me"* when the dukandaar resumes speaking!
2. **Regional Dialect & Accent Inaccuracies:** Regional Indian phonetics warp names (*"Rames"* for *Ramesh*, *"Sarma"* for *Sharma*) and STT models frequently confuse numbers like **15** (*pandrah*), **50** (*pachaas*), and **500** (*paanch sau*), or fail on colloquial fractions (*"dedh sau"*, *"dhai sau"*, *"aadha kilo"*, *"pav kilo"*).
3. **Non-Tech Dukandaar Hesitation:** Shopkeepers fear technology making accounting errors. They will **not** squint at small tables to verify an entry before committing.

---

## ⚡ Key Technical Innovations (The 'Specialty')

### 1. Zero-Transition Interruption Stripping
Separates ambient counter chatter (price quotes to third parties, commands to helpers, loose change negotiations) from the actual accounting command—**even without resumption cues like *"kaha tha me"***. 
- *Visual Proof for Judges:* The filtered disturbance is explicitly surfaced in a greyed-out strikethrough badge (`<s>dudh 40 ka ho gaya</s>`) on screen so you can verify what was removed.

### 2. Phonetic & Levenshtein Customer Mapping
Speech-to-text might capture *"Rames"*, *"Ramess"*, *"Rameshwar"*, or *"रमेश"*. GallaVoice uses an Indian English/Hindi phonetic transformer coupled with weighted Levenshtein distance:
$$\text{Score} = 0.65 \times \text{PhoneticSim} + 0.35 \times \text{RawSim}$$
Any match $\ge 70\%$ automatically maps to existing registered customer IDs (`CUST_01: Ramesh Bhai`) with a visual confirmation pill.

### 3. Rate-Card Accent Price Sanity Check
A built-in store price card (Cheeni = ₹44/kg, Tel = ₹140/pkt, Dudh = ₹40/pkt) cross-references item quantities against spoken numbers.
- If an accent slip causes STT to transcribe *"1 packet tel, 1500 rupaye"* (instead of ₹140) or *"2 kilo cheeni, 15 rupaye"* (instead of ₹88), GallaVoice automatically flags the accent slip, applies the rate card price, and warns the shopkeeper during readback.

### 4. The Two-Icon Confirmation Gate
Once an entry is staged:
- GallaVoice synthesizes a natural, respectful Devanagari Hindi confirmation sentence using the browser's native `SpeechSynthesis` (`hi-IN`):
  > *"रमेश भाई के खाते में दो किलो चीनी और एक पैकेट तेल, कुल दो सौ अट्ठाईस रुपये उधार। क्या इसे सेव करें?"*
- The bottom half of the screen renders **ONLY TWO massive, thumb-friendly physical buttons**:
  - ❌ **RETRY (Red Button — "गलत है / फिर से बोलें"):** Immediately stops audio, discards draft, and re-arms the microphone.
  - ✅ **CONTINUE (Green Button — "सही है / खाते में जोड़ें"):** Commits to persistent local storage, updates customer balance, triggers confetti, and speaks a 1-second audio confirmation (*"खाता अपडेट हो गया"*).

---

## 🚀 Quickstart & Setup (Run on Localhost in 30 Seconds)

GallaVoice is strictly client-side. It requires **no backend server, no Python environment, and ZERO external API keys** for Phase 1.

### 1. Clone & Install
```bash
git clone https://github.com/your-username/gallavoice.git
cd gallavoice
npm install
```

### 2. Launch Local Dev Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser (Google Chrome or Microsoft Edge recommended for native Hindi SpeechSynthesis and Web Speech Recognition).

---

## 🎯 Judges' Test Script (Try These Voice Inputs)

You can speak these into your microphone or test them with **1 click** using the **"Simulate Noisy Galla Audio"** test bar at the top of the dashboard:

| # | Test Scenario | Spoken Hinglish / Hindi Input | Expected Result |
|---|---|---|---|
| **1** | **Interruption WITH Transition Marker** | *"Ramesh bhai ko... wo do rupee ki he dudh aab 40 ka ho gaya he... ha kaha tha me, do kilo cheeni aur ek tel ka packet udhaar likh do."* | Filtered noise: `"wo do rupee ki he"`, `"dudh aab 40..."`<br>Item: 2kg Cheeni (₹88) + 1 pkt Tel (₹140) = **₹228 Udhaar**<br>Customer: **Ramesh Bhai** |
| **2** | **Hard Disturbance WITHOUT Transition** | *"Sunita bhabhi ko wo do rupee ki he dudh 40 ka ho gaya chhotu packet de de do packet tel aur paanch kilo chawal udhaar likho"* | Filtered noise: `"wo do rupee ki he"`, `"dudh 40 ka ho gaya"`, `"chhotu packet de de"`<br>Item: 2 pkt Tel (₹280) + 5kg Chawal (₹300) = **₹580 Udhaar**<br>Customer: **Sunita Bhabhi** |
| **3** | **Accent "Rames" + "Dedh Sau" Jama** | *"Rames ko dedh sau rupaye jama karo are bhai khulle nahi hai abhi kal le lena ha dedh sau jama"* | Phonetic match: `"Rames"` $\rightarrow$ **Ramesh Bhai** (95% match)<br>Colloquial number: `"dedh sau"` $\rightarrow$ **₹150 Jama (Payment)** |
| **4** | **Colloquial Fractions** | *"Sharma ji ko aadha kilo cheeni aur pav kilo dal udhaar likho chhotu dhyan kidhar hai tera"* | Quantity: 0.5kg Cheeni (₹22) + 0.25kg Dal (₹30) = **₹52 Udhaar**<br>Customer: **Sharma Ji** |
| **5** | **Accent Slip Price Sanity Check** | *"Pintu auto ko 1 packet tel 1500 rupaye udhaar likh do are ruko 140 ka hai"* | Rate Card Sanity triggered!<br>Caught ₹1500 outlier vs standard ₹140/pkt.<br>Total: **₹140 Udhaar** |
| **6** | **Pure Counter Chatter** | *"Chhotu baraf le aa jaldi are Sunita bhabhi kal aana doodh khatam ho gaya"* | Flagged as `NOISE_ONLY`. No ledger transaction committed. |

---

## ⚡ Phase 2: Free Cloud AI Upgrade & Key Setup Guide

While GallaVoice works 100% out-of-the-box in **Zero-Key Mode**, you can connect free cloud LLMs in seconds:

### Step 1: Obtain 100% Free API Keys (No Credit Card Required)
- **Groq Cloud (Llama 3.3 70B & Whisper Large v3 Turbo):**  
  👉 Get your free key at: **[https://console.groq.com/keys](https://console.groq.com/keys)**
- **Google AI Studio (Gemini 2.5 Flash):**  
  👉 Get your free key at: **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**

### Step 2: Configure Keys in the App
You can configure your keys in either of two ways:
1. **In-App Settings Drawer (Recommended):**  
   Click the **⚡ AI Engine Settings** icon in the top header $\rightarrow$ paste your Groq or Gemini key $\rightarrow$ click **"कनेक्शन जांचें (Ping Test)"** $\rightarrow$ click **Save**.
2. **Environment File (`.env.local`):**  
   Create a `.env.local` file in the project root:
   ```env
   VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
   VITE_GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
   ```

*Note:* If network connectivity drops or rate limits are reached, GallaVoice automatically degrades gracefully to the local zero-key parser so the shopkeeper's counter never freezes.

---

## 📊 Live Local Khata Features

- **Tab 1: All Transactions Table:** Full searchable ledger, filterable by Udhaar vs Jama, with timestamps, items breakdown, noise logs, audio playback button, and CSV export.
- **Tab 2: Customer Summary Khata:** Customer debit/credit tracking, live running net balance, and a one-click WhatsApp payment reminder simulation.
- **Tab 3: Store Rate Card:** In-place editable Kirana pricing catalog with Devanagari aliases and unit metrics.
- **Browser Persistence:** Transactions and customer ledgers are saved in browser `localStorage` and can be exported as `.csv` or full `.json` backups.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite 6
- **Styling:** Tailwind CSS (Custom Kirana Theme: Saffron, Jama-Emerald, Udhaar-Red, Bahi-Khata Cream)
- **Icons:** Lucide React
- **Audio & Speech:** Web Speech API (`webkitSpeechRecognition` `hi-IN` + native `SpeechSynthesis`)
- **Celebration FX:** Canvas-Confetti
- **Cloud AI (Phase 2):** Groq SDK / REST (`llama-3.3-70b-versatile`, `whisper-large-v3-turbo`) & Google Gemini API (`gemini-2.5-flash`)

---

*Made with ❤️ for Indian Kirana Shopkeepers by GallaVoice Team.*
