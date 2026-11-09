import React from 'react';
import { 
  Volume2, 
  X, 
  UserCheck, 
  ArrowRight, 
  Sparkles,
  TrendingDown,
  TrendingUp,
  Receipt,
  Users,
  CheckCircle2,
  ShoppingBag,
  FileText
} from 'lucide-react';

export default function VoiceAssistantAnswerCard({
  queryResult,
  onClose,
  onReplayAudio,
  onViewCustomer,
  onViewTransactions,
  onViewRateCard,
  onOpenPdfReport,
  language = 'hi'
}) {
  if (!queryResult) return null;

  const isHindi = language === 'hi';
  const { query_answer, tts_hindi_readback, tts_readback, ignored_side_chatter, customer_data, query_type, rate_card_updates } = queryResult;
  const answerText = isHindi ? (tts_hindi_readback || tts_readback) : (tts_readback || tts_hindi_readback);

  return (
    <div className="bg-gradient-to-b from-white to-amber-50/40 rounded-3xl p-6 sm:p-7 border-2 border-amber-400/90 shadow-xl relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 text-left">
      {/* Top decorative accent bar */}
      <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"></div>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span>{isHindi ? 'गल्ला वॉयस उत्तर' : 'Voice Khata Answer'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-300">
                {isHindi ? 'लाइव उत्तर' : 'Two-Way Voice'}
              </span>
            </h3>
            <p className="text-xs text-stone-500">
              {isHindi ? 'खाता बही से खोजकर बोला गया उत्तर' : 'Live balance spoken aloud from ledger'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          title={isHindi ? 'बंद करें' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Spoken Question Prompt */}
      {queryResult.rawTranscript && (
        <div className="mb-3 p-3 rounded-2xl bg-stone-100/80 border border-stone-200/80 text-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
            {isHindi ? 'सुना गया सवाल:' : 'Question Asked:'}
          </span>
          <p className="font-semibold text-stone-800 italic">
            "{queryResult.rawTranscript}"
          </p>
        </div>
      )}

      {/* Filtered Noise Strikethrough if side-talk happened */}
      {ignored_side_chatter && (
        <div className="mb-3 p-2.5 rounded-xl bg-stone-100/90 border border-stone-200 text-xs flex items-center gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0">
            {isHindi ? 'हटाया गया शोर:' : 'Ignored Chatter:'}
          </span>
          <div className="flex flex-wrap gap-1">
            {ignored_side_chatter.split('|').map(s => s.trim()).filter(Boolean).map((noise, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-stone-200 text-stone-500 font-mono text-[11px] line-through">
                <s>{noise}</s>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Answer Hero Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 mb-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
              {query_answer?.title || (isHindi ? 'खाता स्थिति' : 'Account Status')}
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
              {query_answer?.customerName || query_answer?.title}
            </h4>
            {query_answer?.details && (
              <p className="text-xs font-semibold text-stone-600 mt-1">
                {query_answer.details}
              </p>
            )}
          </div>

          {/* Huge Main Metric Highlight */}
          <div className="text-right shrink-0">
            <span className="text-2xl sm:text-3xl font-black text-amber-900 font-mono block">
              {query_answer?.mainMetric || `₹${(queryResult.total_amount_inr || 0).toLocaleString('en-IN')}`}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 inline-block mt-0.5">
              {query_answer?.metricLabel || (isHindi ? 'बाकी' : 'Balance')}
            </span>
          </div>
        </div>
      </div>

      {/* Rate Card Updated Items List */}
      {rate_card_updates && rate_card_updates.length > 0 && (
        <div className="mb-4 space-y-2 p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            {isHindi ? 'अपडेट किए गए सामान (Updated Items):' : 'Updated Items:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rate_card_updates.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-stone-900 block">
                    {item.hindiName || item.name}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {item.isNew 
                      ? (isHindi ? '✨ नया सामान जोड़ा गया' : '✨ New Item Added') 
                      : (isHindi ? `पहले: ₹${item.oldPrice}` : `Was: ₹${item.oldPrice}`)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-900 font-mono">
                    ₹{item.newPrice}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-600 block">
                    /{item.unit === 'pao' ? (isHindi ? 'पाव' : 'pao') : item.unit === 'pkt' ? (isHindi ? 'पैकेट' : 'pkt') : item.unit === 'ltr' ? (isHindi ? 'लीटर' : 'ltr') : item.unit === 'pc' ? (isHindi ? 'नग' : 'pc') : (isHindi ? 'किग्रा' : 'kg')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {answerText && (
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
            <p className="text-xs sm:text-sm font-bold text-stone-800 font-devanagari leading-relaxed">
              "{answerText}"
            </p>
          </div>

          <button
            type="button"
            onClick={onReplayAudio}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isHindi ? 'आवाज़ दोबारा सुनें' : 'Replay Audio'}
          >
            <Volume2 className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">{isHindi ? 'दोबारा सुनें' : 'Replay'}</span>
          </button>
        </div>
      )}

      {/* Footer Navigation & Done Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
        <div className="flex items-center gap-2">
          {customer_data && onViewCustomer && (
            <button
              type="button"
              onClick={() => onViewCustomer(customer_data)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{isHindi ? 'पूरा खाता देखें' : 'View Full Ledger'}</span>
            </button>
          )}

          {query_type === 'TODAY_SUMMARY' && onViewTransactions && (
            <button
              type="button"
              onClick={onViewTransactions}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
              <span>{isHindi ? 'आज का रोजनामचा देखें' : 'View Transactions'}</span>
            </button>
          )}

          {query_type === 'RATE_CARD_UPDATED' && onViewRateCard && (
            <button
              type="button"
              onClick={onViewRateCard}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>{isHindi ? 'पूरा रेट कार्ड देखें' : 'View Rate Card'}</span>
            </button>
          )}

          {(query_type === 'PDF_REPORT' || queryResult.intent === 'GENERATE_PDF') && onOpenPdfReport && (
            <button
              type="button"
              onClick={onOpenPdfReport}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isHindi ? 'PDF रिपोर्ट खोलें' : 'Open PDF Report'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isHindi ? 'ठीक है (Done)' : 'Done'}</span>
        </button>
      </div>
    </div>
  );
}
