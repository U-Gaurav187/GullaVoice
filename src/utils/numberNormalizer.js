/**
 * Number & Colloquial Quantity Normalizer
 * Disambiguates messy, accented Hindi/Hinglish numbers and colloquial Indian fractions
 * like "dedh sau" (150), "dhai sau" (250), "aadha kilo" (0.5), "pav kilo" (0.25).
 */

// Basic Hindi/Hinglish number words to numeric values
export const HINDI_NUMBERS = {
  // Units 0 - 9
  'shunya': 0, 'zero': 0, 'ek': 1, 'do': 2, 'teen': 3, 'tin': 3, 'char': 4, 'chaar': 4,
  'panch': 5, 'paanch': 5, 'chhe': 6, 'chhah': 6, 'che': 6, 'sat': 7, 'saat': 7,
  'aath': 8, 'ath': 8, 'nau': 9, 'no': 9, 'das': 10, 'dus': 10,

  // 11 - 20
  'gyarah': 11, 'gyara': 11, 'barah': 12, 'bara': 12, 'terah': 13, 'tera': 13,
  'chaudah': 14, 'chouda': 14, 'pandrah': 15, 'pandra': 15, 'pndra': 15,
  'solah': 16, 'sola': 16, 'satrah': 17, 'satra': 17, 'atharah': 18, 'athara': 18,
  'unnis': 19, 'unnees': 19, 'bees': 20, 'bis': 20,

  // Tens & multiples
  'pacchis': 25, 'pachis': 25, 'tees': 30, 'tis': 30, 'paintis': 35, 'paintees': 35,
  'chalis': 40, 'chaalis': 40, 'paintalis': 45, 'paintaalis': 45,
  'pachas': 50, 'pachaas': 50, 'pachpan': 55, 'saath': 60, 'sath': 60,
  'paintsath': 65, 'sattar': 70, 'assi': 80, 'nabbe': 90, 'nabbey': 90,

  // Hundreds & Thousands
  'sau': 100, 'so': 100, 'hazaar': 1000, 'hazar': 1000, 'lakh': 100000
};

// Hindi Devanagari numerals mapping
export const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

/**
 * Replace Devanagari digits with ASCII digits (e.g. '२५' -> '25')
 */
export function normalizeDevanagariDigits(text = '') {
  if (!text) return '';
  return text.replace(/[०-९]/g, d => DEVANAGARI_DIGITS[d] || d);
}

/**
 * Normalizes colloquial Indian quantities and fractions in text
 * e.g., "dedh kilo" -> "1.5 kilo", "aadha kilo" -> "0.5 kilo", "pav kilo" -> "0.25 kilo"
 */
export function normalizeColloquialQuantities(text = '') {
  if (!text) return '';
  let str = normalizeDevanagariDigits(text).toLowerCase();

  // Colloquial Money expressions:
  // "dedh sau" -> 150
  str = str.replace(/\b(dedh|derh)\s+(sau|so)\b/gi, '150');
  // "dhai sau" / "dhai so" -> 250
  str = str.replace(/\b(dhai|dhaiya)\s+(sau|so)\b/gi, '250');
  // "sawa sau" -> 125
  str = str.replace(/\bsawa\s+(sau|so)\b/gi, '125');
  // "paune do sau" -> 175
  str = str.replace(/\bpaune\s+do\s+(sau|so)\b/gi, '175');
  // "sawa do sau" -> 225
  str = str.replace(/\bsawa\s+do\s+(sau|so)\b/gi, '225');
  // "dedh hazaar" -> 1500
  str = str.replace(/\b(dedh|derh)\s+(hazaar|hazar)\b/gi, '1500');
  // "dhai hazaar" -> 2500
  str = str.replace(/\b(dhai)\s+(hazaar|hazar)\b/gi, '2500');

  // Colloquial Weight & Unit expressions:
  // "aadha kilo" / "aadha liter" / "aadha packet" -> "0.5 kilo"
  str = str.replace(/\b(aadha|adha|adhaa)\s+(kilo|kg|l|litre|liter|packet|pkt)?\b/gi, (match, prefix, unit) => {
    return `0.5 ${unit || 'kilo'}`.trim();
  });

  // "pav kilo" / "pao kilo" / "ek pav" -> "0.25 kilo"
  str = str.replace(/\b(ek\s+)?(pav|pao|pau)\s+(kilo|kg|l|litre|liter|packet|pkt)?\b/gi, (match, ek, pav, unit) => {
    return `0.25 ${unit || 'kilo'}`.trim();
  });

  // "paun kilo" / "teen pav" -> "0.75 kilo"
  str = str.replace(/\b(paun|pawn|teen\s+pav)\s+(kilo|kg|l|litre|liter)?\b/gi, (match, paun, unit) => {
    return `0.75 ${unit || 'kilo'}`.trim();
  });

  // "sawa kilo" -> "1.25 kilo"
  str = str.replace(/\bsawa\s+(kilo|kg|l|litre|liter)\b/gi, '1.25 $1');

  // "dedh kilo" / "derh kilo" -> "1.5 kilo"
  str = str.replace(/\b(dedh|derh)\s+(kilo|kg|l|litre|liter)\b/gi, '1.5 $2');

  // "dhai kilo" -> "2.5 kilo"
  str = str.replace(/\bdhai\s+(kilo|kg|l|litre|liter)\b/gi, '2.5 $1');

  // Multi-hundreds: e.g. "do sau" -> 200, "paanch sau" -> 500
  str = str.replace(/\b(ek|do|teen|tin|char|chaar|panch|paanch|chhe|saat|aath|nau)\s+(sau|so)\b/gi, (match, num, sau) => {
    const val = HINDI_NUMBERS[num.toLowerCase()] || 1;
    return String(val * 100);
  });

  // Thousands: e.g. "ek hazaar" -> 1000, "do hazaar" -> 2000
  str = str.replace(/\b(ek|do|teen|chaar|paanch)\s+(hazaar|hazar)\b/gi, (match, num) => {
    const val = HINDI_NUMBERS[num.toLowerCase()] || 1;
    return String(val * 1000);
  });

  // Replace standalone Hindi single words for quantities:
  // e.g. "do packet" -> "2 packet", "paanch kilo" -> "5 kilo"
  const wordRegex = /\b(ek|do|teen|tin|char|chaar|panch|paanch|chhe|saat|aath|nau|das|gyarah|barah|terah|chaudah|pandrah|solah|satrah|atharah|unnis|bees|pacchis|tees|chalis|pachas)\b/gi;
  str = str.replace(wordRegex, (match) => {
    const val = HINDI_NUMBERS[match.toLowerCase()];
    return val !== undefined ? String(val) : match;
  });

  return str;
}

/**
 * Extracts a numeric value from words or string
 */
export function parseSpokenNumber(input) {
  if (typeof input === 'number') return input;
  if (!input) return 0;

  const normalized = normalizeColloquialQuantities(String(input));
  const numMatch = normalized.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }
  return 0;
}
