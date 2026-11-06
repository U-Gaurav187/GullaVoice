/**
 * Pre-seeded sample transaction ledger records with explicit prices on every item.
 */
export const INITIAL_TRANSACTIONS = [
  {
    id: 'TXN_1001',
    timestamp: '2026-11-06T21:40:00Z',
    customerSpoken: 'वैशाली',
    matchedCustomerId: 'CUST_06',
    customerName: 'Vaishali',
    customerHindiName: 'वैशाली',
    customerUpName: 'वैशाली भौजी (बहुरिया)',
    matchConfidence: 0.98,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Aloo (आलू)', quantity: '2 kg', unitPrice: 30, calculatedPrice: 60, accentNote: null }
    ],
    totalAmount: 60,
    ignoredNoise: 'ममी खाने में क्या बना है | वैशाली दो किलो रावा लेके आएगी क्या',
    rawTranscript: 'वैशाली के खाते में, ममी खाने में क्या बना है, वैशाली दो किलो रावा लेके आएगी क्या, दो किलो आलू लिख दो',
    status: 'COMMITTED',
    ttsHindiText: 'वैशाली भौजी के खाते में दो किलो आलू, कुल साठ रुपये उधार दर्ज किए गए।'
  },
  {
    id: 'TXN_1002',
    timestamp: '2026-11-06T21:58:00Z',
    customerSpoken: 'पार्थ',
    matchedCustomerId: 'CUST_07',
    customerName: 'Parth',
    customerHindiName: 'पार्थ',
    customerUpName: 'बबुआ / भइया (पार्थ)',
    matchConfidence: 0.95,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Cheeni (चीनी)', quantity: '0.375 kg (साढ़े पाव)', unitPrice: 44, calculatedPrice: 16.5, accentNote: 'Colloquial साढ़े पाव = 375g' }
    ],
    totalAmount: 16.5,
    ignoredNoise: '',
    rawTranscript: 'पार्थ के खाते में साढ़े पाव किलो चीनी लिख दो',
    status: 'COMMITTED',
    ttsHindiText: 'पार्थ के खाते में साढ़े पाव चीनी, कुल साढ़े सोलह रुपये उधार दर्ज किए गए।'
  },
  {
    id: 'TXN_1003',
    timestamp: '2026-11-06T14:30:15Z',
    customerSpoken: 'Ramesh bhai',
    matchedCustomerId: 'CUST_01',
    customerName: 'Ramesh Bhai',
    customerHindiName: 'रमेश भाई',
    customerUpName: 'दद्दा (रमेश भैया)',
    matchConfidence: 0.96,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Cheeni (चीनी)', quantity: '1 kg', unitPrice: 44, calculatedPrice: 44, accentNote: null },
      { name: 'Dudh (दूध)', quantity: '2 pkt', unitPrice: 40, calculatedPrice: 80, accentNote: null }
    ],
    totalAmount: 124,
    ignoredNoise: 'arre chhotu jhadu laga le',
    rawTranscript: 'Ramesh bhai ko arre chhotu jhadu laga le ek kilo cheeni aur do dudh udhaar likh do',
    status: 'COMMITTED',
    ttsHindiText: 'दद्दा रमेश भाई के खाते में एक किलो चीनी और दो पैकेट दूध, कुल एक सौ चौबीस रुपये उधार दर्ज किए गए।'
  },
  {
    id: 'TXN_1004',
    timestamp: '2026-11-06T16:12:40Z',
    customerSpoken: 'Sunita bhabhi',
    matchedCustomerId: 'CUST_02',
    customerName: 'Sunita Bhabhi',
    customerHindiName: 'सुनीता भाभी',
    customerUpName: 'बड़ी भौजी (सुनीता)',
    matchConfidence: 0.98,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Atta (आटा)', quantity: '5 kg', unitPrice: 45, calculatedPrice: 225, accentNote: null },
      { name: 'Tel (तेल)', quantity: '1 pkt', unitPrice: 140, calculatedPrice: 140, accentNote: null }
    ],
    totalAmount: 365,
    ignoredNoise: 'dudh kal 42 ka ho jayega kya',
    rawTranscript: 'Sunita bhabhi ko paanch kilo atta aur ek tel udhaar likho dudh kal 42 ka ho jayega kya ha likh do',
    status: 'COMMITTED',
    ttsHindiText: 'सुनीता भौजी के खाते में पांच किलो आटा और एक पैकेट तेल, कुल तीन सौ पैंसठ रुपये उधार दर्ज किए गए।'
  },
  {
    id: 'TXN_1005',
    timestamp: '2026-11-06T18:05:22Z',
    customerSpoken: 'Rames',
    matchedCustomerId: 'CUST_01',
    customerName: 'Ramesh Bhai',
    customerHindiName: 'रमेश भाई',
    customerUpName: 'दद्दा (रमेश भैया)',
    matchConfidence: 0.91,
    transactionType: 'JAMA',
    items: [],
    totalAmount: 200,
    ignoredNoise: 'bhaiya change nahi hai abhi',
    rawTranscript: 'Rames ko do sau rupaye jama karo bhaiya change nahi hai abhi ha do sau jama',
    status: 'COMMITTED',
    ttsHindiText: 'दद्दा रमेश भाई के खाते में दो सौ रुपये जमा किए गए।'
  },
  {
    id: 'TXN_1006',
    timestamp: '2026-11-06T19:20:00Z',
    customerSpoken: 'Sharma ji',
    matchedCustomerId: 'CUST_04',
    customerName: 'Sharma Ji',
    customerHindiName: 'शर्मा जी',
    customerUpName: 'पंडित जी (शर्मा गुरुजी)',
    matchConfidence: 0.95,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Chawal (चावल)', quantity: '2 kg', unitPrice: 60, calculatedPrice: 120, accentNote: null },
      { name: 'Dal (दाल)', quantity: '1 kg', unitPrice: 120, calculatedPrice: 120, accentNote: null }
    ],
    totalAmount: 240,
    ignoredNoise: 'chhotu chai le aa do cup',
    rawTranscript: 'Sharma ji ko do kilo chawal aur ek kilo dal udhaar likho chhotu chai le aa do cup',
    status: 'COMMITTED',
    ttsHindiText: 'पंडित शर्मा जी के खाते में दो किलो चावल और एक किलो दाल, कुल दो सौ चालीस रुपये उधार दर्ज किए गए।'
  }
];
