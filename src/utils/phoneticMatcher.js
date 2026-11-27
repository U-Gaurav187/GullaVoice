/**
 * Phonetic, Alphabet-Exact & Name-Diary Customer Matcher
 *
 * Balances regional Hindi/Hinglish recognition with strict alphabet-by-alphabet
 * differentiation (via alphabetDifferentiator.js) so names differing by even one
 * consonant (e.g. Vaishali vs Vaisali vs Vaishari vs Vaisari) are NOT conflated.
 */

import {
  compareAlphabetSimilarity,
  getExactConsonantSkeleton
} from './alphabetDifferentiator.js';

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
 * Strips common Indian honorifics, titles, and conversational query openers to isolate root names in both English and Hindi
 */
export function stripHonorifics(name = '') {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(?:कि|जरा|अरे|सुनो|हां\s+सुनो|भैया|चेक\s+करो|बताओ|देखना|ki|zara|arre?|are|suno|ha\s+suno|bhaiya|check\s+karo|batao|dekhna)\s+/iu, '')
    .replace(/\b(bhai|bhabhi|ji|bhaiya|babu|seth|uncle|devi|aunty|didi|sahab|saab|auto|auto wala|tailor|ke|ka|ko|ki|ket)\b/gi, ' ')
    .replace(/(?:^|\s+)(भाई|भाभी|भैया|बाबू|सेठ|दीदी|साहब|टेलर|ऑटो|के|का|को|की|खाते|में|केट|जी|कि)(?=\s+|$)/gi, ' ')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps Devanagari script to Hinglish phonetic phonemes
 * Handles regional dialect interchangeability:
 * - व <-> ब (Vaishali <-> Baisali)
 * - श <-> स <-> ष (Ramesh <-> Rames, Vaishali <-> Vaisali)
 * - च <-> छ, क <-> ख, ग <-> घ, ज <-> झ
 */
export function devanagariToPhonetic(str = '') {
  const charMap = {
    'अ':'a','आ':'a','इ':'i','ई':'i','उ':'u','ऊ':'u','ए':'e','ऐ':'e','ओ':'o','औ':'o',
    'ा':'a','ि':'i','ी':'i','ु':'u','ू':'u','े':'e','ै':'e','ो':'o','ौ':'o',
    'ं':'n','ँ':'n','्':'',
    'क':'k','ख':'k','ग':'g','घ':'g',
    'च':'c','छ':'c','ज':'j','झ':'j',
    'ट':'t','ठ':'t','ड':'d','ढ':'d','ण':'n',
    'त':'t','थ':'t','द':'d','ध':'d','न':'n',
    'प':'p','फ':'f','ब':'v','भ':'v','म':'m',
    'य':'y','र':'r','ल':'l','व':'v',
    'श':'s','ष':'s','स':'s','ह':'h',
    'ड़':'r','ढ़':'d','फ़':'f','ज़':'j'
  };
  return str.split('').map(ch => charMap[ch] !== undefined ? charMap[ch] : ch).join('');
}

/**
 * Hinglish Phonetic Code Transformer
 * Normalizes common regional Indian speech variations:
 * - Sh vs S (Bhojpuri / Marwari / Hindi)
 * - V vs W vs B (Vaishali / Baisali)
 * - Ph vs F
 * - Z vs J
 * - Aspirated consonants: Bh -> B, Dh -> D, Th -> T, Kh -> K, Gh -> G, Chh -> C
 * - Vowel collapse: EE -> I, OO -> U, AI -> E
 */
