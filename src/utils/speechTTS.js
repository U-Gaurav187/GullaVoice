/**
 * Native Browser Speech Synthesis (TTS) Manager for Hindi (hi-IN)
 * Speeds up or adapts voice for dukandaar acoustic clarity.
 */

class SpeechTTSManager {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.voices = [];
    this.isSpeaking = false;
    this.onStateChange = null;

    if (this.synth) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  getHindiVoice() {
    if (!this.voices || !this.voices.length) {
      this.loadVoices();
    }

    // 1. Look for native Hindi (hi-IN or hi)
    const hiVoice = this.voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
    if (hiVoice) return hiVoice;

    // 2. Look for Indian English (en-IN)
    const enInVoice = this.voices.find(v => v.lang === 'en-IN' || v.lang.includes('IN'));
    if (enInVoice) return enInVoice;

    // 3. Fallback to default voice
    return this.voices.find(v => v.default) || this.voices[0] || null;
  }

  stop() {
    if (!this.synth) return;
    try {
      this.synth.cancel();
    } catch (e) {
      console.warn('TTS cancel error:', e);
    }
    this.isSpeaking = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  speak(text, onComplete) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      if (onComplete) onComplete();
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    if (!text || !text.trim()) {
      if (onComplete) onComplete();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    const voice = this.getHindiVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || 'hi-IN';
    } else {
      utterance.lang = 'hi-IN';
    }

    // Optimal rate and pitch for Indian Kirana shop counters
    utterance.rate = 0.95; // Slightly measured pace for noisy environment
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStateChange) this.onStateChange(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange(false);
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange(false);
      if (onComplete) onComplete();
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Failed to trigger TTS:', err);
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange(false);
    }
  }
}

export const speechTTS = new SpeechTTSManager();
