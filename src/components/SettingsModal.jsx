import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Cpu, 
  RotateCcw, 
  Download, 
  Eye, 
  EyeOff,
  Zap
} from 'lucide-react';
import { exportBackupJSON } from '../utils/storage';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetAllData,
  transactions,
  customers,
  rateCard
}) {
  const [formData, setFormData] = useState(settings);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleEngineChange = (engine) => {
    setFormData(prev => ({ ...prev, engine }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      if (formData.engine === 'GROQ_LLAMA') {
        if (!formData.groqApiKey) {
          throw new Error('कृपया पहले Groq API Key दर्ज करें।');
        }
        const start = performance.now();
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${formData.groqApiKey.trim()}` }
        });
        const elapsed = Math.round(performance.now() - start);
        if (!res.ok) throw new Error(`Groq Authentication Failed (${res.status})`);
        setTestStatus({
          type: 'success',
          message: `✅ Groq Cloud कनेक्टेड! लेटेंसी: ${elapsed}ms (मॉडल: Llama-3.3-70b तैयार)`
        });
      } else if (formData.engine === 'GEMINI_FLASH') {
        if (!formData.geminiApiKey) {
          throw new Error('कृपया पहले Gemini API Key दर्ज करें।');
        }
        const start = performance.now();
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${formData.geminiApiKey.trim()}`);
        const elapsed = Math.round(performance.now() - start);
        if (!res.ok) throw new Error(`Gemini Authentication Failed (${res.status})`);
        setTestStatus({
          type: 'success',
          message: `✅ Google Gemini कनेक्टेड! लेटेंसी: ${elapsed}ms (मॉडल: Gemini 2.5 Flash तैयार)`
        });
      } else {
        setTestStatus({
          type: 'success',
          message: '✅ लोकल ज़ीरो-की इंजन सक्रिय है (0ms लेटेंसी, 100% ऑफ़लाइन)।'
        });
      }
    } catch (err) {
      setTestStatus({
        type: 'error',
        message: `❌ कनेक्शन विफल: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                ⚡ AI इंजन व सेटिंग्स (AI Engine Settings)
              </h3>
              <p className="text-xs text-stone-500">
                Switch between zero-key local fallback & 100% free Cloud LLM pipelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6 text-xs">
          {/* Section 1: Choose Active AI Engine */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">
              सक्रिय AI इंजन चुनें (Select Active Engine):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Zero-Key Local */}
              <div
                onClick={() => handleEngineChange('LOCAL_ZERO_KEY')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  formData.engine === 'LOCAL_ZERO_KEY'
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900 text-xs">1. ज़ीरो-की लोकल</span>
                    {formData.engine === 'LOCAL_ZERO_KEY' && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold mb-1.5">
                    No Keys Needed
                  </span>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Deterministic regex + phonetic fuzzy engine. Runs 100% offline.
                  </p>
                </div>
              </div>

              {/* Option 2: Groq Cloud AI */}
              <div
                onClick={() => handleEngineChange('GROQ_LLAMA')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  formData.engine === 'GROQ_LLAMA'
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900 text-xs">2. Groq Cloud</span>
                    {formData.engine === 'GROQ_LLAMA' && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold mb-1.5">
                    Free Tier (Fast)
                  </span>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Llama 3.3 70B + Whisper Large v3 Turbo.
                  </p>
                </div>
              </div>

              {/* Option 3: Google Gemini */}
              <div
                onClick={() => handleEngineChange('GEMINI_FLASH')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  formData.engine === 'GEMINI_FLASH'
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900 text-xs">3. Gemini 2.5</span>
                    {formData.engine === 'GEMINI_FLASH' && (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold mb-1.5">
                    Google AI Free
                  </span>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Gemini 2.5 Flash native structured JSON parsing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Free API Keys Input & Direct URLs */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
            <h4 className="font-bold text-stone-900 flex items-center justify-between">
              <span>मुफ़्त API कीज़ सेटअप (Free API Key Setup):</span>
              <span className="text-[11px] font-normal text-stone-500">
                100% Free • No Credit Card Required
              </span>
            </h4>

            {/* Groq Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700 text-[11px]">Groq API Key:</label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline inline-flex items-center gap-0.5 text-[11px] font-semibold"
                >
                  मुफ़्त की प्राप्त करें (console.groq.com/keys) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showGroqKey ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={formData.groqApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                  className="w-full text-xs font-mono p-2.5 pr-10 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Gemini Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700 text-[11px]">Google Gemini API Key:</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline inline-flex items-center gap-0.5 text-[11px] font-semibold"
                >
                  मुफ़्त की प्राप्त करें (aistudio.google.com) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={formData.geminiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  className="w-full text-xs font-mono p-2.5 pr-10 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTesting ? 'जांच रहे हैं...' : 'कनेक्शन जांचें (Ping Test)'}</span>
              </button>
              <span className="text-[11px] text-stone-400">
                You can also configure via <code className="bg-stone-200 px-1 py-0.5 rounded">.env.local</code>
              </span>
            </div>

            {/* Ping Test Result Banner */}
            {testStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                testStatus.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testStatus.message}
              </div>
            )}
          </div>

          {/* Section 3: Audio Preferences */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-orange-600" />
              <span>ऑडियो व रीडबैक प्राथमिकताएं (Audio & Readback):</span>
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block text-xs">
                  स्वचालित हिंदी बोलकर पुष्टि (Auto Hindi Readback)
                </span>
                <span className="text-[11px] text-stone-500">
                  Automatically speaks the confirmation sentence in Hindi via TTS
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoReadback}
                onChange={(e) => setFormData({ ...formData, autoReadback: e.target.checked })}
                className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Section 4: Backup & Reset */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-200">
            <button
              onClick={() => exportBackupJSON(transactions, customers, rateCard)}
              className="text-stone-600 hover:text-stone-900 font-semibold inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>पूरा बैकअप डाउनलोड करें (JSON)</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('सावधानी: यह सारा खाता डेटा मिटाकर डिफ़ॉल्ट पर रीसेट कर देगा। क्या आप सहमत हैं?')) {
                  onResetAllData();
                  onClose();
                }
              }}
              className="text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>डेटा रीसेट करें</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-bold transition-colors"
          >
            रद्द करें
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all"
          >
            सेव करें (Save Settings)
          </button>
        </div>
      </div>
    </div>
  );
}