export function toHinglishPhoneticKey(str = '') {
  if (!str) return '';
  let s = stripHonorifics(str);

  // If contains Devanagari characters, map to phonetic Latin
  if (/[\u0900-\u097F]/.test(s)) {
    s = devanagariToPhonetic(s);
  }

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
    .replace(/bh+/g, 'v')
    .replace(/b+/g, 'v')
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
 * Resolves a spoken/transcribed customer name against the offline/editable Name Diary.
 * Preserves exact alphabet differences in strict mode while allowing cross-script alignment
 * (e.g. "Vaishali" <-> "वैशाली") and explicit user-saved ASR slip aliases.
 */
export function resolveNameFromDiary(spokenName = '', nameDiary = [], strictAlphabet = true) {
  const cleanSpoken = stripHonorifics(spokenName);
  if (!cleanSpoken || !nameDiary || !nameDiary.length) {
    return {
      matched: false,
      entry: null,
      canonicalName: spokenName,
      canonicalHindiName: spokenName,
      nearSuggestions: []
    };
  }

  let bestExact = null;
  let bestAlias = null;
  const nearSuggestions = [];

  for (const entry of nameDiary) {
    const cands = [entry.name, entry.hindiName].filter(Boolean);
    let entryBestSim = 0;
    let entryDiffs = [];
    let matchedExplicitAlias = false;

    for (const cand of cands) {
      const cleanCand = stripHonorifics(cand);
      if (!cleanCand) continue;

      const alpha = compareAlphabetSimilarity(cleanSpoken, cleanCand);
      if (cleanSpoken === cleanCand || alpha.exactMatch) {
        bestExact = entry;
        break;
      }

      if (alpha.exactAlphabetSimilarity > entryBestSim) {
        entryBestSim = alpha.exactAlphabetSimilarity;
        entryDiffs = alpha.consonantDiffs;
      }
    }

    if (bestExact) break;

    for (const alias of entry.aliases || []) {
      const cleanAlias = stripHonorifics(alias);
      if (!cleanAlias) continue;
      const alpha = compareAlphabetSimilarity(cleanSpoken, cleanAlias);
      if (cleanSpoken === cleanAlias || alpha.exactMatch) {
        matchedExplicitAlias = true;
        bestAlias = entry;
        break;
      }
    }

    if (matchedExplicitAlias) continue;

    if (entryBestSim >= 0.42) {
      nearSuggestions.push({
        id: entry.id,
        name: entry.name,
        hindiName: entry.hindiName || entry.name,
        similarity: entryBestSim,
        diffs: entryDiffs
      });
    }
  }

  if (bestExact) {
    return {
      matched: true,
      matchType: 'EXACT_ALPHABET',
      entry: bestExact,
      canonicalName: bestExact.name,
      canonicalHindiName: bestExact.hindiName || bestExact.name,
      nearSuggestions: []
    };
  }

  if (bestAlias) {
    return {
      matched: true,
      matchType: 'DIARY_ALIAS',
      entry: bestAlias,
      canonicalName: bestAlias.name,
      canonicalHindiName: bestAlias.hindiName || bestAlias.name,
      nearSuggestions: []
    };
  }

  nearSuggestions.sort((a, b) => b.similarity - a.similarity);

  // In strict alphabet mode, never silently overwrite a distinct consonant name like Vaisari -> Vaishali
  // unless an explicit alias exists; instead surface nearSuggestions for confirmation chips.
  return {
    matched: false,
    matchType: strictAlphabet ? 'STRICT_DISTINCT' : 'UNMATCHED',
    entry: null,
    canonicalName: spokenName,
    canonicalHindiName: spokenName,
    nearSuggestions: nearSuggestions.slice(0, 3)
  };
}

/**
 * Match a spoken customer name against the existing database of customers.
 * Supports strict alphabet differentiation so distinct names (Vaishali vs Vaisali vs Vaishari vs Vaisari)
 * never merge into the wrong customer ledger.
 *
 * @param {string} spokenName - The customer name recognized by speech/text
 * @param {Array} customers - List of registered customer objects
 * @param {number} threshold - Minimum confidence required for a match (0.75)
 * @param {object} options - { strictAlphabet?: boolean, diaryEntries?: Array }
 */
export function matchCustomerPhonetically(spokenName = '', customers = [], threshold = 0.75, options = {}) {
  const { strictAlphabet = true, diaryEntries = [] } = options || {};

  if (!spokenName || !customers || !customers.length) {
    const diaryInfo = resolveNameFromDiary(spokenName, diaryEntries, strictAlphabet);
    return {
      isMatch: false,
      customer: null,
      confidence: 0,
      matchedName: diaryInfo.matched ? diaryInfo.canonicalName : (spokenName || 'Unknown'),
      matchedHindiName: diaryInfo.matched ? diaryInfo.canonicalHindiName : (spokenName || ''),
      spokenName,
      nearMatches: diaryInfo.nearSuggestions || []
    };
  }

  const cleanSpoken = stripHonorifics(spokenName);
  const spokenSkeleton = getExactConsonantSkeleton(cleanSpoken);
  const phoneticSpoken = toHinglishPhoneticKey(spokenName);

  let bestMatch = null;
  let highestScore = 0;
  let bestDiffs = [];
  const nearMatchesMap = new Map();

  for (const customer of customers) {
    const primaryNames = [customer.name, customer.hindiName].filter(Boolean);
    const aliasNames = (customer.aliases || []).filter(Boolean);
    let customerHighest = 0;
    let customerBestDiffs = [];

    for (const cand of primaryNames) {
      const cleanCand = stripHonorifics(cand);
      if (!cleanCand) continue;

      const alpha = compareAlphabetSimilarity(cleanSpoken, cleanCand);

      // 1. Exact literal or exact cross-script alphabet match (e.g. "Vaishali" == "वैशाली")
      if (cleanSpoken === cleanCand || alpha.exactMatch) {
        return {
          isMatch: true,
          customer,
          confidence: 1.0,
          matchedName: customer.name,
          matchedHindiName: customer.hindiName || customer.name,
          matchedId: customer.id,
          spokenName,
          nearMatches: [],
          reason: `Exact alphabet match: ${customer.name} (100%)`
        };
      }

      // Track alphabet-exact similarity & diffs for near-match suggestions
      if (alpha.exactAlphabetSimilarity >= 0.42) {
        const existing = nearMatchesMap.get(customer.id);
        if (!existing || alpha.exactAlphabetSimilarity > existing.similarity) {
          nearMatchesMap.set(customer.id, {
            id: customer.id,
            name: customer.name,
            hindiName: customer.hindiName || customer.name,
            similarity: alpha.exactAlphabetSimilarity,
            diffs: alpha.consonantDiffs
          });
        }
      }

      let score = 0;
      const candSkeleton = getExactConsonantSkeleton(cleanCand);
      const sameConsonants = Boolean(spokenSkeleton && candSkeleton && spokenSkeleton === candSkeleton);

      if (strictAlphabet) {
        // Strict Alphabet Differentiation:
        // Consonants MUST match in full (e.g. V-SH-L vs V-S-L vs V-SH-R are blocked from auto-merging!)
        if (sameConsonants) {
          // Same consonant skeleton, minor vowel/matra difference (e.g. Anita vs Aneeta)
          score = Math.max(0.82, alpha.exactAlphabetSimilarity);
        } else {
          // Consonants differ (e.g. श vs स, ल vs र, व vs ब): cap safely below match threshold!
          score = Math.min(alpha.exactAlphabetSimilarity * 0.66, 0.62);
        }
      } else {
        // Moderate / Lenient dialect fallback when requested by user
        if (sameConsonants) {
          score = Math.max(0.88, alpha.exactAlphabetSimilarity);
        } else if (cleanSpoken.length >= 3 && cleanCand.length >= 3 && (cleanCand.includes(cleanSpoken) || cleanSpoken.includes(cleanCand))) {
          score = 0.86;
        } else if (phoneticSpoken) {
          const phoneticCand = toHinglishPhoneticKey(cand);
          if (phoneticSpoken === phoneticCand) {
            score = 0.85;
          } else {
            const phoneticSim = calculateSimilarity(phoneticSpoken, phoneticCand);
            const rawSim = calculateSimilarity(cleanSpoken, cleanCand);
            score = phoneticSim * 0.45 + alpha.exactAlphabetSimilarity * 0.35 + rawSim * 0.2;
          }
        }
      }

      if (score > customerHighest) {
        customerHighest = score;
        customerBestDiffs = alpha.consonantDiffs;
      }
    }

    // 2. Explicit user-saved aliases still match reliably
    for (const alias of aliasNames) {
      const cleanAlias = stripHonorifics(alias);
      if (!cleanAlias) continue;
      const alpha = compareAlphabetSimilarity(cleanSpoken, cleanAlias);
      if (cleanSpoken === cleanAlias || alpha.exactMatch) {
        customerHighest = Math.max(customerHighest, 0.98);
      } else if (!strictAlphabet) {
        const phoneticAlias = toHinglishPhoneticKey(alias);
        if (phoneticSpoken && phoneticAlias === phoneticSpoken) {
          customerHighest = Math.max(customerHighest, 0.88);
        }
      }
    }

    if (customerHighest > highestScore) {
      highestScore = customerHighest;
      bestMatch = customer;
      bestDiffs = customerBestDiffs;
    }
  }

  const isMatch = highestScore >= threshold && bestMatch !== null;
  const nearMatches = Array.from(nearMatchesMap.values())
    .filter(nm => !isMatch || nm.id !== bestMatch?.id)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);

  // If unmatched against registered customers, consult the offline Name Diary for canonical spelling/suggestions
  const diaryFallback = !isMatch
    ? resolveNameFromDiary(spokenName, diaryEntries, strictAlphabet)
    : null;

  const combinedNear = nearMatches.length > 0
    ? nearMatches
    : (diaryFallback?.nearSuggestions || []);

  return {
    isMatch,
    customer: isMatch ? bestMatch : null,
    confidence: Number(highestScore.toFixed(2)),
    matchedName: isMatch
      ? bestMatch.name
      : (diaryFallback?.matched ? diaryFallback.canonicalName : spokenName),
    matchedHindiName: isMatch
      ? (bestMatch.hindiName || bestMatch.name)
      : (diaryFallback?.matched ? diaryFallback.canonicalHindiName : spokenName),
    matchedId: isMatch ? bestMatch.id : null,
    spokenName,
    consonantDiffs: bestDiffs,
    nearMatches: combinedNear,
    reason: isMatch
      ? `Matched to existing customer: ${bestMatch.name} (${Math.round(highestScore * 100)}% match)`
      : `Distinct or unmatched customer: ${spokenName}`
  };
}
