import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Volume2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { speechTTS } from '../utils/speechTTS';

export default function TransactionsTable({
  transactions = [],
  onDeleteTransaction,
  onSelectTransaction,
  newestTxnId,
  language = 'hi'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'UDHAAR' | 'JAMA'

  const filteredTxns = transactions.filter(t => {
    const matchesSearch = 
      (t.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerHindiName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerUpName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerSpoken || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.matchedCustomerId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || t.transactionType === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatShortTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const handleSpeakSummary = (e, txn) => {
    e.stopPropagation();
    if (txn.ttsHindiText) {
      speechTTS.speak(txn.ttsHindiText);
    }
  };

  const handleDelete = (e, txnId) => {
    e.stopPropagation();
    onDeleteTransaction(txnId);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/60">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>खाता रोजनामचा</span>
            <span className="text-stone-400 font-normal text-xs">(All Transactions)</span>
            <span className="bg-stone-200 text-stone-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredTxns.length}
            </span>
          </h3>
          <p className="text-[11px] text-stone-500">
            {language === 'hi' ? 'किसी भी प्रविष्टि पर क्लिक करके पूरी रसीद और समय देखें' : 'Click any row to view full itemized receipt & exact time'}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="ग्राहक या नाम खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex rounded-xl bg-stone-200/70 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              सभी
            </button>
            <button
              onClick={() => setTypeFilter('UDHAAR')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'UDHAAR' ? 'bg-red-500 text-white shadow-xs' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              उधार
            </button>
            <button
              onClick={() => setTypeFilter('JAMA')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'JAMA' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              जमा
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto flex-1 max-h-[580px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-100/70 text-stone-600 font-bold border-b border-stone-200 uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-2.5 px-4">समय (Time)</th>
              <th className="py-2.5 px-4">ग्राहक (Customer)</th>
              <th className="py-2.5 px-4">प्रकार (Type)</th>
              <th className="py-2.5 px-4">सामान व दर (Items & Rates)</th>
              <th className="py-2.5 px-4">रकम (Total ₹)</th>
              <th className="py-2.5 px-4">हटाया गया शोर</th>
              <th className="py-2.5 px-4 text-right">कार्रवाई</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-stone-400">
                  <p className="text-sm font-semibold">कोई लेनदेन नहीं मिला</p>
                  <p className="text-xs text-stone-400 mt-1">माइक दबाकर बोलना शुरू करें</p>
                </td>
              </tr>
            ) : (
              filteredTxns.map((txn) => {
                const isUdhaar = txn.transactionType === 'UDHAAR';
                const isNew = txn.id === newestTxnId;

                return (
                  <tr 
                    key={txn.id} 
                    onClick={() => onSelectTransaction && onSelectTransaction(txn)}
                    className={`transition-colors cursor-pointer group hover:bg-amber-50/60 ${
                      isNew ? 'bg-orange-50/80 animate-in fade-in duration-300' : ''
                    }`}
                    title="पूरी खरीद रसीद देखने के लिए क्लिक करें"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{formatShortTime(txn.timestamp)}</span>
                      </div>
                    </td>

                    {/* Customer Info (English, Hindi & UP Native!) */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                        <span>{txn.customerName}</span>
                        <span className="text-[11px] font-devanagari text-stone-600 font-medium">
                          ({txn.customerHindiName || txn.customerName})
                        </span>
                      </div>
                      {/* UP Native Honorific display */}
                      <div className="text-[10px] text-orange-800 font-medium mt-0.5 font-devanagari">
                        🇮🇳 {txn.customerUpName || 'मान्य ग्राहक'}
                      </div>
                    </td>

                    {/* Transaction Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isUdhaar 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isUdhaar ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isUdhaar ? 'उधार' : 'जमा'}</span>
                      </span>
                    </td>

                    {/* Items & Rates (Every item priced explicitly!) */}
                    <td className="py-3 px-4">
                      {txn.items && txn.items.length > 0 ? (
                        <div className="flex flex-col gap-1 max-w-[240px]">
                          {txn.items.map((item, idx) => (
                            <span 
                              key={idx}
                              className="text-[11px] text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 inline-flex items-center justify-between"
                            >
                              <span className="font-medium">{item.quantity} {item.name}</span>
                              <span className="font-bold text-stone-900 ml-2">
                                ₹{item.calculatedPrice || item.price || 0}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">
                          {isUdhaar ? 'नकद उधार' : 'सीधा भुगतान'}
                        </span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-base font-black ${
                        isUdhaar ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        ₹{txn.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Ignored Noise badge */}
                    <td className="py-3 px-4 max-w-[160px]">
                      {txn.ignoredNoise ? (
                        <div className="flex flex-wrap gap-1">
                          {txn.ignoredNoise.split('|').slice(0, 2).map((chunk, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-400 line-through text-[10px] truncate max-w-[140px] block">
                              {chunk.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleSpeakSummary(e, txn)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="Listen Voice Readback"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, txn.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
