import React, { useState } from 'react';
import { 
  Languages, 
  CheckCircle2, 
  ArrowRight,
  Mic,
  X
} from 'lucide-react';

export default function LanguageSelectModal({
  isOpen,
  onClose,
  currentLanguage = 'hi',
  onSave
}) {
  const [selectedLang, setSelectedLang] = useState(currentLanguage);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      language: selectedLang
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight">
            गल्ला वॉयस (GallaVoice)
          </h2>
          <p className="text-xs text-orange-100 mt-1 max-w-sm mx-auto">
            दुकान का डिजिटल बहीखाता • Voice Khata for Bharat
          </p>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-orange-600" />
              <span>अपनी पसंदीदा भाषा चुनें (Select Language)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Hindi Option */}
              <button
                type="button"
                onClick={() => setSelectedLang('hi')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  selectedLang === 'hi'
                    ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-200'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">🇮🇳</span>
                  {selectedLang === 'hi' && (
                    <CheckCircle2 className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div className="font-black text-stone-900 text-sm">हिन्दी (Hindi)</div>
                <div className="text-[11px] text-stone-500 mt-0.5 font-devanagari">
                  हिंदी में बोलकर खाता पुष्टि होगी
                </div>
              </button>

              {/* English Option */}
              <button
                type="button"
                onClick={() => setSelectedLang('en')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  selectedLang === 'en'
                    ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-200'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">🇬🇧</span>
                  {selectedLang === 'en' && (
                    <CheckCircle2 className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div className="font-black text-stone-900 text-sm">English</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Voice readback in Indian English
                </div>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>शुरू करें (Continue to GallaVoice)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-center text-stone-400 mt-2.5">
              आप इसे कभी भी ऊपर हेडर में भाषा बटन से बदल सकते हैं।
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
