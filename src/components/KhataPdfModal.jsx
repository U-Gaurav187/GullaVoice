import React, { useState } from 'react';
import { FileText, Printer, Download, X, Users } from 'lucide-react';
import { printKhataPdf, downloadKhataHtml } from '../utils/pdfGenerator.js';

export default function KhataPdfModal({
  isOpen = false,
  onClose,
  customers = []
}) {
  const [filterPendingOnly, setFilterPendingOnly] = useState(true);

  if (!isOpen) return null;

  const debtors = filterPendingOnly
    ? customers.filter(c => ((c.totalUdhaar || 0) - (c.totalJama || 0)) > 0)
    : customers;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-stone-300 shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal White Toolbar */}
        <div className="px-5 py-3.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-stone-700" />
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                उधारी बहीखाता PDF (Khata Statement)
              </h2>
              <p className="text-[11px] text-stone-500">
                बाकी राशि वाले सभी ग्राहकों की साफ़ सूची
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterPendingOnly(!filterPendingOnly)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-stone-600" />
              <span>{filterPendingOnly ? `सिर्फ बकाया (${sortedDebtors.length})` : `सभी खाते (${sortedDebtors.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadKhataHtml(customers, { filterPendingOnly })}
              className="p-2 rounded-lg bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 cursor-pointer"
              title="HTML डाउनलोड"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => printKhataPdf(customers, { filterPendingOnly })}
              className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900 cursor-pointer"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plain White A4 Document Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-100">
          <div className="bg-white border border-stone-300 max-w-3xl mx-auto p-6 sm:p-10 text-stone-900 shadow-xs">
            {/* Simple Document Header */}
            <div className="border-b-2 border-stone-900 pb-3 mb-5 flex items-end justify-between">
              <div>
                <h1 className="text-lg font-extrabold text-stone-900">
                  गल्ला वॉयस किराना स्टोर (GallaVoice Kirana Store)
                </h1>
                <p className="text-xs text-stone-600">
                  उधारी बहीखाता विवरण (Outstanding Balance Statement)
                </p>
              </div>
              <div className="text-right text-xs text-stone-600">
                <div>दिनांक: {formattedDate}</div>
                <div>कुल ग्राहक: {sortedDebtors.length}</div>
              </div>
            </div>

            {/* Plain White Summary Boxes */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="border border-stone-300 p-3 bg-white">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">
                  शुद्ध बकाया (Net Balance)
                </span>
                <span className="text-lg font-extrabold font-mono text-stone-900">
                  ₹{totalNetPending.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border border-stone-300 p-3 bg-white">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">
                  कुल उधार (Total Udhaar)
                </span>
                <span className="text-lg font-extrabold font-mono text-stone-900">
                  ₹{totalGrossUdhaar.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border border-stone-300 p-3 bg-white">
                <span className="text-[10px] font-semibold text-stone-500 uppercase block">
                  कुल जमा (Total Jama)
                </span>
                <span className="text-lg font-extrabold font-mono text-stone-900">
                  ₹{totalJama.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Clean White Table */}
            <table className="w-full text-left text-xs border-collapse mb-6">
              <thead>
                <tr className="bg-stone-50 border-t border-b border-stone-900 text-stone-900 font-bold">
                  <th className="py-2.5 px-3 text-center w-10">क्र.</th>
                  <th className="py-2.5 px-3">ग्राहक का नाम (Customer Name)</th>
                  <th className="py-2.5 px-3 text-right">कुल उधार</th>
                  <th className="py-2.5 px-3 text-right">कुल जमा</th>
                  <th className="py-2.5 px-3 text-right">बाकी राशि (Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {sortedDebtors.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-stone-500">
                      कोई बकाया खाता नहीं है। सभी खाते चुकता हैं।
                    </td>
                  </tr>
                ) : (
                  sortedDebtors.map((customer, index) => {
                    const net = Math.max(0, (customer.totalUdhaar || 0) - (customer.totalJama || 0));
                    return (
                      <tr key={customer.id || index}>
                        <td className="py-2.5 px-3 text-center text-stone-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-stone-900">{customer.name}</div>
                          {customer.hindiName && customer.hindiName !== customer.name && (
                            <div className="text-[11px] text-stone-500">{customer.hindiName}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-700">
                          ₹{(customer.totalUdhaar || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-700">
                          ₹{(customer.totalJama || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          ₹{net.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {sortedDebtors.length > 0 && (
                <tfoot>
                  <tr className="bg-stone-50 border-t-2 border-b-2 border-stone-900 font-extrabold text-stone-900">
                    <td colSpan="2" className="py-2.5 px-3 text-right">
                      कुल योग ({sortedDebtors.length} ग्राहक):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ₹{totalGrossUdhaar.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ₹{totalJama.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      ₹{totalNetPending.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Simple Footer */}
            <div className="pt-4 border-t border-stone-300 flex items-center justify-between text-[11px] text-stone-500">
              <span>GallaVoice Ledger Report</span>
              <span>हस्ताक्षर: _____________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
