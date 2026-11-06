import React, { useState } from 'react';
import { UserCheck, Phone, ArrowUpRight, ArrowDownLeft, Share2, Search, CheckCircle, Plus } from 'lucide-react';

export default function CustomerKhataTable({
  customers = [],
  onRecordQuickPayment,
  onAddNewCustomer
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.hindiName && c.hindiName.includes(searchTerm)) ||
    (c.aliases && c.aliases.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleShareReminder = (customer) => {
    const message = `नमस्ते ${customer.name} जी, आपकी किराना दुकान पर कुल बाकी राशि ₹${customer.netBalance} है। कृपया समय पर भुगतान करें। धन्यवाद!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>ग्राहक बहीखाता (Customer Ledgers)</span>
            <span className="bg-stone-200 text-stone-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {filtered.length} ग्राहक
            </span>
          </h3>
          <p className="text-xs text-stone-500">
            Phonetic aliases mapped for dialect-proof customer matching
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="ग्राहक या उपनाम खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="overflow-x-auto flex-1 max-h-[520px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-100/70 text-stone-600 font-bold border-b border-stone-200 uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">ग्राहक विवरण (Customer Info)</th>
              <th className="py-2.5 px-4">फ़ोनेटिक उपनाम (Speech Aliases)</th>
              <th className="py-2.5 px-4">कुल उधार</th>
              <th className="py-2.5 px-4">कुल जमा</th>
              <th className="py-2.5 px-4">बकाया राशि (Net Balance)</th>
              <th className="py-2.5 px-4 text-right">त्वरित कार्रवाई</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((customer) => {
              const owesMoney = customer.netBalance > 0;
              const isSettled = customer.netBalance === 0;

              return (
                <tr key={customer.id} className="hover:bg-stone-50 transition-colors">
                  {/* Name and Contact */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <span>{customer.name}</span>
                      <span className="text-[11px] font-devanagari text-stone-500">
                        ({customer.hindiName || customer.name})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono mt-0.5">
                      <span>{customer.id}</span>
                      <span>•</span>
                      <span>{customer.phone}</span>
                    </div>
                  </td>

                  {/* Phonetic Speech Aliases */}
                  <td className="py-3 px-4 max-w-[220px]">
                    <div className="flex flex-wrap gap-1">
                      {customer.aliases && customer.aliases.map((alias, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[10px]"
                        >
                          "{alias}"
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Total Udhaar */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-red-600 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                      ₹{customer.totalUdhaar}
                    </span>
                  </td>

                  {/* Total Jama */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      ₹{customer.totalJama}
                    </span>
                  </td>

                  {/* Net Balance */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        owesMoney 
                          ? 'bg-red-100 text-red-800' 
                          : isSettled 
                          ? 'bg-stone-100 text-stone-700' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        ₹{Math.abs(customer.netBalance)} {owesMoney ? 'उधार' : isSettled ? 'चुका दिया' : 'अग्रिम जमा'}
                      </span>
                    </div>
                  </td>

                  {/* Quick Action */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {owesMoney && (
                        <button
                          onClick={() => handleShareReminder(customer)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition-colors"
                          title="व्हाट्सएप तगादा संदेश भेजें"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>तगादा</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
