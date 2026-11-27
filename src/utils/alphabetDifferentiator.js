/**
 * Alphabet-by-Alphabet & Akshara Differentiator Engine (100% Offline, Zero-Key)
 *
 * Decomposes both Hindi Devanagari and English/Hinglish words into exact phoneme/letter
 * tokens WITHOUT collapsing distinct consonants (e.g. श vs स, ल vs र, व vs ब, क vs ख).
 * Ensures names like Vaishali (वैशाली), Vaisali (वैसाली), Vaishari (वैशारी), and
 * Vaisari (वैसारी) remain strictly distinguishable down to every single alphabet.
 */

const DEVANAGARI_MULTI_DIGRAPHS = [
  ['क्ष', 'KSH'],
  ['त्र', 'TR'],
  ['ज्ञ', 'GY'],
  ['श्र', 'SHR']
];

const DEVANAGARI_CHAR_TO_TOKEN = {
  // Independent vowels
  'अ': { tok: 'A', isConsonant: false, label: 'अ (a)' },
  'आ': { tok: 'AA', isConsonant: false, label: 'आ (aa)' },
  'इ': { tok: 'I', isConsonant: false, label: 'इ (i)' },
  'ई': { tok: 'EE', isConsonant: false, label: 'ई (ee)' },
  'उ': { tok: 'U', isConsonant: false, label: 'उ (u)' },
  'ऊ': { tok: 'OO', isConsonant: false, label: 'ऊ (oo)' },
  'ऋ': { tok: 'RI', isConsonant: false, label: 'ऋ (ri)' },
  'ए': { tok: 'E', isConsonant: false, label: 'ए (e)' },
  'ऐ': { tok: 'AI', isConsonant: false, label: 'ऐ (ai)' },
  'ओ': { tok: 'O', isConsonant: false, label: 'ओ (o)' },
  'औ': { tok: 'AU', isConsonant: false, label: 'औ (au)' },

  // Matras & modifiers
  'ा': { tok: 'AA', isConsonant: false, label: 'ा (aa)' },
  'ि': { tok: 'I', isConsonant: false, label: 'ि (i)' },
  'ी': { tok: 'EE', isConsonant: false, label: 'ी (ee)' },
  'ु': { tok: 'U', isConsonant: false, label: 'ु (u)' },
  'ू': { tok: 'OO', isConsonant: false, label: 'ू (oo)' },
  'ृ': { tok: 'RI', isConsonant: false, label: 'ृ (ri)' },
  'े': { tok: 'E', isConsonant: false, label: 'े (e)' },
  'ै': { tok: 'AI', isConsonant: false, label: 'ै (ai)' },
  'ो': { tok: 'O', isConsonant: false, label: 'ो (o)' },
  'ौ': { tok: 'AU', isConsonant: false, label: 'ौ (au)' },
  'ं': { tok: 'N', isConsonant: false, label: 'ं (n)' },
  'ँ': { tok: 'N', isConsonant: false, label: 'ँ (n)' },
  'ः': { tok: 'H', isConsonant: false, label: 'ः (h)' },
  '्': { tok: '', isConsonant: false, label: '्' },

  // Consonants (each distinct alphabet keeps its own unique token!)
  'क': { tok: 'K', isConsonant: true, label: 'क (k)' },
  'ख': { tok: 'KH', isConsonant: true, label: 'ख (kh)' },
  'ग': { tok: 'G', isConsonant: true, label: 'ग (g)' },
  'घ': { tok: 'GH', isConsonant: true, label: 'घ (gh)' },
  'ङ': { tok: 'NG', isConsonant: true, label: 'ङ (ng)' },

  'च': { tok: 'CH', isConsonant: true, label: 'च (ch)' },
  'छ': { tok: 'CHH', isConsonant: true, label: 'छ (chh)' },
  'ज': { tok: 'J', isConsonant: true, label: 'ज (j)' },
  'झ': { tok: 'JH', isConsonant: true, label: 'झ (jh)' },
  'ञ': { tok: 'NY', isConsonant: true, label: 'ञ (ny)' },

  'ट': { tok: 'TT', isConsonant: true, label: 'ट (t)' },
  'ठ': { tok: 'TTH', isConsonant: true, label: 'ठ (th)' },
  'ड': { tok: 'DD', isConsonant: true, label: 'ड (d)' },
  'ढ': { tok: 'DDH', isConsonant: true, label: 'ढ (dh)' },
  'ण': { tok: 'NN', isConsonant: true, label: 'ण (n)' },

  'त': { tok: 'T', isConsonant: true, label: 'त (t)' },
  'थ': { tok: 'TH', isConsonant: true, label: 'थ (th)' },
  'द': { tok: 'D', isConsonant: true, label: 'द (d)' },
  'ध': { tok: 'DH', isConsonant: true, label: 'ध (dh)' },
  'न': { tok: 'N', isConsonant: true, label: 'न (n)' },

  'प': { tok: 'P', isConsonant: true, label: 'प (p)' },
  'फ': { tok: 'PH', isConsonant: true, label: 'फ (ph)' },
  'ब': { tok: 'B', isConsonant: true, label: 'ब (b)' },
  'भ': { tok: 'BH', isConsonant: true, label: 'भ (bh)' },
  'म': { tok: 'M', isConsonant: true, label: 'म (m)' },

  'य': { tok: 'Y', isConsonant: true, label: 'य (y)' },
  'र': { tok: 'R', isConsonant: true, label: 'र (r)' },
  'ल': { tok: 'L', isConsonant: true, label: 'ल (l)' },
  'व': { tok: 'V', isConsonant: true, label: 'व (v)' },

  'श': { tok: 'SH', isConsonant: true, label: 'श (sh)' },
  'ष': { tok: 'SHH', isConsonant: true, label: 'ष (shh)' },
  'स': { tok: 'S', isConsonant: true, label: 'स (s)' },
  'ह': { tok: 'H', isConsonant: true, label: 'ह (h)' },

  // Nukta variants
  'क़': { tok: 'Q', isConsonant: true, label: 'क़ (q)' },
  'ख़': { tok: 'KHH', isConsonant: true, label: 'ख़ (kh)' },
  'ग़': { tok: 'GHH', isConsonant: true, label: 'ग़ (gh)' },
  'ज़': { tok: 'Z', isConsonant: true, label: 'ज़ (z)' },
  'ड़': { tok: 'RD', isConsonant: true, label: 'ड़ (rd)' },
  'ढ़': { tok: 'RDH', isConsonant: true, label: 'ढ़ (rdh)' },
  'फ़': { tok: 'F', isConsonant: true, label: 'फ़ (f)' }
};

