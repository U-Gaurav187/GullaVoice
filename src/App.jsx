import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Mic, 
  Receipt, 
  Users, 
  ShoppingBag, 
  Volume2, 
  Sparkles, 
  Check, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';

import Header from './components/Header.jsx';
import GallaVoiceController from './components/GallaVoiceController.jsx';
import StagingCard from './components/StagingCard.jsx';
import TransactionsTable from './components/TransactionsTable.jsx';
import CustomerKhataTable from './components/CustomerKhataTable.jsx';
import RateCardModal from './components/RateCardModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import LanguageSelectModal from './components/LanguageSelectModal.jsx';
import PurchaseDetailModal from './components/PurchaseDetailModal.jsx';
import VoiceAssistantAnswerCard from './components/VoiceAssistantAnswerCard.jsx';

import { storage } from './utils/storage.js';
import { speechTTS } from './utils/speechTTS.js';
import { matchCustomerPhonetically } from './utils/phoneticMatcher.js';
import { transcribeWithGroqWhisper, parseWithGroqLlama } from './services/groqService.js';
import { transcribeWithWisprFlow } from './services/wisprFlowService.js';
import { parseWithGeminiFlash } from './services/geminiService.js';
import { parseKiranaVoiceLocally, extractRateCardUpdatesFromText } from './services/localParser.js';

