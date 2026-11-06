import React, { useEffect } from 'react';
import { 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  UserCheck, 
  Tag, 
  Sparkles, 
  Clock, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { speechTTS } from '../utils/speechTTS';

export default function StagingCard({
  stagedDraft,
  onRetry,
  onContinue,
  isTtsSpeaking,
  onReplayAudio
}) {
  if (!stagedDraft) return null;

  const isUdhaar = stagedDraft.transaction_type === 'UDHAAR';
  const isNoiseOnly = stagedDraft.intent === 'NOISE_ONLY';

  return (
    <div className="bg-gradient-to-b from-white to-stone-50 rounded-3xl p-6 border-2 border-orange-300 shadow-xl relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
      {/* Decorative top accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-2 ${isUdhaar ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            2
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span>पुष्टि करें (Verify Draft Before Commit)</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                isUdhaar ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isUdhaar ? 'उधार (Credit / Udhaar)' : 'जमा (Payment / Jama)'}
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              Listen to the voice readback and tap one of the giant action buttons below.
            </p>
          </div>
        </div>

        {/* Source engine badge */}
        <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded-md border border-stone-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-500" />
          {stagedDraft.sourceEngine || 'Galla AI Parser'}
        </span>
      </div>

      {/* Customer Matching & Phonetic Identification */}
      <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-700" />
            <div>
              <span className="text-[11px] font-semibold text-stone-500 block">ग्राहक (Customer Name):</span>
              <span className="text-lg font-bold text-stone-900">
                {stagedDraft.matched_customer_name || stagedDraft.customer_spoken || 'अज्ञात ग्राहक'}
              </span>
            </div>
          </div>

          {/* Phonetic Match Pill */}
          {stagedDraft.match_confidence > 0 && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
                ✓ {Math.round(stagedDraft.match_confidence * 100)}% फोनेटिक मैच
              </span>
              {stagedDraft.customer_spoken && stagedDraft.customer_spoken !== stagedDraft.matched_customer_name && (
                <span className="block text-[10px] text-stone-500 mt-0.5 font-mono">
                  बोला गया: "{stagedDraft.customer_spoken}"
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price Sanity Alert (Requirement 2) */}
      {stagedDraft.price_sanity_alert && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">कीमत जाँच चेतावनी (Accent Price Sanity Warning):</strong>
            <span>{stagedDraft.price_sanity_note || 'Spoken price differed significantly from rate card standard rate and was auto-adjusted.'}</span>
          </div>
        </div>
      )}

      {/* Items Breakdown Table */}
      {stagedDraft.items && stagedDraft.items.length > 0 ? (
        <div className="mb-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="px-3 py-2 bg-stone-100/70 text-[11px] font-bold text-stone-600 flex justify-between border-b border-stone-200">
            <span>सामान विवरण (Item & Quantity)</span>
            <span>रकम (Amount ₹)</span>
          </div>
          <div className="divide-y divide-stone-100">
            {stagedDraft.items.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-stone-50">
                <div>
                  <span className="font-bold text-stone-900">{item.name}</span>
                  <span className="text-stone-500 ml-2 font-medium">({item.quantity})</span>
                  {item.accent_correction_note && (
                    <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                      ⚠️ {item.accent_correction_note}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-900 text-sm">
                    ₹{item.calculated_price_inr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        isUdhaar && (
          <div className="mb-4 p-3 rounded-xl bg-stone-100 text-stone-600 text-xs">
            सीधे खाते में उधार रकम जोड़ी जा रही है।
          </div>
        )
      )}

      {/* Total Amount Display Box */}
      <div className={`mb-4 p-4 rounded-2xl flex items-center justify-between border ${
        isUdhaar ? 'bg-red-50/70 border-red-200' : 'bg-emerald-50/70 border-emerald-200'
      }`}>
        <div>
          <span className="text-xs font-semibold text-stone-600 uppercase block">
            {isUdhaar ? 'कुल उधार राशि (Total Credit)' : 'कुल प्राप्त जमा (Payment Received)'}
          </span>
          <span className="text-xs text-stone-500">
            {isUdhaar ? 'ग्राहक के खाते में जुड़ेगा' : 'ग्राहक के खाते से कटेगा'}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-extrabold tracking-tight ${
            isUdhaar ? 'text-red-600' : 'text-emerald-700'
          }`}>
            ₹{stagedDraft.total_amount_inr}
          </span>
        </div>
      </div>

      {/* Mandatory Native Hindi Readback Stage Box (Requirement 3) */}
      <div className="mb-6 p-4 rounded-2xl bg-orange-50/80 border border-orange-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900">
            <Volume2 className={`w-4 h-4 text-orange-600 ${isTtsSpeaking ? 'animate-bounce' : ''}`} />
            <span>हिंदी वॉयस पुष्टिकरण (Native Hindi Audio Readback):</span>
          </div>
          <button
            onClick={onReplayAudio}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors"
            title="ऑडियो फिर से सुनें"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>🔊 फिर से सुनें (Replay)</span>
          </button>
        </div>
        <p className="text-sm font-devanagari font-semibold text-stone-800 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-orange-200/60">
          "{stagedDraft.tts_hindi_readback}"
        </p>
      </div>

      {/* THE MANDATORY TWO-ICON CONFIRMATION GATE (Requirement 4) */}
      {/* "render ONLY TWO massive, thumb-friendly icon buttons covering the bottom half" */}
      <div className="pt-2">
        <div className="text-center mb-2">
          <span className="text-xs font-extrabold text-stone-700 tracking-wider uppercase">
            👇 अंतिम निर्णय (CHOOSE ACTION) 👇
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* ❌ RETRY BUTTON (Red, Refresh/Mic icon - "गलत है / फिर से बोलें") */}
          <button
            onClick={onRetry}
            className="group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/40 border-2 border-red-400 active:scale-95 transition-all duration-150 cursor-pointer"
            title="गलत है - रद्द करके फिर से बोलें"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:rotate-180 transition-transform duration-300">
              <RotateCcw className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <span className="text-lg font-black tracking-wide">
              ❌ गलत है
            </span>
            <span className="text-xs font-bold text-red-100 mt-0.5">
              फिर से बोलें (RETRY)
            </span>
          </button>

          {/* ✅ CONTINUE BUTTON (Green, Checkmark icon - "सही है / खाते में जोड़ें") */}
          <button
            onClick={onContinue}
            className="group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 border-2 border-emerald-400 active:scale-95 transition-all duration-150 cursor-pointer"
            title="सही है - खाते में पक्का जोड़ें"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
              <Check className="w-8 h-8 text-white stroke-[3]" />
            </div>
            <span className="text-lg font-black tracking-wide">
              ✅ सही है
            </span>
            <span className="text-xs font-bold text-emerald-100 mt-0.5">
              खाते में जोड़ें (SAVE)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
