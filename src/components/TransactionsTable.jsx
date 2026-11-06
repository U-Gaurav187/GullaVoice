import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  User, 
  Tag, 
  MessageSquareX,
  Volume2
} from 'lucide-react';
import { speechTTS } from '../utils/speechTTS';

export default function TransactionsTable({
  transactions = [],
  onDeleteTransaction,
  newestTxnId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'UDHAAR' | 'JAMA'

  const filteredTxns = transactions.filter(t => {
    const matchesSearch = 
      (t.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.customerSpoken || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.matchedCustomerId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || t.transactionType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSpeakSummary = (txn) => {
    if (txn.ttsHindiText) {
      speechTTS.speak(txn.ttsHindiText);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Controls */}
      <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>खाता रोजनामचा</span>
            <span className="text-stone-500 font-normal text-xs">(All Transactions Ledger)</span>
            <span className="bg-stone-200 text-stone-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredTxns.length}
            </span>
          </h3>
          <p className="text-xs text-stone-500">Live ledger persisted in your browser's local database</p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="ग्राहक खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex rounded-xl bg-stone-200/70 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                typeFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              सभी
            </button>
            <button
              onClick={() => setTypeFilter('UDHAAR')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                typeFilter === 'UDHAAR' ? 'bg-red-500 text-white shadow-xs' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              उधार
            </button>
            <button
              onClick={() => setTypeFilter('JAMA')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                typeFilter === 'JAMA' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              जमा
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto flex-1 max-h-[520px]">
        {filteredTxns.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            कोई लेनदेन नहीं मिला। ऊपर माइक से बोलकर या ऑडियो सिमुलेटर से नया लेनदेन जोड़ें।
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-100/70 text-stone-600 font-bold border-b border-stone-200 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">समय (Time)</th>
                <th className="py-2.5 px-3">ग्राहक (Customer)</th>
                <th className="py-2.5 px-3">प्रकार (Type)</th>
                <th className="py-2.5 px-3">सामान (Items)</th>
                <th className="py-2.5 px-3">रकम (Total ₹)</th>
                <th className="py-2.5 px-3">हटाया गया शोर (Noise Log)</th>
                <th className="py-2.5 px-3 text-right">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTxns.map((txn) => {
                const isNew = txn.id === newestTxnId;
                const isUdhaar = txn.transactionType === 'UDHAAR';

                return (
                  <tr
                    key={txn.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      isNew ? 'animate-flash-row bg-emerald-50 font-medium' : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(txn.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{txn.customerName}</span>
                        {txn.matchedCustomerId && (
                          <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                            {txn.matchedCustomerId}
                          </span>
                        )}
                      </div>
                      {txn.customerSpoken && txn.customerSpoken !== txn.customerName && (
                        <span className="text-[10px] text-stone-400 block font-mono">
                          बोला: "{txn.customerSpoken}"
                        </span>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isUdhaar 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isUdhaar ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-red-500" />
                            उधार
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 text-emerald-600" />
                            जमा
                          </>
                        )}
                      </span>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-3 max-w-[200px]">
                      {txn.items && txn.items.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {txn.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200"
                            >
                              {it.quantity} {it.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">सीधा भुगतान</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`font-bold text-sm ${
                        isUdhaar ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        ₹{txn.totalAmount}
                      </span>
                    </td>

                    {/* Ignored Noise Log */}
                    <td className="py-3 px-3 max-w-[150px]">
                      {txn.ignoredNoise ? (
                        <span 
                          className="line-through text-stone-400 text-[10px] truncate block font-mono bg-stone-100 px-1.5 py-0.5 rounded"
                          title={`Ignored Side-Chatter: ${txn.ignoredNoise}`}
                        >
                          {txn.ignoredNoise}
                        </span>
                      ) : (
                        <span className="text-stone-300 text-[10px]">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSpeakSummary(txn)}
                          className="p-1 rounded text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="बोलकर सुनाएं"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(txn.id)}
                          className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
