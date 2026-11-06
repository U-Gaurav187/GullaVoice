import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Send,
  RefreshCw
} from 'lucide-react';
import { audioRecorder } from '../utils/audioRecorder.js';

export default function GallaVoiceController({
  onAudioRecorded,
  onManualTextSubmit,
  isProcessing,
  currentTranscript,
  language = 'hi'
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [recordDuration, setRecordDuration] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [typedInput, setTypedInput] = useState('');

  const timerRef = useRef(null);

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

  const handleToggleRecord = async () => {
    if (isProcessing) return;

    if (isRecording) {
      // ⏹️ Click to STOP
      setIsRecording(false);
      setStatusMessage(language === 'hi' ? '⚡ AI समझ रहा है...' : '⚡ Processing...');

      try {
        const result = await audioRecorder.stop();
        if (!result || !result.blob) {
          setStatusMessage('');
          return;
        }

        if (result.durationMs < 600) {
          setStatusMessage(language === 'hi' 
            ? '⚠️ बहुत जल्दी बंद हो गया। कृपया पूरा वाक्य बोलें।' 
            : '⚠️ Too short. Please speak complete sentence.');
          return;
        }

        setStatusMessage('');
        onAudioRecorded(result.blob);
      } catch (err) {
        console.error('Stop record error:', err);
        setStatusMessage(err.message || 'Recording failed.');
      }
    } else {
      // 🎙️ Click to RECORD
      setStatusMessage('');
      try {
        await audioRecorder.start((volume) => {
          setMicVolume(volume);
        });
        setIsRecording(true);
      } catch (err) {
        console.error('Start record error:', err);
        setStatusMessage(err.message || 'Microphone access failed.');
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!typedInput.trim() || isProcessing) return;
    onManualTextSubmit(typedInput.trim());
    setTypedInput('');
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-all">
      {/* Recording Duration Pill when active */}
      <div className="w-full h-8 flex items-center justify-center mb-2">
        {isRecording ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-mono font-bold border border-red-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span>रिकॉर्डिंग चालू: {formatTimer(recordDuration)}</span>
          </div>
        ) : isProcessing ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>AI समझ रहा है...</span>
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-stone-400">
            {language === 'hi' ? 'माइक तैयार है' : 'Microphone Ready'}
          </span>
        )}
      </div>

      {/* THE CENTRAL SLEEK PC RECORD BUTTON */}
      <div className="relative my-4 flex flex-col items-center justify-center">
        {/* Pulsing ambient ring during recording */}
        {isRecording && (
          <div 
            className="absolute rounded-full bg-red-500/15 transition-all duration-75 ease-out pointer-events-none"
            style={{
              width: `${140 + micVolume * 1.4}px`,
              height: `${140 + micVolume * 1.4}px`
            }}
          ></div>
        )}

        <button
          type="button"
          onClick={handleToggleRecord}
          disabled={isProcessing}
          className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-150 active:scale-95 cursor-pointer select-none ${
            isRecording
              ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/30 ring-8 ring-red-100 animate-pulse'
              : 'bg-gradient-to-tr from-orange-500 via-amber-600 to-orange-600 hover:shadow-orange-500/30 ring-8 ring-orange-100 hover:ring-orange-200'
          }`}
          title={isRecording ? 'क्लिक करके रोकें' : 'बोलने के लिए क्लिक करें'}
        >
          {isRecording ? (
            <>
              <Square className="w-9 h-9 fill-white" />
              <span className="text-[11px] font-black tracking-wider mt-1 uppercase">
                {language === 'hi' ? 'रोकें' : 'STOP'}
              </span>
            </>
          ) : isProcessing ? (
            <>
              <RefreshCw className="w-9 h-9 animate-spin" />
              <span className="text-[10px] font-bold mt-1">
                {language === 'hi' ? 'सोच रहे...' : 'Thinking...'}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-10 h-10" />
              <span className="text-[11px] font-black tracking-wider mt-1 uppercase">
                {language === 'hi' ? 'बोलें' : 'SPEAK'}
              </span>
            </>
          )}
        </button>

        {/* Dynamic Decibel Waves or Clean Helper Label */}
        {isRecording ? (
          <div className="flex items-center justify-center gap-1 mt-4 h-6">
            {[20, 50, 85, 65, 100, 45, 80, 35, 95, 55, 25].map((factor, i) => {
              const h = Math.max(5, Math.min(26, Math.round((micVolume / 100) * factor)));
              return (
                <span
                  key={i}
                  className="w-1 bg-red-500 rounded-full transition-all duration-75"
                  style={{ height: `${h}px` }}
                ></span>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 text-xs font-semibold text-stone-500">
            {language === 'hi' ? 'क्लिक करके बोलना शुरू करें' : 'Click to start speaking'}
          </div>
        )}
      </div>

      {/* Status Alert if needed */}
      {statusMessage && (
        <div className="w-full text-xs font-bold text-stone-700 bg-stone-100 p-2.5 rounded-xl border border-stone-200 mb-3 animate-in fade-in">
          {statusMessage}
        </div>
      )}

      {/* Transcript Card (Only shown if text was recognized) */}
      {currentTranscript && (
        <div className="w-full mt-2 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-left">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            {language === 'hi' ? 'सुनी गई आवाज़:' : 'Recognized:'}
          </span>
          <p className="text-xs font-semibold text-stone-900 font-devanagari">
            "{currentTranscript}"
          </p>
        </div>
      )}

      {/* Single Clean PC Input Bar */}
      <form onSubmit={handleFormSubmit} className="w-full mt-4 flex items-center gap-2">
        <input
          type="text"
          placeholder={language === 'hi' ? 'या कीबोर्ड से लिखकर एंटर दबाएं...' : 'Or type ledger command & Enter...'}
          value={typedInput}
          onChange={(e) => setTypedInput(e.target.value)}
          className="flex-1 text-xs p-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 text-stone-800 transition-colors"
        />
        <button
          type="submit"
          disabled={!typedInput.trim() || isProcessing}
          className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-colors disabled:opacity-40 cursor-pointer"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
