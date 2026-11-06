/**
 * Pre-seeded realistic Kirana customers for testing phonetic matching
 * and running udhaar/jama ledger balances.
 */
export const INITIAL_CUSTOMERS = [
  {
    id: 'CUST_01',
    name: 'Ramesh Bhai',
    hindiName: 'रमेश भाई',
    aliases: ['Rames', 'Ramess', 'Rameshwar', 'Ramesh', 'रमेश'],
    phone: '+91 98201 12345',
    totalUdhaar: 420,
    totalJama: 200,
    netBalance: 220, // positive means customer owes money (Udhaar)
    lastUpdated: '2026-11-06T10:15:00Z',
    notes: 'Regular customer, visits daily in evening'
  },
  {
    id: 'CUST_02',
    name: 'Sunita Bhabhi',
    hindiName: 'सुनीता भाभी',
    aliases: ['Sunita', 'Sunitaji', 'Suneeta', 'Sunita Devi', 'सुनीता'],
    phone: '+91 98202 23456',
    totalUdhaar: 750,
    totalJama: 500,
    netBalance: 250,
    lastUpdated: '2026-11-06T11:45:00Z',
    notes: 'Flat 302, Sai Kripa Society'
  },
  {
    id: 'CUST_03',
    name: 'Pintu Auto',
    hindiName: 'पिंटू ऑटो',
    aliases: ['Pintu', 'Pintoo', 'Pintu Bhai', 'Auto Wala Pintu', 'पिंटू'],
    phone: '+91 98203 34567',
    totalUdhaar: 310,
    totalJama: 310,
    netBalance: 0,
    lastUpdated: '2026-11-05T18:20:00Z',
    notes: 'Auto stand near main square'
  },
  {
    id: 'CUST_04',
    name: 'Sharma Ji',
    hindiName: 'शर्मा जी',
    aliases: ['Sharmaji', 'Sarma', 'Sarmaji', 'Pandit Ji Sharma', 'शर्मा'],
    phone: '+91 98204 45678',
    totalUdhaar: 1450,
    totalJama: 1000,
    netBalance: 450,
    lastUpdated: '2026-11-06T09:00:00Z',
    notes: 'Retired school teacher, monthly clearance'
  },
  {
    id: 'CUST_05',
    name: 'Mahesh Tailor',
    hindiName: 'महेश टेलर',
    aliases: ['Mahes', 'Mahesh', 'Mahesh Bhai', 'Tailor Mahesh', 'महेश'],
    phone: '+91 98205 56789',
    totalUdhaar: 180,
    totalJama: 0,
    netBalance: 180,
    lastUpdated: '2026-11-04T16:30:00Z',
    notes: 'Tailor shop opposite temple'
  },
  {
    id: 'CUST_06',
    name: 'Vaishali',
    hindiName: 'वैशाली',
    aliases: ['Vaishali', 'Vaisali', 'Vaishali Bhabhi', 'वैशाली', 'वैसाली'],
    phone: '+91 98206 67890',
    totalUdhaar: 0,
    totalJama: 0,
    netBalance: 0,
    lastUpdated: '2026-11-06T12:00:00Z',
    notes: 'Regular local customer'
  }
];
