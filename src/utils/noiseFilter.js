/**
 * Counter Conversation & Worker Chatter Filter (GallaVoice Core SOP)
 * Separates ambient counter talk, helper/worker instructions, passing price queries,
 * and resumption markers from the core accounting ledger instruction.
 */

export const COUNTER_CHATTER_PATTERNS = [
  // 1. Commands / dispatches to shop helpers & workers (e.g. "छोटू थैली दे दे", "राजू बर्फ लाना")
  /(?:अरे\s+|ए\s+|ओ\s+)?(?:छोटू|राजू|बबलू|मुन्ना|लड़के|बेटा|मोनू|सोनू|chhotu|raju|bablu|munna|monu|sonu)\s+[\p{L}\p{M}\p{N}\s,]{1,45}?(?:दे\s*दे|दे\s*दो|ला\s*दे|ले\s*आ|लाना|पकड़ा\s*दे|रख\s*दे|बांध\s*दे|तोल\s*दे|निकाल\s*दे|लगा\s*ले|कर\s*दे|de\s*de|de\s*do|le\s*aa|pakda\s*de|rakh\s*de|nikaal|pack\s*kar)/giu,

  // 2. General counter helper chores without explicit helper names
  /(?:जल्दी\s+से\s+)?(?:चाय|पानी|बर्फ|थैली|पन्नी|झाड़ू|डिब्बा|बोरा|chai|paani|baraf|theli|panni)\s+(?:ले\s*आ|ला\s*दो|दे\s*दे|दे\s*दो|रख\s*दे|बांध\s*दे|लगा\s*ले|le\s*aa|de\s*de|de\s*do)/giu,

  // 3. Passing customer price inquiries & stock questions (not part of the active khata transaction)
  /(?:ये|यह|वो|ये\s+वाला|वो\s+वाला|yeh|wo)\s+(?:कितने\s+का|कैसे\s+दिया|क्या\s+रेट|क्या\s+भाव|kitne\s+ka|kaise\s+diya)\s*(?:है|हैं|hai)?/giu,
  /(?:दही|दूध|ब्रेड|सब्जी|dahi|doodh|dudh|bread)\s+(?:ताजा\s+है\s+क्या|खत्म\s+हो\s+गया|खतम\s+हो\s+गया|kal\s+\d+\s+ka|khatam\s+ho\s+gaya)/giu,

  // 4. Cash change / counter exchange small-talk
  /(?:अरे\s+भाई\s+|भैया\s+)?(?:खुल्ले|चिल्लर|छुट्टे|change|khulle|chhutte|chillar)\s+(?:नहीं\s+हैं?|दो|दे\s+दो|nahi\s+hai|nahi\s+hain|do|de\s+do)/giu,
  /(?:कल\s+ले\s+लेना|बाद\s+में\s+आना|कल\s+आना|अभी\s+चले\s+जाओ|kal\s+le\s+lena|baad\s+mein?\s+aana|kal\s+aana)/giu,

  // 5. Mid-sentence transition & resumption markers (shopkeeper returning to ledger dictation)
  /(?:हाँ|हा|अच्छा|अरे)\s*(?:कहाँ|कहा)\s*(?:था|थे)\s*(?:मैं|में|हम)/giu,
  /(?:कहाँ|कहा)\s*(?:था|थे)\s*(?:मैं|में|हम)/giu,
  /(?:ha|haan|accha|acha|arre|are)\s*(?:kaha|kahan)\s*(?:tha|the)\s*(?:mai|main|me|hum)/giu,
  /(?:अरे|अच्छा|हाँ)\s+सुनो/giu,
  /(?:arre|are|accha|acha|ha|haan)\s+suno/giu,
  /(?:एक\s+मिनट|रुको\s+जरा|ek\s+minute|are\s+ruko|अरे\s+रुको)/giu
];

/**
 * Splits spoken transcript into clean ledger command and ignored counter chatter.
 *
 * @param {string} rawTranscript
 * @returns {{ cleanedCommand: string, removedNoiseSegments: string[], ignoredNoiseText: string, hasNoise: boolean }}
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

  for (const pattern of COUNTER_CHATTER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        const trimmed = m.trim();
        if (trimmed && !removedSegments.includes(trimmed)) {
          removedSegments.push(trimmed);
        }
      }
      text = text.replace(pattern, ' ');
    }
  }

  const cleanedCommand = text
    .replace(/[,\.\?।]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanedCommand,
    removedNoiseSegments: removedSegments,
    ignoredNoiseText: removedSegments.join(' | '),
    hasNoise: removedSegments.length > 0
  };
}
