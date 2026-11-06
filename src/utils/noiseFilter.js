/**
 * Mid-Sentence "Galla Disturbance" & Side-Chatter Filter
 * Separates ambient cash-counter conversations, price quotes to other buyers,
 * and calls to store helpers from the real accounting ledger command.
 */

// Common side-chatter, helper calls, and filler patterns at Indian Kirana counters
export const DISTURBANCE_PATTERNS = [
  // 1. Price inquiries / quotes to other customers
  /wo\s+do\s+(rupee|rupaye)\s+ki\s+(he|hai)?/gi,
  /wo\s+paanch\s+rupaye\s+ka\s+(he|hai)?/gi,
  /(dudh|doodh)\s+(aab|ab)?\s*\d+\s*ka\s+ho\s+gaya(\s+(he|hai))?/gi,
  /(dudh|doodh)\s+kal\s+\d+\s+ka\s+ho\s+jayega\s+kya/gi,
  /(dudh|doodh)\s+khatam\s+ho\s+gaya/gi,
  /yeh\s+kitne\s+ka\s+(he|hai)/gi,
  /bhav\s+badh\s+gaya\s+(he|hai)?/gi,

  // 2. Commands / yells to helpers (Chhotu, Raju, Bablu)
  /chhotu\s+packet\s+de\s+de/gi,
  /chhotu\s+packet\s+de/gi,
  /chhotu\s+baraf\s+le\s+aa\s*(jaldi)?/gi,
  /chhotu\s+chai\s+le\s+aa\s*(do\s+cup)?/gi,
  /arre?\s+chhotu\s+jhadu\s+laga\s+le/gi,
  /chhotu\s+dhyan\s+kidhar\s+hai\s+tera/gi,
  /chhotu\s+theli\s+de/gi,
  /raju\s+saman\s+rakh\s+de/gi,

  // 3. Customer exchange distractions (change, loose coins, return later)
  /are?\s+bhai\s+khulle\s+nahi\s+hai\s+abhi/gi,
  /bhaiya\s+change\s+nahi\s+hai\s+abhi/gi,
  /khulle\s+paise\s+nahi\s+hai/gi,
  /change\s+do/gi,
  /chhutte\s+nahi\s+hai/gi,
  /kal\s+le\s+lena/gi,
  /kal\s+aana/gi,
  /are\s+sunita\s+bhabhi\s+kal\s+aana/gi,
  /baad\s+me\s+aana/gi,

  // 4. Shopkeeper transition & filler hesitation phrases
  /ha\s+kaha\s+tha\s+me/gi,
  /kaha\s+the\s+hum/gi,
  /kaha\s+tha\s+mai/gi,
  /ha\s+toh\s+kaha\s+the/gi,
  /are\s+ha\s+suno/gi,
  /acha\s+suno/gi,
  /are\s+ruko/gi,
  /are\s+bhai/gi
];

/**
 * Filter out counter disturbances and side-chatter from spoken text.
 * 
 * @param {string} rawTranscript - The raw transcript from speech recognition
 * @returns {Object} - { cleanedCommand, removedNoiseSegments, ignoredNoiseText, hasNoise }
 */
export function filterGallaDisturbances(rawTranscript = '') {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    return {
      cleanedCommand: '',
      removedNoiseSegments: [],
      ignoredNoiseText: '',
      hasNoise: false
    };
  }

  let text = rawTranscript.trim();
  const removedSegments = [];

  // Match and strip known disturbance regex patterns
  for (const pattern of DISTURBANCE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => {
        const trimmed = m.trim();
        if (trimmed && !removedSegments.includes(trimmed)) {
          removedSegments.push(trimmed);
        }
      });
      // Replace with clean space
      text = text.replace(pattern, ' ');
    }
  }

  // Clean multiple spaces and dangling punctuation
  const cleanedCommand = text
    .replace(/[,\.\?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const ignoredNoiseText = removedSegments.join(' | ');

  return {
    cleanedCommand,
    removedNoiseSegments: removedSegments,
    ignoredNoiseText,
    hasNoise: removedSegments.length > 0
  };
}
