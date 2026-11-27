import React, { useState } from 'react';
import { 
  UserCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Share2, 
  Search, 
  FileText,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Edit2,
  Check,
  X
} from 'lucide-react';

export default function CustomerKhataTable({
  customers = [],
  onSelectCustomer,
  onOpenPdfReport,
  onUpdateCustomerName,
  language = 'hi'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editHindiName, setEditHindiName] = useState('');
  const [editUpName, setEditUpName] = useState('');

  const handleStartEdit = (e, customer) => {
    e.stopPropagation();
    setEditingId(customer.id);
    setEditName(customer.name || '');
    setEditHindiName(customer.hindiName || customer.name || '');
    setEditUpName(customer.upNativeName || '');
  };

  const handleSaveEdit = (e, customerId) => {
    e.stopPropagation();
    if (editName.trim() && onUpdateCustomerName) {
      onUpdateCustomerName(customerId, {
        name: editName.trim(),
        hindiName: editHindiName.trim() || editName.trim(),
        upNativeName: editUpName.trim()
      });
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.hindiName && c.hindiName.includes(searchTerm)) ||
    (c.upNativeName && c.upNativeName.includes(searchTerm)) ||
    (c.aliases && c.aliases.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleShareReminder = (e, customer) => {
    e.stopPropagation();
    const message = `नमस्ते ${customer.name} जी, आपकी किराना दुकान पर कुल बाकी राशि ₹${customer.netBalance} है। कृपया समय पर भुगतान करें। धन्यवाद!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/60">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>ग्राहक बहीखाता</span>
            <span className="text-stone-400 font-normal text-xs">(Customer Ledgers)</span>
            <span className="bg-stone-200 text-stone-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {filtered.length} ग्राहक
            </span>
          </h3>
          <p className="text-[11px] text-stone-500">
            {language === 'hi' ? 'ग्राहक पर क्लिक करके उनकी पूरी खरीद और समय देखें' : 'Click any customer to inspect their full itemized purchases & timestamps'}
          </p>
        </div>

        {/* Search Input & PDF Generation Toolbar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="ग्राहक या उपनाम खोजें..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {onOpenPdfReport && (
            <button
              type="button"
              onClick={onOpenPdfReport}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
              title="उधारी खाता PDF बनाएं (Generate Debtors PDF)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Customers List Table */}
      <div className="overflow-x-auto flex-1 max-h-[580px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-100/70 text-stone-600 font-bold border-b border-stone-200 uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-2.5 px-4">ग्राहक (Customer Name)</th>
              <th className="py-2.5 px-4">देशी यूपी नाम (UP Native)</th>
              <th className="py-2.5 px-4">कुल उधार</th>
              <th className="py-2.5 px-4">कुल जमा</th>
              <th className="py-2.5 px-4">बकाया राशि (Net Balance)</th>
              <th className="py-2.5 px-4 text-right">कार्रवाई</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-stone-400">
                  <p className="text-sm font-semibold">कोई ग्राहक खाता नहीं मिला</p>
                  <p className="text-xs text-stone-400 mt-1">माइक से पहला उधार बोलते ही ग्राहक का खाता यहाँ अपने आप बन जाएगा</p>
                </td>
              </tr>
            ) : (
              filtered.map((customer) => {
                const owesMoney = customer.netBalance > 0;
                const isSettled = customer.netBalance === 0;

                return (
                  <tr 
                    key={customer.id} 
                    onClick={() => onSelectCustomer && onSelectCustomer(customer)}
                    className="hover:bg-amber-50/60 transition-colors cursor-pointer group"
                    title="ग्राहक का पूरा बहीखाता देखने के लिए क्लिक करें"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      {editingId === customer.id ? (
                        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="English Name"
                            className="w-full px-2 py-1 text-xs font-bold border border-orange-400 rounded-lg bg-white"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editHindiName}
                            onChange={(e) => setEditHindiName(e.target.value)}
                            placeholder="हिंदी नाम"
                            className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg bg-white"
                          />
                        </div>
                      ) : (
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                          <span>{customer.name}</span>
                          <span className="text-[11px] font-devanagari text-stone-500">
                            ({customer.hindiName || customer.name})
                          </span>
                          {onUpdateCustomerName && (
                            <button
                              type="button"
                              onClick={(e) => handleStartEdit(e, customer)}
                              className="p-1 rounded-md text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                              title="ग्राहक का नाम बदलें (Rename Customer)"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* UP Native Name */}
                    <td className="py-3.5 px-4">
                      {editingId === customer.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editUpName}
                            onChange={(e) => setEditUpName(e.target.value)}
                            placeholder="देशी नाम (optional)"
                            className="w-32 px-2 py-1 text-xs border border-stone-300 rounded-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveEdit(e, customer.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            title="सेव करें"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                            title="रद्द करें"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-950 border border-orange-200 font-devanagari font-bold text-xs">
                          🇮🇳 {customer.upNativeName || 'मान्य ग्राहक'}
                        </span>
                      )}
                    </td>

                    {/* Total Udhaar */}
                    <td className="py-3.5 px-4 font-mono font-bold text-red-600 whitespace-nowrap">
                      ₹{customer.totalUdhaar.toLocaleString('en-IN')}
                    </td>

                    {/* Total Jama */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                      ₹{customer.totalJama.toLocaleString('en-IN')}
                    </td>

                    {/* Net Balance */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-base font-black ${
                          owesMoney ? 'text-red-600' : isSettled ? 'text-stone-500' : 'text-emerald-700'
                        }`}>
                          ₹{Math.abs(customer.netBalance).toLocaleString('en-IN')}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          owesMoney 
                            ? 'bg-red-100 text-red-800' 
                            : isSettled 
                              ? 'bg-stone-100 text-stone-600' 
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {owesMoney ? 'बाकी' : isSettled ? 'बराबर' : 'अग्रिम'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {owesMoney && (
                          <button
                            type="button"
                            onClick={(e) => handleShareReminder(e, customer)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="WhatsApp तकादा (Payment Reminder)"
                          >
                            <Share2 className="w-3 h-3 text-emerald-600" />
                            <span>{copiedId === customer.id ? 'भेजा गया!' : 'तकादा'}</span>
                          </button>
                        )}

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
