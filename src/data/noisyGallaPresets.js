/**
 * Curated Test Presets for judges and users to simulate real-world
 * messy, accented, interrupted Hinglish kirana counter speech.
 */
export const NOISY_GALLA_PRESETS = [
  {
    id: 'preset_01',
    title: 'Interruption WITH Transition Marker',
    tag: 'Classic Disturbance',
    spokenText: 'Ramesh bhai ko... wo do rupee ki he dudh aab 40 ka ho gaya he... ha kaha tha me, do kilo cheeni aur ek tel ka packet udhaar likh do.',
    description: 'Notice the mid-sentence milk price distraction to another buyer and "ha kaha tha me" resumption.',
    expectedCustomer: 'Ramesh Bhai',
    expectedItems: '2kg Cheeni + 1 pkt Tel',
    expectedType: 'UDHAAR',
    expectedTotal: 228
  },
  {
    id: 'preset_02',
    title: 'Zero-Transition Hard Disturbance',
    tag: 'No Transition Marker',
    spokenText: 'Sunita bhabhi ko wo do rupee ki he dudh 40 ka ho gaya chhotu packet de de do packet tel aur paanch kilo chawal udhaar likho',
    description: 'No "kaha tha me" transition! Pure interleaving of side-chatter to a helper and price inquiry.',
    expectedCustomer: 'Sunita Bhabhi',
    expectedItems: '2 pkt Tel + 5kg Chawal',
    expectedType: 'UDHAAR',
    expectedTotal: 580
  },
  {
    id: 'preset_03',
    title: 'Accent "Rames" + "Dedh Sau" Jama',
    tag: 'Phonetic + Colloquial ₹',
    spokenText: 'Rames ko dedh sau rupaye jama karo are bhai khulle nahi hai abhi kal le lena ha dedh sau jama',
    description: 'Maps "Rames" to Ramesh Bhai (>= 85% phonetic similarity) and "dedh sau" to ₹150 Jama.',
    expectedCustomer: 'Ramesh Bhai',
    expectedItems: 'Cash Jama',
    expectedType: 'JAMA',
    expectedTotal: 150
  },
  {
    id: 'preset_04',
    title: 'Colloquial Fractions (Aadha & Pav Kilo)',
    tag: 'Fractions Disambiguation',
    spokenText: 'Sharma ji ko aadha kilo cheeni aur pav kilo dal udhaar likho chhotu dhyan kidhar hai tera',
    description: 'Translates "aadha kilo" to 0.5kg (₹22) and "pav kilo" to 0.25kg (₹30) for pulses.',
    expectedCustomer: 'Sharma Ji',
    expectedItems: '0.5kg Cheeni + 0.25kg Dal',
    expectedType: 'UDHAAR',
    expectedTotal: 52
  },
  {
    id: 'preset_05',
    title: 'Accent Price Slip Sanity Check (1500 vs 140)',
    tag: 'Rate Card Price Sanity',
    spokenText: 'Pintu auto ko 1 packet tel 1500 rupaye udhaar likh do are ruko 140 ka hai',
    description: 'Caught accent slip! Tel is ₹140/pkt, spoken ₹1500 is an extreme outlier flagged by Rate Card.',
    expectedCustomer: 'Pintu Auto',
    expectedItems: '1 pkt Tel',
    expectedType: 'UDHAAR',
    expectedTotal: 140
  },
  {
    id: 'preset_06',
    title: 'Pure Counter Chatter (Should Be Ignored)',
    tag: 'Noise Filter Only',
    spokenText: 'Chhotu baraf le aa jaldi are Sunita bhabhi kal aana doodh khatam ho gaya',
    description: 'Pure conversational counter chatter with no transaction intent. Categorized as NOISE_ONLY.',
    expectedCustomer: 'None',
    expectedItems: 'None',
    expectedType: 'NOISE_ONLY',
    expectedTotal: 0
  },
  {
    id: 'preset_07',
    title: "2-Way Query: Ramesh's Udhaar Balance",
    tag: 'Reverse Voice Khata',
    spokenText: 'Ramesh ka kitna udhaar baaki hai?',
    description: 'Two-way voice assistant checks the customer ledger and answers their live balance aloud in Hindi.',
    expectedCustomer: 'Ramesh',
    expectedItems: 'Voice Inquiry',
    expectedType: 'CHECK_BALANCE',
    expectedTotal: 0
  },
  {
    id: 'preset_08',
    title: "2-Way Query: Today's Total Sales & Khata",
    tag: "Today's Hisab",
    spokenText: 'Aaj kitni sale hui aur kitna udhaar hua?',
    description: 'Aggregates today\'s transactions and speaks out total udhaar and jama summary aloud.',
    expectedCustomer: 'Store Ledger',
    expectedItems: 'Daily Summary',
    expectedType: 'CHECK_TODAY_SUMMARY',
    expectedTotal: 0
  },
  {
    id: 'preset_09',
    title: '2-Way Query: Highest Udhaar in Store',
    tag: 'Top Debtor Inquiry',
    spokenText: 'Sabse zyada udhaar kiske paas hai?',
    description: 'Finds the customer with maximum outstanding balance across the store and speaks the answer.',
    expectedCustomer: 'Top Debtor',
    expectedItems: 'Ranked Balance',
    expectedType: 'CHECK_HIGHEST_UDHAAR',
    expectedTotal: 0
  },
  {
    id: 'preset_10',
    title: 'Interrupted Query: Chatter + Balance Question',
    tag: 'Chatter + 2-Way Query',
    spokenText: 'Chhotu baraf le aa jaldi ha suno Ramesh bhai ka khata batao kitna baaki hai',
    description: 'Filters helper dispatch noise ("Chhotu baraf le aa") and extracts the conversational balance query.',
    expectedCustomer: 'Ramesh Bhai',
    expectedItems: 'Filtered Query',
    expectedType: 'CHECK_BALANCE',
    expectedTotal: 0
  }
];
