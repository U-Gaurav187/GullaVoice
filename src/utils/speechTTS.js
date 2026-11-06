/**
 * Browser Speech Synthesis Manager
 * Supports natural voice readback in either Hindi ('hi-IN') or Indian English ('en-IN').
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

  getVoiceForLanguage(lang = 'hi') {
    if (!this.voices || !this.voices.length) {
      this.loadVoices();
    }

    if (lang === 'hi') {
      // Look for Hindi voice
      const hiVoice = this.voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      if (hiVoice) return hiVoice;
      // Fallback to Indian English
      const enInVoice = this.voices.find(v => v.lang === 'en-IN' || v.lang.includes('IN'));
      if (enInVoice) return enInVoice;
    } else {
      // Look for Indian English first, then general English
      const enInVoice = this.voices.find(v => v.lang === 'en-IN' || v.lang.includes('IN'));
      if (enInVoice) return enInVoice;
      const enVoice = this.voices.find(v => v.lang.startsWith('en'));
      if (enVoice) return enVoice;
    }

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

  speak(text, lang = 'hi', onComplete) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      if (onComplete) onComplete();
      return;
    }

    this.stop();

    if (!text || !text.trim()) {
      if (onComplete) onComplete();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    const voice = this.getVoiceForLanguage(lang);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || (lang === 'hi' ? 'hi-IN' : 'en-IN');
    } else {
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }

    utterance.rate = 0.95; // Clear articulation
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
