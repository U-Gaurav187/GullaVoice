import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Filter, AlertCircle, RefreshCw, Send } from 'lucide-react';

export default function GallaVoiceController({
  onTranscriptReady,
  isProcessing,
  currentTranscript,
  filteredNoise,
  onReset
}) {
  const [isListening, setIsListening] = useState(false);
  const [manualText, setManualText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Set to Hindi / Hinglish

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = (final || interim).trim();
      if (text) {
        setManualText(text);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access denied. Please allow mic permission in your browser.');
      } else if (event.error !== 'no-speech') {
        setErrorMessage(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-submit if text was captured
      if (manualText && manualText.trim().length > 3) {
        onTranscriptReady(manualText.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [manualText, onTranscriptReady]);

  // Sync manual input when preset is loaded
  useEffect(() => {
    if (currentTranscript) {
      setManualText(currentTranscript);
    }
  }, [currentTranscript]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setErrorMessage('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Start error:', err);
          recognitionRef.current.abort();
          setTimeout(() => recognitionRef.current?.start(), 150);
        }
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualText.trim() || isProcessing) return;
    onTranscriptReady(manualText.trim());
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">
              गल्ला वॉयस माइक (Galla Mic Controller)
            </h2>
            <p className="text-xs text-stone-500">
              Accented Hindi/Hinglish speech with live counter noise cancellation
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {isListening && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              लाइव सुन रहे हैं (Listening...)
            </span>
          )}
          {isProcessing && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              प्रोसेसिंग (Processing...)
            </span>
          )}
        </div>
      </div>

      {/* Center Giant Microphone Action */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring during recording */}
          {isListening && (
            <div className="absolute w-36 h-36 rounded-full bg-orange-500/20 animate-ping"></div>
          )}

          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-200 transform active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-500/40 ring-4 ring-red-300'
                : 'bg-gradient-to-tr from-orange-500 via-amber-600 to-orange-600 hover:shadow-orange-500/30 ring-4 ring-orange-100 hover:ring-orange-200'
            }`}
            title={isListening ? 'माइक बंद करने के लिए टैप करें' : 'बोलने के लिए टैप करें (Tap to Speak)'}
          >
            {isListening ? (
              <>
                <MicOff className="w-10 h-10 animate-bounce" />
                <span className="text-[11px] font-bold mt-1">रोकें (STOP)</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[11px] font-bold mt-1">बोलें (SPEAK)</span>
              </>
            )}
          </button>
        </div>

        {/* Live Audio Waveform Simulation */}
        {isListening ? (
          <div className="flex items-center justify-center gap-1 mt-4 h-10">
            {[14, 28, 42, 20, 36, 12, 38, 24, 40, 16, 32].map((height, i) => (
              <span
                key={i}
                className="w-1 bg-orange-500 rounded-full waveform-bar"
                style={{
                  height: `${height}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500 font-medium mt-3 text-center">
            {speechSupported
              ? 'बटन दबाकर दुकान की सामान्य भाषा में बोलें (जैसे: "रमेश भाई को 2 किलो चीनी उधार लिख दो")'
              : 'ब्राउज़र में माइक समर्थित नहीं है, नीचे टेक्स्ट लिखकर टेस्ट करें।'}
          </p>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Raw Transcript Box & Manual Text Entry */}
      <form onSubmit={handleManualSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
            <span>कहा गया वाक्य (Spoken Transcript):</span>
            <span className="text-[10px] text-stone-400 font-normal">
              Type or speak any Hinglish sentence
            </span>
          </label>
          <div className="relative">
            <textarea
              rows={2}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="जैसे: Ramesh bhai ko... wo do rupee ki he dudh 40 ka ho gaya... 2 kilo cheeni aur 1 tel udhaar likh do"
              className="w-full text-xs font-medium p-3 pr-10 rounded-xl bg-stone-50 border border-stone-300 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none text-stone-800 placeholder-stone-400"
            />
            {manualText && (
              <button
                type="submit"
                disabled={isProcessing}
                className="absolute right-2.5 bottom-3.5 p-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-xs"
                title="पार्स करें (Process Speech)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Removed Side-Chatter Display Badge (Requirement 1) */}
        {filteredNoise && (
          <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-xs">
            <div className="flex items-center gap-1.5 text-stone-600 font-semibold mb-1">
              <Filter className="w-3.5 h-3.5 text-orange-600" />
              <span>निकाली गई काउंटर बातचीत (Filtered Side-Chatter):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredNoise.split('|').map((segment, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 rounded bg-stone-200/80 text-stone-500 line-through font-mono text-[11px]"
                  title="This interruption was automatically filtered out"
                >
                  {segment.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
