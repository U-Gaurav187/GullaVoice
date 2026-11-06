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

import Header from './components/Header';
import AudioPresetBar from './components/AudioPresetBar';
import GallaVoiceController from './components/GallaVoiceController';
import StagingCard from './components/StagingCard';
import TransactionsTable from './components/TransactionsTable';
import CustomerKhataTable from './components/CustomerKhataTable';
import RateCardModal from './components/RateCardModal';
import SettingsModal from './components/SettingsModal';

import { storage } from './utils/storage';
import { speechTTS } from './utils/speechTTS';
import { processGallaSpeech } from './services/parserEngine';

export default function App() {
  // Core persistent states
  const [transactions, setTransactions] = useState(() => storage.getTransactions());
  const [customers, setCustomers] = useState(() => storage.getCustomers());
  const [rateCard, setRateCard] = useState(() => storage.getRateCard());
  const [settings, setSettings] = useState(() => storage.getSettings());

  // Active interaction states
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

  // Sync TTS state listener
  useEffect(() => {
    speechTTS.onStateChange = (speaking) => {
      setIsTtsSpeaking(speaking);
    };
  }, []);

  // Save to localStorage whenever state updates
  useEffect(() => {
    storage.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storage.saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    storage.saveRateCard(rateCard);
  }, [rateCard]);

  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  // Aggregate stats
  const totalUdhaar = customers.reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
  const totalJama = customers.reduce((sum, c) => sum + (c.totalJama || 0), 0);

  /**
   * Handle incoming speech transcript (from live Mic or 1-click Preset)
   */
  const handleProcessTranscript = async (transcriptText) => {
    if (!transcriptText || !transcriptText.trim()) return;

    setIsProcessing(true);
    setCurrentTranscript(transcriptText);

    try {
      const parsedResult = await processGallaSpeech({
        transcript: transcriptText,
        settings,
        customers,
        rateCard
      });

      setFilteredNoise(parsedResult.ignored_side_chatter || '');
      setStagedDraft(parsedResult);

      // Auto-trigger Mandatory Native Hindi Voice Readback (TTS)
      if (settings.autoReadback && parsedResult.tts_hindi_readback) {
        // Small delay so UI renders staging card first
        setTimeout(() => {
          speechTTS.speak(parsedResult.tts_hindi_readback);
        }, 300);
      }
    } catch (err) {
      console.error('Processing error:', err);
      alert('Error parsing speech: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 1-Click Preset selection from Audio Preset Bar
   */
  const handleSelectPreset = (preset) => {
    // Stop ongoing speech
    speechTTS.stop();
    handleProcessTranscript(preset.spokenText);
  };

  /**
   * Replay Hindi TTS readback
   */
  const handleReplayAudio = () => {
    if (stagedDraft && stagedDraft.tts_hindi_readback) {
      speechTTS.speak(stagedDraft.tts_hindi_readback);
    }
  };

  /**
   * ❌ RETRY ACTION (The Confirmation Gate)
   * Stops TTS audio immediately, discards draft, and resets view
   */
  const handleRetry = () => {
    speechTTS.stop();
    setStagedDraft(null);
    setCurrentTranscript('');
    setFilteredNoise('');
  };

  /**
   * ✅ CONTINUE ACTION (The Confirmation Gate)
   * Commits draft to persistent ledger, updates customer balance, speaks confirmation
   */
  const handleContinue = () => {
    if (!stagedDraft) return;

    speechTTS.stop();

    const txnId = `TXN_${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 1. Resolve or Create Customer in persistent database
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
      // Update existing customer record
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
      // Create new customer record
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
        notes: 'Created via GallaVoice counter'
      };
      updatedCustomers.push(newCustomer);
      targetCustomerId = newCustId;
    }

    // 2. Build verified Transaction record
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
      ttsHindiText: stagedDraft.tts_hindi_readback
    };

    // 3. Persist State
    setCustomers(updatedCustomers);
    setTransactions([newTransaction, ...transactions]);
    setNewestTxnId(txnId);

    // 4. Confetti celebration
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch (e) {}

    // 5. Short 1-second native Hindi audio confirmation
    setTimeout(() => {
      speechTTS.speak('खाता अपडेट हो गया।');
    }, 150);

    // 6. Reset staged card
    setStagedDraft(null);
    setCurrentTranscript('');
    setFilteredNoise('');
  };

  /**
   * Delete transaction
   */
  const handleDeleteTransaction = (txnId) => {
    if (window.confirm('क्या आप इस लेनदेन को हटाना चाहते हैं?')) {
      setTransactions(transactions.filter(t => t.id !== txnId));
    }
  };

  /**
   * Reset all data to factory initial state
   */
  const handleResetAllData = () => {
    storage.resetAll();
    window.location.reload();
  };

  return (
    <div className="min-h-full bg-stone-100 flex flex-col">
      {/* Top Header Bar */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRateCard={() => setIsRateCardOpen(true)}
        transactions={transactions}
        customers={customers}
        rateCard={rateCard}
        totalUdhaar={totalUdhaar}
        totalJama={totalJama}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* 1-Click Simulate Noisy Galla Audio Test Bar */}
        <AudioPresetBar
          onSelectPreset={handleSelectPreset}
          isProcessing={isProcessing}
        />

        {/* Dashboard 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Galla Voice Controller & Staging Card */}
          <div className="lg:col-span-5 space-y-6">
            {/* The Staging Card with TWO GIANT ICON BUTTONS */}
            {stagedDraft ? (
              <StagingCard
                stagedDraft={stagedDraft}
                onRetry={handleRetry}
                onContinue={handleContinue}
                isTtsSpeaking={isTtsSpeaking}
                onReplayAudio={handleReplayAudio}
              />
            ) : (
              <GallaVoiceController
                onTranscriptReady={handleProcessTranscript}
                isProcessing={isProcessing}
                currentTranscript={currentTranscript}
                filteredNoise={filteredNoise}
                onReset={handleRetry}
              />
            )}
          </div>

          {/* RIGHT PANEL: Live Local Khata Tables & Customer Ledger */}
          <div className="lg:col-span-7 flex flex-col h-full space-y-4">
            {/* Tab Switcher */}
            <div className="flex items-center justify-between bg-stone-200/80 p-1 rounded-2xl">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('TRANSACTIONS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'TRANSACTIONS'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-orange-600" />
                  <span>रोजनामचा (All Transactions)</span>
                  <span className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.2 rounded-full border">
                    {transactions.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('CUSTOMERS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'CUSTOMERS'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>ग्राहक खाता (Customer Ledger)</span>
                  <span className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.2 rounded-full border">
                    {customers.length}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-stone-500 font-medium pr-3 hidden sm:block">
                ⚡ Persisted locally in browser
              </div>
            </div>

            {/* Tab Views */}
            <div className="flex-1">
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
        onResetAllData={handleResetAllData}
        transactions={transactions}
        customers={customers}
        rateCard={rateCard}
      />
    </div>
  );
}
