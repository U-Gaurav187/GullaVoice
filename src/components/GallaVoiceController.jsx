import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  Languages, 
  Send,
  Play,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info
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
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [lastAudioStats, setLastAudioStats] = useState(null);

  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const pressStartTimeRef = useRef(0);
  const sessionStartTimeRef = useRef(0);
  const isHoldingRef = useRef(false);

  isRecordingRef.current = isRecording;

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
    if (isProcessing || isRecordingRef.current) return;
    setStatusMessage('');
    setAudioPreviewUrl(null);
    sessionStartTimeRef.current = Date.now();

    try {
      await audioRecorder.start((volume) => {
        setMicVolume(volume);
      });
      setIsRecording(true);
      setStatusMessage(language === 'hi' 
        ? '🎙️ सुन रहे हैं... (बोलते रहें, पूरा होने पर छोड़ें या दोबारा टैप करें)' 
        : '🎙️ Listening... (Speak naturally, release or tap again when finished)');
    } catch (err) {
      console.error('Mic start error:', err);
      setIsRecording(false);
      setStatusMessage(err.message || 'Microphone access failed. Please allow microphone in browser.');
    }
  };

  const stopRecordingSession = async () => {
    if (!isRecordingRef.current) return;
    setIsRecording(false);
    setStatusMessage(language === 'hi' 
      ? '⚡ Whisper AI आवाज़ को समझ रहा है...' 
      : '⚡ Whisper AI transcribing audio...');

    try {
      const result = await audioRecorder.stop();
      if (!result || !result.blob) {
        setStatusMessage('Recording was empty.');
        return;
      }

      console.log(`🎙️ Captured WAV Audio: ${result.durationMs}ms, ${result.sizeBytes} bytes, ${result.mimeType}`);

      // Minimum audio duration check (at least 700ms and 15KB)
      if (result.durationMs < 700 || result.sizeBytes < 15000) {
        setStatusMessage(language === 'hi' 
          ? '⚠️ बहुत जल्दी बंद हो गया (< 1 सेकंड)। कृपया माइक दबाकर पूरा वाक्य बोलें।' 
          : '⚠️ Too short (< 1s). Please hold mic and speak full sentence.');
        return;
      }

      // Create audio preview URL so user can listen to what mic recorded
      const preview = URL.createObjectURL(result.blob);
      setAudioPreviewUrl(preview);
      setLastAudioStats({ durationMs: result.durationMs, sizeBytes: result.sizeBytes });

      // Pass high-fidelity WAV blob to AI pipeline
      onAudioRecorded(result.blob);
    } catch (err) {
      console.error('Stop error:', err);
      setStatusMessage(err.message || 'Failed to capture audio.');
    }
  };

  // Dual Interaction Handlers: Push-to-Talk (Hold & Release) + Tap-to-Toggle
  const handlePointerDown = (e) => {
    if (isProcessing) return;
    pressStartTimeRef.current = Date.now();
    isHoldingRef.current = true;

    if (!isRecordingRef.current) {
      startRecordingSession();
    }
  };

  const handlePointerUp = (e) => {
    if (isProcessing) return;
    const holdDuration = Date.now() - pressStartTimeRef.current;
    isHoldingRef.current = false;

    if (isRecordingRef.current) {
      // If held for > 400ms, it was a Push-to-Talk hold -> stop on release!
      if (holdDuration > 400) {
        stopRecordingSession();
      } 
      // If tapped and session has run for > 600ms, second tap stops hands-free recording!
      else if (Date.now() - sessionStartTimeRef.current > 600) {
        stopRecordingSession();
      }
    }
  };

  const handlePlayRecordedAudio = () => {
    if (audioPreviewUrl) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const player = new Audio(audioPreviewUrl);
      audioPlayerRef.current = player;
      player.play().catch(e => console.warn('Audio playback failed:', e));
    }
  };

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

      {/* THE CENTRAL GIANT MINIMALIST MIC BUTTON (Dual-Mode: Hold or Tap) */}
      <div className="relative my-4 flex flex-col items-center justify-center">
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
          type="button"
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          disabled={isProcessing}
          className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-150 active:scale-95 cursor-pointer select-none touch-none ${
            isRecording
              ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/40 ring-8 ring-red-100 animate-pulse'
              : 'bg-gradient-to-tr from-orange-500 via-amber-600 to-orange-600 hover:shadow-orange-500/40 ring-8 ring-orange-100 hover:ring-orange-200'
          }`}
          title={isRecording ? 'छोड़ें या टैप करें' : 'दबाकर रखें या टैप करें'}
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
                {language === 'hi' ? 'बोलें (HOLD/TAP)' : 'SPEAK'}
              </span>
            </>
          )}
        </button>

        {/* Dynamic Waveform & Helpful Guidance */}
        {isRecording ? (
          <div className="flex flex-col items-center mt-3">
            <div className="flex items-center justify-center gap-1.5 h-8">
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
            <span className="text-[11px] text-red-600 font-bold mt-1 animate-pulse">
              {micVolume > 5 ? '🎙️ आवाज़ आ रही है...' : '🎙️ बोलिए, सुन रहे हैं...'}
            </span>
          </div>
        ) : (
          <p className="text-xs text-stone-500 font-medium mt-4 max-w-xs">
            {language === 'hi' 
              ? 'बटन दबाकर रखें और बोलें (या एक बार टैप करके बोलें)' 
              : 'Press & hold to speak (or tap once to record)'}
          </p>
        )}
      </div>

      {/* Live status alert message */}
      {statusMessage && (
        <div className="w-full text-xs font-bold text-stone-700 bg-stone-100 p-2.5 rounded-xl border border-stone-200 mb-3 animate-in fade-in duration-150">
          {statusMessage}
        </div>
      )}

      {/* Audio Playback Verification Pill (Listen to what your mic recorded!) */}
      {audioPreviewUrl && lastAudioStats && (
        <div className="w-full mb-3 p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'hi' ? 'रिकॉर्ड हुई आवाज़:' : 'Microphone audio:'}
            </span>
            <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full font-mono">
              {Math.round(lastAudioStats.durationMs / 100) / 10}s • {Math.round(lastAudioStats.sizeBytes / 1024)} KB WAV
            </span>
          </div>
          <button
            type="button"
            onClick={handlePlayRecordedAudio}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{language === 'hi' ? 'आवाज़ सुनें' : 'Play Audio'}</span>
          </button>
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
