/**
 * Offline Indian Kirana Name Diary & Word Dictionary (Zero-Key Built-in Shabd-Kosh)
 *
 * Pre-seeded with common Indian customer names in both exact English and exact Hindi
 * Devanagari scripts. Used locally (zero API keys) AND dynamically fed into Groq Whisper's
 * prompt when deployed online to prevent letter substitutions like Vaishali -> Vaisari.
 */

export const INDIAN_NAME_DICTIONARY = [
  { id: 'DICT_01', name: 'Vaishali', hindiName: 'वैशाली', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_02', name: 'Avinash', hindiName: 'अविनाश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_03', name: 'Ramesh Bhai', hindiName: 'रमेश भाई', aliases: ['Ramesh'], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_04', name: 'Parth', hindiName: 'पार्थ', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_05', name: 'Sunita', hindiName: 'सुनीता', aliases: ['Sunita Bhabhi'], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_06', name: 'Sharma Ji', hindiName: 'शर्मा जी', aliases: ['Sharma'], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_07', name: 'Pintu', hindiName: 'पिंटू', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_08', name: 'Maheed', hindiName: 'महीद', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_09', name: 'Rohid', hindiName: 'रोहिद', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_10', name: 'Rohit', hindiName: 'रोहित', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_11', name: 'Mohit', hindiName: 'मोहित', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_12', name: 'Suresh', hindiName: 'सुरेश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_13', name: 'Mahesh', hindiName: 'महेश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_14', name: 'Ganesh', hindiName: 'गणेश', aliases: [], isConsonantDistinct: true, isCustom: false, category: 'Customer Name' },
  { id: 'DICT_15', name: 'Dinesh', hindiName: 'दिनेश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_16', name: 'Rajesh', hindiName: 'राजेश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_17', name: 'Mukesh', hindiName: 'मुकेश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_18', name: 'Raju', hindiName: 'राजू', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_19', name: 'Chhotu', hindiName: 'छोटू', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_20', name: 'Anita', hindiName: 'अनिता', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_21', name: 'Kavita', hindiName: 'कविता', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_22', name: 'Savita', hindiName: 'सविता', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_23', name: 'Babita', hindiName: 'बबिता', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_24', name: 'Geeta', hindiName: 'गीता', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_25', name: 'Sita', hindiName: 'सीता', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_26', name: 'Priya', hindiName: 'प्रिया', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_27', name: 'Pooja', hindiName: 'पूजा', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_28', name: 'Neha', hindiName: 'नेहा', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_29', name: 'Sneha', hindiName: 'स्नेहा', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_30', name: 'Kiran', hindiName: 'किरण', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_31', name: 'Vikram', hindiName: 'विक्रम', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_32', name: 'Bikram', hindiName: 'बिक्रम', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_33', name: 'Vikas', hindiName: 'विकास', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_34', name: 'Deepak', hindiName: 'दीपक', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_35', name: 'Sohan', hindiName: 'सोहन', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_36', name: 'Mohan', hindiName: 'मोहन', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_37', name: 'Rohan', hindiName: 'रोहन', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_38', name: 'Kailash', hindiName: 'कैलाश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_39', name: 'Prakash', hindiName: 'प्रकाश', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_40', name: 'Santosh', hindiName: 'संतोष', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_41', name: 'Manoj', hindiName: 'मनोज', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_42', name: 'Vinod', hindiName: 'विनोद', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_43', name: 'Ashok', hindiName: 'अशोक', aliases: [], isCustom: false, category: 'Customer Name' },
  { id: 'DICT_44', name: 'Gaurav', hindiName: 'गौरव', aliases: [], isCustom: false, category: 'Customer Name' }
];