const LATIN_DIGRAPHS = [
  ['ksh', 'KSH', true, 'ksh'],
  ['chh', 'CHH', true, 'chh'],
  ['shr', 'SHR', true, 'shr'],
  ['sh', 'SH', true, 'sh'],
  ['ch', 'CH', true, 'ch'],
  ['kh', 'KH', true, 'kh'],
  ['gh', 'GH', true, 'gh'],
  ['jh', 'JH', true, 'jh'],
  ['th', 'TH', true, 'th'],
  ['dh', 'DH', true, 'dh'],
  ['bh', 'BH', true, 'bh'],
  ['ph', 'PH', true, 'ph'],
  ['tr', 'TR', true, 'tr'],
  ['gy', 'GY', true, 'gy'],
  ['ai', 'AI', false, 'ai'],
  ['ay', 'AI', false, 'ay'],
  ['au', 'AU', false, 'au'],
  ['ou', 'AU', false, 'ou'],
  ['ee', 'EE', false, 'ee'],
  ['ii', 'EE', false, 'ii'],
  ['ea', 'EE', false, 'ea'],
  ['oo', 'OO', false, 'oo'],
  ['uu', 'OO', false, 'uu'],
  ['aa', 'AA', false, 'aa']
];

const LATIN_SINGLE = {
  'a': { tok: 'A', isConsonant: false },
  'e': { tok: 'E', isConsonant: false },
  'i': { tok: 'I', isConsonant: false },
  'o': { tok: 'O', isConsonant: false },
  'u': { tok: 'U', isConsonant: false },
  'b': { tok: 'B', isConsonant: true },
  'c': { tok: 'K', isConsonant: true },
  'd': { tok: 'D', isConsonant: true },
  'f': { tok: 'F', isConsonant: true },
  'g': { tok: 'G', isConsonant: true },
  'h': { tok: 'H', isConsonant: true },
  'j': { tok: 'J', isConsonant: true },
  'k': { tok: 'K', isConsonant: true },
  'l': { tok: 'L', isConsonant: true },
  'm': { tok: 'M', isConsonant: true },
  'n': { tok: 'N', isConsonant: true },
  'p': { tok: 'P', isConsonant: true },
  'q': { tok: 'Q', isConsonant: true },
  'r': { tok: 'R', isConsonant: true },
  's': { tok: 'S', isConsonant: true },
  't': { tok: 'T', isConsonant: true },
  'v': { tok: 'V', isConsonant: true },
  'w': { tok: 'V', isConsonant: true },
  'x': { tok: 'KS', isConsonant: true },
  'y': { tok: 'Y', isConsonant: true },
  'z': { tok: 'Z', isConsonant: true }
};

