import React from 'react';
import { 
  Mic, 
  Settings, 
  ShoppingBag, 
  Download, 
  Languages, 
  Sparkles, 
  Receipt, 
  Users 
} from 'lucide-react';
import { exportTransactionsToCSV } from '../utils/storage.js';

export default function Header({
  activeTab = 'TRANSACTIONS',
  onSelectTab,
  settings,
  onOpenSettings,
  onOpenRateCard,
  onOpenLanguageModal,
  transactions = [],
  customers = [],
  totalUdhaar = 0,
  grossUdhaar,
  totalJama = 0
}) {
  const isHindi = settings.speechLanguage === 'hi';
  const hasKey = Boolean(settings.groqApiKey || import.meta.env.VITE_GROQ_API_KEY);

  // Authoritative net udhaar after deducting jama (e.g. ₹1,265 - ₹500 = ₹765 net udhaar remaining)
  const netUdhaar = grossUdhaar !== undefined ? totalUdhaar : Math.max(0, totalUdhaar - totalJama);
  const displayGross = grossUdhaar !== undefined ? grossUdhaar : (totalUdhaar + totalJama);

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectTab && onSelectTab('VOICE')}
          className="flex items-center gap-3 shrink-0 cursor-pointer select-none group"
          title="माइक काउंटर पर जाएं (Go to Voice Counter)"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-tight text-stone-900 flex items-center gap-1">
                <span>गल्ला वॉयस</span>
                <span className="text-orange-600">GallaVoice</span>
              </h1>
            </div>
            <p className="text-[10px] text-stone-400 hidden md:block">
              Noisy Cash-Counter Voice Khata
            </p>
          </div>
        </div>

        {/* PRIMARY CENTER TABS: Voice Counter (Home) | Transactions | Customer Khata */}
        <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200/90 shadow-2xs">
          {/* Voice Counter (Home) */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('VOICE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'VOICE'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${activeTab === 'VOICE' ? 'text-white' : 'text-stone-500'}`} />
            <span>{isHindi ? 'माइक काउंटर' : 'Voice Counter'}</span>
          </button>

          {/* Transactions Tab */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('TRANSACTIONS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Receipt className={`w-3.5 h-3.5 ${activeTab === 'TRANSACTIONS' ? 'text-orange-600' : 'text-stone-400'}`} />
            <span>{isHindi ? 'रोजनामचा' : 'Transactions'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'TRANSACTIONS' ? 'bg-orange-100 text-orange-900 font-bold' : 'bg-stone-200 text-stone-600'
            }`}>
              {transactions.length}
            </span>
          </button>

          {/* Customers Tab */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('CUSTOMERS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'CUSTOMERS'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'CUSTOMERS' ? 'text-orange-600' : 'text-stone-400'}`} />
            <span>{isHindi ? 'ग्राहक खाता' : 'Customers'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'CUSTOMERS' ? 'bg-orange-100 text-orange-900 font-bold' : 'bg-stone-200 text-stone-600'
            }`}>
              {customers.length}
            </span>
          </button>
        </div>

        {/* Live Counters & Controls (Cleaned & Polished for Production) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Counters (Net Udhaar after deducting Jama) */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <div 
              className="bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
              title={`शुद्ध बकाया उधार: ₹${netUdhaar.toLocaleString('en-IN')} (कुल उधार ₹${displayGross.toLocaleString('en-IN')} - जमा ₹${totalJama.toLocaleString('en-IN')})`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="text-stone-500 text-[10px]">उधार:</span>
              <span className="font-black text-red-600 text-xs">₹{netUdhaar.toLocaleString('en-IN')}</span>
            </div>
            <div 
              className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
              title={`कुल जमा राशि: ₹${totalJama.toLocaleString('en-IN')}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-stone-500 text-[10px]">जमा:</span>
              <span className="font-black text-emerald-600 text-xs">₹{totalJama.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Language Toggle Pill */}
          <button
            onClick={onOpenLanguageModal}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch Language (हिन्दी / English)"
          >
            <Languages className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-[11px]">{isHindi ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Rate Card */}
          <button
            onClick={onOpenRateCard}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
            title="दर सूची (Store Rate Card)"
          >
            <ShoppingBag className="w-4 h-4 text-stone-600" />
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportTransactionsToCSV(transactions)}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors hidden sm:block cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-stone-600" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
