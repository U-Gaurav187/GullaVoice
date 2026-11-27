import React, { useState } from 'react';
import { 
  Check, 
  RotateCcw, 
  Volume2, 
  AlertTriangle, 
  UserCheck, 
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  Mic,
  Send,
  RefreshCw
} from 'lucide-react';
import { formatAksharaChips } from '../utils/alphabetDifferentiator.js';

export default function StagingCard({
  stagedDraft,
  onRetry,
  onContinue,
  onStagingVoiceCommand,
  isAutoListening = false,
  autoListenVolume = 0,
  onFinishAutoListenNow,
  isProcessing = false,
  isTtsSpeaking,
  onReplayAudio,
  language = 'hi'
}) {
  const [followUpText, setFollowUpText] = useState('');

  if (!stagedDraft) return null;

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!followUpText.trim() || isProcessing) return;
    onStagingVoiceCommand && onStagingVoiceCommand(followUpText.trim());
    setFollowUpText('');
  };

  const isUdhaar = stagedDraft.transaction_type === 'UDHAAR';
  const readbackText = language === 'hi' 
    ? (stagedDraft.tts_hindi_readback || stagedDraft.tts_readback)
    : (stagedDraft.tts_readback || stagedDraft.tts_hindi_readback);

  return (
    <div className="bg-gradient-to-b from-white to-stone-50 rounded-3xl p-6 border-2 border-orange-400 shadow-xl relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
      {/* Decorative top accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-2.5 ${isUdhaar ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4 pt-1">
        <div>
          <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
            <span>{language === 'hi' ? 'पुष्टि करें (Confirm Entry)' : 'Verify Transaction'}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              isUdhaar ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isUdhaar 
                ? (language === 'hi' ? 'उधार (Credit)' : 'UDHAAR (Credit)') 
                : (language === 'hi' ? 'जमा (Payment)' : 'JAMA (Payment)')}
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {language === 'hi' 
              ? 'AI द्वारा समझी गई प्रविष्टि सुनें और नीचे दिए गए बड़े बटन से पुष्टि करें।'
              : 'Listen to AI voice readback and tap one of the giant buttons below.'}
          </p>
        </div>

        <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded-md border border-stone-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-500" />
          Groq AI
        </span>
      </div>

      {/* Customer Matching Card */}
      <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-700" />
            <div>
              <span className="text-[11px] font-semibold text-stone-500 block">
                {language === 'hi' ? 'ग्राहक का नाम (Customer):' : 'Customer Account:'}
              </span>
              <span className="text-lg font-black text-stone-900">
                {stagedDraft.matched_customer_hindi_name || stagedDraft.matched_customer_name || stagedDraft.customer_spoken || 'Walk-in Customer'}
              </span>
              {/* Exact Akshara / Alphabet Chips */}
              {(stagedDraft.matched_customer_hindi_name || stagedDraft.matched_customer_name || stagedDraft.customer_spoken) && (
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  {formatAksharaChips(stagedDraft.matched_customer_hindi_name || stagedDraft.matched_customer_name || stagedDraft.customer_spoken).map((chip, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-amber-200 text-amber-900 font-bold"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phonetic / Alphabet Match Pill */}
          {stagedDraft.match_confidence > 0 && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                ✓ {Math.round(stagedDraft.match_confidence * 100)}% Match
              </span>
              {stagedDraft.customer_spoken && stagedDraft.customer_spoken !== stagedDraft.matched_customer_name && (
                <span className="block text-[10px] text-stone-500 mt-0.5 font-mono">
                  Heard: "{stagedDraft.customer_spoken}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Distinct Alphabet Near-Match Suggestions from Name Diary / Khata */}
        {stagedDraft.near_customer_matches && stagedDraft.near_customer_matches.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-amber-200/70 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-amber-900">
              {language === 'hi' ? 'डायरी अक्षर सुझाव (बदलने हेतु चुनें):' : 'Similar Diary Names:'}
            </span>
            {stagedDraft.near_customer_matches.map((nm, idx) => (
              <button
                key={nm.id || idx}
                type="button"
                onClick={() => onStagingVoiceCommand && onStagingVoiceCommand(`${nm.hindiName || nm.name} लिखो`)}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-white hover:bg-orange-50 text-stone-800 hover:text-orange-900 border border-amber-300 font-bold shadow-2xs transition-colors cursor-pointer"
                title={nm.diffs?.length ? `अक्षर अंतर: ${nm.diffs.map(d => `${d.token1} ≠ ${d.token2}`).join(', ')}` : nm.name}
              >
                {nm.hindiName || nm.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Sanity Alert */}
      {stagedDraft.price_sanity_alert && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 text-xs flex items-start gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">
              {language === 'hi' ? 'कीमत जाँच चेतावनी (Accent Price Alert):' : 'Rate Card Price Warning:'}
            </strong>
            <span>{stagedDraft.price_sanity_note}</span>
          </div>
        </div>
      )}

      {/* Discourse Bifurcation Breakdown (Hackathon Feature) */}
      {stagedDraft.discourse_clauses && stagedDraft.discourse_clauses.length > 0 && (
        <div className="mb-4 p-3.5 rounded-2xl bg-stone-100/90 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-orange-600" />
              <span>{language === 'hi' ? 'दुकान की बातचीत का विभाजन (Discourse Split):' : 'Speech Discourse Analysis:'}</span>
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              {stagedDraft.discourse_clauses.filter(c => c.action === 'IGNORE').length} chatter filtered
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {stagedDraft.discourse_clauses.map((clause, idx) => {
              if (clause.action === 'TARGET' || clause.type === 'LEDGER_HEADER') {
                return (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold font-devanagari"
                    title="खाता लक्ष्य (Target Customer)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    <span>🎯 {clause.utterance}</span>
                  </span>
                );
              }
              if (clause.action === 'RECORD' || clause.type === 'COMMIT_COMMAND') {
                return (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold font-devanagari"
                    title="खाता प्रविष्टि (Recorded Ledger Item)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>📝 {clause.utterance}</span>
                  </span>
                );
              }
              // Ignored side-chatter, helper commands, or queries
              return (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-stone-200/90 text-stone-500 line-through text-[11px] font-medium font-devanagari"
                  title={`${clause.type || 'Chatter'}: Ignored`}
                >
                  <XCircle className="w-3 h-3 text-stone-400" />
                  <span>{clause.utterance}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Customer Settlement Breakdown (if multiple people settled at once) */}
      {stagedDraft.multi_customers && stagedDraft.multi_customers.length > 0 && (
        <div className="mb-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="px-3 py-2 bg-emerald-50 text-[11px] font-bold text-emerald-900 flex justify-between border-b border-emerald-200">
            <span>{language === 'hi' ? 'ग्राहक अनुसार जमा विवरण (Customers Settled)' : 'Customer Settlement Split'}</span>
            <span>{language === 'hi' ? 'जमा राशि (₹)' : 'Jama (₹)'}</span>
          </div>
          <div className="divide-y divide-stone-100">
            {stagedDraft.multi_customers.map((mc, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900">{mc.hindiName || mc.name}</span>
                <span className="font-black text-emerald-700 font-mono">₹{mc.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Breakdown Table */}
      {stagedDraft.items && stagedDraft.items.length > 0 ? (
        <div className="mb-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="px-3 py-2 bg-stone-100/70 text-[11px] font-bold text-stone-600 flex justify-between border-b border-stone-200">
            <span>{language === 'hi' ? 'सामान (Item & Quantity)' : 'Item Details'}</span>
            <span>{language === 'hi' ? 'रकम (Amount ₹)' : 'Price (₹)'}</span>
          </div>
          <div className="divide-y divide-stone-100">
            {stagedDraft.items.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-stone-50">
                <div>
                  <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                  <span className="text-stone-500 ml-2 font-medium">({item.quantity})</span>
                  {item.accent_correction_note && (
                    <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                      ⚠️ {item.accent_correction_note}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-black text-stone-900 text-sm">
                    ₹{item.calculated_price_inr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Total Amount Box */}
      <div className={`mb-4 p-4 rounded-2xl flex items-center justify-between border ${
        isUdhaar ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'
      }`}>
        <div>
          <span className="text-xs font-bold text-stone-600 uppercase block">
            {isUdhaar 
              ? (language === 'hi' ? 'कुल उधार राशि (Total Credit)' : 'Total Udhaar Amount') 
              : (language === 'hi' ? 'कुल प्राप्त जमा (Payment Received)' : 'Payment Received')}
          </span>
          <span className="text-[11px] text-stone-500">
            {isUdhaar ? 'Added to customer khata' : 'Deducted from customer khata'}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-black tracking-tight ${
            isUdhaar ? 'text-red-600' : 'text-emerald-700'
          }`}>
            ₹{stagedDraft.total_amount_inr}
          </span>
        </div>
      </div>

      {/* Voice Readback Display Box */}
      <div className="mb-6 p-4 rounded-2xl bg-orange-50/80 border border-orange-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900">
            <Volume2 className={`w-4 h-4 text-orange-600 ${isTtsSpeaking ? 'animate-bounce' : ''}`} />
            <span>{language === 'hi' ? 'हिंदी वॉयस पुष्टिकरण (Audio Readback):' : 'Voice Readback (TTS):'}</span>
          </div>
          <button
            onClick={onReplayAudio}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? '🔊 फिर से सुनें' : '🔊 Replay'}</span>
          </button>
        </div>
        <p className="text-sm font-semibold text-stone-800 leading-relaxed bg-white/90 p-3 rounded-xl border border-orange-200/60 font-devanagari">
          "{readbackText}"
        </p>
      </div>

      {/* Hands-Free Two-Way Confirmation Status (No mic button click needed!) */}
      <div className={`mb-5 p-3.5 rounded-2xl border space-y-2.5 transition-all ${
        isAutoListening
          ? 'bg-emerald-50/90 border-emerald-300 shadow-xs'
          : 'bg-stone-100/80 border-stone-200'
      }`}>
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold">
            {isAutoListening ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0"></span>
                <Mic className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-emerald-950">
                  {language === 'hi'
                    ? 'सुन रहा हूँ... बिना बटन दबाए बोलें "Confirm", "गलत है", या कोई सुधार'
                    : 'Listening hands-free... Say "Confirm", "Retry", or an edit'}
                </span>
              </>
            ) : isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 text-orange-600 animate-spin shrink-0" />
                <span className="text-stone-800">
                  {language === 'hi' ? 'आपकी पुष्टि समझ रहा हूँ...' : 'Processing your voice reply...'}
                </span>
              </>
            ) : isTtsSpeaking ? (
              <>
                <Volume2 className="w-4 h-4 text-orange-600 animate-pulse shrink-0" />
                <span className="text-stone-800">
                  {language === 'hi' ? 'पढ़कर सुना रहा हूँ... इसके बाद अपने-आप सुनना शुरू होगा' : 'Reading aloud... Auto-listening starts right after'}
                </span>
              </>
            ) : (
              <span className="text-stone-600 text-[11px]">
                {language === 'hi'
                  ? 'नीचे बटन दबाएं, "फिर से सुनें" से दोबारा बोलें, या यहाँ टाइप करें:'
                  : 'Tap Confirm/Retry below, hit Replay to speak hands-free, or type here:'}
              </span>
            )}
          </div>

          {isAutoListening && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 h-4">
                {[30, 75, 100, 60, 85, 40].map((factor, i) => (
                  <span
                    key={i}
                    className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, Math.min(16, Math.round((autoListenVolume / 100) * factor)))}px` }}
                  ></span>
                ))}
              </div>
              {onFinishAutoListenNow && (
                <button
                  type="button"
                  onClick={onFinishAutoListenNow}
                  className="px-2 py-0.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold cursor-pointer"
                >
                  {language === 'hi' ? 'भेजें' : 'Send'}
                </button>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleFollowUpSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder={language === 'hi'
              ? 'या लिखकर बदलें (जैसे: Confirm / ग्राहक का नाम वैशाली है / 3.5 किलो आलू)...'
              : 'Or type "Confirm", "It is Vaishali", "3.5 kg potato"...'}
            className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
          />

          <button
            type="submit"
            disabled={!followUpText.trim() || isProcessing}
            className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-40 cursor-pointer"
            title="Apply"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* THE MANDATORY TWO GIANT ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        {/* ❌ RETRY BUTTON */}
        <button
          onClick={onRetry}
          className="group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/40 border-2 border-red-400 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:rotate-180 transition-transform duration-300">
            <RotateCcw className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <span className="text-lg font-black tracking-wide">
            {language === 'hi' ? '❌ गलत है' : '❌ RETRY'}
          </span>
          <span className="text-xs font-bold text-red-100 mt-0.5">
            {language === 'hi' ? 'फिर से बोलें' : 'Discard & Re-speak'}
          </span>
        </button>

        {/* ✅ CONTINUE BUTTON */}
        <button
          onClick={onContinue}
          className="group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 border-2 border-emerald-400 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </div>
          <span className="text-lg font-black tracking-wide">
            {language === 'hi' ? '✅ सही है' : '✅ SAVE'}
          </span>
          <span className="text-xs font-bold text-emerald-100 mt-0.5">
            {language === 'hi' ? 'खाते में जोड़ें' : 'Commit to Ledger'}
          </span>
        </button>
      </div>
    </div>
  );
}
