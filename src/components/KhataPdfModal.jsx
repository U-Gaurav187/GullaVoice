import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  X, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Share2
} from 'lucide-react';
import { printKhataPdf, downloadKhataHtml } from '../utils/pdfGenerator.js';

export default function KhataPdfModal({
  isOpen = false,
  onClose,
  customers = [],
  language = 'hi'
}) {
  const [filterPendingOnly, setFilterPendingOnly] = useState(true);

  if (!isOpen) return null;

  // Filter debtors (those where totalUdhaar - totalJama > 0)
  const debtors = filterPendingOnly
    ? customers.filter(c => ((c.totalUdhaar || 0) - (c.totalJama || 0)) > 0)
    : customers;

  // Sort by net remaining debt descending (highest pending balance first)
  const sortedDebtors = [...debtors].sort((a, b) => {
    const netA = Math.max(0, (a.totalUdhaar || 0) - (a.totalJama || 0));
    const netB = Math.max(0, (b.totalUdhaar || 0) - (b.totalJama || 0));
    return netB - netA;
  });

  const totalGrossUdhaar = sortedDebtors.reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
  const totalJama = sortedDebtors.reduce((sum, c) => sum + (c.totalJama || 0), 0);
  const totalNetPending = sortedDebtors.reduce((sum, c) => sum + Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0)), 0);

  const formattedDate = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const handlePrint = () => {
    printKhataPdf(customers, { filterPendingOnly });
  };

  const handleDownload = () => {
    downloadKhataHtml(customers, { filterPendingOnly });
  };

  const handleShareSummary = () => {
    const text = `🏪 गल्ला वॉयस किराना स्टोर - उधारी बहीखाता विवरण\nदिनांक: ${formattedDate}\nकुल बाकी उधारी: ₹${totalNetPending.toLocaleString('en-IN')}\nबाकी ग्राहक: ${sortedDebtors.length} लोग\n\n` +
      sortedDebtors.map((c, i) => `${i + 1}. ${c.name} (${c.hindiName || ''}): ₹${Math.max(0, (c.totalUdhaar || 0) - (c.totalJama || 0)).toLocaleString('en-IN')} बाकी`).join('\n');
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-stone-50 rounded-3xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Actions Toolbar */}
        <div className="p-4 sm:p-5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-2xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                <span>उधारी बहीखाता रिपोर्ट</span>
                <span className="text-orange-600 font-normal text-xs">(Debtors PDF)</span>
              </h2>
              <p className="text-[11px] text-stone-500">
                जिनका भी पैसा बाकी है, उनकी पूरी सूची प्रिंट या PDF सेव करें
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setFilterPendingOnly(!filterPendingOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterPendingOnly
                  ? 'bg-orange-50 border-orange-300 text-orange-900'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
              title="Toggle filter"
            >
              <Users className="w-3.5 h-3.5 text-orange-600" />
              <span>{filterPendingOnly ? 'सिर्फ बाकी उधारी वाले' : 'सभी खाते'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-200 text-orange-950 font-mono">
                {sortedDebtors.length}
              </span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareSummary}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="WhatsApp पर सारांश भेजें"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* HTML File Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-bold transition-colors cursor-pointer"
              title="HTML फाइल डाउनलोड करें"
            >
              <Download className="w-4 h-4 text-stone-600" />
            </button>

            {/* Main Primary: Print / Save as PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>PDF डाउनलोड / प्रिंट करें</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer ml-1"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-200/60">
          {/* Printable A4 Paper Preview */}
          <div className="bg-white rounded-2xl shadow-md border border-stone-200 max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
            {/* Document Header */}
            <div className="border-b-2 border-orange-500 pb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                  <span>🏪</span>
                  <span>गल्ला वॉयस किराना एवं जनरल स्टोर</span>
                </h1>
                <p className="text-xs text-stone-500 mt-0.5">
                  GallaVoice Kirana & General Store • डिजिटल आवाज़-आधारित बहीखाता
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-900 text-[11px] font-bold">
                  <span>📋 उधारी बहीखाता विवरण (Pending Debtors Statement)</span>
                </div>
              </div>

              <div className="text-right text-xs text-stone-500">
                <div>दिनांक: <strong className="text-stone-800">{formattedDate}</strong></div>
                <div>समय: <strong className="text-stone-800">{formattedTime}</strong></div>
                <div className="mt-1 text-[11px]">
                  प्रकार: <strong className="text-stone-800">{filterPendingOnly ? 'सिर्फ बाकी उधारी' : 'सभी खाते'}</strong>
                </div>
              </div>
            </div>

            {/* Summary KPI Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide block">
                  कुल शुद्ध बाकी (Net Pending)
                </span>
                <span className="text-xl font-black text-red-700 font-mono">
                  ₹{totalNetPending.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-red-500 mt-0.5">
                  जमा काटने के बाद बाकी शुद्ध रुपया
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block">
                  कुल पुराना उधार (Gross Udhaar)
                </span>
                <span className="text-xl font-black text-stone-800 font-mono">
                  ₹{totalGrossUdhaar.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  कुल दर्ज हुआ सामान उधार
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide block">
                  कुल जमा (Total Jama)
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono">
                  ₹{totalJama.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">
                  ग्राहकों द्वारा दिया गया नकद
                </p>
              </div>
            </div>

            {/* Debtors List Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 uppercase text-[10px]">
                    <th className="py-2.5 px-3 text-center w-10">क्र.</th>
                    <th className="py-2.5 px-3">ग्राहक का नाम (Customer Name)</th>
                    <th className="py-2.5 px-3">फोन / पहचान</th>
                    <th className="py-2.5 px-3 text-right">कुल उधार</th>
                    <th className="py-2.5 px-3 text-right">कुल जमा</th>
                    <th className="py-2.5 px-3 text-right">बाकी रुपया (Net)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sortedDebtors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-stone-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-stone-700 text-sm">कोई उधारी बाकी नहीं है!</p>
                        <p className="text-xs text-stone-500 mt-1">सभी ग्राहकों के खाते पूरी तरह से चुकता हैं।</p>
                      </td>
                    </tr>
                  ) : (
                    sortedDebtors.map((customer, index) => {
                      const net = Math.max(0, (customer.totalUdhaar || 0) - (customer.totalJama || 0));
                      const owesMoney = net > 0;
                      const aliasStr = (customer.aliases || []).filter(a => a && a !== customer.name && a !== customer.hindiName).slice(0, 2).join(', ');

                      return (
                        <tr key={customer.id || index} className={index % 2 === 1 ? 'bg-stone-50/60' : ''}>
                          <td className="py-3 px-3 font-bold text-stone-400 text-center font-mono">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-stone-900 text-sm">
                              {customer.name}
                            </div>
                            <div className="text-[11px] text-stone-500 font-devanagari">
                              {customer.hindiName || ''} {customer.upNativeName && (
                                <span className="text-orange-600 font-semibold">• {customer.upNativeName}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-stone-500 text-[11px]">
                            <div>{customer.phone || '+91 98000 00000'}</div>
                            {aliasStr && (
                              <div className="text-[10px] text-stone-400">उपनाम: {aliasStr}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-red-600">
                            ₹{(customer.totalUdhaar || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                            ₹{(customer.totalJama || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className={`font-mono font-black text-sm ${owesMoney ? 'text-red-700' : 'text-emerald-700'}`}>
                              ₹{net.toLocaleString('en-IN')}
                            </span>
                            <div className="text-[10px] font-bold uppercase mt-0.5">
                              {owesMoney ? (
                                <span className="text-red-700">● बाकी</span>
                              ) : (
                                <span className="text-emerald-700">✓ चुकता</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {sortedDebtors.length > 0 && (
                  <tfoot>
                    <tr className="bg-stone-100/90 font-bold border-t-2 border-stone-300">
                      <td colSpan="3" className="py-3 px-3 text-right text-stone-800">
                        कुल योग ({sortedDebtors.length} ग्राहक):
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-red-600 text-xs">
                        ₹{totalGrossUdhaar.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 text-xs">
                        ₹{totalJama.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-red-700 text-sm">
                        ₹{totalNetPending.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Document Footer */}
            <div className="pt-4 border-t border-dashed border-stone-300 flex flex-wrap items-end justify-between gap-4 text-xs text-stone-500">
              <div>
                <div className="font-bold text-orange-600 flex items-center gap-1">
                  <span>⚡ गल्ला वॉयस (GallaVoice)</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  शोर-प्रतिरोधी वॉयस बहीखाता • स्वतः गणितीय हिसाब
                </div>
              </div>
              <div className="text-center w-40">
                <div className="border-b border-stone-400 h-10 mb-1"></div>
                <div className="text-[11px] text-stone-600 font-bold">दुकानदार हस्ताक्षर व मुहर</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-stone-200 flex items-center justify-between px-6 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>PDF में सभी नाम, कुल उधार, जमा और शुद्ध बाकी राशि शामिल है</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors cursor-pointer"
          >
            बंद करें (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
