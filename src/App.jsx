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

import { storage } from './utils/storage.js';
import { speechTTS } from './utils/speechTTS.js';
import { transcribeWithGroqWhisper, parseWithGroqLlama } from './services/groqService.js';
import { parseKiranaVoiceLocally } from './services/localParser.js';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [newestTxnId, setNewestTxnId] = useState(null);

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState('TRANSACTIONS'); // 'TRANSACTIONS' | 'CUSTOMERS'
  const [isRateCardOpen, setIsRateCardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

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
  const effectiveGroqKey = settings.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '';

  // Aggregate stats
  const totalUdhaar = customers.reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
  const totalJama = customers.reduce((sum, c) => sum + (c.totalJama || 0), 0);

  /**
   * 1. Voice-to-Text via Groq Whisper AI, followed by Llama 3.3 70B extraction
   */
  const handleAudioRecorded = async (audioBlob) => {
    if (!effectiveGroqKey) {
      setIsLanguageModalOpen(true);
      return;
    }

    setIsProcessing(true);
    speechTTS.stop();

    try {
      // Step 1: AI Speech-to-Text via Whisper Large v3 Turbo
      const transcript = await transcribeWithGroqWhisper(
        effectiveGroqKey, 
        audioBlob, 
        currentLanguage
      );

      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No intelligible speech detected. Please speak closer to the microphone.');
      }

      setCurrentTranscript(transcript);

      // Step 2: AI Parsing via Llama 3.3 70B
      await executeAIParser(transcript);
    } catch (err) {
      console.error('Audio processing error:', err);
      alert(err.message || 'Error processing audio via AI');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Direct text processing (from preset or manual input)
   */
  const handleProcessTranscript = async (text) => {
    if (!text || !text.trim()) return;
    setIsProcessing(true);
    speechTTS.stop();
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
   * Executes AI LLM parser (or fallback if key missing)
   */
  const executeAIParser = async (transcriptText) => {
    let parsedResult;

    if (effectiveGroqKey) {
      try {
        parsedResult = await parseWithGroqLlama({
          apiKey: effectiveGroqKey,
          transcript: transcriptText,
          customers,
          rateCard,
          language: currentLanguage
        });
      } catch (err) {
        console.warn('Groq Llama failed, falling back to local engine:', err);
        parsedResult = parseKiranaVoiceLocally(transcriptText, customers, rateCard);
      }
    } else {
      parsedResult = parseKiranaVoiceLocally(transcriptText, customers, rateCard);
    }

    setFilteredNoise(parsedResult.ignored_side_chatter || '');
    setStagedDraft(parsedResult);

    // Step 3: Read back aloud in chosen language (Hindi or English)
    const readbackSentence = currentLanguage === 'hi'
      ? (parsedResult.tts_hindi_readback || parsedResult.tts_readback)
      : (parsedResult.tts_readback || parsedResult.tts_hindi_readback);

    if (settings.autoReadback && readbackSentence) {
      setTimeout(() => {
        speechTTS.speak(readbackSentence, currentLanguage);
      }, 250);
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
    let customerIndex = updatedCustomers.findIndex(c => c.id === targetCustomerId);

    if (customerIndex === -1 && targetCustomerId) {
      customerIndex = updatedCustomers.findIndex(c => c.name.toLowerCase() === customerName.toLowerCase());
    }

    const amount = Number(stagedDraft.total_amount_inr) || 0;
    const isUdhaar = stagedDraft.transaction_type === 'UDHAAR';

    if (customerIndex >= 0) {
      const existing = updatedCustomers[customerIndex];
      const newUdhaar = isUdhaar ? existing.totalUdhaar + amount : existing.totalUdhaar;
      const newJama = !isUdhaar ? existing.totalJama + amount : existing.totalJama;
      const newNet = newUdhaar - newJama;

      updatedCustomers[customerIndex] = {
        ...existing,
        totalUdhaar: newUdhaar,
        totalJama: newJama,
        netBalance: newNet,
        lastUpdated: nowIso
      };
      targetCustomerId = existing.id;
      customerName = existing.name;
    } else {
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

    const newTransaction = {
      id: txnId,
      timestamp: nowIso,
      customerSpoken: stagedDraft.customer_spoken || customerName,
      matchedCustomerId: targetCustomerId,
      customerName: customerName,
      matchConfidence: stagedDraft.match_confidence || 1.0,
      transactionType: stagedDraft.transaction_type || 'UDHAAR',
      items: (stagedDraft.items || []).map(it => ({
        name: it.name,
        quantity: it.quantity,
        calculatedPrice: it.calculated_price_inr,
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
    setCurrentTranscript('');
    setFilteredNoise('');
  };

  const handleDeleteTransaction = (txnId) => {
    if (window.confirm('Delete this transaction?')) {
      setTransactions(transactions.filter(t => t.id !== txnId));
    }
  };

  const handleLanguageModalSave = ({ language, groqApiKey }) => {
    localStorage.setItem('gallavoice_welcome_seen_v1', 'true');
    setSettings(prev => ({
      ...prev,
      speechLanguage: language,
      groqApiKey: groqApiKey || prev.groqApiKey,
      engine: groqApiKey ? 'GROQ_LLAMA' : prev.engine
    }));
  };

  return (
    <div className="min-h-full bg-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRateCard={() => setIsRateCardOpen(true)}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        transactions={transactions}
        totalUdhaar={totalUdhaar}
        totalJama={totalJama}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Voice Controller or Staging Card */}
          <div className="lg:col-span-5 space-y-6">
            {stagedDraft ? (
              <StagingCard
                stagedDraft={stagedDraft}
                onRetry={handleRetry}
                onContinue={handleContinue}
                isTtsSpeaking={isTtsSpeaking}
                onReplayAudio={handleReplayAudio}
                language={currentLanguage}
              />
            ) : (
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
            )}
          </div>

          {/* RIGHT COLUMN: Live Local Khata Ledger */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between bg-stone-200/80 p-1 rounded-2xl">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('TRANSACTIONS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'TRANSACTIONS'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-orange-600" />
                  <span>{currentLanguage === 'hi' ? 'रोजनामचा (Transactions)' : 'All Transactions'}</span>
                  <span className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.2 rounded-full border">
                    {transactions.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('CUSTOMERS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'CUSTOMERS'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>{currentLanguage === 'hi' ? 'ग्राहक खाता (Customers)' : 'Customer Ledgers'}</span>
                  <span className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.2 rounded-full border">
                    {customers.length}
                  </span>
                </button>
              </div>

              <span className="text-[11px] text-stone-500 font-semibold pr-3 hidden sm:inline">
                Persistent Local Database
              </span>
            </div>

            {/* Active Tab View */}
            <div>
              {activeTab === 'TRANSACTIONS' ? (
                <TransactionsTable
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  newestTxnId={newestTxnId}
                />
              ) : (
                <CustomerKhataTable
                  customers={customers}
                  onRecordQuickPayment={(c) => {
                    handleProcessTranscript(`${c.name} ko 100 rupaye jama`);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <LanguageSelectModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={currentLanguage}
        groqKey={settings.groqApiKey}
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
