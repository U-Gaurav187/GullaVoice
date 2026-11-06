/**
 * Local Kirana Rate Card Table
 * Pre-seeded with common Indian grocery items and rates (INR).
 * Used for quantity pricing and detecting spoken accent slips (e.g., 15 vs 88 or 1500 vs 140).
 */
export const INITIAL_RATE_CARD = [
  {
    id: 'ITEM_01',
    name: 'Cheeni',
    displayName: 'Cheeni (Sugar)',
    hindiName: 'चीनी',
    aliases: ['cheeni', 'chini', 'shakkar', 'sugar', 'चीनी', 'शक्कर'],
    unit: 'kg',
    unitPrice: 44,
    category: 'Groceries'
  },
  {
    id: 'ITEM_02',
    name: 'Tel',
    displayName: 'Tel (Cooking Oil)',
    hindiName: 'तेल',
    aliases: ['tel', 'oil', 'refined', 'sarson tel', 'packet tel', 'तेल', 'सरसों तेल'],
    unit: 'pkt',
    unitPrice: 140,
    category: 'Oils'
  },
  {
    id: 'ITEM_03',
    name: 'Dudh',
    displayName: 'Dudh (Milk)',
    hindiName: 'दूध',
    aliases: ['dudh', 'doodh', 'milk', 'amul doodh', 'दूध'],
    unit: 'pkt',
    unitPrice: 40,
    category: 'Dairy'
  },
  {
    id: 'ITEM_04',
    name: 'Atta',
    displayName: 'Atta (Wheat Flour)',
    hindiName: 'आटा',
    aliases: ['atta', 'ata', 'wheat flour', 'aashirvaad', 'आटा'],
    unit: 'kg',
    unitPrice: 45,
    category: 'Grains'
  },
  {
    id: 'ITEM_05',
    name: 'Chawal',
    displayName: 'Chawal (Rice)',
    hindiName: 'चावल',
    aliases: ['chawal', 'rice', 'basmati', 'kolam', 'चावल'],
    unit: 'kg',
    unitPrice: 60,
    category: 'Grains'
  },
  {
    id: 'ITEM_06',
    name: 'Dal',
    displayName: 'Dal (Toor/Moong)',
    hindiName: 'दाल',
    aliases: ['dal', 'daal', 'toor dal', 'moong dal', 'दाल', 'तूर दाल'],
    unit: 'kg',
    unitPrice: 120,
    category: 'Pulses'
  },
  {
    id: 'ITEM_07',
    name: 'Chai Patti',
    displayName: 'Chai Patti (Tea Leaves)',
    hindiName: 'चाय पत्ती',
    aliases: ['chai patti', 'chai', 'tea', 'chaye', 'चाय पत्ती', 'चाय'],
    unit: 'pkt',
    unitPrice: 90,
    category: 'Beverages'
  },
  {
    id: 'ITEM_08',
    name: 'Masala',
    displayName: 'Garam / Haldi Masala',
    hindiName: 'मसाला',
    aliases: ['masala', 'haldi', 'mirchi', 'dhaniya', 'मसाला', 'हल्दी'],
    unit: 'pkt',
    unitPrice: 30,
    category: 'Spices'
  },
  {
    id: 'ITEM_09',
    name: 'Namak',
    displayName: 'Namak (Salt)',
    hindiName: 'नमक',
    aliases: ['namak', 'salt', 'tata namak', 'नमक'],
    unit: 'pkt',
    unitPrice: 28,
    category: 'Groceries'
  },
  {
    id: 'ITEM_10',
    name: 'Sabun',
    displayName: 'Sabun (Soap)',
    hindiName: 'साबुन',
    aliases: ['sabun', 'soap', 'dettol', 'lifebuoy', 'साबुन'],
    unit: 'nag',
    unitPrice: 35,
    category: 'Personal Care'
  },
  {
    id: 'ITEM_11',
    name: 'Aloo',
    displayName: 'Aloo (Potatoes)',
    hindiName: 'आलू',
    aliases: ['aloo', 'aalu', 'potato', 'potatoes', 'आलू', 'आलो'],
    unit: 'kg',
    unitPrice: 30,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_12',
    name: 'Pyaz',
    displayName: 'Pyaz (Onions)',
    hindiName: 'प्याज़',
    aliases: ['pyaz', 'pyaaz', 'onion', 'kanda', 'प्याज़', 'कांदा'],
    unit: 'kg',
    unitPrice: 40,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_13',
    name: 'Rawa',
    displayName: 'Rawa / Suji (Semolina)',
    hindiName: 'रवा / सूजी',
    aliases: ['rawa', 'rava', 'suji', 'sooji', 'रवा', 'सूजी'],
    unit: 'kg',
    unitPrice: 36,
    category: 'Grains'
  },
  {
    id: 'ITEM_14',
    name: 'Tamatar',
    displayName: 'Tamatar (Tomatoes)',
    hindiName: 'टमाटर',
    aliases: ['tamatar', 'टामाटर', 'टमाटर', 'tomato', 'tomatoes'],
    unit: 'kg',
    unitPrice: 40,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_15',
    name: 'Dhania',
    displayName: 'Hara Dhania (Coriander)',
    hindiName: 'हरा धनिया',
    aliases: ['dhania', 'dhaniya', 'hara dhania', 'हरा धनिया', 'दनिया', 'धनिया'],
    unit: 'kg',
    unitPrice: 60,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_16',
    name: 'Kela Chips',
    displayName: 'Kela Chips (Banana Chips)',
    hindiName: 'केला चिप्स',
    aliases: ['kela chips', 'chips', 'banana chips', 'केला चिप्स', 'केडा चिप्स'],
    unit: 'pkt',
    unitPrice: 50,
    category: 'Snacks'
  },
  {
    id: 'ITEM_17',
    name: 'Tilli Tel',
    displayName: 'Tilli / Mustard Oil',
    hindiName: 'तिल का तेल',
    aliases: ['tilli tel', 'til tel', 'tilli ka tel', 'तिल्ली का तेल', 'तिल का तेल', 'सरसों तेल'],
    unit: 'kg',
    unitPrice: 180,
    category: 'Oils'
  },
  {
    id: 'ITEM_18',
    name: 'Sev',
    displayName: 'Sev / Namkeen / Seb',
    hindiName: 'सेव',
    aliases: ['sev', 'save', 'shev', 'namkeen', 'bhujia', 'ratlami sev', 'seb', 'apple', 'सेव', 'सेब', 'नमकीन', 'भुजिया'],
    unit: 'kg',
    unitPrice: 160,
    category: 'Snacks'
  }
];
