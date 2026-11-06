import React, { useState } from 'react';
import { 
  X, 
  Volume2, 
  RotateCcw, 
  Download, 
  Languages,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { exportBackupJSON } from '../utils/storage';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetAllData,
  transactions = [],
  customers = [],
  rateCard = []
}) {
  const [formData, setFormData] = useState(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                दुकान सेटिंग्स (Store & Voice Settings)
              </h3>
              <p className="text-xs text-stone-500">
                आवाज़, रीडबैक और डेटा बैकअप प्राथमिकताएं प्रबंधित करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5 text-xs">
          {/* Section 1: Language Preference */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2">
              <Languages className="w-4 h-4 text-orange-600" />
              <span>पसंदीदा भाषा (Preferred Voice & Readback Language):</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, speechLanguage: 'hi' }))}
                className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  formData.speechLanguage === 'hi'
                    ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-2xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <span>🇮🇳 हिन्दी (Hindi)</span>
                {formData.speechLanguage === 'hi' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, speechLanguage: 'en' }))}
                className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  formData.speechLanguage === 'en'
                    ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold shadow-2xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <span>🇬🇧 English</span>
                {formData.speechLanguage === 'en' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
              </button>
            </div>
          </div>

          {/* Section 2: Audio & Voice Readback Preferences */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-orange-600" />
              <span>ऑडियो व रीडबैक प्राथमिकताएं (Audio & Readback):</span>
            </h4>

            {/* Toggle 1: Auto Readback */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-semibold text-stone-800 block text-xs">
                  स्वचालित बोलकर पुष्टि (Auto Voice Readback)
                </span>
                <span className="text-[11px] text-stone-500">
                  आवाज़ से प्रविष्टि के बाद AI खुद बोलकर पुष्टि करेगा
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoReadback}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoReadback: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            {/* Toggle 2: Audio Feedback Sound */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
              <div>
                <span className="font-semibold text-stone-800 block text-xs">
                  ध्वनि संकेत (Audio Chimes & Tones)
                </span>
                <span className="text-[11px] text-stone-500">
                  रिकॉर्डिंग शुरू और बंद होने पर बीप आवाज़
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.audioFeedbackEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, audioFeedbackEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>

          {/* Section 3: Data Backup & Management */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center justify-between">
              <span>डेटा बैकअप व प्रबंधन (Data Management):</span>
              <span className="text-[10px] text-stone-400 font-mono">Local Storage</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Backup JSON */}
              <button
                type="button"
                onClick={() => exportBackupJSON({ transactions, customers, rateCard })}
                className="p-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-600" />
                <span>बैकअप डाउनलोड (JSON)</span>
              </button>

              {/* Reset Data */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('चेतावनी: क्या आप पूरा खाता डेटा रीसेट करना चाहते हैं? सभी प्रविष्टियां मिट जाएंगी।')) {
                    onResetAllData();
                  }
                }}
                className="p-3 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-red-500" />
                <span>पूरा डेटा रीसेट करें</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 font-bold text-xs transition-colors cursor-pointer"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            सेव करें (Save Settings)
          </button>
        </div>
      </div>
    </div>
  );
}
