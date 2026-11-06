import React from 'react';
import { Mic, Settings, ShoppingBag, Database, Volume2, Sparkles, Download } from 'lucide-react';
import { exportTransactionsToCSV, exportBackupJSON } from '../utils/storage';

export default function Header({
  settings,
  onOpenSettings,
  onOpenRateCard,
  transactions = [],
  customers = [],
  rateCard = [],
  totalUdhaar = 0,
  totalJama = 0
}) {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                <span>गल्ला वॉयस</span>
                <span className="text-orange-600">GallaVoice</span>
              </h1>
              <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-orange-200">
                Hackathon Edition
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Noisy Cash-Counter Voice Khata for Bharat • India Runs on Voice
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium">
          <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-stone-600">कुल उधार:</span>
            <span className="font-bold text-red-600 text-sm">₹{totalUdhaar.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-stone-600">कुल जमा:</span>
            <span className="font-bold text-emerald-600 text-sm">₹{totalJama.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Active Engine Indicator */}
          <div 
            onClick={onOpenSettings}
            className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Click to change AI engine or configure free keys"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden md:inline">
              {settings.engine === 'GROQ_LLAMA' ? 'Groq Llama 3.3' :
               settings.engine === 'GEMINI_FLASH' ? 'Gemini 2.5 Flash' : 'Zero-Key Local Engine'}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </div>

          {/* Rate Card Button */}
          <button
            onClick={onOpenRateCard}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-stone-200 transition-colors"
            title="View or edit store rate card"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">दर सूची (Rate Card)</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={() => exportTransactionsToCSV(transactions)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-stone-200 transition-colors"
            title="Download Ledger CSV"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
            title="Settings & Free Cloud API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
