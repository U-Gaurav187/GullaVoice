import React, { useState } from 'react';
import { 
  Languages, 
  Sparkles, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic
} from 'lucide-react';

export default function LanguageSelectModal({
  isOpen,
  onClose,
  currentLanguage = 'hi',
  groqKey = '',
  onSave
}) {
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [keyInput, setKeyInput] = useState(groqKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!keyInput.trim()) {
      setTestResult({ type: 'error', message: 'कृपया पहले Groq API Key दर्ज करें।' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${keyInput.trim()}` }
      });
      if (res.ok) {
        setTestResult({ type: 'success', message: '✅ Groq API Key सही है! Whisper + Llama 3.3 सक्रिय है।' });
      } else {
        setTestResult({ type: 'error', message: `❌ अमान्य API Key (${res.status}). कृपया जांचें।` });
      }
    } catch (e) {
      setTestResult({ type: 'error', message: `कनेक्शन त्रुटि: ${e.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      language: selectedLang,
      groqApiKey: keyInput.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight">
            गल्ला वॉयस (GallaVoice) में आपका स्वागत है!
          </h2>
          <p className="text-xs text-orange-100 mt-1 max-w-sm mx-auto">
            AI Voice-First Kirana Khata • Scaler x Wispr Flow Hackathon
          </p>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Language Selection */}
          <div>
            <label className="block text-xs font-extrabold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-orange-600" />
              <span>1. अपनी पसंदीदा भाषा चुनें (Select Language)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Hindi Option */}
              <button
                type="button"
                onClick={() => setSelectedLang('hi')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedLang === 'hi'
                    ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-200'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">🇮🇳</span>
                  {selectedLang === 'hi' && (
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
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
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedLang === 'en'
                    ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-200'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">🇬🇧</span>
                  {selectedLang === 'en' && (
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <div className="font-black text-stone-900 text-sm">English / Hinglish</div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Voice readback in Indian English
                </div>
              </button>
            </div>
          </div>

          {/* 2. Free AI API Key Input */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>2. Groq AI API Key (100% Free)</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Free Key लें</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed">
              गल्ला वॉयस असली आवाज़ को <strong>Whisper AI</strong> और <strong>Llama 3.3 70B</strong> से समझता है। यह Groq पर 100% मुफ़्त है (बिना किसी क्रेडिट कार्ड के 15 सेकंड में मिलता है)।
            </p>

            <div className="space-y-2">
              <input
                type="password"
                placeholder="gsk_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || !keyInput}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'जांच रहे हैं...' : 'की जांचें (Test Key)'}
                </button>
                <span className="text-[10px] text-stone-400">
                  Stored securely in your local browser
                </span>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                  testResult.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {testResult.message}
                </div>
              )}
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
            <p className="text-[11px] text-center text-stone-400 mt-2">
              आप इसे कभी भी ऊपर हेडर में भाषा या सेटिंग्स बटन से बदल सकते हैं।
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