function normalizeEndingVowelForComparison(tokens) {
  if (!tokens.length) return tokens;
  const copy = [...tokens];
  const last = copy[copy.length - 1];
  // Final 'a' vs 'aa' (e.g. Sunita -> 'AA'/'A') and final 'i' vs 'ee' (Vaishali -> 'I'/'EE')
  // Keep consonants untouched, normalize trailing Latin -i/-ee only in full compare helper when appropriate
  return copy;
}

/**
 * Extracts exact alphabet/phoneme tokens from any Devanagari or Latin/Hinglish word or phrase.
 */
export function getExactAlphabetTokens(text = '') {
  const clean = (text || '').normalize('NFC').trim().toLowerCase();
  if (!clean) return [];

  const tokens = [];
  let i = 0;

  while (i < clean.length) {
    const ch = clean[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Check Devanagari conjuncts (e.g. क्ष, त्र, ज्ञ)
    let matchedConjunct = false;
    for (const [seq, tok] of DEVANAGARI_MULTI_DIGRAPHS) {
      if (clean.startsWith(seq, i)) {
        tokens.push({ tok, isConsonant: true, raw: seq, script: 'hi' });
        i += seq.length;
        matchedConjunct = true;
        break;
      }
    }
    if (matchedConjunct) continue;

    // Check Devanagari nukta 2-char combos (NFD or uncombined base + \u093C)
    if (clean[i + 1] === '\u093C') {
      const pair = ch + '\u093C';
      const entry = DEVANAGARI_CHAR_TO_TOKEN[pair];
      if (entry) {
        tokens.push({ tok: entry.tok, isConsonant: entry.isConsonant, raw: pair, script: 'hi' });
        i += 2;
        continue;
      }
    }

    // Check single Devanagari char
    if (DEVANAGARI_CHAR_TO_TOKEN[ch]) {
      const entry = DEVANAGARI_CHAR_TO_TOKEN[ch];
      if (entry.tok) {
        tokens.push({ tok: entry.tok, isConsonant: entry.isConsonant, raw: ch, script: 'hi' });
      }
      i++;
      continue;
    }

    // Check Latin digraphs/trigraphs
    let matchedLatinDigraph = false;
    for (const [digraph, tok, isConsonant, raw] of LATIN_DIGRAPHS) {
      if (clean.startsWith(digraph, i)) {
        tokens.push({ tok, isConsonant, raw, script: 'en' });
        i += digraph.length;
        matchedLatinDigraph = true;
        break;
      }
    }
    if (matchedLatinDigraph) continue;

    // Check single Latin letter
    if (LATIN_SINGLE[ch]) {
      const entry = LATIN_SINGLE[ch];
      tokens.push({ tok: entry.tok, isConsonant: entry.isConsonant, raw: ch, script: 'en' });
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

/**
 * Normalizes minor cross-script schwa/trailing-matra conventions while preserving EVERY consonant
 * and vowel quality strictly (Vaishali == वैशाली, Ramesh == रमेश, Vaishali != Vaisali != Vaishari).
 */
function buildComparableSequences(text = '') {
  const rawTokens = getExactAlphabetTokens(text);

  // Drop inherent trailing/medial schwa noise only when comparing Latin "Vaishali" ('AA' -> 'A') vs Devanagari ('ा' -> 'AA')
  const fullSeq = rawTokens.map((t, idx) => {
    // In Hindi names written in English, 'a' after a consonant before another consonant/end often represents 'ा' or schwa:
    // keep distinct AI/AU/EE/OO/E/O/I/U/A/AA distinction for short vs long when Devanagari explicit matra differs,
    // except treat Latin single 'a' in medial/final open syllable as compatible with 'AA' when matching Hindi <-> English.
    if (t.tok === 'AA') return 'A*';
    if (t.tok === 'A') return 'A*';
    if (idx === rawTokens.length - 1 && (t.tok === 'I' || t.tok === 'EE')) return 'I*';
    return t.tok;
  });

  // Strict unrelaxed token sequence (distinguishes even अ vs आ / ि vs ी inside same script)
  const strictTokens = rawTokens.map(t => t.tok);
  const consonants = rawTokens.filter(t => t.isConsonant).map(t => t.tok);
  const consonantLabels = rawTokens.filter(t => t.isConsonant).map(t => `${t.raw}(${t.tok})`);

  return {
    rawTokens,
    fullSeq,
    strictTokens,
    consonants,
    consonantLabels
  };
}

function tokenLevenshtein(arr1 = [], arr2 = []) {
  const m = arr1.length;
  const n = arr2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = arr1[i - 1] === arr2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function sequenceSimilarity(arr1 = [], arr2 = []) {
  if (!arr1.length && !arr2.length) return 1;
  if (!arr1.length || !arr2.length) return 0;
  const maxLen = Math.max(arr1.length, arr2.length);
  return Math.max(0, 1 - tokenLevenshtein(arr1, arr2) / maxLen);
}

/**
 * Extracts exact consonant skeleton string, e.g.:
 * - "वैशाली" / "Vaishali" -> "V-SH-L"
 * - "वैसाली" / "Vaisali"  -> "V-S-L"
 * - "वैशारी" / "Vaishari" -> "V-SH-R"
 * - "वैसारी" / "Vaisari"  -> "V-S-R"
 */
export function getExactConsonantSkeleton(word = '') {
  const { consonants } = buildComparableSequences(word);
  return consonants.join('-');
}

/**
 * Breaks a word into visual Akshara / Alphabet chips for UI display & user verification.
 * e.g. "वैशाली" -> ["वै", "शा", "ली"], "Vaishali" -> ["V", "ai", "sh", "a", "l", "i"]
 */
export function formatAksharaChips(word = '') {
  const clean = (word || '').normalize('NFC').trim();
  if (!clean) return [];

  // Devanagari akshara splitter (clusters consonant+halant+consonant+matra+anusvara)
  if (/[\u0900-\u097F]/.test(clean)) {
    const chips = [];
    let current = '';
    const chars = Array.from(clean);

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (/\s/.test(ch)) {
        if (current) {
          chips.push(current);
          current = '';
        }
        continue;
      }
      const isMatraOrMod = /[\u093C-\u094D\u0901-\u0903\u0951-\u0954]/.test(ch);
      const prevEndedWithHalant = current.endsWith('\u094D');

      if (current && (isMatraOrMod || prevEndedWithHalant)) {
        current += ch;
      } else {
        if (current) chips.push(current);
        current = ch;
      }
    }
    if (current) chips.push(current);
    return chips;
  }

  // Latin grapheme/digraph tokens
  const toks = getExactAlphabetTokens(clean);
  return toks.map(t => t.raw);
}

/**
 * Compares two words down to EVERY single alphabet (consonants & vowels).
 * Returns exact match flags, exact alphabet similarity score, and letter-by-letter diffs.
 */
export function compareAlphabetSimilarity(word1 = '', word2 = '') {
  const w1 = (word1 || '').trim();
  const w2 = (word2 || '').trim();

  if (!w1 || !w2) {
    return {
      exactMatch: false,
      sameConsonants: false,
      exactAlphabetSimilarity: 0,
      consonantSimilarity: 0,
      consonantDiffs: [],
      skeleton1: '',
      skeleton2: ''
    };
  }

  const s1 = buildComparableSequences(w1);
  const s2 = buildComparableSequences(w2);

  const skeleton1 = s1.consonants.join('-');
  const skeleton2 = s2.consonants.join('-');
  const sameConsonants = Boolean(skeleton1 && skeleton2 && skeleton1 === skeleton2);

  const crossScriptSeqMatch =
    s1.fullSeq.length > 0 &&
    s1.fullSeq.length === s2.fullSeq.length &&
    s1.fullSeq.every((t, idx) => t === s2.fullSeq[idx]);

  const strictSameScriptMatch = w1.toLowerCase() === w2.toLowerCase();
  const consonantSimilarity = sequenceSimilarity(s1.consonants, s2.consonants);
  const fullSimilarity = sequenceSimilarity(s1.fullSeq, s2.fullSeq);

  // Compare strict vowel/matra length penalty within same script (e.g. रवि vs रवी)
  const sameScript =
    (/[\u0900-\u097F]/.test(w1) && /[\u0900-\u097F]/.test(w2)) ||
    (!/[\u0900-\u097F]/.test(w1) && !/[\u0900-\u097F]/.test(w2));

  let exactAlphabetSimilarity = consonantSimilarity * 0.7 + fullSimilarity * 0.3;
  if (strictSameScriptMatch) {
    exactAlphabetSimilarity = 1.0;
  } else if (crossScriptSeqMatch && !sameScript) {
    exactAlphabetSimilarity = 1.0;
  } else if (sameScript && sameConsonants && !strictSameScriptMatch) {
    // Same script, same consonants, but different vowel matras (e.g. अनिता vs अनीता)
    const unrelaxedSim = sequenceSimilarity(s1.strictTokens, s2.strictTokens);
    exactAlphabetSimilarity = 0.72 + unrelaxedSim * 0.25;
  }

  // Compute exact differing consonant positions so UI can show e.g. "श (SH) ≠ स (S)"
  const consonantDiffs = [];
  const maxC = Math.max(s1.consonants.length, s2.consonants.length);
  for (let i = 0; i < maxC; i++) {
    const c1 = s1.consonants[i] || '—';
    const c2 = s2.consonants[i] || '—';
    if (c1 !== c2) {
      consonantDiffs.push({
        position: i + 1,
        token1: s1.consonantLabels[i] || c1,
        token2: s2.consonantLabels[i] || c2
      });
    }
  }

  return {
    exactMatch: strictSameScriptMatch || (crossScriptSeqMatch && !sameScript),
    sameConsonants,
    exactAlphabetSimilarity: Number(exactAlphabetSimilarity.toFixed(3)),
    consonantSimilarity: Number(consonantSimilarity.toFixed(3)),
    consonantDiffs,
    skeleton1,
    skeleton2
  };
}

/**
 * Builds a concise Whisper decoder biasing prompt from live Customers + Name Diary + Rate Card.
 * Kept under ~550 chars so it comfortably fits Whisper's 224-token prompt limit.
 */
export function formatWhisperDictionaryPrompt(customers = [], nameDiary = [], rateCard = []) {
  const seen = new Set();
  const names = [];

  const pushName = (val) => {
    const clean = (val || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(clean);
  };

  // Prioritize active registered customer names first (exact Hindi & English spellings)
  for (const c of customers || []) {
    pushName(c.hindiName);
    pushName(c.name);
  }

  // Next include custom user-added Name Diary entries, then built-in entries
  const sortedDiary = [...(nameDiary || [])].sort((a, b) => (b.isCustom ? 1 : 0) - (a.isCustom ? 1 : 0));
  for (const d of sortedDiary) {
    pushName(d.hindiName);
    pushName(d.name);
    if (names.length >= 28) break;
  }

  const items = [];
  for (const r of (rateCard || []).slice(0, 10)) {
    if (r.hindiName) items.push(r.hindiName);
  }

  const namePart = names.slice(0, 26).join(', ');
  const itemPart = items.join(', ') || 'आलू, कांदा, प्याज, टमाटर, चीनी, दूध, तेल, चावल';

  const fullPrompt = `किराना खाता नाम डायरी: ${namePart}। सामान: ${itemPart}। कन्फर्म करो, ग्राहक का नाम लिखो, उधार, जमा।`;
  return fullPrompt.slice(0, 560);
}
