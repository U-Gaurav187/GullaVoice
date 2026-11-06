/**
 * Local Deterministic & Fuzzy Parsing Engine (Zero-Key Fallback)
 * Runs 100% in the browser with zero external API calls or keys required.
 * Implements the official Galla AI Kirana JSON Schema.
 */

import { filterGallaDisturbances } from '../utils/noiseFilter.js';
import { normalizeColloquialQuantities, parseSpokenNumber } from '../utils/numberNormalizer.js';
import { matchCustomerPhonetically } from '../utils/phoneticMatcher.js';
import { checkRateCardSanity } from '../utils/rateCardSanity.js';
import { buildHindiReadback } from '../utils/hindiDevanagariHelper.js';

export function parseKiranaVoiceLocally(rawTranscript = '', customers = [], rateCard = []) {
  if (!rawTranscript || !rawTranscript.trim()) {
    return {
      intent: 'NOISE_ONLY',
      customer_spoken: '',
      matched_customer_name: '',
      matched_customer_id: null,
      match_confidence: 0,
      items: [],
      total_amount_inr: 0,
      transaction_type: 'UDHAAR',
      ignored_side_chatter: '',
      tts_hindi_readback: 'कोई आवाज़ सुनाई नहीं दी। कृपया फिर से बोलें।'
    };
  }

  // Step 1: Filter mid-sentence counter disturbances & noise
  const { cleanedCommand, ignoredNoiseText, removedNoiseSegments } = filterGallaDisturbances(rawTranscript);

  // If command was entirely noise or empty after filtering
  if (!cleanedCommand.trim()) {
    return {
      intent: 'NOISE_ONLY',
      customer_spoken: '',
      matched_customer_name: '',
      matched_customer_id: null,
      match_confidence: 0,
      items: [],
      total_amount_inr: 0,
      transaction_type: 'UDHAAR',
      ignored_side_chatter: ignoredNoiseText,
      tts_hindi_readback: 'यह केवल बातचीत थी, कोई खाता लेनदेन नहीं मिला।'
    };
  }

  // Step 2: Normalize numbers & colloquial quantities ("dedh sau", "aadha kilo", etc.)
  const normalizedText = normalizeColloquialQuantities(cleanedCommand);

  // Step 3: Determine Intent (UDHAAR vs JAMA vs CHECK_BALANCE vs NOISE_ONLY)
  const isJama = /\b(jama|diye|diya|pay|payment|jama karo|jama kar do|jama likho)\b/i.test(normalizedText);
  const isUdhaar = /\b(udhaar|udhar|baaki|baki|khate me|likh do|likho|daal do)\b/i.test(normalizedText);

  // Check if it's purely noise without transaction cues
  const hasTransactionKeywords = isJama || isUdhaar || /\b(rupaye|rupee|rs|kilo|packet|pkt|lit)\b/i.test(normalizedText);

  if (!hasTransactionKeywords && removedNoiseSegments.length > 0 && !normalizedText.includes('ko')) {
    return {
      intent: 'NOISE_ONLY',
      customer_spoken: '',
      matched_customer_name: '',
      matched_customer_id: null,
      match_confidence: 0,
      items: [],
      total_amount_inr: 0,
      transaction_type: 'UDHAAR',
      ignored_side_chatter: ignoredNoiseText,
      tts_hindi_readback: 'काउंटर बातचीत को नजरअंदाज किया गया।'
    };
  }

  const transaction_type = isJama ? 'JAMA' : 'UDHAAR';
  const intent = isJama ? 'RECEIVE_JAMA' : 'CREATE_UDHAAR';

  // Step 4: Extract Customer Name & Apply Phonetic Fuzzy Matching
  let spokenCustomerName = '';

  // Look for target customer phrase: e.g. "Ramesh bhai ko", "Sunita bhabhi ko", "Sharma ji ko"
  const koMatch = normalizedText.match(/^([a-z\s]+?)\s+(ko|ke\s+khate|ka)\b/i);
  if (koMatch) {
    spokenCustomerName = koMatch[1].trim();
  } else {
    // Check against first 2-3 words
    const words = normalizedText.split(/\s+/).slice(0, 3).join(' ');
    spokenCustomerName = words;
  }

  const phoneticMatch = matchCustomerPhonetically(spokenCustomerName, customers, 0.70);
  const matched_customer_name = phoneticMatch.matchedName;
  const match_confidence = phoneticMatch.confidence;
  const matched_customer_id = phoneticMatch.matchedId;

  // Step 5: Extract Items & Amounts
  const items = [];
  let spokenRupeesTotal = 0;

  // Extract explicit spoken total rupees: e.g. "1500 rupaye", "150 rupaye", "228 rupaye"
  const rupeeMatch = normalizedText.match(/(\d+(\.\d+)?)\s*(rupaye|rupee|rs|inr)/i);
  if (rupeeMatch) {
    spokenRupeesTotal = parseFloat(rupeeMatch[1]);
  }

  if (transaction_type === 'JAMA') {
    // For JAMA, total amount is usually the spoken rupees or parsed number
    if (spokenRupeesTotal === 0) {
      const numMatch = normalizedText.match(/\b(\d+)\b/);
      if (numMatch) spokenRupeesTotal = parseInt(numMatch[1], 10);
    }
  } else {
    // For UDHAAR, match items from store rate card
    for (const rc of rateCard) {
      const searchTerms = [rc.name, rc.displayName, ...(rc.aliases || [])];
      for (const term of searchTerms) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match quantity before item: e.g., "2 kilo cheeni", "1 packet tel", "0.5 kilo cheeni"
        const beforeRegex = new RegExp(`(\\d+(\\.\\d+)?)\\s*(kilo|kg|packet|pkt|nag|l|liter)?\\s*${escaped}`, 'i');
        // Match quantity after item: e.g., "cheeni 2 kilo", "tel ek packet"
        const afterRegex = new RegExp(`${escaped}\\s*(\\d+(\\.\\d+)?)\\s*(kilo|kg|packet|pkt|nag|l|liter)?`, 'i');

        let qty = 0;
        let unit = rc.unit || 'unit';

        const matchBefore = normalizedText.match(beforeRegex);
        const matchAfter = normalizedText.match(afterRegex);

        if (matchBefore) {
          qty = parseFloat(matchBefore[1]);
          if (matchBefore[3]) unit = matchBefore[3];
        } else if (matchAfter) {
          qty = parseFloat(matchAfter[1]);
          if (matchAfter[3]) unit = matchAfter[3];
        } else if (new RegExp(`\\b${escaped}\\b`, 'i').test(normalizedText)) {
          // Mentioned without explicit quantity -> default to 1 unit
          qty = 1;
        }

        if (qty > 0) {
          // Check if item is already added
          if (!items.some(it => it.name.toLowerCase() === rc.name.toLowerCase())) {
            items.push({
              name: rc.name,
              quantity: `${qty} ${unit}`.trim(),
              spokenPrice: spokenRupeesTotal > 0 && items.length === 0 ? spokenRupeesTotal : null,
              unitPrice: rc.unitPrice,
              calculatedPrice: Math.round(rc.unitPrice * qty),
              accentNote: null
            });
          }
          break;
        }
      }
    }
  }

  // Step 6: Price Sanity Check against Rate Card (Catches 15 vs 88 or 1500 vs 140)
  const sanityResult = checkRateCardSanity(items, spokenRupeesTotal, rateCard);
  const total_amount_inr = transaction_type === 'JAMA' 
    ? (spokenRupeesTotal || 100) 
    : sanityResult.recommendedTotal;

  // Map items to output schema with accent note
  const finalItems = sanityResult.sanitizedItems.map(it => ({
    name: it.name,
    quantity: it.quantity,
    calculated_price_inr: it.calculatedPrice,
    accent_correction_note: it.accentNote || null
  }));

  // Step 7: Mandatory Native Hindi Readback Sentence Generation
  const tts_hindi_readback = buildHindiReadback({
    customerName: matched_customer_name,
    transactionType: transaction_type,
    items: finalItems,
    totalAmount: total_amount_inr
  });

  return {
    intent,
    customer_spoken: spokenCustomerName,
    matched_customer_name,
    matched_customer_id,
    match_confidence,
    phonetic_reason: phoneticMatch.reason,
    items: finalItems,
    total_amount_inr,
    transaction_type,
    ignored_side_chatter: ignoredNoiseText,
    price_sanity_alert: sanityResult.isSanityAlert,
    price_sanity_note: sanityResult.notes,
    tts_hindi_readback
  };
}
