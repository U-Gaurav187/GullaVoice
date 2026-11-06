/**
 * Phonetic & Fuzzy Customer Name Matcher
 * Maps regional Indian accents (e.g., "Rames", "Ramess", "Rameshwar" -> "Ramesh Bhai")
 * using Hinglish phonetic sound transformation and Levenshtein distance.
 */

/**
 * Standard Levenshtein distance calculation
 */
export function calculateLevenshteinDistance(str1 = '', str2 = '') {
  const s1 = (str1 || '').toLowerCase().trim();
  const s2 = (str2 || '').toLowerCase().trim();

  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const matrix = Array.from({ length: s1.length + 1 }, () =>
    new Array(s2.length + 1).fill(0)
  );

  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[s1.length][s2.length];
}

/**
 * Compute normalized similarity score between 0 and 1
 */
export function calculateSimilarity(str1 = '', str2 = '') {
  const s1 = (str1 || '').toLowerCase().trim();
  const s2 = (str2 || '').toLowerCase().trim();
  if (!s1 && !s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = calculateLevenshteinDistance(s1, s2);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Strips common Indian honorifics and titles to isolate root names in both English and Hindi
 */
export function stripHonorifics(name = '') {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(bhai|bhabhi|ji|bhaiya|babu|seth|uncle|devi|aunty|didi|sahab|saab|auto|auto wala|tailor|ke|ka|ko)\b/gi, '')
    .replace(/(भाई|भाभी|जी|भैया|बाबू|सेठ|दीदी|साहब|टेलर|ऑटो|के|का|को|की|खाते|में)/gi, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hinglish Phonetic Code Transformer
 * Normalizes common regional Indian speech variations:
 * - Sh vs S (Bhojpuri / Marwari / Hindi)
 * - V vs W
 * - Ph vs F
 * - Z vs J
 * - Aspirated consonants: Bh -> B, Dh -> D, Th -> T, Kh -> K, Gh -> G, Chh -> C
 * - Vowel collapse: EE -> I, OO -> U, AI -> E
 */
export function toHinglishPhoneticKey(str = '') {
  if (!str) return '';
  let s = stripHonorifics(str);

  // Common Hindi Devanagari transliteration simplifications
  s = s
    .toLowerCase()
    .replace(/sh+/g, 's')
    .replace(/sch+/g, 's')
    .replace(/chh+/g, 'c')
    .replace(/ch+/g, 'c')
    .replace(/kh+/g, 'k')
    .replace(/gh+/g, 'g')
    .replace(/th+/g, 't')
    .replace(/dh+/g, 'd')
    .replace(/bh+/g, 'b')
    .replace(/ph+/g, 'f')
    .replace(/w+/g, 'v')
    .replace(/z+/g, 'j')
    .replace(/ee+/g, 'i')
    .replace(/ea+/g, 'i')
    .replace(/oo+/g, 'u')
    .replace(/ou+/g, 'u')
    .replace(/ai+/g, 'e')
    .replace(/ay+/g, 'e')
    .replace(/au+/g, 'o')
    .replace(/aa+/g, 'a')
    .replace(/(.)\1+/g, '$1') // collapse double letters (e.g. 'mm' -> 'm', 'ss' -> 's')
    .trim();

  return s;
}

/**
 * Match a spoken customer name against the existing database of customers.
 * Returns best match if confidence >= threshold (default 0.75).
 * 
 * @param {string} spokenName - The customer name recognized by speech/text
 * @param {Array} customers - List of registered customer objects
 * @param {number} threshold - Minimum confidence required for a match (0.75)
 */
export function matchCustomerPhonetically(spokenName = '', customers = [], threshold = 0.75) {
  if (!spokenName || !customers || !customers.length) {
    return {
      isMatch: false,
      customer: null,
      confidence: 0,
      matchedName: spokenName || 'Unknown',
      spokenName
    };
  }

  const cleanSpoken = stripHonorifics(spokenName);
  const phoneticSpoken = toHinglishPhoneticKey(spokenName);

  let bestMatch = null;
  let highestScore = 0;

  for (const customer of customers) {
    const candidateNames = [
      customer.name,
      customer.hindiName,
      ...(customer.aliases || [])
    ];

    for (const cand of candidateNames) {
      if (!cand) continue;
      const cleanCand = stripHonorifics(cand);
      const phoneticCand = toHinglishPhoneticKey(cand);

      // 1. Exact or Substring match
      if (cleanSpoken && cleanCand && (cleanCand.includes(cleanSpoken) || cleanSpoken.includes(cleanCand))) {
        const score = 0.95;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = customer;
        }
      }

      // 2. Hinglish Phonetic Key Match
      if (phoneticSpoken && phoneticCand) {
        if (phoneticSpoken === phoneticCand) {
          const score = 0.92;
          if (score > highestScore) {
            highestScore = score;
            bestMatch = customer;
          }
        } else {
          const phoneticSim = calculateSimilarity(phoneticSpoken, phoneticCand);
          const rawSim = calculateSimilarity(cleanSpoken, cleanCand);
          const weightedSim = phoneticSim * 0.65 + rawSim * 0.35;

          if (weightedSim > highestScore) {
            highestScore = weightedSim;
            bestMatch = customer;
          }
        }
      }
    }
  }

  const isMatch = highestScore >= threshold && bestMatch !== null;

  return {
    isMatch,
    customer: isMatch ? bestMatch : null,
    confidence: Number(highestScore.toFixed(2)),
    matchedName: isMatch ? bestMatch.name : spokenName,
    matchedId: isMatch ? bestMatch.id : null,
    spokenName,
    reason: isMatch 
      ? `Matched to existing customer: ${bestMatch.name} (${Math.round(highestScore * 100)}% phonetic match)`
      : `New or unmatched customer: ${spokenName}`
  };
}
