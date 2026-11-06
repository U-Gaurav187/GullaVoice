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
  Filter,
  ShoppingBag,
  Share2,
  CheckCircle2,
  Layers,
  History
} from 'lucide-react';
import { speechTTS } from '../utils/speechTTS';

export default function PurchaseDetailModal({
  transaction,
  customer,
  transactions = [],
  onClose,
  language = 'hi'
}) {
  if (!transaction && !customer) return null;

  const isTxnView = Boolean(transaction);

  // Format exact date & timestamp
  const formatExactTime = (isoString) => {
    if (!isoString) return { dateStr: 'आज', timeStr: '' };
    try {
      const d = new Date(isoString);
      return {
        dateStr: d.toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeStr: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      };
    } catch (e) {
      return { dateStr: isoString, timeStr: '' };
    }
  };

  // If customer view, find all associated transactions
  const customerTxns = !isTxnView && customer ? transactions.filter(t => {
    if (t.matchedCustomerId && (t.matchedCustomerId === customer.id || t.matchedCustomerId.toLowerCase() === customer.id.toLowerCase())) {
      return true;
    }
    if (t.customerName && customer.name && t.customerName.toLowerCase() === customer.name.toLowerCase()) {
      return true;
    }
    if (t.customerHindiName && customer.hindiName && t.customerHindiName === customer.hindiName) {
      return true;
    }
    if (customer.aliases && Array.isArray(customer.aliases)) {
      const tName = (t.customerName || '').toLowerCase();
      const tHindi = t.customerHindiName || '';
      const tSpoken = (t.customerSpoken || '').toLowerCase();
      if (customer.aliases.some(a => {
        const al = a.toLowerCase();
        return al === tName || al === tSpoken || a === tHindi;
      })) {
        return true;
      }
    }
    return false;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];

  const isUdhaar = isTxnView ? transaction.transactionType === 'UDHAAR' : (customer?.netBalance > 0);

  const handleSpeakText = (text) => {
    if (text) {
      speechTTS.speak(text, 'hi');
    }
  };

  const handleShareWhatsApp = (cust) => {
    if (!cust) return;
    const message = `नमस्ते ${cust.name} जी, आपकी किराना दुकान पर कुल बाकी राशि ₹${cust.netBalance} है। कृपया समय पर भुगतान करें। धन्यवाद!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const activeCustomerName = transaction?.customerName || customer?.name;
  const activeHindiName = transaction?.customerHindiName || customer?.hindiName || activeCustomerName;
  const activeUpName = transaction?.customerUpName || customer?.upNativeName || 'मान्य ग्राहक';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between relative ${
          isUdhaar ? 'bg-red-50/80' : 'bg-emerald-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
              isUdhaar ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isTxnView ? (
                isUdhaar ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />
              ) : (
                <History className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-stone-900">
                  {isTxnView 
                    ? (language === 'hi' ? 'खरीद और रसीद विवरण' : 'Purchase Receipt Record') 
                    : `${activeCustomerName} - पूरा बहीखाता`}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  isUdhaar ? 'bg-red-100 text-red-800 border-red-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {isTxnView 
                    ? (isUdhaar ? 'उधार' : 'जमा') 
                    : (customer?.netBalance > 0 ? 'उधार बाकी' : 'खाता बराबर')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5 font-medium">
                {isTxnView ? (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatExactTime(transaction?.timestamp).dateStr}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatExactTime(transaction?.timestamp).timeStr}</span>
                    </span>
                  </>
                ) : (
                  <span>दुकान का खाता एवं पुरानी सभी खरीद का विवरण</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone-500 hover:text-stone-900 flex items-center justify-center border border-stone-200 transition-colors cursor-pointer shadow-xs"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Customer Tri-Lingual Name Card (Clean, NO ID, NO Phone number) */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                खाताधारक विवरण (Account Holder):
              </span>
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                  <span>{activeCustomerName}</span>
                  <span className="font-devanagari text-stone-600 font-bold">
                    ({activeHindiName})
                  </span>
                </div>
                {/* UP Native Honorific display */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-orange-100/90 text-orange-950 font-semibold text-[11px] border border-orange-200">
                  <span>🇮🇳 देशी यूपी नाम:</span>
                  <span className="font-bold">{activeUpName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                <span>नियमित ग्राहक</span>
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEW MODE 1: CUSTOMER KHATA WITH FULL ITEM PURCHASE HISTORY */}
          {/* ======================================================== */}
          {!isTxnView && customer && (
            <div className="space-y-4">
              {/* Account Balance Summary Badges */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-[10px] font-bold text-stone-500 uppercase block">कुल उधार</span>
                  <span className="text-base sm:text-lg font-black text-red-600 font-mono">
                    ₹{customer.totalUdhaar.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-[10px] font-bold text-stone-500 uppercase block">कुल जमा</span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                    ₹{customer.totalJama.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl border text-center ${
                  customer.netBalance > 0 
                    ? 'bg-red-50 border-red-200 text-red-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-[10px] font-bold uppercase block">
                    {customer.netBalance > 0 ? 'बाकी बकाया' : 'खाता शेष'}
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono">
                    ₹{Math.abs(customer.netBalance).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Purchase History Header */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-600" />
                  <h4 className="text-sm font-black text-stone-900">
                    खरीद व उधार का पूरा इतिहास ({customerTxns.length} प्रविष्टियां)
                  </h4>
                </div>
                <span className="text-[11px] text-stone-500">
                  नई से पुरानी क्रम में
                </span>
              </div>

              {/* Full Itemized History List */}
              {customerTxns.length > 0 ? (
                <div className="space-y-3">
                  {customerTxns.map((txn, index) => {
                    const isTxnUdhaar = txn.transactionType === 'UDHAAR';
                    const { dateStr, timeStr } = formatExactTime(txn.timestamp);

                    return (
                      <div 
                        key={txn.id || index}
                        className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs hover:border-orange-300 transition-all"
                      >
                        {/* Transaction Card Header */}
                        <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                          isTxnUdhaar ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isTxnUdhaar 
                                ? 'bg-red-100 text-red-800 border-red-200' 
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {isTxnUdhaar ? 'उधार' : 'जमा'}
                            </span>
                            <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>{dateStr}</span>
                            </span>
                            <span className="text-xs font-mono text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>{timeStr}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-base font-black ${
                              isTxnUdhaar ? 'text-red-600' : 'text-emerald-700'
                            }`}>
                              ₹{txn.totalAmount.toLocaleString('en-IN')}
                            </span>
                            {txn.ttsHindiText && (
                              <button
                                type="button"
                                onClick={() => handleSpeakText(txn.ttsHindiText)}
                                className="p-1 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-stone-100 transition-colors cursor-pointer"
                                title="आवाज़ सुनें"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Items in this Transaction */}
                        {txn.items && txn.items.length > 0 ? (
                          <div className="p-3 divide-y divide-stone-100">
                            {txn.items.map((item, iIdx) => (
                              <div key={iIdx} className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                  <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                                    <ShoppingBag className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                    <span>{item.name}</span>
                                    <span className="text-stone-500 font-normal">({item.quantity})</span>
                                  </div>
                                  {item.unitPrice && (
                                    <span className="text-[10px] text-stone-400 block mt-0.5 ml-5">
                                      दर: ₹{item.unitPrice} प्रति इकाई
                                    </span>
                                  )}
                                  {item.accentNote && (
                                    <span className="text-[10px] text-amber-700 font-medium block mt-0.5 ml-5">
                                      💡 {item.accentNote}
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-stone-900 text-xs font-mono">
                                  ₹{item.calculatedPrice || item.price || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-stone-500 text-xs italic bg-stone-50/50">
                            {isTxnUdhaar ? 'नकद उधार राशि दर्ज की गई' : 'नकद भुगतान प्राप्त (खाते में जमा)'}
                          </div>
                        )}

                        {/* Voice readback / Original voice note */}
                        {txn.rawTranscript && (
                          <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-600 flex items-center gap-1.5">
                            <span className="font-bold text-stone-400 shrink-0">🎙️ आवाज़:</span>
                            <span className="italic truncate font-devanagari">"{txn.rawTranscript}"</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
                  <Receipt className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-bold text-stone-700">
                    पुराना बहीखाता बकाया: ₹{customer.totalUdhaar}
                  </p>
                  <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                    यह बकाया दुकान के पिछले खाते से दर्ज है। अब ग्राहक जब भी आवाज़ से सामान लेगा, वह ठीक ऊपर पूरी रसीद और समय के साथ दिखता रहेगा।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW MODE 2: SINGLE TRANSACTION DETAIL (CLICKED FROM ALL TRANSACTIONS) */}
          {/* ======================================================== */}
          {isTxnView && transaction && (
            <div className="space-y-4">
              {/* Itemized Purchases Breakdown */}
              {transaction.items && transaction.items.length > 0 ? (
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
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-center text-xs">
                  {isUdhaar ? 'नकद उधार प्रविष्टि' : 'नकद भुगतान प्रविष्टि'}
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
                    इस समय खाते में दर्ज की गई
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black ${isUdhaar ? 'text-red-600' : 'text-emerald-700'}`}>
                    ₹{transaction.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Voice Transcript & Filtered Noise details */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    माइक से सुनी गई मूल आवाज़ (Original Voice Command):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSpeakText(transaction.ttsHindiText || transaction.rawTranscript)}
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/60 flex items-center justify-between">
          {!isTxnView && customer && customer.netBalance > 0 ? (
            <button
              type="button"
              onClick={() => handleShareWhatsApp(customer)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp तकादा भेजें</span>
            </button>
          ) : (
            <div></div>
          )}

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