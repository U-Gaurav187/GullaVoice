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

    let completed = false;
    let safetyTimer = null;
    const finishOnce = () => {
      if (completed) return;
      completed = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange(false);
      if (onComplete) {
        // Brief 350ms gap prevents laptop speaker echo from bleeding into hands-free mic
        setTimeout(() => onComplete(), 350);
      }
    };

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStateChange) this.onStateChange(true);
    };

    utterance.onend = () => finishOnce();

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        completed = true;
        if (safetyTimer) clearTimeout(safetyTimer);
        this.isSpeaking = false;
        if (this.onStateChange) this.onStateChange(false);
        return;
      }
      console.warn('SpeechSynthesis notice:', e.error || e);
      finishOnce();
    };

    this.currentUtterance = utterance;
    // Retain strong reference to prevent Chromium GC from killing onend mid-speech
    window.__gallavoice_utterance = utterance;

    // Guarantee onComplete fires even if Windows Chromium silently drops onend
    const estMs = Math.max(3000, Math.min(12000, text.trim().length * 95 + 2200));
    safetyTimer = setTimeout(() => {
      if (!completed && !this.synth.speaking) {
        finishOnce();
      }
    }, estMs);

    setTimeout(() => {
      try {
        if (this.synth) {
          this.synth.speak(utterance);
        }
      } catch (err) {
        console.warn('Failed to trigger TTS:', err);
        finishOnce();
      }
    }, 50);
  }
}

export const speechTTS = new SpeechTTSManager();
