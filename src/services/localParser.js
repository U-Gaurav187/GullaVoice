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

export function parseKiranaVoiceLocally(rawTranscript = '', customers = [], rateCard = [], transactions = []) {
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

  // Step 2.4: Check for Rate Card Update Voice Commands
  // Examples:
  // - "Rate card mein mooli ka daam ₹40 kilo, cheeni ka daam ₹60 kilo, aaloo ka daam ₹45 pao kar do"
  // - "रेट कार्ड में मूली का दाम 40 रुपये किलो, चीनी का दाम 60 रुपये किलो, आलू का दाम 45 पाव कर दो"
  // - "चीनी का भाव 50 रुपये किलो कर दो"
  const isRateCardUpdate = (
    /(rate\s*card|रेट\s*कार्ड)/i.test(normalizedText) &&
    /(daam|bhav|rate|price|दाम|भाव|रेट|कीमत|kilo|kg|किलो|pao|pav|पाव|packet|pkt|पैकेट|rup|रुप|kar\s*do|badal\s*do|update|कर\s*दो|बदल\s*दो)/i.test(normalizedText)
  ) || (
    /(?:ka|ke|ki|का|के|की)\s*(?:daam|bhav|rate|price|दाम|भाव|रेट|कीमत)\s*(?:₹|रु|रुपये|rs\.?)?\s*\d+/iu.test(normalizedText) &&
    /(kar\s*do|badal\s*do|update|likh\s*do|कर\s*दो|बदल\s*दो|लिख\s*दो|डाल\s*दो)/iu.test(normalizedText)
  );

  if (isRateCardUpdate) {
    const updates = extractRateCardUpdatesFromText(rawTranscript || normalizedText, rateCard);
    if (updates.length > 0) {
      const summaryItemsHindi = updates.map(u => `${u.hindiName || u.name} ₹${u.newPrice}/${u.unitLabel}`).join(', ');
      const summaryItemsEng = updates.map(u => `${u.name} ₹${u.newPrice}/${u.unit}`).join(', ');

      const tts_hindi_readback = `रेट कार्ड अपडेट हो गया है: ${summaryItemsHindi} दर्ज कर दिया गया है।`;
      const tts_readback = `Rate card updated: ${summaryItemsEng} recorded.`;

      return {
        intent: 'UPDATE_RATE_CARD',
        query_type: 'RATE_CARD_UPDATED',
        rate_card_updates: updates,
        items: [],
        customer_spoken: '',
        matched_customer_name: '',
        matched_customer_id: null,
        total_amount_inr: updates.length,
        transaction_type: 'QUERY',
        ignored_side_chatter: ignoredNoiseText,
        tts_hindi_readback,
        tts_readback,
        query_answer: {
          title: 'रेट कार्ड अपडेट (Rate Card Updated)',
          customerName: 'रेट कार्ड (Rate Card)',
          mainMetric: `${updates.length} सामान अपडेट`,
          metricLabel: 'दाम बदले गए',
          details: summaryItemsHindi
        }
      };
    }
  }

  // Step 2.5: Check for 2-Way Conversational Ledger Queries
  // Examples:
  // - "Ramesh ka kitna udhaar baaki hai?" / "रमेश भाई का खाता बताओ"
  // - "Aaj kitni sale hui?" / "Aaj kitna udhaar hua?"
  // - "Sabse zyada udhaar kiske paas hai?"
  // - "Dukan me kul kitna udhaar hai?"
  const isQuery = /\b(kitna|kitni|kitne|batao|dikhao|kiske|kiska|kisko|check|hisab|hisaab|balance|sale|bikri|dhandha)\b|कितना|कितनी|कितने|बताओ|दिखाओ|किसका|किसके|किसको|चेक|हिसाब|बैलेंस|सेल|बिक्री|धंधा/i.test(normalizedText);

  // 1. Highest Debtor Query (e.g. "Sabse zyada udhaar kiske paas hai?")
  const isHighestQuery = /(sabse\s+zyada|sabse\s+bada|sabse\s+badi|top|highest)\s*(udhaar|baaki|baki|khata)?/i.test(normalizedText) ||
    /(सबसे\s+ज्यादा|सबसे\s+बड़ा|सबसे\s+बड़ी|टॉप)\s*(उधार|बाकी|खाता)?/i.test(normalizedText);

  if (isQuery && isHighestQuery) {
    const sorted = [...customers].sort((a, b) => (b.totalUdhaar || 0) - (a.totalUdhaar || 0));
    const topCust = sorted[0];
    const topAmount = topCust ? (topCust.totalUdhaar || 0) : 0;

    let tts_hindi_readback = '';
    let tts_readback = '';

    if (topCust && topAmount > 0) {
      tts_hindi_readback = `दुकान में सबसे ज्यादा उधार ${topCust.name || topCust.hindiName} के पास है, कुल ${topAmount} रुपये बाकी है।`;
      tts_readback = `The highest udhaar in the store is with ${topCust.name}, total ₹${topAmount}.`;
    } else {
      tts_hindi_readback = 'दुकान में किसी भी ग्राहक का उधार बाकी नहीं है, सभी खाते चुकता हैं।';
      tts_readback = 'No outstanding udhaar with any customer in the store.';
    }

    return {
      intent: 'CHECK_HIGHEST_UDHAAR',
      query_type: 'HIGHEST_UDHAAR',
      customer_spoken: topCust?.name || '',
      matched_customer_name: topCust?.name || '',
      matched_customer_id: topCust?.id || null,
      total_amount_inr: topAmount,
      customer_data: topCust,
      items: [],
      transaction_type: 'QUERY',
      ignored_side_chatter: ignoredNoiseText,
      tts_hindi_readback,
      tts_readback,
      query_answer: {
        title: 'सबसे ज्यादा उधार (Top Debtor)',
        customerName: topCust?.name || 'कोई नहीं',
        mainMetric: `₹${topAmount.toLocaleString('en-IN')}`,
        metricLabel: 'कुल उधार बाकी',
        details: topCust ? `जमा: ₹${(topCust.totalJama || 0).toLocaleString('en-IN')}` : 'सभी खाते चुकता'
      }
    };
  }

  // 2. Today's Business Summary Query (e.g. "Aaj kitni sale hui?", "Aaj kitna udhaar hua?")
  const isTodayQuery = /\b(aaj|today)\b/i.test(normalizedText) || /आज/i.test(normalizedText);
  const isBusinessMetric = /(sale|bikri|dhandha|hisab|hisaab|udhaar|jama|kamai|kitna|kitni)/i.test(normalizedText) ||
    /(सेल|बिक्री|धंधा|हिसाब|उधार|जमा|कमाई|कितना|कितनी)/i.test(normalizedText);

  if (isQuery && isTodayQuery && isBusinessMetric && !/(khate|khata|bhai|bhabhi|ji)\b/i.test(normalizedText)) {
    const todayStr = new Date().toDateString();
    const todayTxns = (transactions || []).filter(t => {
      const d = t.timestamp ? new Date(t.timestamp) : (t.date ? new Date(t.date) : null);
      return d && d.toDateString() === todayStr;
    });

    const todayUdhaar = todayTxns.filter(t => t.type === 'UDHAAR').reduce((sum, t) => sum + (t.amount || t.totalAmount || 0), 0);
    const todayJama = todayTxns.filter(t => t.type === 'JAMA').reduce((sum, t) => sum + (t.amount || t.totalAmount || 0), 0);
    const todayCount = todayTxns.length;

    const tts_hindi_readback = `आज दुकान में कुल ${todayCount} लेनदेन हुए: ${todayUdhaar} रुपये उधार और ${todayJama} रुपये जमा दर्ज किए गए।`;
    const tts_readback = `Today: ${todayCount} transactions recorded. ₹${todayUdhaar} udhaar credit and ₹${todayJama} cash payment received.`;

    return {
      intent: 'CHECK_TODAY_SUMMARY',
      query_type: 'TODAY_SUMMARY',
      customer_spoken: '',
      matched_customer_name: '',
      matched_customer_id: null,
      total_amount_inr: todayUdhaar + todayJama,
      items: [],
      transaction_type: 'QUERY',
      ignored_side_chatter: ignoredNoiseText,
      tts_hindi_readback,
      tts_readback,
      query_answer: {
        title: 'आज का खाता व हिसाब (Today\'s Summary)',
        mainMetric: `₹${(todayUdhaar + todayJama).toLocaleString('en-IN')}`,
        metricLabel: `कुल लेनदेन: ${todayCount}`,
        details: `उधार: ₹${todayUdhaar.toLocaleString('en-IN')} | जमा: ₹${todayJama.toLocaleString('en-IN')}`
      }
    };
  }

  // 3. Store Total Outstanding Query (e.g. "Dukan me kul kitna udhaar hai?")
  const isStoreTotal = /(dukan|store|total|kul|dukaan)\s*(me|mein|ka|ki)?\s*(kul|total)?\s*(kitna|udhaar|baaki|baki|balance)/i.test(normalizedText) ||
    /(दुकान|स्टोर|कुल|टोटल)\s*(में|का|की)?\s*(कुल|टोटल)?\s*(कितना|उधार|बाकी|बैलेंस)/i.test(normalizedText);

  if (isQuery && isStoreTotal && !/(khate|khata|bhai|bhabhi|ji)\b/i.test(normalizedText)) {
    const totalUdhaar = (customers || []).reduce((sum, c) => sum + (c.totalUdhaar || 0), 0);
    const totalJama = (customers || []).reduce((sum, c) => sum + (c.totalJama || 0), 0);

    const tts_hindi_readback = `दुकान में वर्तमान में कुल ${totalUdhaar} रुपये उधार बाकी है और ${totalJama} रुपये जमा है।`;
    const tts_readback = `Total store outstanding udhaar is ₹${totalUdhaar}, and total jama is ₹${totalJama}.`;

    return {
      intent: 'CHECK_TOTAL_STORE_BALANCE',
      query_type: 'STORE_TOTAL',
      customer_spoken: '',
      matched_customer_name: '',
      matched_customer_id: null,
      total_amount_inr: totalUdhaar,
      items: [],
      transaction_type: 'QUERY',
      ignored_side_chatter: ignoredNoiseText,
      tts_hindi_readback,
      tts_readback,
      query_answer: {
        title: 'दुकान की कुल स्थिति (Store Outstanding)',
        mainMetric: `₹${totalUdhaar.toLocaleString('en-IN')}`,
        metricLabel: 'कुल उधार बाकी',
        details: `कुल जमा: ₹${totalJama.toLocaleString('en-IN')}`
      }
    };
  }

  // 4. Customer Specific Balance Query (e.g. "Ramesh ka kitna udhaar baaki hai?", "रमेश भाई का खाता बताओ", "वैशाली खाते में कितना हुआ?")
  const isCustomerBalanceQuery = isQuery && (
    /(kitna\s+udhaar|udhaar\s+kitna|kitna\s+baaki|kitna\s+baki|kitna\s+balance|balance\s+kitna|khata\s+batao|khata\s+dikhao|hisab\s+batao)/i.test(normalizedText) ||
    /(कितना\s+उधार|उधार\s+कितना|कितना\s+बाकी|कितना\s+बैलेंस|बैलेंस\s+कितना|खाता\s+बताओ|खाता\s+दिखाओ|हिसाब\s+बताओ)/i.test(normalizedText) ||
    /\b(khata|khate|khatam)\b.*(udhaar|baki|baaki|kitna|kitne|kitni|hua|hue|hai|batao|dikhao)/i.test(normalizedText) ||
    /(खाता|खाते|खातं).*(उधार|बाकी|कितना|कितने|कितनी|हुआ|हुए|है|बताओ|दिखाओ)/i.test(normalizedText) ||
    /(?:ka|ke|ki|का|के|की)\s*(?:kitna|kitne|kitni|कितना|कितने|कितनी)\s*(?:hua|hue|hai|baaki|baki|udhaar|हुआ|हुए|है|बाकी|उधार)/i.test(normalizedText)
  );

  if (isCustomerBalanceQuery) {
    let spokenCust = '';
    let cleanedQ = normalizedText.trim().replace(/[।.,!?]+$/g, '');
    cleanedQ = cleanedQ.replace(/^(?:कि|जरा|अरे|सुनो|हां\s+सुनो|भैया|चेक\s+करो|बताओ|देखना|ki|zara|arre?|are|suno|ha\s+suno|bhaiya|check\s+karo|batao|dekhna)\s+/iu, '');

    const m1 = cleanedQ.match(/^(.+?)\s+(?:(?:ke|ka|ki|ko|के|का|की|को)\s+)?(?:khate\s+me(?:in)?|khata\s+me(?:in)?|khate|khata|khatam|खाते\s+में|खाता\s+में|खाते|खाता|खातं)\s+(?:kitna|kitne|kitni|udhaar|udhar|baaki|baki|hisab|hisaab|balance|hua|hue|hai|batao|dikhao|कितना|कितने|कितनी|उधार|बाकी|हिसाब|बैलेंस|हुआ|हुए|है|बताओ|दिखाओ)/iu);
    if (m1) {
      spokenCust = m1[1].trim();
    } else {
      const m2 = cleanedQ.match(/^(.+?)\s+(?:ke|ka|ki|ko|के|का|की|को)\s+(?:kitna|kitne|kitni|udhaar|udhar|baaki|baki|hisab|hisaab|balance|hua|hue|hai|batao|dikhao|कितना|कितने|कितनी|उधार|बाकी|हिसाब|बैलेंस|हुआ|हुए|है|बताओ|दिखाओ)/iu);
      if (m2) {
        spokenCust = m2[1].trim();
      } else {
        const custMatch = cleanedQ.match(/(?:(?:ha\s+suno|suno|arre?|are|bhaiya)\s+)?([\p{L}\p{M}\s]+?)\s+(?:ka|ke|ki|ko|का|के|की|को)\s+(?:kitna|khata|khate|udhaar|udhar|balance|baaki|baki|hisab|hisaab)/iu);
        if (custMatch) {
          spokenCust = custMatch[1].trim();
        } else {
          spokenCust = cleanedQ.split(/\s+/).slice(0, 2).join(' ');
        }
      }
    }

    const phoneticMatch = matchCustomerPhonetically(spokenCust, customers, 0.60);
    const targetCust = phoneticMatch.isMatch ? phoneticMatch.customer : customers.find(c => 
      c.name.toLowerCase().includes(spokenCust.toLowerCase()) || 
      (c.hindiName && c.hindiName.includes(spokenCust))
    );

    if (targetCust) {
      const udhaar = targetCust.totalUdhaar || 0;
      const jama = targetCust.totalJama || 0;
      const net = Math.max(0, udhaar - jama);

      let tts_hindi_readback = '';
      let tts_readback = '';

      if (udhaar > 0 && jama > 0) {
        tts_hindi_readback = `${targetCust.hindiName || targetCust.name} के खाते में कुल ${udhaar} रुपये उधार है और ${jama} रुपये जमा है। कुल बाकी ${net} रुपये है।`;
        tts_readback = `${targetCust.name} has ₹${udhaar} udhaar and ₹${jama} payment. Net balance is ₹${net}.`;
      } else if (udhaar > 0) {
        tts_hindi_readback = `${targetCust.hindiName || targetCust.name} के खाते में कुल ${udhaar} रुपये उधार बाकी है।`;
        tts_readback = `${targetCust.name} has ₹${udhaar} pending udhaar.`;
      } else {
        tts_hindi_readback = `${targetCust.hindiName || targetCust.name} का कोई उधार बाकी नहीं है, खाता चुकता है।`;
        tts_readback = `${targetCust.name} has zero balance, account is fully settled.`;
      }

      return {
        intent: 'CHECK_BALANCE',
        query_type: 'CUSTOMER_BALANCE',
        customer_spoken: spokenCust,
        matched_customer_name: targetCust.name,
        matched_customer_id: targetCust.id,
        match_confidence: phoneticMatch.confidence || 0.95,
        total_amount_inr: udhaar,
        customer_data: targetCust,
        items: [],
        transaction_type: 'QUERY',
        ignored_side_chatter: ignoredNoiseText,
        tts_hindi_readback,
        tts_readback,
        query_answer: {
          title: `${targetCust.name} का खाता`,
          customerName: targetCust.name,
          hindiName: targetCust.hindiName,
          mainMetric: `₹${udhaar.toLocaleString('en-IN')}`,
          metricLabel: 'कुल उधार बाकी',
          details: `जमा: ₹${jama.toLocaleString('en-IN')}`
        }
      };
    } else {
      const tts_hindi_readback = `ग्राहक '${spokenCust}' का कोई खाता नहीं मिला। क्या नया खाता खोलना चाहते हैं?`;
      const tts_readback = `No customer record found for '${spokenCust}'.`;

      return {
        intent: 'CHECK_BALANCE',
        query_type: 'CUSTOMER_NOT_FOUND',
        customer_spoken: spokenCust,
        matched_customer_name: spokenCust,
        matched_customer_id: null,
        match_confidence: 0,
        total_amount_inr: 0,
        customer_data: null,
        items: [],
        transaction_type: 'QUERY',
        ignored_side_chatter: ignoredNoiseText,
        tts_hindi_readback,
        tts_readback,
        query_answer: {
          title: 'ग्राहक नहीं मिला',
          customerName: spokenCust,
          mainMetric: 'रिकॉर्ड नहीं मिला',
          metricLabel: 'खाता स्थिति',
          details: 'कृपया ग्राहक का नाम सही से बोलें या नया खाता जोड़ें'
        }
      };
    }
  }

  // Step 3: Determine Intent for Transactions (UDHAAR vs JAMA)
  const isJama = /\b(jama|diye|diya|pay|payment|jama karo|jama kar do|jama likho)\b|जमा|दिए|दिया/i.test(normalizedText);
  const isUdhaar = /\b(udhaar|udhar|baaki|baki|khate me|khate mein|likh do|likho|daal do|rakh do|ragda)\b|उधार|खाते में|खाते|लिख दो|रख दो|रगदा|रख दा|डाल दो|चढ़ा दो/i.test(normalizedText);

  // Check if it's purely noise without transaction cues
  const hasTransactionKeywords = isJama || isUdhaar || /\b(rupaye|rupee|rs|kilo|packet|pkt|lit)\b|रुपये|किलो|पैकेट|लीटर/i.test(normalizedText);

  if (!hasTransactionKeywords && removedNoiseSegments.length > 0 && !normalizedText.includes('ko') && !normalizedText.includes('को')) {
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

  // Look for target customer phrase: e.g. "वैशाली के खाते में", "Ramesh bhai ko", "Sunita bhabhi ko"
  const koMatch = normalizedText.match(/^([\p{L}\p{M}\s]+?)\s+(?:के\s+खाते\s+में|ke\s+khate\s+mein|के\s+खाते|ke\s+khate|को|ko|का|ka|की|के|ke)(?:[\s,।]+|$)/iu);
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
      const searchTerms = [rc.name, rc.displayName, rc.hindiName, ...(rc.aliases || [])].filter(Boolean);
      for (const term of searchTerms) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match quantity before item: e.g., "2 kilo cheeni", "4 किलो कांदे", "1 packet tel"
        const beforeRegex = new RegExp(`(\\d+(\\.\\d+)?)\\s*(kilo|kg|packet|pkt|nag|l|liter|किलो|पैकेट|लीटर)?\\s*${escaped}`, 'iu');
        // Match quantity after item: e.g., "cheeni 2 kilo", "कांदे 4 किलो"
        const afterRegex = new RegExp(`${escaped}\\s*(\\d+(\\.\\d+)?)\\s*(kilo|kg|packet|pkt|nag|l|liter|किलो|पैकेट|लीटर)?`, 'iu');

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
        } else {
          // Check standalone word boundary so "batao" does not match "atta"
          const wordRegex = new RegExp(`(?:^|[\\s,।])(?:ek\\s+)?${escaped}(?:[\\s,।]|$)`, 'iu');
          if (wordRegex.test(normalizedText)) {
            qty = 1;
          }
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

/**
 * Extracts item price updates from natural spoken Rate Card commands
 */
export function extractRateCardUpdatesFromText(rawText = '', rateCard = []) {
  let clean = rawText.replace(/^(?:rate\s*card\s*(?:mein|me|update)?|रेट\s*कार्ड\s*(?:में|अपडेट)?)\s*/iu, '');
  clean = clean.replace(/(?:kar\s*do|likh\s*do|badal\s*do|update\s*karo|कर\s*दो|लिख\s*दो|बदल\s*दो|अपडेट\s*करो)[.।]?$/iu, '');

  const regex = /([a-zA-Z\u0900-\u097F]+(?:\s+[a-zA-Z\u0900-\u097F]+)?)\s+(?:(?:ka|ke|ki|का|के|की)\s+)?(?:daam|bhav|rate|price|दाम|भाव|रेट|कीमत)?\s*(?:₹|रु|रुपये|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:₹|रु|रुपये|rs\.?|rupee|rupees)?\s*(kilo|kg|किलो|pao|pav|पाव|packet|pkt|पैकेट|liter|litre|लीटर|piece|pc|नग)?/giu;

  const updates = [];
  let m;
  while ((m = regex.exec(clean)) !== null) {
    let rawName = m[1].replace(/^(?:aur|and|और)\s+/iu, '').trim();
    rawName = rawName.replace(/\s+(?:ka|ke|ki|का|के|की)$/iu, '').trim();
    if (/^(?:rate|card|रेट|कार्ड|दाम|भाव|update|karo|करो)$/i.test(rawName)) continue;

    let price = parseFloat(m[2]);
    let rawUnit = (m[3] || 'kg').toLowerCase();

    let unit = 'kg';
    let unitLabel = 'किलो';
    if (/पाव|pao|pav/i.test(rawUnit)) { unit = 'pao'; unitLabel = 'पाव'; }
    else if (/पैकेट|packet|pkt/i.test(rawUnit)) { unit = 'pkt'; unitLabel = 'पैकेट'; }
    else if (/लीटर|liter|litre|ltr/i.test(rawUnit)) { unit = 'ltr'; unitLabel = 'लीटर'; }
    else if (/piece|pc|नग/i.test(rawUnit)) { unit = 'pc'; unitLabel = 'नग'; }

    // Match against existing rateCard
    const lower = rawName.toLowerCase();
    const existing = (rateCard || []).find(rc => 
      rc.name.toLowerCase() === lower ||
      rc.hindiName === rawName ||
      (rc.aliases && rc.aliases.some(a => a.toLowerCase() === lower || lower.includes(a.toLowerCase())))
    );

    updates.push({
      name: existing ? existing.name : (rawName.charAt(0).toUpperCase() + rawName.slice(1)),
      hindiName: existing ? (existing.hindiName || rawName) : rawName,
      oldPrice: existing ? existing.unitPrice : null,
      newPrice: price,
      unit: unit,
      unitLabel: unitLabel,
      isNew: !existing,
      id: existing ? existing.id : `ITEM_${Date.now()}_${updates.length}`
    });
  }
  return updates;
}