export default function App() {
  // Persistent database states
  const [transactions, setTransactions] = useState(() => storage.getTransactions());
  const [customers, setCustomers] = useState(() => storage.getCustomers());
  const [rateCard, setRateCard] = useState(() => storage.getRateCard());
  const [settings, setSettings] = useState(() => storage.getSettings());

  // Active voice & draft states
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [filteredNoise, setFilteredNoise] = useState('');
  const [stagedDraft, setStagedDraft] = useState(null);
  const [voiceQueryResult, setVoiceQueryResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [newestTxnId, setNewestTxnId] = useState(null);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState('VOICE'); // 'VOICE' | 'TRANSACTIONS' | 'CUSTOMERS'
  const [isRateCardOpen, setIsRateCardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // First-time startup modal check
  useEffect(() => {
    const hasChosenLang = localStorage.getItem('gallavoice_welcome_seen_v1');
    if (!hasChosenLang) {
      setIsLanguageModalOpen(true);
    }
  }, []);

  // Sync TTS speech state
  useEffect(() => {
    speechTTS.onStateChange = (speaking) => {
      setIsTtsSpeaking(speaking);
    };
  }, []);

  // Persistence triggers
  useEffect(() => { storage.saveTransactions(transactions); }, [transactions]);
  useEffect(() => { storage.saveCustomers(customers); }, [customers]);
  useEffect(() => { storage.saveRateCard(rateCard); }, [rateCard]);
  useEffect(() => { storage.saveSettings(settings); }, [settings]);

  const currentLanguage = settings.speechLanguage === 'en' ? 'en' : 'hi';
  const effectiveWisprKey = settings.wisprFlowApiKey || import.meta.env.VITE_WISPR_FLOW_API_KEY || '';
  const effectiveGroqKey = settings.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '';
  const effectiveGeminiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  // Aggregate stats
  const totalUdhaar = customers.reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
  const totalJama = customers.reduce((sum, c) => sum + (c.totalJama || 0), 0);

  /**
   * 1. Voice-to-Text via Wispr Flow API (Official Hackathon STT) or Groq Whisper AI,
   * followed by multi-model resilient extraction (Llama 3.3 70B / Llama 3.1 8B Instant)
   */
  const handleAudioRecorded = async (audioBlob) => {
    setIsProcessing(true);
    speechTTS.stop();

    try {
      console.log('🎙️ Captured audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);

      let transcript = '';

      // Priority 1: Wispr Flow Voice Interface API (with custom dictionary context)
      if (effectiveWisprKey) {
        try {
          console.log('⚡ Transcribing via Wispr Flow API...');
          const dictionary = [
            ...customers.map(c => c.name),
            ...customers.map(c => c.hindiName),
            ...customers.flatMap(c => c.aliases || []),
            ...rateCard.map(r => r.name),
            ...rateCard.map(r => r.hindiName),
            'Avinash', 'अविनाश', 'sev', 'सेव', 'seb', 'सेब', 'likh do', 'लिख दो', 'udhaar', 'उधार'
          ];
          transcript = await transcribeWithWisprFlow({
            apiKey: effectiveWisprKey,
            audioBlob,
            language: currentLanguage,
            customDictionary: dictionary
          });
          console.log('📝 Wispr Flow Transcription:', transcript);
        } catch (wisprErr) {
          console.warn('Wispr Flow STT failed, falling back to Groq Whisper:', wisprErr.message);
        }
      }

      // Priority 2 / Fallback: Groq Whisper Large v3 Turbo (or secure serverless proxy)
      if (!transcript) {
        try {
          transcript = await transcribeWithGroqWhisper(
            effectiveGroqKey, 
            audioBlob, 
            currentLanguage
          );
          console.log('📝 Groq Whisper Transcription:', transcript);
        } catch (groqErr) {
          console.warn('Groq Whisper failed:', groqErr.message);
          // If both failed and no key exists, open settings
          if (!effectiveGroqKey && !effectiveWisprKey) {
            setIsLanguageModalOpen(true);
            return;
          }
          throw groqErr;
        }
      }

      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No intelligible speech detected. Please speak closer to the microphone.');
      }

      setCurrentTranscript(transcript);

      // Step 2: AI Parsing via Groq AI (with multi-model 70B -> 8B failover)
      await executeAIParser(transcript);
    } catch (err) {
      console.error('Audio processing error:', err);
      const isMediaErr = (err.message || '').includes('could not process file') || (err.message || '').includes('decode');
      const userMsg = isMediaErr
        ? (currentLanguage === 'hi' 
            ? 'माइक से आवाज़ ठीक से रिकॉर्ड नहीं हो पाई। कृपया दोबारा माइक दबाकर साफ आवाज़ में बोलें।' 
            : 'Audio recording was interrupted. Please tap the mic and try speaking again.')
        : (err.message || 'Error processing audio via AI');
      
      if (settings.autoReadback) {
        speechTTS.speak(userMsg, currentLanguage);
      } else {
        alert(userMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Direct text processing (from preset or manual input)
   */
  const handleProcessTranscript = async (input) => {
    const text = typeof input === 'string' ? input : input?.spokenText || '';
    if (!text || !text.trim()) return;
    setIsProcessing(true);
    speechTTS.stop();
    setVoiceQueryResult(null);
    setCurrentTranscript(text);

    try {
      await executeAIParser(text);
    } catch (err) {
      console.error('Transcript parse error:', err);
      alert(err.message || 'Error parsing transcript');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Executes AI LLM parser (Gemini 3.5 Flash or Groq with local fallback)
   */
  const executeAIParser = async (transcriptText) => {
    let parsedResult = null;

    // 1. High-Speed Groq Engine (Llama / GPT-OSS 120B or secure serverless proxy)
    try {
      console.log('⚡ Processing via Groq Turbo AI Engine (or secure proxy)...');
      parsedResult = await parseWithGroqLlama({
        apiKey: effectiveGroqKey,
        transcript: transcriptText,
        customers,
        rateCard,
        language: currentLanguage
      });
    } catch (err) {
      console.warn('Groq parsing failed, trying Gemini Flash:', err.message);
    }

    // 2. Google Gemini 3.5 Flash if Groq was unavailable or failed
    if (!parsedResult && effectiveGeminiKey) {
      try {
        console.log('⚡ Processing via Google Gemini 3.5 Flash...');
        parsedResult = await parseWithGeminiFlash({
          apiKey: effectiveGeminiKey,
          transcript: transcriptText,
          customers,
          rateCard,
          language: currentLanguage
        });
      } catch (err) {
        console.warn('Gemini parsing error:', err.message);
      }
    }

    // 3. Fallback to Local Deterministic Engine
    if (!parsedResult) {
      console.log('⚡ Falling back to zero-key local deterministic parser...');
      parsedResult = parseKiranaVoiceLocally(transcriptText, customers, rateCard, transactions);
    }

    // Verify / strengthen customer match using phonetic matching
    const spokenCust = parsedResult.customer_spoken || parsedResult.matched_customer_name || '';
    if (spokenCust) {
      const phoneticMatch = matchCustomerPhonetically(spokenCust, customers, 0.65);
      if (phoneticMatch.isMatch && phoneticMatch.customer) {
        parsedResult.matched_customer_id = phoneticMatch.customer.id;
        parsedResult.matched_customer_name = phoneticMatch.customer.name;
        parsedResult.match_confidence = Math.max(parsedResult.match_confidence || 0, phoneticMatch.confidence);
      }
    }

    // Enrich items with Store Rate Card pricing if price was 0 or uncalculated
    if (parsedResult.items && parsedResult.items.length > 0) {
      let computedSum = 0;
      parsedResult.items = parsedResult.items.map(item => {
        const itemLower = (item.name || '').toLowerCase().trim();
        const rcMatch = rateCard.find(rc => 
          rc.name.toLowerCase() === itemLower ||
          rc.hindiName === item.name ||
          (rc.aliases && rc.aliases.some(a => itemLower.includes(a.toLowerCase()) || a.toLowerCase().includes(itemLower)))
        );

        let qtyNum = parseFloat(item.quantity);
        if (isNaN(qtyNum)) {
          const qStr = (item.quantity || '').toLowerCase();
          if (/चार|char|chaar|four/i.test(qStr)) qtyNum = 4;
          else if (/तीन|tin|teen|three/i.test(qStr)) qtyNum = 3;
          else if (/दो|do|two|jo|पिलो/i.test(qStr)) qtyNum = 2;
          else if (/एक|ek|one/i.test(qStr)) qtyNum = 1;
          else if (/पाँच|पांच|panch|five/i.test(qStr)) qtyNum = 5;
          else if (/छह|chhe|six/i.test(qStr)) qtyNum = 6;
          else if (/साढ़े पाव/i.test(qStr)) qtyNum = 0.375;
          else if (/सवा/i.test(qStr)) qtyNum = 1.25;
          else if (/डेढ़|dedh/i.test(qStr)) qtyNum = 1.5;
          else if (/ढाई|dhai/i.test(qStr)) qtyNum = 2.5;
          else if (/आधा|aadha|half/i.test(qStr)) qtyNum = 0.5;
          else if (/पाव|pav|pao/i.test(qStr)) qtyNum = 0.25;
          else qtyNum = 1;
        }

        let price = Number(item.calculated_price_inr) || 0;
        let unitPrice = item.unitPrice || 0;

        if (price === 0 && rcMatch) {
          unitPrice = rcMatch.unitPrice;
          price = Math.round(unitPrice * qtyNum);
        } else if (price === 0) {
          // Dynamic Kirana category fallback (ensure NO item ever has ₹0)
          if (/वैसलीन|vaseline|क्रीम|cream/i.test(itemLower)) unitPrice = 45;
          else if (/साबुन|soap/i.test(itemLower)) unitPrice = 35;
          else if (/शैम्पू|shampoo/i.test(itemLower)) unitPrice = 2;
          else if (/तेल|oil/i.test(itemLower)) unitPrice = 140;
          else if (/बिस्कुट|biscuit/i.test(itemLower)) unitPrice = 20;
          else if (/नमकीन|चिप्स|chips/i.test(itemLower)) unitPrice = 40;
          else if (/दाल|dal/i.test(itemLower)) unitPrice = 120;
          else if (/कांदा|प्याज|टमाटर|आलू|potato|onion/i.test(itemLower)) unitPrice = 40;
          else unitPrice = 40; // general market baseline
          
          price = Math.round(unitPrice * qtyNum);
          item.accent_correction_note = `अनुमानित दर: ₹${unitPrice}`;
        } else if (unitPrice === 0 && qtyNum > 0) {
          unitPrice = Math.round(price / qtyNum);
        }

        computedSum += price;
        return {
          ...item,
          unitPrice: unitPrice || (rcMatch ? rcMatch.unitPrice : 0),
          calculated_price_inr: price
        };
      });

      if (!parsedResult.total_amount_inr || Number(parsedResult.total_amount_inr) === 0) {
        parsedResult.total_amount_inr = computedSum;
      }

      // Update Hindi readback if it originally had zero
      if (parsedResult.total_amount_inr > 0 && parsedResult.tts_hindi_readback && parsedResult.tts_hindi_readback.includes('शून्य')) {
        const itemSummaries = parsedResult.items.map(i => `${i.quantity} ${i.name}`).join(' और ');
        parsedResult.tts_hindi_readback = `${parsedResult.matched_customer_name || 'ग्राहक'} के खाते में ${itemSummaries}, कुल ₹${parsedResult.total_amount_inr} उधार। क्या इसे सेव करें?`;
      }
    }

    // Step: Check for Rate Card Voice Updates
    const isRateCardUpdate = parsedResult.intent === 'UPDATE_RATE_CARD' || 
      (parsedResult.rate_card_updates && parsedResult.rate_card_updates.length > 0) ||
      (/(rate\s*card|रेट\s*कार्ड)/i.test(transcriptText) && /(daam|bhav|rate|price|दाम|भाव|रेट|कीमत|kilo|kg|pao|pav|kar\s*do|badal\s*do|update)/i.test(transcriptText));

    if (isRateCardUpdate) {
      setStagedDraft(null);

      let updates = parsedResult.rate_card_updates;
      if (!updates || updates.length === 0) {
        updates = extractRateCardUpdatesFromText(transcriptText, rateCard);
      }

      if (updates && updates.length > 0) {
        let updatedRateCard = [...rateCard];
        const appliedUpdates = [];

        for (const u of updates) {
          const uPrice = parseFloat(u.new_price || u.newPrice || u.price);
          if (isNaN(uPrice) || uPrice <= 0) continue;

          const uName = (u.name || '').trim();
          const uHindi = (u.hindiName || uName).trim();
          const uUnit = (u.unit || 'kg').toLowerCase();

          const lower = uName.toLowerCase();
          const idx = updatedRateCard.findIndex(rc => 
            rc.name.toLowerCase() === lower ||
            (rc.hindiName && rc.hindiName === uHindi) ||
            (rc.aliases && rc.aliases.some(a => a.toLowerCase() === lower || lower.includes(a.toLowerCase())))
          );

          if (idx >= 0) {
            const oldItem = updatedRateCard[idx];
            updatedRateCard[idx] = {
              ...oldItem,
              unitPrice: uPrice,
              unit: uUnit
            };
            appliedUpdates.push({
              name: oldItem.name,
              hindiName: oldItem.hindiName || uHindi,
              oldPrice: oldItem.unitPrice,
              newPrice: uPrice,
              unit: uUnit,
              isNew: false
            });
          } else {
            // Auto-bilingual mapping for common Kirana produce
            let hindiEquiv = uHindi;
            if (/mooli|muli/i.test(uName)) hindiEquiv = 'मूली';
            else if (/aaloo|aloo/i.test(uName)) hindiEquiv = 'आलू';
            else if (/pyaaz|pyaz|kanda/i.test(uName)) hindiEquiv = 'प्याज';
            else if (/tamatar/i.test(uName)) hindiEquiv = 'टमाटर';
            else if (/mirch|mirchi/i.test(uName)) hindiEquiv = 'मिर्च';
            else if (/adrak/i.test(uName)) hindiEquiv = 'अदरक';
            else if (/nimbu/i.test(uName)) hindiEquiv = 'नींबू';

            const newItem = {
              id: `ITEM_${Date.now()}_${appliedUpdates.length}`,
              name: uName.charAt(0).toUpperCase() + uName.slice(1),
              displayName: `${uName.charAt(0).toUpperCase() + uName.slice(1)} (${hindiEquiv})`,
              hindiName: hindiEquiv,
              aliases: Array.from(new Set([uName.toLowerCase(), uHindi.toLowerCase(), hindiEquiv.toLowerCase()])),
              unit: uUnit,
              unitPrice: uPrice,
              category: 'Vegetables'
            };
            updatedRateCard.push(newItem);
            appliedUpdates.push({
              name: newItem.name,
              hindiName: newItem.hindiName,
              oldPrice: null,
              newPrice: uPrice,
              unit: uUnit,
              isNew: true
            });
          }
        }

        setRateCard(updatedRateCard);
        storage.saveRateCard(updatedRateCard);

        const summaryHindi = appliedUpdates.map(u => `${u.hindiName || u.name} ₹${u.newPrice}/${u.unit === 'pao' ? 'पाव' : u.unit === 'pkt' ? 'पैकेट' : 'किलो'}`).join(', ');
        const summaryEng = appliedUpdates.map(u => `${u.name} ₹${u.newPrice}/${u.unit}`).join(', ');

        const hindiReadback = `रेट कार्ड अपडेट हो गया है: ${summaryHindi} दर्ज कर दिया गया है।`;
        const engReadback = `Rate card updated: ${summaryEng} saved.`;

        const answerPayload = {
          intent: 'UPDATE_RATE_CARD',
          query_type: 'RATE_CARD_UPDATED',
          rate_card_updates: appliedUpdates,
          rawTranscript: transcriptText,
          total_amount_inr: appliedUpdates.length,
          tts_hindi_readback: hindiReadback,
          tts_readback: engReadback,
          query_answer: {
            title: 'रेट कार्ड अपडेट (Rate Card Updated)',
            customerName: 'रेट कार्ड (Rate Card)',
            mainMetric: `${appliedUpdates.length} सामान अपडेट`,
            metricLabel: 'दाम बदले गए',
            details: summaryHindi
          }
        };

        setVoiceQueryResult(answerPayload);
        setFilteredNoise(parsedResult.ignored_side_chatter || '');

        const readbackSentence = currentLanguage === 'hi' ? hindiReadback : engReadback;
        setTimeout(() => {
          speechTTS.speak(readbackSentence, currentLanguage);
        }, 150);

        return;
      }
    }

    // Step: Check if intent is a 2-Way Conversational Ledger Query
    const isQueryIntent = [
      'CHECK_BALANCE',
      'CHECK_TODAY_SUMMARY',
      'CHECK_HIGHEST_UDHAAR',
      'CHECK_TOTAL_STORE_BALANCE'
    ].includes(parsedResult.intent) || (
      (!parsedResult.items || parsedResult.items.length === 0) &&
      (/\b(kitna|kitni|kitne|batao|dikhao|kiske|kiska|kisko|check|hisab|hisaab|balance|sale|bikri|dhandha)\b|कितना|कितनी|कितने|बताओ|दिखाओ|किसका|किसके|किसको|चेक|हिसाब|बैलेंस|सेल|बिक्री|धंधा/i.test(transcriptText))
    );

    if (isQueryIntent) {
      setStagedDraft(null);

      // Detect specific query type if LLM returned generic query or was mistaken
      let qIntent = parsedResult.intent;
      const normText = transcriptText.toLowerCase();

      if (/(sabse\s+zyada|sabse\s+bada|top|highest)/i.test(normText) || /(सबसे\s+ज्यादा|सबसे\s+बड़ा|टॉप)/i.test(normText)) {
        qIntent = 'CHECK_HIGHEST_UDHAAR';
      } else if (/(aaj|today|आज)/i.test(normText) && /(sale|bikri|dhandha|hisab|उधार|जमा|सेल|बिक्री)/i.test(normText) && !/(khate|khata|के खाते|का खाता)/i.test(normText)) {
        qIntent = 'CHECK_TODAY_SUMMARY';
      } else if (/(dukan|store|total|kul|दुकान|स्टोर|कुल)/i.test(normText) && /(kitna|udhaar|balance|उधार|बाकी)/i.test(normText) && !/(khate|khata|के खाते|का खाता)/i.test(normText)) {
        qIntent = 'CHECK_TOTAL_STORE_BALANCE';
      } else {
        qIntent = 'CHECK_BALANCE';
      }

      parsedResult.intent = qIntent;

      if (qIntent === 'CHECK_BALANCE') {
        // Extract customer name candidates
        let candidateName = parsedResult.matched_customer_name || parsedResult.customer_spoken || '';
        if (!candidateName) {
          let cleanedQ = transcriptText.trim().replace(/[।.,!?]+$/g, '');
          cleanedQ = cleanedQ.replace(/^(?:कि|जरा|अरे|सुनो|हां\s+सुनो|भैया|चेक\s+करो|बताओ|देखना|ki|zara|arre?|are|suno|ha\s+suno|bhaiya|check\s+karo|batao|dekhna)\s+/iu, '');
          const m1 = cleanedQ.match(/^(.+?)\s+(?:(?:ke|ka|ki|ko|के|का|की|को)\s+)?(?:khate\s+me(?:in)?|khata\s+me(?:in)?|khate|khata|khatam|खाते\s+में|खाता\s+में|खाते|खाता|खातं)\s+/iu);
          if (m1) candidateName = m1[1].trim();
          else {
            const m2 = cleanedQ.match(/^(.+?)\s+(?:ke|ka|ki|ko|के|का|की|को)\s+/iu);
            if (m2) candidateName = m2[1].trim();
          }
        }

        // 1. Authoritative lookup from persistent customer database using phonetic matcher
        const pMatch = matchCustomerPhonetically(candidateName || transcriptText, customers, 0.50);

        // 2. Check if there was an unsaved staged draft for this customer
        let draftMatch = null;
        if (!pMatch.isMatch && stagedDraft && (stagedDraft.matched_customer_name || stagedDraft.customer_spoken)) {
          const draftCustomerName = stagedDraft.matched_customer_name || stagedDraft.customer_spoken;
          const dm = matchCustomerPhonetically(candidateName || transcriptText, [{
            id: 'DRAFT',
            name: draftCustomerName,
            hindiName: draftCustomerName,
            totalUdhaar: stagedDraft.transaction_type === 'UDHAAR' ? stagedDraft.total_amount_inr : 0,
            totalJama: stagedDraft.transaction_type === 'JAMA' ? stagedDraft.total_amount_inr : 0
          }], 0.50);
          if (dm.isMatch) draftMatch = dm;
        }

        if (pMatch.isMatch && pMatch.customer) {
          const targetCust = pMatch.customer;
          const udhaar = targetCust.totalUdhaar || 0;
          const jama = targetCust.totalJama || 0;
          const net = Math.max(0, udhaar - jama);
          const cName = targetCust.hindiName || targetCust.name;

          const isJamaQuery = /(paisa\s+jama|paise\s+jama|kitna\s+jama|jama\s+kitna|पैसा\s+जमा|पैसे\s+जमा|कितना\s+जमा|जमा\s+कितना|जमा\s+है|जमा\s+किए|जमा\s+किया|जमा\s+हुआ)/i.test(normText);

          parsedResult.customer_data = targetCust;
          parsedResult.matched_customer_name = targetCust.name;
          parsedResult.matched_customer_id = targetCust.id;

          let hindiText = '';
          let engText = '';

          if (isJamaQuery) {
            // Specific inquiry for JAMA (Deposited money)
            parsedResult.total_amount_inr = jama;
            if (jama > 0) {
              hindiText = `${cName} के खाते में अभी तक कुल ₹${jama.toLocaleString('en-IN')} जमा हैं${net > 0 ? ` (और ₹${net.toLocaleString('en-IN')} उधार बाकी है)` : ''}।`;
              engText = `${targetCust.name} has total ₹${jama.toLocaleString('en-IN')} deposited${net > 0 ? ` (and ₹${net.toLocaleString('en-IN')} net udhaar remaining)` : ''}.`;
            } else {
              hindiText = `${cName} के खाते में अभी तक कोई पैसा जमा नहीं है${udhaar > 0 ? ` (कुल ₹${udhaar.toLocaleString('en-IN')} उधार बाकी है)` : ''}।`;
              engText = `${targetCust.name} has zero deposits so far${udhaar > 0 ? ` (total ₹${udhaar.toLocaleString('en-IN')} udhaar)` : ''}.`;
            }

            parsedResult.query_answer = {
              title: `${cName} का जमा विवरण (Deposits)`,
              customerName: targetCust.name,
              hindiName: targetCust.hindiName,
              mainMetric: `₹${jama.toLocaleString('en-IN')}`,
              metricLabel: 'कुल जमा राशि (Total Jama)',
              details: `कुल खरीद: ₹${udhaar.toLocaleString('en-IN')} | शुद्ध बकाया: ₹${net.toLocaleString('en-IN')}`
            };
          } else {
            // Specifically UDHAAR: Subtracted from jama (Net remaining balance)
            parsedResult.total_amount_inr = net;
            if (net > 0 && jama > 0) {
              hindiText = `${cName} के खाते में ₹${jama.toLocaleString('en-IN')} जमा काटकर, अब कुल ₹${net.toLocaleString('en-IN')} उधार बाकी है।`;
              engText = `${targetCust.name} has ₹${net.toLocaleString('en-IN')} net udhaar remaining (after deducting ₹${jama.toLocaleString('en-IN')} jama).`;
            } else if (net > 0) {
              hindiText = `${cName} के खाते में कुल ₹${net.toLocaleString('en-IN')} उधार बाकी है।`;
              engText = `${targetCust.name} has total ₹${net.toLocaleString('en-IN')} pending udhaar.`;
            } else {
              hindiText = `${cName} का कोई उधार बाकी नहीं है, खाता पूरा चुकता है${jama > 0 ? ` (₹${jama.toLocaleString('en-IN')} जमा दर्ज है)` : ''}।`;
              engText = `${targetCust.name} has zero pending udhaar, account is fully settled${jama > 0 ? ` (₹${jama.toLocaleString('en-IN')} jama recorded)` : ''}.`;
            }

            parsedResult.query_answer = {
              title: `${cName} का उधार खाता (Udhaar Balance)`,
              customerName: targetCust.name,
              hindiName: targetCust.hindiName,
              mainMetric: `₹${net.toLocaleString('en-IN')}`,
              metricLabel: 'कुल उधार बाकी (Net Balance)',
              details: `कुल खरीद: ₹${udhaar.toLocaleString('en-IN')} | कुल जमा: ₹${jama.toLocaleString('en-IN')}`
            };
          }

          parsedResult.tts_hindi_readback = hindiText;
          parsedResult.tts_readback = engText;
        } else if (draftMatch && draftMatch.isMatch) {
          const draftAmt = Number(stagedDraft.total_amount_inr) || 0;
          parsedResult.total_amount_inr = draftAmt;
          parsedResult.matched_customer_name = draftMatch.matchedName;
          parsedResult.customer_data = null;
          parsedResult.tts_hindi_readback = `${draftMatch.matchedName} के खाते में ₹${draftAmt.toLocaleString('en-IN')} का उधार अभी ड्राफ्ट में है, जिसे आपने अभी तक सेव नहीं किया है। कृपया पहले नीचे 'पुष्टि करें' बटन दबाएं।`;
          parsedResult.tts_readback = `${draftMatch.matchedName} has ₹${draftAmt.toLocaleString('en-IN')} in an unconfirmed draft. Please tap Confirm & Save on screen first.`;
          parsedResult.query_answer = {
            title: 'ड्राफ्ट प्रविष्टि (Unsaved Draft)',
            customerName: draftMatch.matchedName,
            mainMetric: `₹${draftAmt.toLocaleString('en-IN')}`,
            metricLabel: 'ड्राफ्ट उधार (अपुष्ट)',
            details: 'यह प्रविष्टि अभी तक सेव नहीं हुई है। नीचे पुष्टि करें दबाएं।'
          };
        } else {
          // Unrecognized customer
          const dispName = candidateName || 'ग्राहक';
          parsedResult.total_amount_inr = 0;
          parsedResult.customer_data = null;
          parsedResult.tts_hindi_readback = `ग्राहक '${dispName}' का कोई खाता नहीं मिला। क्या नया खाता खोलना चाहते हैं?`;
          parsedResult.tts_readback = `No customer record found for '${dispName}'.`;
          parsedResult.query_answer = {
            title: 'ग्राहक नहीं मिला (No Record)',
            customerName: dispName,
            mainMetric: 'रिकॉर्ड नहीं मिला',
            metricLabel: 'खाता स्थिति',
            details: 'कृपया ग्राहक का नाम सही से बोलें या नया खाता जोड़ें'
          };
        }
      } else if (qIntent === 'CHECK_TODAY_SUMMARY') {
        const todayStr = new Date().toDateString();
        const todayTxns = (transactions || []).filter(t => {
          const d = t.timestamp ? new Date(t.timestamp) : (t.date ? new Date(t.date) : null);
          return d && d.toDateString() === todayStr;
        });
        const todayUdhaar = todayTxns.filter(t => t.type === 'UDHAAR' || t.transactionType === 'UDHAAR').reduce((sum, t) => sum + (t.amount || t.totalAmount || 0), 0);
        const todayJama = todayTxns.filter(t => t.type === 'JAMA' || t.transactionType === 'JAMA').reduce((sum, t) => sum + (t.amount || t.totalAmount || 0), 0);
        const todayCount = todayTxns.length;

        parsedResult.total_amount_inr = todayUdhaar + todayJama;
        parsedResult.tts_hindi_readback = `आज दुकान में कुल ${todayCount} लेनदेन हुए: ₹${todayUdhaar.toLocaleString('en-IN')} उधार और ₹${todayJama.toLocaleString('en-IN')} रुपये जमा दर्ज किए गए।`;
        parsedResult.tts_readback = `Today: ${todayCount} transactions. ₹${todayUdhaar.toLocaleString('en-IN')} udhaar and ₹${todayJama.toLocaleString('en-IN')} payment received.`;
        parsedResult.query_answer = {
          title: "आज का खाता व हिसाब (Today's Summary)",
          mainMetric: `₹${(todayUdhaar + todayJama).toLocaleString('en-IN')}`,
          metricLabel: `कुल लेनदेन: ${todayCount}`,
          details: `उधार: ₹${todayUdhaar.toLocaleString('en-IN')} | जमा: ₹${todayJama.toLocaleString('en-IN')}`
        };
      } else if (qIntent === 'CHECK_HIGHEST_UDHAAR') {
        const sorted = [...customers].sort((a, b) => (b.totalUdhaar || 0) - (a.totalUdhaar || 0));
        const topCust = sorted[0];
        const topAmount = topCust ? (topCust.totalUdhaar || 0) : 0;
        if (topCust && topAmount > 0) {
          parsedResult.customer_data = topCust;
          parsedResult.matched_customer_name = topCust.name;
          parsedResult.total_amount_inr = topAmount;
          parsedResult.tts_hindi_readback = `दुकान में सबसे ज्यादा उधार ${topCust.hindiName || topCust.name} के पास है, कुल ₹${topAmount.toLocaleString('en-IN')} बाकी है।`;
          parsedResult.tts_readback = `The highest udhaar in the store is with ${topCust.name}, total ₹${topAmount.toLocaleString('en-IN')}.`;
          parsedResult.query_answer = {
            title: 'सबसे ज्यादा उधार (Top Debtor)',
            customerName: topCust.name,
            mainMetric: `₹${topAmount.toLocaleString('en-IN')}`,
            metricLabel: 'कुल उधार बाकी',
            details: `जमा: ₹${(topCust.totalJama || 0).toLocaleString('en-IN')}`
          };
        } else {
          parsedResult.total_amount_inr = 0;
          parsedResult.tts_hindi_readback = 'दुकान में किसी भी ग्राहक का उधार बाकी नहीं है, सभी खाते चुकता हैं।';
          parsedResult.tts_readback = 'No outstanding udhaar with any customer in the store.';
          parsedResult.query_answer = {
            title: 'सबसे ज्यादा उधार (Top Debtor)',
            customerName: 'कोई नहीं',
            mainMetric: '₹0',
            metricLabel: 'खाता स्थिति',
            details: 'सभी खाते चुकता हैं'
          };
        }
      } else if (qIntent === 'CHECK_TOTAL_STORE_BALANCE') {
        const totalUdhaar = (customers || []).reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
        const totalJama = (customers || []).reduce((sum, c) => sum + (c.totalJama || 0), 0);
        parsedResult.total_amount_inr = totalUdhaar;
        parsedResult.tts_hindi_readback = `दुकान में वर्तमान में कुल ₹${totalUdhaar.toLocaleString('en-IN')} उधार बाकी है और ₹${totalJama.toLocaleString('en-IN')} जमा है।`;
        parsedResult.tts_readback = `Total store outstanding udhaar is ₹${totalUdhaar.toLocaleString('en-IN')}, and total jama is ₹${totalJama.toLocaleString('en-IN')}.`;
        parsedResult.query_answer = {
          title: 'दुकान की कुल स्थिति (Store Outstanding)',
          mainMetric: `₹${totalUdhaar.toLocaleString('en-IN')}`,
          metricLabel: 'कुल उधार बाकी',
          details: `कुल जमा: ₹${totalJama.toLocaleString('en-IN')}`
        };
      }

      setVoiceQueryResult({
        ...parsedResult,
        rawTranscript: transcriptText
      });
      setFilteredNoise(parsedResult.ignored_side_chatter || '');

      const readbackSentence = currentLanguage === 'hi'
        ? (parsedResult.tts_hindi_readback || parsedResult.tts_readback)
        : (parsedResult.tts_readback || parsedResult.tts_hindi_readback);

      if (readbackSentence) {
        setTimeout(() => {
          speechTTS.speak(readbackSentence, currentLanguage);
        }, 150);
      }
      return;
    }

    setVoiceQueryResult(null);

    const isNoiseOnly = parsedResult.intent === 'NOISE_ONLY' || 
      ((!parsedResult.items || parsedResult.items.length === 0) && Number(parsedResult.total_amount_inr) === 0);

    setFilteredNoise(parsedResult.ignored_side_chatter || '');

    if (isNoiseOnly) {
      setStagedDraft(null);
      const advice = currentLanguage === 'hi'
        ? 'कोई खाता लेनदेन नहीं मिला। कृपया ग्राहक और सामान का नाम बोलें (जैसे: "रमेश भाई को दो किलो चीनी उधार")।'
        : 'No ledger transaction detected. Please speak customer name and items (e.g. "Ramesh bhai 2kg sugar credit").';
      
      if (settings.autoReadback) {
        speechTTS.speak(advice, currentLanguage);
      }
    } else {
      setStagedDraft(parsedResult);

      // Read back aloud in chosen language (Hindi or English)
      const readbackSentence = currentLanguage === 'hi'
        ? (parsedResult.tts_hindi_readback || parsedResult.tts_readback)
        : (parsedResult.tts_readback || parsedResult.tts_hindi_readback);

      if (settings.autoReadback && readbackSentence) {
        setTimeout(() => {
          speechTTS.speak(readbackSentence, currentLanguage);
        }, 250);
      }
    }
  };

  /**
   * Replay audio in chosen language
   */
  const handleReplayAudio = () => {
    if (!stagedDraft) return;
    const textToSpeak = currentLanguage === 'hi'
      ? (stagedDraft.tts_hindi_readback || stagedDraft.tts_readback)
      : (stagedDraft.tts_readback || stagedDraft.tts_hindi_readback);

    if (textToSpeak) {
      speechTTS.speak(textToSpeak, currentLanguage);
    }
  };

  /**
   * ❌ RETRY Action: Discards draft, stops speech
   */
  const handleRetry = () => {
    speechTTS.stop();
    setStagedDraft(null);
    setVoiceQueryResult(null);
    setCurrentTranscript('');
    setFilteredNoise('');
  };

  /**
   * ✅ CONTINUE Action: Commits to persistent local ledger
   */
  const handleContinue = () => {
    if (!stagedDraft) return;

    speechTTS.stop();

    const txnId = `TXN_${Date.now()}`;
    const nowIso = new Date().toISOString();

    let targetCustomerId = stagedDraft.matched_customer_id;
    let customerName = stagedDraft.matched_customer_name || stagedDraft.customer_spoken || 'Walk-in Customer';

    let updatedCustomers = [...customers];
    let customerIndex = -1;

    // 1. Direct ID lookup
    if (targetCustomerId) {
      customerIndex = updatedCustomers.findIndex(c => c.id === targetCustomerId);
    }

    // 2. Exact English or Hindi Name or Aliases lookup
    if (customerIndex === -1 && customerName) {
      const lowerTarget = customerName.toLowerCase().trim();
      customerIndex = updatedCustomers.findIndex(c => 
        c.name.toLowerCase() === lowerTarget ||
        (c.hindiName && c.hindiName.toLowerCase() === lowerTarget) ||
        (c.aliases && c.aliases.some(a => a.toLowerCase() === lowerTarget))
      );
    }

    // 3. Spoken Name lookup
    if (customerIndex === -1 && stagedDraft.customer_spoken) {
      const lowerSpoken = stagedDraft.customer_spoken.toLowerCase().trim();
      customerIndex = updatedCustomers.findIndex(c => 
        c.name.toLowerCase() === lowerSpoken ||
        (c.hindiName && c.hindiName.toLowerCase() === lowerSpoken) ||
        (c.aliases && c.aliases.some(a => a.toLowerCase() === lowerSpoken))
      );
    }

    // 4. Phonetic & Fuzzy lookup (prevents duplicate accounts on accent slips)
    if (customerIndex === -1) {
      const pMatch = matchCustomerPhonetically(customerName || stagedDraft.customer_spoken, updatedCustomers, 0.58);
      if (pMatch.isMatch && pMatch.customer) {
        customerIndex = updatedCustomers.findIndex(c => c.id === pMatch.customer.id);
      }
    }

    const amount = Number(stagedDraft.total_amount_inr) || 0;
    const isUdhaar = stagedDraft.transaction_type === 'UDHAAR';

    if (customerIndex >= 0) {
      // ✅ Existing customer found: ADD to their previous balance!
      const existing = updatedCustomers[customerIndex];
      const newUdhaar = isUdhaar ? (existing.totalUdhaar || 0) + amount : (existing.totalUdhaar || 0);
      const newJama = !isUdhaar ? (existing.totalJama || 0) + amount : (existing.totalJama || 0);
      const newNet = newUdhaar - newJama;

      // Consolidate aliases so future recognition gets even stronger
      const mergedAliases = Array.from(new Set([
        ...(existing.aliases || []),
        customerName,
        stagedDraft.customer_spoken
      ].filter(Boolean)));

      updatedCustomers[customerIndex] = {
        ...existing,
        totalUdhaar: newUdhaar,
        totalJama: newJama,
        netBalance: newNet,
        lastUpdated: nowIso,
        aliases: mergedAliases
      };
      targetCustomerId = existing.id;
      customerName = existing.name;
    } else {
      // Only create new customer if completely novel and unrecognized
      const newCustId = `CUST_${String(updatedCustomers.length + 1).padStart(2, '0')}`;
      const newCustomer = {
        id: newCustId,
        name: customerName,
        hindiName: customerName,
        aliases: [customerName, stagedDraft.customer_spoken].filter(Boolean),
        phone: '+91 98000 00000',
        totalUdhaar: isUdhaar ? amount : 0,
        totalJama: !isUdhaar ? amount : 0,
        netBalance: isUdhaar ? amount : -amount,
        lastUpdated: nowIso,
        notes: 'Created via GallaVoice'
      };
      updatedCustomers.push(newCustomer);
      targetCustomerId = newCustId;
    }

    const matchedCust = updatedCustomers.find(c => c.id === targetCustomerId);
    const customerHindi = matchedCust?.hindiName || stagedDraft.matched_customer_name || customerName;
    const customerUp = matchedCust?.upNativeName || 'मान्य ग्राहक';

    const newTransaction = {
      id: txnId,
      timestamp: nowIso,
      customerSpoken: stagedDraft.customer_spoken || customerName,
      matchedCustomerId: targetCustomerId,
      customerName: customerName,
      customerHindiName: customerHindi,
      customerUpName: customerUp,
      matchConfidence: stagedDraft.match_confidence || 1.0,
      transactionType: stagedDraft.transaction_type || 'UDHAAR',
      items: (stagedDraft.items || []).map(it => ({
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice || it.unit_price || 0,
        calculatedPrice: it.calculated_price_inr || it.calculatedPrice || 0,
        accentNote: it.accent_correction_note || null
      })),
      totalAmount: amount,
      ignoredNoise: stagedDraft.ignored_side_chatter || '',
      rawTranscript: currentTranscript,
      status: 'COMMITTED',
      ttsHindiText: stagedDraft.tts_readback || stagedDraft.tts_hindi_readback
    };

    setCustomers(updatedCustomers);
    setTransactions([newTransaction, ...transactions]);
    setNewestTxnId(txnId);

    // Confetti celebration
    try {
      confetti({ particleCount: 65, spread: 70, origin: { y: 0.75 } });
    } catch (e) {}

    // Short audio confirmation in chosen language
    setTimeout(() => {
      speechTTS.speak(
        currentLanguage === 'hi' ? 'खाता अपडेट हो गया।' : 'Ledger updated successfully.',
        currentLanguage
      );
    }, 150);

    setStagedDraft(null);
    setVoiceQueryResult(null);
    setCurrentTranscript('');
    setFilteredNoise('');
  };

  const handleDeleteTransaction = (txnId) => {
    if (window.confirm('Delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== txnId));
    }
  };

  const handleLanguageModalSave = ({ language }) => {
    localStorage.setItem('gallavoice_welcome_seen_v1', 'true');
    setSettings(prev => ({
      ...prev,
      speechLanguage: language
    }));
  };

  return (
    <div className="min-h-full bg-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRateCard={() => setIsRateCardOpen(true)}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        transactions={transactions}
        customers={customers}
        totalUdhaar={totalUdhaar}
        totalJama={totalJama}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {activeTab === 'VOICE' ? (
          /* THE FULL HERO MIC INTERFACE (DOMINATES SCREEN ON HOME) */
          <div className="max-w-xl w-full mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {voiceQueryResult ? (
              <VoiceAssistantAnswerCard
                queryResult={voiceQueryResult}
                onClose={() => setVoiceQueryResult(null)}
                onReplayAudio={() => {
                  const s = currentLanguage === 'hi'
                    ? (voiceQueryResult.tts_hindi_readback || voiceQueryResult.tts_readback)
                    : (voiceQueryResult.tts_readback || voiceQueryResult.tts_hindi_readback);
                  if (s) speechTTS.speak(s, currentLanguage);
                }}
                onViewCustomer={(cust) => {
                  setSelectedCustomer(cust);
                  setActiveTab('CUSTOMERS');
                  setVoiceQueryResult(null);
                }}
                onViewTransactions={() => {
                  setActiveTab('TRANSACTIONS');
                  setVoiceQueryResult(null);
                }}
                onViewRateCard={() => {
                  setIsRateCardOpen(true);
                  setVoiceQueryResult(null);
                }}
                language={currentLanguage}
              />
            ) : stagedDraft ? (
              <StagingCard
                stagedDraft={stagedDraft}
                onRetry={handleRetry}
                onContinue={handleContinue}
                isTtsSpeaking={isTtsSpeaking}
                onReplayAudio={handleReplayAudio}
                language={currentLanguage}
              />
            ) : (
              <>
                <GallaVoiceController
                  onAudioRecorded={handleAudioRecorded}
                  onManualTextSubmit={handleProcessTranscript}
                  isProcessing={isProcessing}
                  currentTranscript={currentTranscript}
                  filteredNoise={filteredNoise}
                  language={currentLanguage}
                  hasApiKey={Boolean(effectiveGroqKey)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </>
            )}
          </div>
        ) : activeTab === 'TRANSACTIONS' ? (
          /* TRANSACTIONS TABLE VIEW (ON-DEMAND WHEN USER CLICKS TOP BOX) */
          <div className="w-full flex flex-col space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('VOICE')}
                className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-orange-600 transition-colors cursor-pointer group"
              >
                <span className="text-base group-hover:-translate-x-0.5 transition-transform">←</span>
                <span>{currentLanguage === 'hi' ? 'वापस माइक काउंटर पर जाएं' : 'Back to Voice Counter'}</span>
              </button>
              <div className="text-xs font-semibold text-stone-500">
                {currentLanguage === 'hi' ? 'कुल प्रविष्टियां:' : 'Total Records:'} <span className="font-bold text-stone-800">{transactions.length}</span>
              </div>
            </div>
            <TransactionsTable
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onSelectTransaction={setSelectedTransaction}
              newestTxnId={newestTxnId}
              language={currentLanguage}
            />
          </div>
        ) : (
          /* CUSTOMERS KHATA TABLE VIEW (ON-DEMAND WHEN USER CLICKS TOP BOX) */
          <div className="w-full flex flex-col space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('VOICE')}
                className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-orange-600 transition-colors cursor-pointer group"
              >
                <span className="text-base group-hover:-translate-x-0.5 transition-transform">←</span>
                <span>{currentLanguage === 'hi' ? 'वापस माइक काउंटर पर जाएं' : 'Back to Voice Counter'}</span>
              </button>
              <div className="text-xs font-semibold text-stone-500">
                {currentLanguage === 'hi' ? 'कुल ग्राहक खाते:' : 'Total Customer Accounts:'} <span className="font-bold text-stone-800">{customers.length}</span>
              </div>
            </div>
            <CustomerKhataTable
              customers={customers}
              onSelectCustomer={setSelectedCustomer}
              language={currentLanguage}
            />
          </div>
        )}
      </main>

      {/* Purchase Details Modal (Shows exact purchases and exact time) */}
      <PurchaseDetailModal
        transaction={selectedTransaction}
        customer={selectedCustomer}
        transactions={transactions}
        onClose={() => {
          setSelectedTransaction(null);
          setSelectedCustomer(null);
        }}
        language={currentLanguage}
      />

      {/* Modals */}
      <LanguageSelectModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={currentLanguage}
        onSave={handleLanguageModalSave}
      />

      <RateCardModal
        isOpen={isRateCardOpen}
        onClose={() => setIsRateCardOpen(false)}
        rateCard={rateCard}
        onUpdateRateCard={setRateCard}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onResetAllData={() => {
          storage.resetAll();
          window.location.reload();
        }}
        transactions={transactions}
        customers={customers}
        rateCard={rateCard}
      />
    </div>
  );
}
