import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  Filter, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Languages, 
  Send,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { audioRecorder } from '../utils/audioRecorder.js';
import { NOISY_GALLA_PRESETS } from '../data/noisyGallaPresets.js';

export default function GallaVoiceController({
  onAudioRecorded,
  onManualTextSubmit,
  isProcessing,
  currentTranscript,
  filteredNoise,
  language = 'hi',
  hasApiKey = false,
  onOpenSettings
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [recordDuration, setRecordDuration] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [showSimulateDrawer, setShowSimulateDrawer] = useState(false);
  const [typedInput, setTypedInput] = useState('');
  const timerRef = useRef(null);
  const holdStartTimeRef = useRef(0);

  // Live timer while recording
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startRecordingSession = async () => {
    if (isProcessing) return;
    setStatusMessage('');
    holdStartTimeRef.current = Date.now();
    try {
      await audioRecorder.start((volume) => {
        setMicVolume(volume);
      });
      setIsRecording(true);
      setStatusMessage(language === 'hi' 
        ? '🎙️ सुन रहे हैं... (दुकान की भाषा में बोलें, पूरा होने पर बटन दबाएं)' 
        : '🎙️ Listening... (Speak naturally, tap when done)');
    } catch (err) {
      console.error('Mic start error:', err);
      setStatusMessage(err.message || 'Microphone access failed. Please allow mic in browser.');
    }
  };

  const stopRecordingSession = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setStatusMessage(language === 'hi' 
      ? '⚡ Whisper AI आवाज़ को समझ रहा है...' 
      : '⚡ Whisper AI transcribing audio...');
    try {
      const audioBlob = await audioRecorder.stop();
      if (audioBlob && audioBlob.size > 200) {
        onAudioRecorded(audioBlob);
      } else {
        setStatusMessage(language === 'hi' 
          ? '⚠️ कोई आवाज़ सुनाई नहीं दी। कृपया माइक के पास बोलें।' 
          : '⚠️ No sound heard. Please speak closer to microphone.');
      }
    } catch (err) {
      console.error('Stop error:', err);
      setStatusMessage(err.message || 'Failed to capture audio.');
    }
  };

  // Toggle for click / tap
  const handleToggle = () => {
    if (isRecording) {
      stopRecordingSession();
    } else {
      startRecordingSession();
    }
  };

  // Manual text submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!typedInput.trim() || isProcessing) return;
    onManualTextSubmit(typedInput.trim());
    setTypedInput('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-600 animate-ping' : 'bg-orange-500'}`}></span>
          <span className="text-xs font-bold text-stone-700 tracking-wide">
            {language === 'hi' ? 'गल्ला वॉयस काउंटर' : 'Galla Voice Counter'}
          </span>
        </div>

        {/* Live Status Pill */}
        {isRecording ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold animate-pulse border border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>रिकॉर्डिंग: {formatTimer(recordDuration)}</span>
          </div>
        ) : isProcessing ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>AI प्रोसेसिंग...</span>
          </div>
        ) : (
          <div className="text-[11px] font-semibold text-stone-400">
            {language === 'hi' ? 'Whisper AI तैयार है' : 'Whisper AI Ready'}
          </div>
        )}
      </div>

      {/* API Key Missing Alert */}
      {!hasApiKey && (
        <div 
          onClick={onOpenSettings}
          className="w-full mb-4 p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-medium cursor-pointer transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Groq API Key जोड़ें (Whisper + Llama के लिए)</span>
          </div>
          <span className="text-[11px] font-bold underline text-orange-700">Set Key →</span>
        </div>
      )}

      {/* THE CENTRAL GIANT MINIMALIST MIC BUTTON */}
      <div className="relative my-5 flex flex-col items-center justify-center">
        {/* Pulsing visualizer ring during recording */}
        {isRecording && (
          <div 
            className="absolute rounded-full bg-red-500/20 transition-all duration-75 ease-out"
            style={{
              width: `${145 + micVolume * 1.5}px`,
              height: `${145 + micVolume * 1.5}px`
            }}
          ></div>
        )}

        <button
          onClick={handleToggle}
          disabled={isProcessing}
          className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-150 active:scale-95 cursor-pointer select-none ${
            isRecording
              ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/40 ring-8 ring-red-100 animate-pulse'
              : 'bg-gradient-to-tr from-orange-500 via-amber-600 to-orange-600 hover:shadow-orange-500/40 ring-8 ring-orange-100 hover:ring-orange-200'
          }`}
          title={isRecording ? 'रिकॉर्डिंग समाप्त करें (Tap to finish)' : 'बोलने के लिए टैप करें (Tap to speak)'}
        >
          {isRecording ? (
            <>
              <Square className="w-10 h-10 fill-white" />
              <span className="text-xs font-black tracking-wider mt-1.5 uppercase">
                {language === 'hi' ? 'रोकें (STOP)' : 'FINISH'}
              </span>
            </>
          ) : isProcessing ? (
            <>
              <RefreshCw className="w-10 h-10 animate-spin" />
              <span className="text-[11px] font-bold mt-1.5">
                {language === 'hi' ? 'समझ रहे हैं...' : 'AI Thinking...'}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-12 h-12" />
              <span className="text-xs font-black tracking-wider mt-1.5 uppercase">
                {language === 'hi' ? 'बोलें (TAP)' : 'SPEAK'}
              </span>
            </>
          )}
        </button>

        {/* Dynamic Decibel Waveform while recording */}
        {isRecording ? (
          <div className="flex items-center justify-center gap-1.5 mt-4 h-8">
            {[20, 45, 80, 60, 95, 40, 75, 30, 90, 50, 25].map((factor, i) => {
              const h = Math.max(6, Math.min(36, Math.round((micVolume / 100) * factor)));
              return (
                <span
                  key={i}
                  className="w-1.5 bg-red-500 rounded-full transition-all duration-75"
                  style={{ height: `${h}px` }}
                ></span>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-stone-500 font-medium mt-4 max-w-xs">
            {language === 'hi' 
              ? 'बटन दबाकर बोलें, जैसे: "रमेश भाई को दो किलो चीनी और एक पैकेट तेल उधार लिख दो"'
              : 'Tap to speak, e.g. "Ramesh bhai 2kg sugar and 1 oil packet udhaar"'}
          </p>
        )}
      </div>

      {/* Live status alert message */}
      {statusMessage && (
        <div className="w-full text-xs font-bold text-stone-700 bg-stone-100 p-2.5 rounded-xl border border-stone-200 mb-3 animate-in fade-in duration-150">
          {statusMessage}
        </div>
      )}

      {/* Quick 1-Click Demo Voice Chips */}
      <div className="w-full mb-3">
        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5 tracking-wider">
          {language === 'hi' ? 'तुरंत टेस्ट करें (1-Click Test Chips):' : 'Try Demo Voice Commands:'}
        </span>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button
            type="button"
            onClick={() => onManualTextSubmit('Ramesh bhai ko do kilo cheeni aur ek tel udhaar likh do')}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            🛒 रमेश: 2kg चीनी + 1 तेल
          </button>
          <button
            type="button"
            onClick={() => onManualTextSubmit('Sunita bhabhi 500 rupaye jama')}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            💰 सुनीता: ₹500 जमा
          </button>
          <button
            type="button"
            onClick={() => onManualTextSubmit('Sharma ji ko 1 kilo atta udhaar likh do')}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            🌾 शर्मा जी: 1kg आटा
          </button>
        </div>
      </div>

      {/* RECOGNIZED TRANSCRIPT & NOISE BADGE */}
      {currentTranscript && (
        <div className="w-full mt-2 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>{language === 'hi' ? 'सुनाई दिया (What Whisper Heard):' : 'Spoken Input:'}</span>
            <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              Whisper STT
            </span>
          </div>

          <p className="text-sm font-semibold text-stone-900 bg-white p-3 rounded-xl border border-stone-200 leading-relaxed font-devanagari">
            "{currentTranscript}"
          </p>

          {/* Strikethrough Filtered Noise */}
          {filteredNoise && (
            <div className="pt-2 border-t border-stone-200">
              <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 mb-1">
                <Filter className="w-3 h-3 text-orange-600" />
                <span>{language === 'hi' ? 'हटाया गया काउंटर शोर (Filtered Chatter):' : 'Filtered Chatter:'}</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filteredNoise.split('|').map((chunk, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 rounded bg-stone-200 text-stone-500 line-through text-[11px] font-mono"
                  >
                    {chunk.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional: Type or Test Voice Input Bar */}
      <form onSubmit={handleFormSubmit} className="w-full mt-4 flex items-center gap-2">
        <input
          type="text"
          placeholder={language === 'hi' ? 'या यहाँ लिखकर टेस्ट करें (Type Hinglish)...' : 'Or type Hinglish command...'}
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 text-stone-800"
        />
        <button
          type="submit"
          disabled={!typedInput.trim() || isProcessing}
          className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-50"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Collapsible Clean Test Examples */}
      <div className="w-full mt-5 pt-3 border-t border-stone-200 text-left">
        <button
          onClick={() => setShowSimulateDrawer(!showSimulateDrawer)}
          className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center justify-between w-full p-2 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
            <span>
              {language === 'hi' ? 'शोरगुल ऑडियो टेस्ट उदाहरण (Test Examples)' : 'Simulate Noisy Audio (Test Inputs)'}
            </span>
          </div>
          {showSimulateDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSimulateDrawer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 animate-in fade-in duration-150">
            {NOISY_GALLA_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onManualTextSubmit(preset.spokenText)}
                disabled={isProcessing}
                className="text-left p-2.5 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 transition-all text-xs group"
              >
                <div className="font-bold text-stone-800 group-hover:text-orange-900 flex items-center justify-between">
                  <span>{preset.title}</span>
                  <span className="text-[10px] text-orange-600 font-bold">Run →</span>
                </div>
                <p className="text-[11px] text-stone-500 font-mono italic truncate mt-1">
                  "{preset.spokenText}"
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
