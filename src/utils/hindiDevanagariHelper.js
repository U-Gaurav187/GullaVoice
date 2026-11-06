/**
 * Hindi Devanagari Readback & Number-to-Words Helper
 * Formats natural, grammatically correct Devanagari sentences
 * for shopkeeper voice readback (TTS).
 */

const HINDI_ONES = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ',
  'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
  'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पचीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
  'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
  'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
  'पचास', 'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
  'साठ', 'इकसठ', 'बासठ', 'तिरेसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर',
  'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
  'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
];

/**
 * Converts numbers (0 to 99999) into Hindi Devanagari words
 */
export function numberToHindiWords(num = 0) {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'शून्य';
  if (n < 0) return 'माइनस ' + numberToHindiWords(Math.abs(n));

  if (n < 100) {
    return HINDI_ONES[n] || String(n);
  }

  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    const hundredStr = (hundreds === 1 ? 'एक सौ' : `${HINDI_ONES[hundreds]} सौ`);
    return remainder > 0 ? `${hundredStr} ${HINDI_ONES[remainder]}` : hundredStr;
  }

  if (n < 100000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    const thousandStr = `${numberToHindiWords(thousands)} हज़ार`;
    return remainder > 0 ? `${thousandStr} ${numberToHindiWords(remainder)}` : thousandStr;
  }

  return `${n}`;
}

/**
 * Maps English item names and units to Devanagari equivalents
 */
export function formatItemInHindi(item) {
  const name = (item.name || '').toLowerCase();
  const qty = (item.quantity || '').toLowerCase();

  let hindiItem = item.name;
  if (name.includes('cheeni') || name.includes('sugar')) hindiItem = 'चीनी';
  else if (name.includes('tel') || name.includes('oil')) hindiItem = 'तेल';
  else if (name.includes('dudh') || name.includes('milk')) hindiItem = 'दूध';
  else if (name.includes('atta') || name.includes('flour')) hindiItem = 'आटा';
  else if (name.includes('chawal') || name.includes('rice')) hindiItem = 'चावल';
  else if (name.includes('dal') || name.includes('daal')) hindiItem = 'दाल';
  else if (name.includes('chai')) hindiItem = 'चाय पत्ती';
  else if (name.includes('masala')) hindiItem = 'मसाला';
  else if (name.includes('sabun')) hindiItem = 'साबुन';
  else if (name.includes('namak')) hindiItem = 'नमक';

  let hindiQty = qty;
  // Convert standard quantities to Hindi phrases
  if (qty.includes('0.5') || qty.includes('aadha')) hindiQty = 'आधा किलो';
  else if (qty.includes('0.25') || qty.includes('pav')) hindiQty = 'पाव किलो';
  else if (qty.includes('1.5') || qty.includes('dedh')) hindiQty = 'डेढ़ किलो';
  else if (qty.includes('2.5') || qty.includes('dhai')) hindiQty = 'ढाई किलो';
  else if (qty.match(/^1\s*(kg|kilo)/i)) hindiQty = 'एक किलो';
  else if (qty.match(/^2\s*(kg|kilo)/i)) hindiQty = 'दो किलो';
  else if (qty.match(/^5\s*(kg|kilo)/i)) hindiQty = 'पांच किलो';
  else if (qty.match(/^1\s*(pkt|packet)/i)) hindiQty = 'एक पैकेट';
  else if (qty.match(/^2\s*(pkt|packet)/i)) hindiQty = 'दो पैकेट';

  return `${hindiQty} ${hindiItem}`.trim();
}

/**
 * Builds the official Hindi confirmation sentence for the shopkeeper to hear via TTS.
 * 
 * e.g. "रमेश भाई के खाते में दो किलो चीनी और एक पैकेट तेल, कुल दो सौ अट्ठाईस रुपये उधार। क्या इसे सेव करें?"
 */
export function buildHindiReadback({ customerName, transactionType, items = [], totalAmount = 0 }) {
  const custName = customerName || 'ग्राहक';
  const totalInWords = numberToHindiWords(totalAmount);

  if (transactionType === 'JAMA') {
    return `${custName} के खाते में ${totalInWords} रुपये जमा। क्या इसे सेव करें?`;
  }

  // Udhaar transaction
  if (items && items.length > 0) {
    const itemPhrases = items.map(formatItemInHindi);
    let itemsJoined = '';
    if (itemPhrases.length === 1) {
      itemsJoined = itemPhrases[0];
    } else if (itemPhrases.length === 2) {
      itemsJoined = `${itemPhrases[0]} और ${itemPhrases[1]}`;
    } else {
      const allButLast = itemPhrases.slice(0, -1).join(', ');
      itemsJoined = `${allButLast} और ${itemPhrases[itemPhrases.length - 1]}`;
    }

    return `${custName} के खाते में ${itemsJoined}, कुल ${totalInWords} रुपये उधार। क्या इसे सेव करें?`;
  }

  return `${custName} के खाते में कुल ${totalInWords} रुपये उधार। क्या इसे सेव करें?`;
}
