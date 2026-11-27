import React, { useState, useEffect, useRef } from 'react';
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
import KhataPdfModal from './components/KhataPdfModal.jsx';
import NameDiaryModal from './components/NameDiaryModal.jsx';

import { storage } from './utils/storage.js';
import { speechTTS } from './utils/speechTTS.js';
import { audioRecorder } from './utils/audioRecorder.js';
import { matchCustomerPhonetically } from './utils/phoneticMatcher.js';
import { formatWhisperDictionaryPrompt, compareAlphabetSimilarity } from './utils/alphabetDifferentiator.js';
import { transcribeWithGroqWhisper, parseWithGroqLlama } from './services/groqService.js';
import {
  parseKiranaVoiceLocally,
  extractRateCardUpdatesFromText,
  parseStagingVoiceFollowUp,
  parseMultiOrSettlementIntent
} from './services/localParser.js';

export default function App() {
  // Persistent database states
  const [transactions, setTransactions] = useState(() => storage.getTransactions());
  const [customers, setCustomers] = useState(() => storage.getCustomers());
  const [rateCard, setRateCard] = useState(() => storage.getRateCard());
  const [nameDiary, setNameDiary] = useState(() => storage.getNameDiary());
  const [settings, setSettings] = useState(() => storage.getSettings());

  // Active voice & draft states
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [filteredNoise, setFilteredNoise] = useState('');
  const [stagedDraft, setStagedDraft] = useState(null);
  const [voiceQueryResult, setVoiceQueryResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [isAutoListening, setIsAutoListening] = useState(false);
  const [autoListenVolume, setAutoListenVolume] = useState(0);
  const [newestTxnId, setNewestTxnId] = useState(null);
  const latestHandlersRef = useRef({});

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState('VOICE'); // 'VOICE' | 'TRANSACTIONS' | 'CUSTOMERS'
  const [isRateCardOpen, setIsRateCardOpen] = useState(false);
  const [isNameDiaryOpen, setIsNameDiaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Startup: Default language is Hindi; users can toggle language anytime from the top header
  useEffect(() => {
    // Main screen renders immediately on startup without any modal obstruction
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
  useEffect(() => { storage.saveNameDiary(nameDiary); }, [nameDiary]);
  useEffect(() => { storage.saveSettings(settings); }, [settings]);

  const currentLanguage = settings.speechLanguage === 'en' ? 'en' : 'hi';
  const effectiveGroqKey = settings.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '';
  const strictAlphabet = (settings.accentToleranceLevel || 'STRICT') === 'STRICT';
  const matcherOptions = { strictAlphabet, diaryEntries: nameDiary };
  const whisperBiasPrompt = formatWhisperDictionaryPrompt(customers, nameDiary, rateCard);

  // Aggregate stats (Authoritative net udhaar after deducting jama)
  const grossUdhaar = customers.reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
  const totalJama = customers.reduce((sum, c) => sum + (c.totalJama || 0), 0);
  const totalUdhaar = Math.max(0, grossUdhaar - totalJama); // Net remaining udhaar after subtracting jama

  /**
   * 1. Voice-to-Text via Groq Whisper (/api/transcribe proxy or client key),
   * followed by Groq AI / zero-key local parser extraction.
   */
  const handleAudioRecorded = async (audioBlob) => {
    setIsProcessing(true);
    speechTTS.stop();

    try {
      const transcript = await transcribeWithGroqWhisper(
        effectiveGroqKey,
        audioBlob,
        currentLanguage,
        whisperBiasPrompt
      );

      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No intelligible speech detected. Please speak closer to the microphone.');
      }

      setCurrentTranscript(transcript);
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
    audioRecorder.abort();
    setIsAutoListening(false);
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
    // 0. PURE IN-APP LOCAL CHECK: Handle PDF generation 100% locally inside the app (NO AI API keys or network calls used)
    const localPdfCheck = parseKiranaVoiceLocally(transcriptText, customers, rateCard, transactions, matcherOptions);
    if (localPdfCheck && localPdfCheck.intent === 'GENERATE_PDF') {
      console.log('📄 PDF requested: generating in-app 100% locally from device storage (ZERO AI API keys used)');
      setIsPdfModalOpen(true);
      setVoiceQueryResult({
        ...localPdfCheck,
        rawTranscript: transcriptText
      });
      if (settings.autoReadback) {
        speechTTS.speak(
          currentLanguage === 'hi' ? localPdfCheck.tts_hindi_readback : localPdfCheck.tts_readback,
          currentLanguage
        );
      }
      return;
    }

    let parsedResult = null;

    // 1. High-Speed Groq Engine (via Vercel serverless proxy or client key)
    try {
      parsedResult = await parseWithGroqLlama({
        apiKey: effectiveGroqKey,
        transcript: transcriptText,
        customers,
        rateCard,
        nameDiary,
        accentToleranceLevel: settings.accentToleranceLevel || 'STRICT',
        language: currentLanguage
      });
    } catch (err) {
      console.warn('Groq parsing failed, falling back to local parser:', err.message);
    }

    // 2. Fallback to Local Deterministic Engine
    if (!parsedResult) {
      parsedResult = parseKiranaVoiceLocally(transcriptText, customers, rateCard, transactions, matcherOptions);
    }

    // Verify / strengthen customer match using exact alphabet + diary-aware matching
    const spokenCust = parsedResult.customer_spoken || parsedResult.matched_customer_name || '';
    if (spokenCust) {
      const phoneticMatch = matchCustomerPhonetically(spokenCust, customers, 0.70, matcherOptions);
      if (phoneticMatch.isMatch && phoneticMatch.customer) {
        parsedResult.matched_customer_id = phoneticMatch.customer.id;
        parsedResult.matched_customer_name = phoneticMatch.customer.name;
        parsedResult.matched_customer_hindi_name = phoneticMatch.customer.hindiName || phoneticMatch.customer.name;
        parsedResult.match_confidence = Math.max(parsedResult.match_confidence || 0, phoneticMatch.confidence);
      } else {
        // Never force-merge distinct alphabets; align canonical script from Name Diary if exact match
        parsedResult.matched_customer_id = null;
        if (phoneticMatch.matchedName && phoneticMatch.matchedName !== spokenCust) {
          parsedResult.matched_customer_name = phoneticMatch.matchedName;
        }
        if (phoneticMatch.matchedHindiName) {
          parsedResult.matched_customer_hindi_name = phoneticMatch.matchedHindiName;
        }
      }
      parsedResult.near_customer_matches = phoneticMatch.nearMatches || parsedResult.near_customer_matches || [];
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

    // Step: Check for Full Settlement / Multi-Customer Payment Received
    // e.g. "महीद और रोहिद के खाते में का उधार पैसा आ चुका है।"
    const settlementCheck = parseMultiOrSettlementIntent(
      transcriptText,
      customers,
      parsedResult?.ignored_side_chatter || ''
    );
    if (settlementCheck) {
      if (settlementCheck.transaction_type === 'QUERY') {
        setStagedDraft(null);
        setVoiceQueryResult({ ...settlementCheck, rawTranscript: transcriptText });
        setFilteredNoise(settlementCheck.ignored_side_chatter || '');
        const msg = currentLanguage === 'hi'
          ? (settlementCheck.tts_hindi_readback || settlementCheck.tts_readback)
          : (settlementCheck.tts_readback || settlementCheck.tts_hindi_readback);
        if (settings.autoReadback && msg) {
          setTimeout(() => speechTTS.speak(msg, currentLanguage), 150);
        }
        return;
      } else {
        // Stage the single or multi-customer JAMA settlement directly on StagingCard
        setVoiceQueryResult(null);
        setFilteredNoise(settlementCheck.ignored_side_chatter || '');
        setStagedDraft(settlementCheck);
        const msg = currentLanguage === 'hi'
          ? (settlementCheck.tts_hindi_readback || settlementCheck.tts_readback)
          : (settlementCheck.tts_readback || settlementCheck.tts_hindi_readback);
        if (settings.autoReadback && msg) {
          setTimeout(() => {
            speechTTS.speak(msg, currentLanguage, () => triggerHandsFreeFollowUp('STAGING'));
          }, 200);
        } else {
          setTimeout(() => triggerHandsFreeFollowUp('STAGING'), 300);
        }
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
      (/\b(kitna|kitni|kitne|batao|bata|dikhao|dikha|kiske|kiska|kisko|kaun|check|hisab|hisaab|balance|sale|bikri|dhandha|bacha|bache)\b|कितना|कितनी|कितने|बताओ|बता(?:\s*(?:दो|दे|2))?|दिखाओ|दिखा|किसका|किसके|किसको|कौन|चेक|हिसाब|बैलेंस|सेल|बिक्री|धंधा|बचा|बची|बचे/iu.test(transcriptText))
    );

    if (isQueryIntent) {
      setStagedDraft(null);

      // Detect specific query type if LLM returned generic query or was mistaken
      let qIntent = parsedResult.intent;
      const normText = transcriptText.toLowerCase();
      const hasStoreOrGroupTerm = /(dukan|dukaan|store|total|kul|grahak|grahakon|grahkon|customer|customers|logon|sabka|sabhi|sab|mujhe|mera|meri|humara|kis\s*kis|kaun\s*kaun)/i.test(normText) ||
        /(दुकान|स्टोर|कुल|टोटल|ग्राहक|ग्राहकों|ग्रहक|ग्रहकों|कस्टमर|लोगों|सबका|सभी|सब|मुझे|मेरा|मेरी|हमारा|किस[\s-]*किस|कौन[\s-]*कौन)/iu.test(normText);
      const mentionsMetric = /(udhaar|udhar|baaki|baki|bacha|bache|balance|hisab|hisaab|paisa|paise|lena|उधार|बाकी|बचा|बची|बचे|बैलेंस|हिसाब|पैसा|पैसे|लेना)/iu.test(normText);
      const explicitPersonalMatch = matchCustomerPhonetically(transcriptText, customers, 0.78);

      if (/(sabse\s+zyada|sabse\s+bada|top|highest)/i.test(normText) || /(सबसे\s+ज्यादा|सबसे\s+बड़ा|टॉप)/i.test(normText)) {
        qIntent = 'CHECK_HIGHEST_UDHAAR';
      } else if (/(aaj|today|आज)/i.test(normText) && /(sale|bikri|dhandha|hisab|उधार|जमा|सेल|बिक्री)/i.test(normText) && !explicitPersonalMatch.isMatch) {
        qIntent = 'CHECK_TODAY_SUMMARY';
      } else if (hasStoreOrGroupTerm && mentionsMetric && !explicitPersonalMatch.isMatch) {
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

        // 0. Check multi-customer query (e.g. "महीद और रोहिद का कितना उधार है?")
        const multiNames = candidateName
          ? candidateName.split(/\s+(?:और|एवं|तथा|and|&)\s+|,\s*/iu).map(s => s.trim()).filter(Boolean)
          : [];
        if (multiNames.length > 1) {
          const matchedMulti = multiNames
            .map(n => matchCustomerPhonetically(n, customers, 0.56))
            .filter(m => m.isMatch && m.customer)
            .map(m => m.customer);
          const uniqueMulti = Array.from(new Map(matchedMulti.map(c => [c.id, c])).values());

          if (uniqueMulti.length > 0) {
            const combinedNet = uniqueMulti.reduce((s, c) => s + Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0)), 0);
            const partsHi = uniqueMulti.map(c => `${c.hindiName || c.name} (₹${Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0)).toLocaleString('en-IN')})`).join(' और ');
            parsedResult.total_amount_inr = combinedNet;
            parsedResult.customer_data = uniqueMulti[0];
            parsedResult.matched_customer_name = uniqueMulti.map(c => c.name).join(' & ');
            parsedResult.tts_hindi_readback = `${partsHi} का कुल शुद्ध उधार ₹${combinedNet.toLocaleString('en-IN')} बाकी है।`;
            parsedResult.tts_readback = `Combined net udhaar for ${parsedResult.matched_customer_name} is ₹${combinedNet.toLocaleString('en-IN')}.`;
            parsedResult.query_answer = {
              title: `${uniqueMulti.length} ग्राहकों का उधार विवरण`,
              customerName: parsedResult.matched_customer_name,
              mainMetric: `₹${combinedNet.toLocaleString('en-IN')}`,
              metricLabel: 'कुल शुद्ध उधार बाकी',
              details: partsHi
            };

            setVoiceQueryResult({ ...parsedResult, rawTranscript: transcriptText });
            setFilteredNoise(parsedResult.ignored_side_chatter || '');
            const readbackSentence = currentLanguage === 'hi' ? parsedResult.tts_hindi_readback : parsedResult.tts_readback;
            if (readbackSentence) setTimeout(() => speechTTS.speak(readbackSentence, currentLanguage), 150);
            return;
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
        // Sort by authoritative NET remaining udhaar (gross - jama)
        const sorted = [...customers].sort((a, b) => 
          Math.max(0, (b.totalUdhaar || 0) - (b.totalJama || 0)) - Math.max(0, (a.totalUdhaar || 0) - (a.totalJama || 0))
        );
        const topCust = sorted[0];
        const topNetUdhaar = topCust ? Math.max(0, (topCust.totalUdhaar || 0) - (topCust.totalJama || 0)) : 0;
        if (topCust && topNetUdhaar > 0) {
          parsedResult.customer_data = topCust;
          parsedResult.matched_customer_name = topCust.name;
          parsedResult.total_amount_inr = topNetUdhaar;
          parsedResult.tts_hindi_readback = `दुकान में सबसे ज्यादा उधार ${topCust.hindiName || topCust.name} के पास है, ₹${(topCust.totalJama || 0).toLocaleString('en-IN')} जमा काटकर कुल ₹${topNetUdhaar.toLocaleString('en-IN')} बाकी है।`;
          parsedResult.tts_readback = `The highest net udhaar in the store is with ${topCust.name}, total ₹${topNetUdhaar.toLocaleString('en-IN')} remaining.`;
          parsedResult.query_answer = {
            title: 'सबसे ज्यादा उधार (Top Debtor)',
            customerName: topCust.name,
            mainMetric: `₹${topNetUdhaar.toLocaleString('en-IN')}`,
            metricLabel: 'शुद्ध उधार बाकी',
            details: `कुल उधार: ₹${(topCust.totalUdhaar || 0).toLocaleString('en-IN')} | जमा: ₹${(topCust.totalJama || 0).toLocaleString('en-IN')}`
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
        const grossStoreUdhaar = (customers || []).reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
        const storeJama = (customers || []).reduce((sum, c) => sum + (c.totalJama || 0), 0);
        const netStoreUdhaar = Math.max(0, grossStoreUdhaar - storeJama);
        const pendingDebtors = (customers || []).filter(c => ((c.totalUdhaar || 0) - (c.totalJama || 0)) > 0);
        const pendingCount = pendingDebtors.length;
        const debtorsBreakdown = pendingDebtors
          .map(c => `${c.hindiName || c.name} (₹${Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0)).toLocaleString('en-IN')})`)
          .join(', ');

        parsedResult.total_amount_inr = netStoreUdhaar;
        parsedResult.tts_hindi_readback = pendingCount > 0
          ? `अभी कुल ${pendingCount} ग्राहकों का ₹${netStoreUdhaar.toLocaleString('en-IN')} उधार बाकी है: ${debtorsBreakdown}।`
          : `अभी किसी भी ग्राहक का उधार बाकी नहीं है, सभी खाते चुकता हैं।`;
        parsedResult.tts_readback = pendingCount > 0
          ? `Currently ${pendingCount} customer(s) owe a total net udhaar of ₹${netStoreUdhaar.toLocaleString('en-IN')}: ${debtorsBreakdown}.`
          : `No customers currently owe udhaar; all accounts are settled.`;
        parsedResult.query_answer = {
          title: 'दुकान की कुल स्थिति (Store Outstanding)',
          customerName: `${pendingCount} बाकी ग्राहक (Pending Debtors)`,
          mainMetric: `₹${netStoreUdhaar.toLocaleString('en-IN')}`,
          metricLabel: 'शुद्ध उधार बाकी',
          details: pendingCount > 0
            ? `${debtorsBreakdown} | कुल उधार: ₹${grossStoreUdhaar.toLocaleString('en-IN')}, जमा: ₹${storeJama.toLocaleString('en-IN')}`
            : `कुल उधार: ₹${grossStoreUdhaar.toLocaleString('en-IN')} | कुल जमा: ₹${storeJama.toLocaleString('en-IN')}`
        };
      }

      if (parsedResult.intent === 'GENERATE_PDF' || parsedResult.query_type === 'PDF_REPORT') {
        setIsPdfModalOpen(true);
      }

      setVoiceQueryResult({
        ...parsedResult,
        rawTranscript: transcriptText
      });
      setFilteredNoise(parsedResult.ignored_side_chatter || '');

      const readbackSentence = currentLanguage === 'hi'
        ? (parsedResult.tts_hindi_readback || parsedResult.tts_readback)
        : (parsedResult.tts_readback || parsedResult.tts_hindi_readback);

      const asksFollowUp = parsedResult.query_type === 'CUSTOMER_NOT_FOUND' ||
        (readbackSentence && (readbackSentence.includes('?') || readbackSentence.includes('क्या')));

      if (readbackSentence) {
        setTimeout(() => {
          speechTTS.speak(
            readbackSentence,
            currentLanguage,
            asksFollowUp ? () => triggerHandsFreeFollowUp('ANSWER') : undefined
          );
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

      // Read back aloud in chosen language, then auto-listen hands-free for Confirm/Edit!
      const readbackSentence = currentLanguage === 'hi'
        ? (parsedResult.tts_hindi_readback || parsedResult.tts_readback)
        : (parsedResult.tts_readback || parsedResult.tts_hindi_readback);

      if (settings.autoReadback && readbackSentence) {
        setTimeout(() => {
          speechTTS.speak(readbackSentence, currentLanguage, () => {
            triggerHandsFreeFollowUp('STAGING');
          });
        }, 250);
      } else {
        setTimeout(() => triggerHandsFreeFollowUp('STAGING'), 300);
      }
    }
  };

  /**
   * Replay audio in chosen language and re-arm hands-free confirmation listener
   */
  const handleReplayAudio = () => {
    if (!stagedDraft) return;
    audioRecorder.abort();
    setIsAutoListening(false);
    const textToSpeak = currentLanguage === 'hi'
      ? (stagedDraft.tts_hindi_readback || stagedDraft.tts_readback)
      : (stagedDraft.tts_readback || stagedDraft.tts_hindi_readback);

    if (textToSpeak) {
      speechTTS.speak(textToSpeak, currentLanguage, () => triggerHandsFreeFollowUp('STAGING'));
    }
  };

  /**
   * ❌ RETRY Action: Discards draft, stops speech & hands-free listener
   */
  const handleRetry = () => {
    audioRecorder.abort();
    setIsAutoListening(false);
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

    audioRecorder.abort();
    setIsAutoListening(false);
    speechTTS.stop();

    const txnId = `TXN_${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Multi-customer settlement commit (e.g. "महीद और रोहिद के खाते में का उधार पैसा आ चुका है")
    if (stagedDraft.multi_customers && stagedDraft.multi_customers.length > 0) {
      let updatedCustomers = [...customers];
      const newTxns = [];

      stagedDraft.multi_customers.forEach((mc, idx) => {
        const amt = Number(mc.amount) || 0;
        let cIdx = mc.id ? updatedCustomers.findIndex(c => c.id === mc.id) : -1;
        if (cIdx === -1) {
          const pm = matchCustomerPhonetically(mc.name, updatedCustomers, 0.56);
          if (pm.isMatch && pm.customer) {
            cIdx = updatedCustomers.findIndex(c => c.id === pm.customer.id);
          }
        }

        let custId = mc.id;
        let custName = mc.name;
        let custHindi = mc.hindiName || mc.name;
        let custUp = 'मान्य ग्राहक';

        if (cIdx >= 0) {
          const existing = updatedCustomers[cIdx];
          const newJama = (existing.totalJama || 0) + amt;
          updatedCustomers[cIdx] = {
            ...existing,
            totalJama: newJama,
            netBalance: (existing.totalUdhaar || 0) - newJama,
            lastUpdated: nowIso
          };
          custId = existing.id;
          custName = existing.name;
          custHindi = existing.hindiName || existing.name;
          custUp = existing.upNativeName || 'मान्य ग्राहक';
        }

        newTxns.push({
          id: `${txnId}_${idx}`,
          timestamp: nowIso,
          customerSpoken: mc.name,
          matchedCustomerId: custId,
          customerName: custName,
          customerHindiName: custHindi,
          customerUpName: custUp,
          matchConfidence: stagedDraft.match_confidence || 0.95,
          transactionType: 'JAMA',
          items: [],
          totalAmount: amt,
          ignoredNoise: stagedDraft.ignored_side_chatter || '',
          rawTranscript: currentTranscript,
          status: 'COMMITTED',
          ttsHindiText: stagedDraft.tts_hindi_readback
        });
      });

      setCustomers(updatedCustomers);
      setTransactions([...newTxns, ...transactions]);
      setNewestTxnId(newTxns[0]?.id || txnId);
      try { confetti({ particleCount: 65, spread: 70, origin: { y: 0.75 } }); } catch (e) {}
      setTimeout(() => {
        speechTTS.speak(currentLanguage === 'hi' ? 'खाता अपडेट हो गया।' : 'Ledger updated successfully.', currentLanguage);
      }, 150);
      setStagedDraft(null);
      setVoiceQueryResult(null);
      setCurrentTranscript('');
      setFilteredNoise('');
      return;
    }

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

    // 4. Alphabet & Diary-aware lookup (respects strict letter differentiation when enabled)
    if (customerIndex === -1) {
      const pMatch = matchCustomerPhonetically(customerName || stagedDraft.customer_spoken, updatedCustomers, strictAlphabet ? 0.72 : 0.58, matcherOptions);
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

      // Only bind spoken variant as alias when same consonant skeleton or non-strict mode,
      // preventing distinct names like Vaisari from polluting Vaishali's ledger aliases.
      const spokenSafeToAlias = stagedDraft.customer_spoken && (
        !strictAlphabet ||
        compareAlphabetSimilarity(existing.hindiName || existing.name, stagedDraft.customer_spoken).sameConsonants
      );
      const mergedAliases = Array.from(new Set([
        ...(existing.aliases || []),
        customerName,
        spokenSafeToAlias ? stagedDraft.customer_spoken : null
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
      // Only create new customer if completely novel / distinct alphabet spelling
      const newCustId = `CUST_${String(updatedCustomers.length + 1).padStart(2, '0')}`;
      const newHindiName = stagedDraft.matched_customer_hindi_name || customerName;
      const newCustomer = {
        id: newCustId,
        name: customerName,
        hindiName: newHindiName,
        aliases: [customerName].filter(Boolean),
        phone: '+91 98000 00000',
        totalUdhaar: isUdhaar ? amount : 0,
        totalJama: !isUdhaar ? amount : 0,
        netBalance: isUdhaar ? amount : -amount,
        lastUpdated: nowIso,
        notes: 'Created via GallaVoice'
      };
      updatedCustomers.push(newCustomer);
      targetCustomerId = newCustId;

      // Auto-learn newly confirmed customer spelling into the Name Diary
      const alreadyInDiary = nameDiary.some(
        d => d.name.toLowerCase() === customerName.toLowerCase() || d.hindiName === newHindiName
      );
      if (!alreadyInDiary) {
        setNameDiary(prev => [
          {
            id: `DICT_${Date.now()}`,
            name: customerName,
            hindiName: newHindiName,
            aliases: [],
            isCustom: true,
            category: 'Customer Khata'
          },
          ...prev
        ]);
      }
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

  /**
   * Renames an existing customer across the customer khata and linked transactions,
   * keeping previous names inside aliases so future voice commands continue to match.
   */
  const handleUpdateCustomerName = (customerId, { name, hindiName, upNativeName }) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      const mergedAliases = Array.from(new Set([
        ...(c.aliases || []),
        c.name,
        c.hindiName,
        name,
        hindiName
      ].filter(Boolean)));

      const updatedCust = {
        ...c,
        name,
        hindiName: hindiName || name,
        upNativeName: upNativeName !== undefined ? upNativeName : c.upNativeName,
        aliases: mergedAliases
      };
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer(updatedCust);
      }
      return updatedCust;
    }));

    setTransactions(prev => prev.map(t => {
      if (t.matchedCustomerId !== customerId) return t;
      return {
        ...t,
        customerName: name,
        customerHindiName: hindiName || name,
        customerUpName: upNativeName !== undefined ? upNativeName : t.customerUpName
      };
    }));
  };

  /**
   * Voice/text follow-up on StagingCard: supports "Confirm", "Retry",
   * customer name corrections ("ग्राहक का नाम वैशाली है", "वैशाली"),
   * and quantity/item modifications ("instead of 4 kg potato, 3.5 kg potato").
   */
  const handleStagingVoiceCommand = async (followUpText) => {
    if (!stagedDraft || !followUpText || !followUpText.trim()) return;
    audioRecorder.abort();
    setIsAutoListening(false);
    speechTTS.stop();

    const localFollowUp = parseStagingVoiceFollowUp(followUpText, stagedDraft, customers, rateCard, matcherOptions);
    if (localFollowUp?.action === 'CONFIRM') {
      handleContinue();
      return;
    }
    if (localFollowUp?.action === 'RETRY') {
      handleRetry();
      return;
    }
    if (localFollowUp?.action === 'ASK_CORRECTION') {
      const askMsg = currentLanguage === 'hi'
        ? 'ठीक है, बताइए क्या सही करना है? नाम, सामान या मात्रा बोलें।'
        : 'Okay, tell me what to fix — the customer name, item, or quantity.';
      if (settings.autoReadback) {
        setTimeout(() => speechTTS.speak(askMsg, currentLanguage, () => triggerHandsFreeFollowUp('STAGING')), 120);
      } else {
        setTimeout(() => triggerHandsFreeFollowUp('STAGING'), 200);
      }
      return;
    }

    // Dynamic restructuring: Try Groq LLM with full current draft context first,
    // then apply local phonetic customer matching + rate card pricing, or fallback to localFollowUp.
    setIsProcessing(true);
    let finalUpdatedDraft = null;

    try {
      const contextualPrompt = `CURRENT STAGED DRAFT: ${JSON.stringify({
        customer: stagedDraft.matched_customer_name || stagedDraft.customer_spoken,
        transaction_type: stagedDraft.transaction_type,
        items: stagedDraft.items,
        total_amount_inr: stagedDraft.total_amount_inr
      })}. USER VOICE CORRECTION: "${followUpText}". Restructure the transaction according to the user's correction (replace items/names if corrected, or update quantity/price), calculate prices from STORE RATE CARD, and return the complete updated JSON ending tts_hindi_readback with "क्या इसे सेव करें?".`;

      const groqUpdated = await parseWithGroqLlama({
        apiKey: effectiveGroqKey,
        transcript: contextualPrompt,
        customers,
        rateCard,
        nameDiary,
        accentToleranceLevel: settings.accentToleranceLevel || 'STRICT',
        language: currentLanguage
      });

      if (groqUpdated && groqUpdated.intent !== 'NOISE_ONLY' && (groqUpdated.matched_customer_name || groqUpdated.customer_spoken || (groqUpdated.items && groqUpdated.items.length > 0))) {
        const spokenCust = groqUpdated.customer_spoken || groqUpdated.matched_customer_name || stagedDraft.customer_spoken;
        const pMatch = spokenCust ? matchCustomerPhonetically(spokenCust, customers, 0.70, matcherOptions) : { isMatch: false };

        let computedTotal = Number(groqUpdated.total_amount_inr) || 0;
        const enrichedItems = (groqUpdated.items || stagedDraft.items || []).map(item => {
          const itemRate = rateCard.find(r =>
            r.name.toLowerCase() === (item.name || '').toLowerCase() ||
            r.hindiName === item.name ||
            (r.aliases && r.aliases.some(a => (item.name || '').toLowerCase().includes(a.toLowerCase())))
          );
          let calcPrice = Number(item.calculated_price_inr) || 0;
          if (calcPrice === 0 && itemRate) {
            const qtyMatch = String(item.quantity || '1').match(/(\d+(\.\d+)?)/);
            const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
            calcPrice = Math.round(itemRate.unitPrice * qty);
          }
          return { ...item, calculated_price_inr: calcPrice };
        });

        if (enrichedItems.length > 0 && (groqUpdated.transaction_type || stagedDraft.transaction_type) === 'UDHAAR') {
          const sumItems = enrichedItems.reduce((s, it) => s + (Number(it.calculated_price_inr) || 0), 0);
          if (sumItems > 0 && computedTotal === 0) computedTotal = sumItems;
        }

        finalUpdatedDraft = {
          ...stagedDraft,
          ...groqUpdated,
          customer_spoken: spokenCust,
          matched_customer_name: pMatch.isMatch ? pMatch.matchedName : (groqUpdated.matched_customer_name || spokenCust || stagedDraft.matched_customer_name),
          matched_customer_id: pMatch.isMatch ? pMatch.customer.id : (stagedDraft.matched_customer_id || null),
          match_confidence: pMatch.isMatch ? pMatch.confidence : (groqUpdated.match_confidence || stagedDraft.match_confidence),
          items: enrichedItems,
          total_amount_inr: computedTotal
        };
      }
    } catch (err) {
      console.warn('Groq dynamic staging correction failed, using local engine:', err.message);
    } finally {
      setIsProcessing(false);
    }

    if (!finalUpdatedDraft && localFollowUp?.action === 'UPDATE_DRAFT' && localFollowUp.updatedDraft) {
      finalUpdatedDraft = localFollowUp.updatedDraft;
    }

    if (finalUpdatedDraft) {
      setStagedDraft(finalUpdatedDraft);
      const readback = currentLanguage === 'hi'
        ? (finalUpdatedDraft.tts_hindi_readback || finalUpdatedDraft.tts_readback)
        : (finalUpdatedDraft.tts_readback || finalUpdatedDraft.tts_hindi_readback);
      if (settings.autoReadback && readback) {
        setTimeout(() => speechTTS.speak(readback, currentLanguage, () => triggerHandsFreeFollowUp('STAGING')), 120);
      } else {
        setTimeout(() => triggerHandsFreeFollowUp('STAGING'), 200);
      }
    } else {
      // Unclear reply -> keep draft open and ask again hands-free
      const retryAsk = currentLanguage === 'hi'
        ? 'समझ नहीं आया। कृपया "Confirm" बोलें, या सही नाम और सामान फिर से बोलें।'
        : 'Did not catch that. Say "Confirm", or restate the customer name and items.';
      if (settings.autoReadback) {
        setTimeout(() => speechTTS.speak(retryAsk, currentLanguage, () => triggerHandsFreeFollowUp('STAGING')), 120);
      } else {
        setTimeout(() => triggerHandsFreeFollowUp('STAGING'), 200);
      }
    }
  };

  const handleStagingAudioRecorded = async (audioBlob) => {
    setIsProcessing(true);
    speechTTS.stop();
    try {
      const transcript = await transcribeWithGroqWhisper(
        effectiveGroqKey,
        audioBlob,
        currentLanguage,
        whisperBiasPrompt
      );
      console.log('🗣️ Staging follow-up heard:', transcript);
      if (transcript && transcript.trim()) {
        await handleStagingVoiceCommand(transcript);
      }
    } catch (err) {
      console.error('Staging audio follow-up error:', err);
      alert(err.message || 'Could not process voice confirmation.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles multifunctional voice/text follow-ups directly from VoiceAssistantAnswerCard:
   * - Close/Done ("ठीक है", "ok", "done")
   * - Negative-only dismiss ("नहीं") vs Negative + new question ("नहीं, नहीं, मुझे कितना उधार है, ये बता दो इस बार")
   * - Creating new customer when asked "क्या नया खाता खोलना चाहते हैं?" ("हाँ, खोल दो")
   * - Any next query, transaction, rate card update, or PDF command
   */
  const handleAnswerCardFollowUp = async (followUpText) => {
    if (!followUpText || !followUpText.trim()) return;
    audioRecorder.abort();
    setIsAutoListening(false);
    speechTTS.stop();
    const raw = followUpText.trim();

    // 1. Check simple Done / Close
    if (/^(?:ok|okay|done|close|thik\s*hai|theek\s*hai|ठीक\s*है|बंद\s*करो|बंद|हो\s*गया)[.।!]*$/iu.test(raw)) {
      setVoiceQueryResult(null);
      return;
    }

    // 2. Strip leading refusal ("नहीं, नहीं, मुझे..." -> "मुझे...")
    const withoutLeadingNo = raw
      .replace(/^(?:(?:nahi|nahin|no|na|नहीं|ना|अरे\s*नहीं|रहने\s*दो)[,\s।]*)+/iu, '')
      .trim();

    // If user ONLY said "नहीं" / "No" with nothing after
    if (!withoutLeadingNo) {
      setVoiceQueryResult(null);
      if (settings.autoReadback) {
        speechTTS.speak(currentLanguage === 'hi' ? 'ठीक है।' : 'Okay.', currentLanguage);
      }
      return;
    }

    // 3. If previous prompt asked "क्या नया खाता खोलना चाहते हैं?" and user says Yes/Create
    const isYesCreate = /^(?:haan|ha|yes|khol\s*do|banao|bana\s*do|create|हाँ|हां|खोल\s*दो|बना\s*दो|बनाओ|हाँ\s+खोल\s+दो)/iu.test(withoutLeadingNo);
    if (voiceQueryResult?.query_type === 'CUSTOMER_NOT_FOUND' && isYesCreate && voiceQueryResult.matched_customer_name) {
      const newCustName = voiceQueryResult.matched_customer_name;
      const newCustId = `CUST_${String(customers.length + 1).padStart(2, '0')}`;
      const newCustomer = {
        id: newCustId,
        name: newCustName,
        hindiName: newCustName,
        aliases: [newCustName],
        phone: '+91 98000 00000',
        totalUdhaar: 0,
        totalJama: 0,
        netBalance: 0,
        lastUpdated: new Date().toISOString(),
        notes: 'Created via GallaVoice'
      };
      setCustomers(prev => [...prev, newCustomer]);
      const msgHi = `${newCustName} का नया खाता खोल दिया गया है। अब आप इनका उधार या जमा बोल सकते हैं।`;
      const msgEn = `New ledger account created for ${newCustName}. You can now record udhaar or jama for them.`;
      setVoiceQueryResult({
        intent: 'CHECK_BALANCE',
        query_type: 'CUSTOMER_BALANCE',
        customer_data: newCustomer,
        matched_customer_name: newCustName,
        matched_customer_id: newCustId,
        rawTranscript: raw,
        tts_hindi_readback: msgHi,
        tts_readback: msgEn,
        query_answer: {
          title: 'नया खाता खोला गया (Account Created)',
          customerName: newCustName,
          mainMetric: '₹0',
          metricLabel: 'खाता खोला गया',
          details: 'अब आप इनके नाम से उधार या जमा दर्ज कर सकते हैं'
        }
      });
      if (settings.autoReadback) {
        speechTTS.speak(currentLanguage === 'hi' ? msgHi : msgEn, currentLanguage);
      }
      return;
    }

    // 4. Otherwise, pass cleanly (with any leading "नहीं, नहीं" stripped) to full voice processor!
    await handleProcessTranscript(withoutLeadingNo);
  };

  const handleAnswerCardAudioRecorded = async (audioBlob) => {
    setIsProcessing(true);
    speechTTS.stop();
    try {
      const transcript = await transcribeWithGroqWhisper(
        effectiveGroqKey,
        audioBlob,
        currentLanguage,
        whisperBiasPrompt
      );
      console.log('🗣️ Answer card follow-up heard:', transcript);
      if (transcript && transcript.trim()) {
        setCurrentTranscript(transcript);
        await handleAnswerCardFollowUp(transcript);
      }
    } catch (err) {
      console.error('Answer card follow-up audio error:', err);
      alert(err.message || 'Could not process voice follow-up.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Hands-free Voice Activity Detection (VAD) auto-listener activated automatically
   * after TTS readback completes on StagingCard ("क्या इसे सेव करें?") or AnswerCard questions.
   */
  const triggerHandsFreeFollowUp = async (mode) => {
    if (isProcessing) return;
    try {
      console.log(`🎙️ Hands-free auto-listen started (${mode})`);
      setIsAutoListening(true);
      setAutoListenVolume(0);
      await audioRecorder.startAutoListen({
        silenceMs: 1000,
        idleTimeoutMs: 7000,
        maxDurationMs: 9000,
        onVolume: (vol) => setAutoListenVolume(vol),
        onAutoComplete: async (result) => {
          setIsAutoListening(false);
          setAutoListenVolume(0);
          if (!result || result.timedOut || result.isSilent || !result.blob) {
            return;
          }
          if (mode === 'STAGING' && latestHandlersRef.current.handleStagingAudioRecorded) {
            await latestHandlersRef.current.handleStagingAudioRecorded(result.blob);
          } else if (mode === 'ANSWER' && latestHandlersRef.current.handleAnswerCardAudioRecorded) {
            await latestHandlersRef.current.handleAnswerCardAudioRecorded(result.blob);
          }
        }
      });
    } catch (err) {
      console.warn('Hands-free auto-listen skipped:', err.message);
      setIsAutoListening(false);
    }
  };

  // Keep latest handlers synced in ref so async VAD callbacks never use stale state
  latestHandlersRef.current = {
    handleStagingAudioRecorded,
    handleAnswerCardAudioRecorded
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
        onOpenNameDiary={() => setIsNameDiaryOpen(true)}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onOpenPdfReport={() => setIsPdfModalOpen(true)}
        transactions={transactions}
        customers={customers}
        totalUdhaar={totalUdhaar}
        grossUdhaar={grossUdhaar}
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
                onClose={() => {
                  audioRecorder.abort();
                  setIsAutoListening(false);
                  speechTTS.stop();
                  setVoiceQueryResult(null);
                }}
                onReplayAudio={() => {
                  audioRecorder.abort();
                  setIsAutoListening(false);
                  const s = currentLanguage === 'hi'
                    ? (voiceQueryResult.tts_hindi_readback || voiceQueryResult.tts_readback)
                    : (voiceQueryResult.tts_readback || voiceQueryResult.tts_hindi_readback);
                  const asksFollowUp = voiceQueryResult.query_type === 'CUSTOMER_NOT_FOUND' ||
                    (s && (s.includes('?') || s.includes('क्या')));
                  if (s) {
                    speechTTS.speak(s, currentLanguage, asksFollowUp ? () => triggerHandsFreeFollowUp('ANSWER') : undefined);
                  }
                }}
                onViewCustomer={(cust) => {
                  audioRecorder.abort();
                  setIsAutoListening(false);
                  setSelectedCustomer(cust);
                  setActiveTab('CUSTOMERS');
                  setVoiceQueryResult(null);
                }}
                onViewCustomersList={() => {
                  audioRecorder.abort();
                  setIsAutoListening(false);
                  setActiveTab('CUSTOMERS');
                  setVoiceQueryResult(null);
                }}
                onViewTransactions={() => {
                  audioRecorder.abort();
                  setIsAutoListening(false);
                  setActiveTab('TRANSACTIONS');
                  setVoiceQueryResult(null);
                }}
                onViewRateCard={() => {
                  audioRecorder.abort();
                  setIsAutoListening(false);
                  setIsRateCardOpen(true);
                  setVoiceQueryResult(null);
                }}
                onOpenPdfReport={() => {
                  audioRecorder.abort();
                  setIsAutoListening(false);
                  setIsPdfModalOpen(true);
                  setVoiceQueryResult(null);
                }}
                onFollowUpVoiceCommand={handleAnswerCardFollowUp}
                onFollowUpAudioRecorded={handleAnswerCardAudioRecorded}
                isAutoListening={isAutoListening}
                autoListenVolume={autoListenVolume}
                onFinishAutoListenNow={() => audioRecorder.finishAutoListenNow()}
                isProcessing={isProcessing}
                language={currentLanguage}
              />
            ) : stagedDraft ? (
              <StagingCard
                stagedDraft={stagedDraft}
                onRetry={handleRetry}
                onContinue={handleContinue}
                onStagingVoiceCommand={handleStagingVoiceCommand}
                isAutoListening={isAutoListening}
                autoListenVolume={autoListenVolume}
                onFinishAutoListenNow={() => audioRecorder.finishAutoListenNow()}
                isProcessing={isProcessing}
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
              onOpenPdfReport={() => setIsPdfModalOpen(true)}
              onOpenNameDiary={() => setIsNameDiaryOpen(true)}
              onUpdateCustomerName={handleUpdateCustomerName}
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
        onUpdateCustomerName={handleUpdateCustomerName}
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

      <NameDiaryModal
        isOpen={isNameDiaryOpen}
        onClose={() => setIsNameDiaryOpen(false)}
        nameDiary={nameDiary}
        customers={customers}
        onUpdateNameDiary={setNameDiary}
        strictAlphabet={strictAlphabet}
        language={currentLanguage}
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

      {/* Debtors Khata PDF Generation Modal */}
      <KhataPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        customers={customers}
        language={currentLanguage}
      />
    </div>
  );
}
