import React from 'react';
import { 
  X, 
  Clock, 
  User, 
  Calendar, 
  Receipt, 
  Volume2, 
  CheckCircle, 
  AlertCircle,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Filter
} from 'lucide-react';
import { speechTTS } from '../utils/speechTTS';

export default function PurchaseDetailModal({
  transaction,
  customer,
  onClose,
  language = 'hi'
}) {
  if (!transaction && !customer) return null;

  const isTxnView = Boolean(transaction);
  const isUdhaar = isTxnView ? transaction.transactionType === 'UDHAAR' : (customer.netBalance > 0);

  // Format exact date & timestamp
  const formatExactTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return {
        dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      };
    } catch (e) {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  const { dateStr, timeStr } = formatExactTime(transaction ? transaction.timestamp : customer?.lastUpdated);

  const handleSpeak = () => {
    if (transaction?.ttsHindiText) {
      speechTTS.speak(transaction.ttsHindiText, language);
    } else if (customer) {
      const summary = `${customer.name} जी का कुल बकाया ${customer.netBalance} रुपये है।`;
      speechTTS.speak(summary, 'hi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with colored strip */}
        <div className={`p-5 border-b border-stone-200 flex items-center justify-between relative ${
          isUdhaar ? 'bg-red-50/70' : 'bg-emerald-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
              isUdhaar ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isUdhaar ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900">
                  {isTxnView ? (language === 'hi' ? 'खरीद और खाता विवरण' : 'Purchase & Ledger Record') : 'ग्राहक बहीखाता विवरण'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  isUdhaar ? 'bg-red-100 text-red-800 border-red-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {isUdhaar ? 'उधार (Credit)' : 'जमा (Payment)'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>{dateStr}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-stone-600">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{timeStr}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone-500 hover:text-stone-900 flex items-center justify-center border border-stone-200 transition-colors cursor-pointer shadow-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Customer Tri-Lingual Name Card */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                खाताधारक विवरण (Account Holder):
              </span>
              <div className="space-y-1">
                <div className="text-base font-black text-stone-900">
                  {transaction?.customerName || customer?.name}
                  <span className="ml-2 font-devanagari text-stone-600 font-bold">
                    ({transaction?.customerHindiName || customer?.hindiName || customer?.name})
                  </span>
                </div>
                {/* UP Native Honorific */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-orange-100/90 text-orange-950 font-semibold text-[11px] border border-orange-200">
                  <span>🇮🇳 देशी यूपी नाम:</span>
                  <span className="font-bold">{transaction?.customerUpName || customer?.upNativeName || 'मान्य ग्राहक'}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-stone-400 font-mono block">ID: {transaction?.matchedCustomerId || customer?.id}</span>
              {customer?.phone && (
                <span className="text-[11px] text-stone-600 font-mono mt-0.5 block">{customer.phone}</span>
              )}
            </div>
          </div>

          {/* Itemized Purchases Breakdown (Every item priced explicitly!) */}
          {transaction?.items && transaction.items.length > 0 ? (
            <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-xs">
              <div className="px-4 py-2.5 bg-stone-100/80 font-bold text-stone-700 flex justify-between border-b border-stone-200 text-[11px] uppercase tracking-wider">
                <span>सामान व मात्रा (Item & Quantity)</span>
                <span>दर एवं कुल रकम (Price ₹)</span>
              </div>

              <div className="divide-y divide-stone-100">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-stone-50">
                    <div>
                      <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-stone-500 text-xs font-normal">({item.quantity})</span>
                      </div>
                      {item.unitPrice && (
                        <span className="text-[11px] text-stone-400 block mt-0.5">
                          दर: ₹{item.unitPrice} प्रति इकाई
                        </span>
                      )}
                      {item.accentNote && (
                        <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                          ⚠️ {item.accentNote}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-stone-900">
                        ₹{item.calculatedPrice || item.price || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-center">
              {isUdhaar ? 'सीधा उधार दर्ज किया गया (Direct credit record)' : 'नकद भुगतान प्राप्त (Cash payment received)'}
            </div>
          )}

          {/* Total Amount Box */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isUdhaar ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'
          }`}>
            <div>
              <span className="text-xs font-bold text-stone-600 uppercase block">
                {isUdhaar ? 'कुल उधार रकम (Total Credit):' : 'कुल जमा रकम (Total Payment):'}
              </span>
              <span className="text-[11px] text-stone-500">
                {isTxnView ? 'इस समय खाते में दर्ज की गई' : 'वर्तमान कुल शुद्ध बकाया'}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-black ${isUdhaar ? 'text-red-600' : 'text-emerald-700'}`}>
                ₹{(transaction?.totalAmount || customer?.netBalance || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Voice Transcript & Filtered Noise details */}
          {transaction && (
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  माइक से सुनी गई मूल आवाज़ (Original Voice Command):
                </span>
                <button
                  type="button"
                  onClick={handleSpeak}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>आवाज़ सुनें</span>
                </button>
              </div>

              <p className="text-xs font-medium text-stone-800 bg-white p-2.5 rounded-xl border border-stone-200 font-devanagari italic">
                "{transaction.rawTranscript || transaction.ttsHindiText || 'Voice record'}"
              </p>

              {transaction.ignoredNoise && (
                <div className="pt-2 border-t border-stone-200">
                  <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1 mb-1">
                    <Filter className="w-3 h-3 text-orange-600" />
                    <span>हटाया गया काउंटर शोर (Ignored Counter Chatter):</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {transaction.ignoredNoise.split('|').map((chunk, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-stone-200 text-stone-500 line-through text-[10px] font-mono">
                        {chunk.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
