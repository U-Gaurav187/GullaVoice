/**
 * Pre-seeded sample transaction ledger records.
 */
export const INITIAL_TRANSACTIONS = [
  {
    id: 'TXN_1001',
    timestamp: '2026-11-06T08:30:15Z',
    customerSpoken: 'Ramesh bhai',
    matchedCustomerId: 'CUST_01',
    customerName: 'Ramesh Bhai',
    matchConfidence: 0.96,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Cheeni', quantity: '1 kg', unitPrice: 44, calculatedPrice: 44, accentNote: null },
      { name: 'Dudh', quantity: '2 pkt', unitPrice: 40, calculatedPrice: 80, accentNote: null }
    ],
    totalAmount: 124,
    ignoredNoise: 'arre chhotu jhadu laga le',
    rawTranscript: 'Ramesh bhai ko arre chhotu jhadu laga le ek kilo cheeni aur do dudh udhaar likh do',
    status: 'COMMITTED',
    ttsHindiText: 'रमेश भाई के खाते में एक किलो चीनी और दो पैकेट दूध, कुल एक सौ चौबीस रुपये उधार दर्ज किए गए।'
  },
  {
    id: 'TXN_1002',
    timestamp: '2026-11-06T09:12:40Z',
    customerSpoken: 'Sunita bhabhi',
    matchedCustomerId: 'CUST_02',
    customerName: 'Sunita Bhabhi',
    matchConfidence: 0.98,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Atta', quantity: '5 kg', unitPrice: 45, calculatedPrice: 225, accentNote: null },
      { name: 'Tel', quantity: '1 pkt', unitPrice: 140, calculatedPrice: 140, accentNote: null }
    ],
    totalAmount: 365,
    ignoredNoise: 'dudh kal 42 ka ho jayega kya',
    rawTranscript: 'Sunita bhabhi ko paanch kilo atta aur ek tel udhaar likho dudh kal 42 ka ho jayega kya ha likh do',
    status: 'COMMITTED',
    ttsHindiText: 'सुनीता भाभी के खाते में पांच किलो आटा और एक पैकेट तेल, कुल तीन सौ पैंसठ रुपये उधार दर्ज किए गए।'
  },
  {
    id: 'TXN_1003',
    timestamp: '2026-11-06T10:05:22Z',
    customerSpoken: 'Rames',
    matchedCustomerId: 'CUST_01',
    customerName: 'Ramesh Bhai',
    matchConfidence: 0.91,
    transactionType: 'JAMA',
    items: [],
    totalAmount: 200,
    ignoredNoise: 'bhaiya change nahi hai abhi',
    rawTranscript: 'Rames ko do sau rupaye jama karo bhaiya change nahi hai abhi ha do sau jama',
    status: 'COMMITTED',
    ttsHindiText: 'रमेश भाई के खाते में दो सौ रुपये जमा किए गए।'
  },
  {
    id: 'TXN_1004',
    timestamp: '2026-11-06T11:20:00Z',
    customerSpoken: 'Sharma ji',
    matchedCustomerId: 'CUST_04',
    customerName: 'Sharma Ji',
    matchConfidence: 0.95,
    transactionType: 'UDHAAR',
    items: [
      { name: 'Chawal', quantity: '2 kg', unitPrice: 60, calculatedPrice: 120, accentNote: null },
      { name: 'Dal', quantity: '1 kg', unitPrice: 120, calculatedPrice: 120, accentNote: null }
    ],
    totalAmount: 240,
    ignoredNoise: 'chhotu chai le aa do cup',
    rawTranscript: 'Sharma ji ko do kilo chawal aur ek kilo dal udhaar likho chhotu chai le aa do cup',
    status: 'COMMITTED',
    ttsHindiText: 'शर्मा जी के खाते में दो किलो चावल और एक किलो दाल, कुल दो सौ चालीस रुपये उधार दर्ज किए गए।'
  }
];
