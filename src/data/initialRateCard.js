/**
 * Comprehensive Indian Kirana Store Master Rate Card Table
 * Pre-seeded with authentic Indian grocery items, personal care, cleaning, staples, and produce.
 * Used for instant quantity pricing and spoken accent slip normalization.
 */
export const INITIAL_RATE_CARD = [
  // ── Staples & Grains ──────────────────────────────────────────────
  {
    id: 'ITEM_01',
    name: 'Cheeni',
    displayName: 'Cheeni (Sugar)',
    hindiName: 'चीनी',
    aliases: ['cheeni', 'chini', 'shakkar', 'sugar', 'चीनी', 'शक्कर'],
    unit: 'kg',
    unitPrice: 44,
    category: 'Staples'
  },
  {
    id: 'ITEM_02',
    name: 'Atta',
    displayName: 'Atta (Wheat Flour)',
    hindiName: 'आटा',
    aliases: ['atta', 'ata', 'wheat flour', 'aashirvaad', 'आटा'],
    unit: 'kg',
    unitPrice: 45,
    category: 'Grains'
  },
  {
    id: 'ITEM_03',
    name: 'Chawal',
    displayName: 'Chawal (Rice)',
    hindiName: 'चावल',
    aliases: ['chawal', 'rice', 'basmati', 'kolam', 'चावल'],
    unit: 'kg',
    unitPrice: 60,
    category: 'Grains'
  },
  {
    id: 'ITEM_04',
    name: 'Maida',
    displayName: 'Maida (All-purpose Flour)',
    hindiName: 'मैदा',
    aliases: ['maida', 'all purpose flour', 'मैदा'],
    unit: 'kg',
    unitPrice: 42,
    category: 'Grains'
  },
  {
    id: 'ITEM_05',
    name: 'Suji / Rawa',
    displayName: 'Suji / Rawa (Semolina)',
    hindiName: 'सूजी / रवा',
    aliases: ['suji', 'rawa', 'rava', 'sooji', 'रवा', 'सूजी'],
    unit: 'kg',
    unitPrice: 38,
    category: 'Grains'
  },
  {
    id: 'ITEM_06',
    name: 'Besan',
    displayName: 'Besan (Gram Flour)',
    hindiName: 'बेसन',
    aliases: ['besan', 'chana flour', 'gram flour', 'बेसन'],
    unit: 'kg',
    unitPrice: 90,
    category: 'Grains'
  },
  {
    id: 'ITEM_07',
    name: 'Poha',
    displayName: 'Poha (Flattened Rice)',
    hindiName: 'पोहा',
    aliases: ['poha', 'powa', 'chiwda', 'पोहा', 'चिवड़ा'],
    unit: 'kg',
    unitPrice: 50,
    category: 'Grains'
  },
  {
    id: 'ITEM_08',
    name: 'Gur',
    displayName: 'Gur / Jaggery',
    hindiName: 'गुड़',
    aliases: ['gur', 'gud', 'jaggery', 'गुड़', 'गुड'],
    unit: 'kg',
    unitPrice: 60,
    category: 'Staples'
  },

  // ── Dals & Pulses ──────────────────────────────────────────────────
  {
    id: 'ITEM_09',
    name: 'Toor Dal',
    displayName: 'Toor / Arhar Dal',
    hindiName: 'अरहर / तूर दाल',
    aliases: ['toor dal', 'arhar dal', 'tuvar dal', 'dal', 'दाल', 'अरहर दाल', 'तूर दाल'],
    unit: 'kg',
    unitPrice: 160,
    category: 'Dals'
  },
  {
    id: 'ITEM_10',
    name: 'Moong Dal',
    displayName: 'Moong Dal (Yellow/Green)',
    hindiName: 'मूंग दाल',
    aliases: ['moong dal', 'mung dal', 'peeli dal', 'मूंग दाल'],
    unit: 'kg',
    unitPrice: 120,
    category: 'Dals'
  },
  {
    id: 'ITEM_11',
    name: 'Chana Dal',
    displayName: 'Chana Dal',
    hindiName: 'चना दाल',
    aliases: ['chana dal', 'chane ki dal', 'चना दाल'],
    unit: 'kg',
    unitPrice: 90,
    category: 'Dals'
  },
  {
    id: 'ITEM_12',
    name: 'Urad Dal',
    displayName: 'Urad Dal (Black/White)',
    hindiName: 'उड़द दाल',
    aliases: ['urad dal', 'udad dal', 'उड़द दाल'],
    unit: 'kg',
    unitPrice: 140,
    category: 'Dals'
  },
  {
    id: 'ITEM_13',
    name: 'Masoor Dal',
    displayName: 'Masoor Dal (Red Lentil)',
    hindiName: 'मसूर दाल',
    aliases: ['masoor dal', 'malka dal', 'मसूर दाल'],
    unit: 'kg',
    unitPrice: 100,
    category: 'Dals'
  },
  {
    id: 'ITEM_14',
    name: 'Rajma',
    displayName: 'Rajma (Kidney Beans)',
    hindiName: 'राजमा',
    aliases: ['rajma', 'chitra rajma', 'rajmah', 'राजमा'],
    unit: 'kg',
    unitPrice: 140,
    category: 'Dals'
  },
  {
    id: 'ITEM_15',
    name: 'Chole / Kabuli Chana',
    displayName: 'Chole / Kabuli Chana',
    hindiName: 'काबुली चना / छोले',
    aliases: ['chole', 'kabuli chana', 'safed chana', 'छोले', 'काबुली चना'],
    unit: 'kg',
    unitPrice: 130,
    category: 'Dals'
  },

  // ── Cooking Oils & Ghee ───────────────────────────────────────────
  {
    id: 'ITEM_16',
    name: 'Tel',
    displayName: 'Refined Cooking Oil',
    hindiName: 'रिफाइंड तेल',
    aliases: ['tel', 'oil', 'refined tel', 'refined', 'packet tel', 'फॉर्च्यून', 'तेल'],
    unit: 'pkt',
    unitPrice: 140,
    category: 'Oils'
  },
  {
    id: 'ITEM_17',
    name: 'Sarson Tel',
    displayName: 'Sarson Tel (Mustard Oil)',
    hindiName: 'सरसों का तेल',
    aliases: ['sarson tel', 'mustard oil', 'kachi ghani', 'सरसों तेल', 'सरसों का तेल'],
    unit: 'kg',
    unitPrice: 160,
    category: 'Oils'
  },
  {
    id: 'ITEM_18',
    name: 'Tilli Tel',
    displayName: 'Tilli Tel (Sesame Oil)',
    hindiName: 'तिल का तेल',
    aliases: ['tilli tel', 'til tel', 'tilli ka tel', 'तिल्ली का तेल', 'तिल का तेल'],
    unit: 'kg',
    unitPrice: 180,
    category: 'Oils'
  },
  {
    id: 'ITEM_19',
    name: 'Ghee',
    displayName: 'Desi Ghee',
    hindiName: 'देसी घी',
    aliases: ['ghee', 'desi ghee', 'amul ghee', 'घी', 'देसी घी'],
    unit: 'kg',
    unitPrice: 650,
    category: 'Dairy'
  },

  // ── Dairy, Eggs & Bakery ──────────────────────────────────────────
  {
    id: 'ITEM_20',
    name: 'Dudh',
    displayName: 'Dudh (Milk)',
    hindiName: 'दूध',
    aliases: ['dudh', 'doodh', 'milk', 'amul doodh', 'amul milk', 'दूध'],
    unit: 'pkt',
    unitPrice: 33,
    category: 'Dairy'
  },
  {
    id: 'ITEM_21',
    name: 'Dahi',
    displayName: 'Dahi (Curd)',
    hindiName: 'दही',
    aliases: ['dahi', 'curd', 'amul dahi', 'दही'],
    unit: 'pkt',
    unitPrice: 35,
    category: 'Dairy'
  },
  {
    id: 'ITEM_22',
    name: 'Paneer',
    displayName: 'Paneer (Cottage Cheese)',
    hindiName: 'पनीर',
    aliases: ['paneer', 'panir', 'amul paneer', 'पनीर'],
    unit: 'kg',
    unitPrice: 420,
    category: 'Dairy'
  },
  {
    id: 'ITEM_23',
    name: 'Makkhan',
    displayName: 'Makkhan / Butter',
    hindiName: 'मक्खन',
    aliases: ['makkhan', 'butter', 'amul butter', 'मक्खन', 'बटर'],
    unit: 'pkt',
    unitPrice: 56,
    category: 'Dairy'
  },
  {
    id: 'ITEM_24',
    name: 'Anda',
    displayName: 'Anda (Eggs)',
    hindiName: 'अंडा',
    aliases: ['anda', 'ande', 'eggs', 'egg', 'अंडा', 'अंडे'],
    unit: 'pc',
    unitPrice: 7,
    category: 'Dairy'
  },
  {
    id: 'ITEM_25',
    name: 'Bread',
    displayName: 'Bread (White/Brown)',
    hindiName: 'ब्रेड',
    aliases: ['bread', 'brot', 'ब्रेड'],
    unit: 'pkt',
    unitPrice: 40,
    category: 'Bakery'
  },
  {
    id: 'ITEM_26',
    name: 'Pav',
    displayName: 'Pav (Ladi Pav)',
    hindiName: 'पाव',
    aliases: ['pav', 'pao', 'ladi pav', 'पाव'],
    unit: 'pkt',
    unitPrice: 25,
    category: 'Bakery'
  },

  // ── Fresh Vegetables & Produce ────────────────────────────────────
  {
    id: 'ITEM_27',
    name: 'Aloo',
    displayName: 'Aloo (Potatoes)',
    hindiName: 'आलू',
    aliases: ['aloo', 'aalu', 'alu', 'potato', 'potatoes', 'आलू'],
    unit: 'kg',
    unitPrice: 30,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_28',
    name: 'Pyaz',
    displayName: 'Pyaz / Kanda (Onions)',
    hindiName: 'प्याज़ / कांदा',
    aliases: ['pyaz', 'pyaaz', 'onion', 'kanda', 'प्याज़', 'कांदा'],
    unit: 'kg',
    unitPrice: 40,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_29',
    name: 'Tamatar',
    displayName: 'Tamatar (Tomatoes)',
    hindiName: 'टमाटर',
    aliases: ['tamatar', 'टामाटर', 'टमाटर', 'tomato', 'tomatoes'],
    unit: 'kg',
    unitPrice: 40,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_30',
    name: 'Dhania',
    displayName: 'Hara Dhania (Coriander)',
    hindiName: 'हरा धनिया',
    aliases: ['dhania', 'dhaniya', 'hara dhania', 'हरा धनिया', 'दनिया', 'धनिया', 'कोथमीर'],
    unit: 'kg',
    unitPrice: 60,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_31',
    name: 'Hari Mirchi',
    displayName: 'Hari Mirchi (Green Chillies)',
    hindiName: 'हरी मिर्च',
    aliases: ['hari mirchi', 'mirchi', 'mirch', 'green chillies', 'हरी मिर्च', 'मिर्ची', 'मिरची'],
    unit: 'kg',
    unitPrice: 80,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_32',
    name: 'Adrak',
    displayName: 'Adrak (Ginger)',
    hindiName: 'अदरक',
    aliases: ['adrak', 'ginger', 'अदरक'],
    unit: 'kg',
    unitPrice: 120,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_33',
    name: 'Lehsun',
    displayName: 'Lehsun (Garlic)',
    hindiName: 'लहसुन',
    aliases: ['lehsun', 'lahsun', 'garlic', 'लहसुन'],
    unit: 'kg',
    unitPrice: 200,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_34',
    name: 'Nimbu',
    displayName: 'Nimbu (Lemons)',
    hindiName: 'नींबू',
    aliases: ['nimbu', 'lemon', 'lemons', 'नींबू', 'नीम्बु'],
    unit: 'pc',
    unitPrice: 5,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_35',
    name: 'Matar',
    displayName: 'Hari Matar (Green Peas)',
    hindiName: 'हरी मटर',
    aliases: ['matar', 'hari matar', 'peas', 'मटर'],
    unit: 'kg',
    unitPrice: 60,
    category: 'Vegetables'
  },
  {
    id: 'ITEM_36',
    name: 'Gobi',
    displayName: 'Patta / Phool Gobi',
    hindiName: 'गोभी',
    aliases: ['gobi', 'gobhi', 'patta gobi', 'phool gobi', 'गोभी'],
    unit: 'kg',
    unitPrice: 40,
    category: 'Vegetables'
  },

  // ── Spices & Seasonings ───────────────────────────────────────────
  {
    id: 'ITEM_37',
    name: 'Namak',
    displayName: 'Namak (Tata Salt)',
    hindiName: 'नमक',
    aliases: ['namak', 'salt', 'tata namak', 'tata salt', 'नमक', 'टाटा नमक'],
    unit: 'pkt',
    unitPrice: 28,
    category: 'Spices'
  },
  {
    id: 'ITEM_38',
    name: 'Haldi',
    displayName: 'Haldi Powder (Turmeric)',
    hindiName: 'हल्दी पाउडर',
    aliases: ['haldi', 'turmeric', 'haldi powder', 'हल्दी', 'हल्दी पाउडर'],
    unit: 'pkt',
    unitPrice: 35,
    category: 'Spices'
  },
  {
    id: 'ITEM_39',
    name: 'Mirch Powder',
    displayName: 'Lal Mirch Powder',
    hindiName: 'लाल मिर्च पाउडर',
    aliases: ['lal mirch', 'red chilli powder', 'mirch powder', 'लाल मिर्च'],
    unit: 'pkt',
    unitPrice: 45,
    category: 'Spices'
  },
  {
    id: 'ITEM_40',
    name: 'Dhaniya Powder',
    displayName: 'Dhaniya Powder (Coriander)',
    hindiName: 'धनिया पाउडर',
    aliases: ['dhaniya powder', 'dhania powder', 'धनिया पाउडर'],
    unit: 'pkt',
    unitPrice: 38,
    category: 'Spices'
  },
  {
    id: 'ITEM_41',
    name: 'Garam Masala',
    displayName: 'Garam Masala',
    hindiName: 'गरम मसाला',
    aliases: ['garam masala', 'masala', 'everest garam masala', 'गरम मसाला', 'मसाला'],
    unit: 'pkt',
    unitPrice: 50,
    category: 'Spices'
  },
  {
    id: 'ITEM_42',
    name: 'Jeera',
    displayName: 'Jeera (Cumin Seeds)',
    hindiName: 'जीरा',
    aliases: ['jeera', 'jira', 'cumin', 'जीरा'],
    unit: 'kg',
    unitPrice: 380,
    category: 'Spices'
  },
  {
    id: 'ITEM_43',
    name: 'Hing',
    displayName: 'Hing (Asafoetida)',
    hindiName: 'हींग',
    aliases: ['hing', 'asafoetida', 'bandhani hing', 'हींग'],
    unit: 'pc',
    unitPrice: 60,
    category: 'Spices'
  },

  // ── Tea, Coffee & Beverages ───────────────────────────────────────
  {
    id: 'ITEM_44',
    name: 'Chai Patti',
    displayName: 'Chai Patti (Tea Powder)',
    hindiName: 'चाय पत्ती',
    aliases: ['chai patti', 'tea', 'chai', 'red label', 'taj mahal', 'taaza', 'चाय', 'चाय पत्ती'],
    unit: 'pkt',
    unitPrice: 120,
    category: 'Beverages'
  },
  {
    id: 'ITEM_45',
    name: 'Coffee',
    displayName: 'Coffee (Nescafe / Bru)',
    hindiName: 'कॉफी',
    aliases: ['coffee', 'nescafe', 'bru', 'कॉफी', 'नेस्कैफे'],
    unit: 'pc',
    unitPrice: 10,
    category: 'Beverages'
  },
  {
    id: 'ITEM_46',
    name: 'Bournvita',
    displayName: 'Bournvita / Horlicks',
    hindiName: 'बॉर्नविटा',
    aliases: ['bournvita', 'horlicks', 'complan', 'बॉर्नविटा', 'हॉर्लिक्स'],
    unit: 'jar',
    unitPrice: 245,
    category: 'Beverages'
  },

  // ── Snacks, Namkeen & Biscuits ────────────────────────────────────
  {
    id: 'ITEM_47',
    name: 'Sev',
    displayName: 'Sev / Ratlami Sev / Bhujia',
    hindiName: 'सेव',
    aliases: ['sev', 'save', 'shev', 'namkeen', 'bhujia', 'ratlami sev', 'seb', 'सेव', 'सेब', 'नमकीन', 'भुजिया'],
    unit: 'kg',
    unitPrice: 160,
    category: 'Snacks'
  },
  {
    id: 'ITEM_48',
    name: 'Kela Chips',
    displayName: 'Kela Chips (Banana Chips)',
    hindiName: 'केला चिप्स',
    aliases: ['kela chips', 'chips', 'banana chips', 'केला चिप्स', 'केडा चिप्स'],
    unit: 'pkt',
    unitPrice: 50,
    category: 'Snacks'
  },
  {
    id: 'ITEM_49',
    name: 'Kurkure / Lays',
    displayName: 'Kurkure / Lays / Balaji Chips',
    hindiName: 'कुरकुरे / लेज चिप्स',
    aliases: ['kurkure', 'lays', 'chips packet', 'balaji', 'कुरकुरे', 'लेज'],
    unit: 'pkt',
    unitPrice: 20,
    category: 'Snacks'
  },
  {
    id: 'ITEM_50',
    name: 'Maggi',
    displayName: 'Maggi 2-Minute Noodles',
    hindiName: 'मैगी',
    aliases: ['maggi', 'maggie', 'noodles', 'yippee', 'मैगी', 'नूडल्स'],
    unit: 'pkt',
    unitPrice: 14,
    category: 'Snacks'
  },
  {
    id: 'ITEM_51',
    name: 'Parle-G',
    displayName: 'Parle-G Biscuits',
    hindiName: 'पारले-जी',
    aliases: ['parle-g', 'parle g', 'parle', 'biscuit', 'पारले जी', 'पारले', 'बिस्कुट'],
    unit: 'pkt',
    unitPrice: 10,
    category: 'Snacks'
  },
  {
    id: 'ITEM_52',
    name: 'Good Day',
    displayName: 'Britannia Good Day Biscuits',
    hindiName: 'गुड डे',
    aliases: ['good day', 'goodday', 'butter biscuit', 'गुड डे'],
    unit: 'pkt',
    unitPrice: 30,
    category: 'Snacks'
  },
  {
    id: 'ITEM_53',
    name: 'Rusk / Toast',
    displayName: 'Rusk / Toast Biscuits',
    hindiName: 'रस / टोस्ट',
    aliases: ['rusk', 'toast', 'rusks', 'रस', 'टोस्ट'],
    unit: 'pkt',
    unitPrice: 40,
    category: 'Snacks'
  },

  // ── Personal Care & Cosmetics (Vaseline, Soaps, Oils) ─────────────
  {
    id: 'ITEM_54',
    name: 'Vaseline',
    displayName: 'Vaseline Petroleum Jelly',
    hindiName: 'वैसलीन',
    aliases: ['vaseline', 'vaselin', 'petroleum jelly', 'cold cream', 'वैसलीन', 'वेसलीन'],
    unit: 'pc',
    unitPrice: 45,
    category: 'Personal Care'
  },
  {
    id: 'ITEM_55',
    name: 'Sabun',
    displayName: 'Bathing Soap (Lifebuoy / Lux / Dettol)',
    hindiName: 'साबुन',
    aliases: ['sabun', 'soap', 'lifebuoy', 'lux', 'dettol', 'santoor', 'साबुन', 'लाईफबॉय', 'लक्स'],
    unit: 'pc',
    unitPrice: 35,
    category: 'Personal Care'
  },
  {
    id: 'ITEM_56',
    name: 'Shampoo',
    displayName: 'Shampoo (Clinic Plus / Sunsilk / Head & Shoulders)',
    hindiName: 'शैम्पू',
    aliases: ['shampoo', 'clinic plus', 'sunsilk', 'shampoo pouch', 'शैम्पू'],
    unit: 'pc',
    unitPrice: 2,
    category: 'Personal Care'
  },
  {
    id: 'ITEM_57',
    name: 'Toothpaste',
    displayName: 'Toothpaste (Colgate / Pepsodent)',
    hindiName: 'कोलगेट / टूथपेस्ट',
    aliases: ['colgate', 'toothpaste', 'pepsodent', 'dant kanti', 'कोलगेट', 'टूथपेस्ट', 'मंजन'],
    unit: 'pc',
    unitPrice: 55,
    category: 'Personal Care'
  },
  {
    id: 'ITEM_58',
    name: 'Nariyal Tel',
    displayName: 'Parachute Coconut Hair Oil',
    hindiName: 'नारियल तेल',
    aliases: ['nariyal tel', 'coconut oil', 'parachute', 'hair oil', 'नारियल तेल', 'पैराशूट तेल'],
    unit: 'pc',
    unitPrice: 42,
    category: 'Personal Care'
  },
  {
    id: 'ITEM_59',
    name: 'Talcum Powder',
    displayName: 'Ponds / DermiCool Powder',
    hindiName: 'टेलकम पाउडर',
    aliases: ['powder', 'ponds powder', 'talcum powder', 'dermicool', 'पाउडर'],
    unit: 'pc',
    unitPrice: 65,
    category: 'Personal Care'
  },

  // ── Cleaning & Household Essentials ───────────────────────────────
  {
    id: 'ITEM_60',
    name: 'Surf / Detergent',
    displayName: 'Washing Powder (Ghadi / Wheel / Surf Excel)',
    hindiName: 'सर्फ़ / डिटर्जेंट',
    aliases: ['surf', 'detergent', 'ghadi powder', 'wheel', 'tide', 'surf excel', 'सर्फ', 'सर्फ़', 'डिटर्जेंट', 'घड़ी पाउडर'],
    unit: 'kg',
    unitPrice: 70,
    category: 'Cleaning'
  },
  {
    id: 'ITEM_61',
    name: 'Vim Bar',
    displayName: 'Vim Bar (Dishwashing Soap)',
    hindiName: 'विम बार / बर्तन साबुन',
    aliases: ['vim bar', 'vim', 'bartan sabun', 'dishwash bar', 'विम बार', 'विम', 'बर्तन साबुन'],
    unit: 'pc',
    unitPrice: 15,
    category: 'Cleaning'
  },
  {
    id: 'ITEM_62',
    name: 'Harpic',
    displayName: 'Harpic Toilet Cleaner',
    hindiName: 'हार्पिक',
    aliases: ['harpic', 'toilet cleaner', 'हार्पिक'],
    unit: 'pc',
    unitPrice: 95,
    category: 'Cleaning'
  },
  {
    id: 'ITEM_63',
    name: 'Maachis',
    displayName: 'Maachis (Matchbox)',
    hindiName: 'माचिस',
    aliases: ['maachis', 'machis', 'matchbox', 'matches', 'माचिस'],
    unit: 'pkt',
    unitPrice: 20,
    category: 'Puja'
  },
  {
    id: 'ITEM_64',
    name: 'Agarbatti',
    displayName: 'Agarbatti (Incense Sticks)',
    hindiName: 'अगरबत्ती',
    aliases: ['agarbatti', 'agarbathi', 'dhoop', 'cycle agarbatti', 'अगरबत्ती', 'धूप'],
    unit: 'pkt',
    unitPrice: 25,
    category: 'Puja'
  },
  {
    id: 'ITEM_65',
    name: 'Kapur',
    displayName: 'Kapur (Camphor)',
    hindiName: 'कपूर',
    aliases: ['kapur', 'camphor', 'karpoor', 'कपूर'],
    unit: 'pkt',
    unitPrice: 30,
    category: 'Puja'
  }
];
