import React from 'react';
import { Mic, Settings, ShoppingBag, Download, Languages, Sparkles } from 'lucide-react';
import { exportTransactionsToCSV } from '../utils/storage.js';

export default function Header({
  settings,
  onOpenSettings,
  onOpenRateCard,
  onOpenLanguageModal,
  transactions = [],
  totalUdhaar = 0,
  totalJama = 0
}) {
  const isHindi = settings.speechLanguage === 'hi';
  const hasKey = Boolean(settings.groqApiKey || import.meta.env.VITE_GROQ_API_KEY);

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-stone-900">
                <span>गल्ला वॉयस</span> <span className="text-orange-600">GallaVoice</span>
              </h1>
              <span className="hidden sm:inline-block bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                AI Voice Khata
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden md:block">
              Whisper STT + Llama 3.3 70B Kirana Ledger
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
          <div className="bg-red-50 border border-red-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-stone-600 text-[11px]">उधार:</span>
            <span className="font-black text-red-600 text-sm">₹{totalUdhaar.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-stone-600 text-[11px]">जमा:</span>
            <span className="font-black text-emerald-600 text-sm">₹{totalJama.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle Pill */}
          <button
            onClick={onOpenLanguageModal}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch Language (हिन्दी / English)"
          >
            <Languages className="w-3.5 h-3.5 text-orange-600" />
            <span>{isHindi ? '🇮🇳 हिन्दी' : '🇬🇧 English'}</span>
          </button>

          {/* AI Key Status Badge */}
          <button
            onClick={onOpenSettings}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              hasKey
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
            }`}
            title="Configure AI API Key"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline">{hasKey ? 'Groq AI Active' : 'Set Free Key'}</span>
            <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </button>

          {/* Rate Card */}
          <button
            onClick={onOpenRateCard}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
            title="दुकान दर सूची (Store Rate Card)"
          >
            <ShoppingBag className="w-4 h-4 text-stone-600" />
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportTransactionsToCSV(transactions)}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors hidden sm:block"
            title="Download CSV Ledger"
          >
            <Download className="w-4 h-4 text-stone-600" />
          </button>

          {/* Settings Modal */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
