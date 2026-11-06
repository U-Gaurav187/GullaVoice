/**
 * Unified Galla Voice Parser Orchestrator
 * Seamlessly toggles between Phase 1 Zero-Key Local Engine and Phase 2 Free Cloud LLMs.
 */

import { parseKiranaVoiceLocally } from './localParser.js';
import { parseWithGroqLlama } from './groqService.js';
import { parseWithGeminiFlash } from './geminiService.js';

export async function processGallaSpeech({
  transcript,
  settings,
  customers = [],
  rateCard = []
}) {
  const engine = settings?.engine || 'LOCAL_ZERO_KEY';
  const groqKey = settings?.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '';
  const geminiKey = settings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  // Mode 1: Free Groq Llama 3.3 70B
  if (engine === 'GROQ_LLAMA' && groqKey) {
    try {
      console.log('⚡ Processing speech via Groq Llama-3.3-70B...');
      const cloudResult = await parseWithGroqLlama({
        apiKey: groqKey,
        transcript,
        customers,
        rateCard
      });
      return {
        ...cloudResult,
        sourceEngine: 'Groq Llama 3.3 70B (Cloud AI)',
        isCloud: true
      };
    } catch (err) {
      console.warn('Groq parsing failed, falling back to Local Zero-Key Engine:', err.message);
      const localFallback = parseKiranaVoiceLocally(transcript, customers, rateCard);
      return {
        ...localFallback,
        sourceEngine: 'Local Deterministic (Fallback Active)',
        engineError: err.message,
        isCloud: false
      };
    }
  }

  // Mode 2: Free Google Gemini 2.5 Flash
  if (engine === 'GEMINI_FLASH' && geminiKey) {
    try {
      console.log('⚡ Processing speech via Google Gemini 2.5 Flash...');
      const cloudResult = await parseWithGeminiFlash({
        apiKey: geminiKey,
        transcript,
        customers,
        rateCard
      });
      return {
        ...cloudResult,
        sourceEngine: 'Google Gemini 2.5 Flash (Cloud AI)',
        isCloud: true
      };
    } catch (err) {
      console.warn('Gemini parsing failed, falling back to Local Zero-Key Engine:', err.message);
      const localFallback = parseKiranaVoiceLocally(transcript, customers, rateCard);
      return {
        ...localFallback,
        sourceEngine: 'Local Deterministic (Fallback Active)',
        engineError: err.message,
        isCloud: false
      };
    }
  }

  // Default: Phase 1 Zero-Key Deterministic & Fuzzy Matcher (100% offline, zero-key)
  const localResult = parseKiranaVoiceLocally(transcript, customers, rateCard);
  return {
    ...localResult,
    sourceEngine: 'Local Deterministic & Phonetic Engine (Zero-Key)',
    isCloud: false
  };
}
