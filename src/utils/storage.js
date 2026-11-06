/**
 * Local Storage Persistence & Backup Utilities
 * Manages Kirana ledger transactions, customer accounts, and settings on localhost.
 */

import { INITIAL_CUSTOMERS } from '../data/initialCustomers.js';
import { INITIAL_RATE_CARD } from '../data/initialRateCard.js';
import { INITIAL_TRANSACTIONS } from '../data/initialTransactions.js';

const STORAGE_KEYS = {
  TRANSACTIONS: 'gallavoice_transactions_v2',
  CUSTOMERS: 'gallavoice_customers_v2',
  RATE_CARD: 'gallavoice_ratecard_v2',
  SETTINGS: 'gallavoice_settings_v1'
};

export const DEFAULT_SETTINGS = {
  engine: 'LOCAL_ZERO_KEY', // 'LOCAL_ZERO_KEY' | 'GROQ_LLAMA' | 'GEMINI_FLASH'
  groqApiKey: '',
  wisprFlowApiKey: '',
  geminiApiKey: '',
  audioFeedbackEnabled: true,
  autoReadback: true,
  speechLanguage: 'hi-IN',
  accentToleranceLevel: 'MODERATE' // 'STRICT' | 'MODERATE' | 'LENIENT'
};

export const storage = {
  getTransactions: () => {
    try {
      const dataV2 = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      let list = dataV2 ? JSON.parse(dataV2) : INITIAL_TRANSACTIONS;

      // Auto-repair transactions where items or total amount had ₹0 due to missing rate card
      const rateCard = storage.getRateCard();
      let hasRepairs = false;

      list = list.map(t => {
        let itemsModified = false;
        let updatedItems = (t.items || []).map(i => {
          let unitP = Number(i.unitPrice) || 0;
          let calcP = Number(i.calculatedPrice) || 0;
          if (calcP === 0 || unitP === 0) {
            const itemNameLower = (i.name || '').toLowerCase().trim();
            const matchedRate = rateCard.find(rc => 
              rc.name.toLowerCase() === itemNameLower ||
              rc.hindiName === i.name ||
              (rc.aliases && rc.aliases.some(a => itemNameLower.includes(a.toLowerCase()) || a.toLowerCase().includes(itemNameLower)))
            );

            if (matchedRate) {
              let qty = parseFloat(i.quantity);
              if (isNaN(qty)) {
                if (/चार|char|four/i.test(i.quantity || '')) qty = 4;
                else if (/तीन|tin|teen/i.test(i.quantity || '')) qty = 3;
                else if (/दो|do|two|पिलो/i.test(i.quantity || '')) qty = 2;
                else if (/साढ़े पाव/i.test(i.quantity || '')) qty = 0.375;
                else if (/पाव/i.test(i.quantity || '')) qty = 0.25;
                else if (/आधा/i.test(i.quantity || '')) qty = 0.5;
                else qty = 1;
              }
              unitP = matchedRate.unitPrice;
              calcP = Math.round(unitP * qty);
              itemsModified = true;
            } else if (calcP === 0) {
              // Generic fallback estimate for unknown items (never leave ₹0)
              calcP = 40;
              unitP = 40;
              itemsModified = true;
            }
          }
          return {
            ...i,
            unitPrice: unitP,
            calculatedPrice: calcP
          };
        });

        let newTotal = Number(t.totalAmount) || 0;
        const sumOfItems = updatedItems.reduce((sum, item) => sum + (item.calculatedPrice || 0), 0);
        if (newTotal === 0 && sumOfItems > 0) {
          newTotal = sumOfItems;
          itemsModified = true;
        }

        // Remap customer if it was pointing to a merged duplicate
        let custName = t.customerName;
        let custHindi = t.customerHindiName;
        let custUp = t.customerUpName;
        let custId = t.matchedCustomerId;
        if (/मुषाली|वैशाली|mushali|maishali/i.test(t.customerSpoken || t.customerName || '')) {
          custId = 'CUST_06';
          custName = 'Vaishali';
          custHindi = 'वैशाली';
          custUp = 'वैशाली भौजी (बहुरिया)';
        } else if (/प्रमेश|pramesh/i.test(t.customerSpoken || t.customerName || '')) {
          custId = 'CUST_01';
          custName = 'Ramesh Bhai';
          custHindi = 'रमेश भाई';
          custUp = 'दद्दा (रमेश भैया)';
        }

        if (itemsModified || custId !== t.matchedCustomerId) {
          hasRepairs = true;
        }

        return {
          ...t,
          items: updatedItems,
          totalAmount: newTotal,
          customerName: custName,
          customerHindiName: custHindi,
          customerUpName: custUp,
          matchedCustomerId: custId
        };
      });

      if (hasRepairs) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      console.error('Failed to load transactions:', e);
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions: (txns) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txns));
    } catch (e) {
      console.error('Failed to save transactions:', e);
    }
  },

  getCustomers: () => {
    try {
      const dataV2 = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      let list = dataV2 ? JSON.parse(dataV2) : INITIAL_CUSTOMERS;

      // ── CONSOLIDATE & MERGE DUPLICATES ─────────────────────────────
      // Maps duplicate test accounts (e.g. 'मुषाली', 'प्रमेश भाई', duplicate 'वैशाली') into canonical parents
      const canonicalVaishali = list.find(c => c.id === 'CUST_06') || INITIAL_CUSTOMERS.find(c => c.id === 'CUST_06');
      const canonicalRamesh = list.find(c => c.id === 'CUST_01') || INITIAL_CUSTOMERS.find(c => c.id === 'CUST_01');
      const canonicalAvinash = list.find(c => c.id === 'CUST_08') || INITIAL_CUSTOMERS.find(c => c.id === 'CUST_08');

      let cleanedList = [];
      let extraVaishaliUdhaar = 0;
      let extraVaishaliJama = 0;
      let extraRameshUdhaar = 0;
      let extraRameshJama = 0;
      let extraAvinashUdhaar = 0;
      let extraAvinashJama = 0;

      for (const c of list) {
        const cName = (c.name || '').toLowerCase().trim();
        const cHindi = (c.hindiName || '').trim();

        // Check if duplicate of Vaishali (e.g. 'मुषाली', 'वैशाली' with non-CUST_06 id)
        if (c.id !== 'CUST_06' && (/मुषाली|वैशाली|mushali|maishali/i.test(cName) || /मुषाली|वैशाली/i.test(cHindi))) {
          extraVaishaliUdhaar += (c.totalUdhaar || 0);
          extraVaishaliJama += (c.totalJama || 0);
          continue; // Drop duplicate row
        }

        // Check if duplicate of Ramesh Bhai (e.g. 'प्रमेश भाई' with non-CUST_01 id)
        if (c.id !== 'CUST_01' && (/प्रमेश|pramesh/i.test(cName) || /प्रमेश/i.test(cHindi))) {
          extraRameshUdhaar += (c.totalUdhaar || 0);
          extraRameshJama += (c.totalJama || 0);
          continue; // Drop duplicate row
        }

        // Check if duplicate of Avinash
        if (c.id !== 'CUST_08' && (/अभिनाश|avinash|abhinash/i.test(cName) || /अभिनाश|अविनाश/i.test(cHindi))) {
          extraAvinashUdhaar += (c.totalUdhaar || 0);
          extraAvinashJama += (c.totalJama || 0);
          continue; // Drop duplicate row
        }

        cleanedList.push(c);
      }

      // Add merged balances to canonical records
      cleanedList = cleanedList.map(c => {
        if (c.id === 'CUST_06' && (extraVaishaliUdhaar > 0 || extraVaishaliJama > 0)) {
          const u = c.totalUdhaar + extraVaishaliUdhaar;
          const j = c.totalJama + extraVaishaliJama;
          return { ...c, totalUdhaar: u, totalJama: j, netBalance: u - j };
        }
        if (c.id === 'CUST_01' && (extraRameshUdhaar > 0 || extraRameshJama > 0)) {
          const u = c.totalUdhaar + extraRameshUdhaar;
          const j = c.totalJama + extraRameshJama;
          return { ...c, totalUdhaar: u, totalJama: j, netBalance: u - j };
        }
        if (c.id === 'CUST_08' && (extraAvinashUdhaar > 0 || extraAvinashJama > 0)) {
          const u = c.totalUdhaar + extraAvinashUdhaar;
          const j = c.totalJama + extraAvinashJama;
          return { ...c, totalUdhaar: u, totalJama: j, netBalance: u - j };
        }
        return c;
      });

      // Ensure latest aliases and UP names are synced from INITIAL_CUSTOMERS
      cleanedList = cleanedList.map(c => {
        const init = INITIAL_CUSTOMERS.find(ic => ic.id === c.id || ic.name.toLowerCase() === c.name.toLowerCase());
        if (init) {
          const mergedAliases = Array.from(new Set([...(c.aliases || []), ...(init.aliases || [])]));
          return {
            ...c,
            hindiName: c.hindiName || init.hindiName,
            upNativeName: c.upNativeName || init.upNativeName,
            aliases: mergedAliases
          };
        }
        return c;
      });

      // Ensure any missing initial customers exist
      INITIAL_CUSTOMERS.forEach(ic => {
        if (!cleanedList.some(c => c.id === ic.id || c.name.toLowerCase() === ic.name.toLowerCase())) {
          cleanedList.push(ic);
        }
      });

      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(cleanedList));
      return cleanedList;
    } catch (e) {
      console.error('Failed to load customers:', e);
      return INITIAL_CUSTOMERS;
    }
  },

  saveCustomers: (customers) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers:', e);
    }
  },

  getRateCard: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATE_CARD);
      let list = data ? JSON.parse(data) : INITIAL_RATE_CARD;
      let hasNew = false;
      INITIAL_RATE_CARD.forEach(initItem => {
        const existingIdx = list.findIndex(item => item.id === initItem.id || item.name.toLowerCase() === initItem.name.toLowerCase());
        if (existingIdx === -1) {
          list.push(initItem);
          hasNew = true;
        } else {
          // Update aliases and prices if newly expanded
          list[existingIdx] = {
            ...initItem,
            ...list[existingIdx],
            aliases: Array.from(new Set([...(list[existingIdx].aliases || []), ...(initItem.aliases || [])]))
          };
        }
      });
      if (hasNew || !data) {
        localStorage.setItem(STORAGE_KEYS.RATE_CARD, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      console.error('Failed to load rate card:', e);
      return INITIAL_RATE_CARD;
    }
  },

  saveRateCard: (items) => {
    try {
      localStorage.setItem(STORAGE_KEYS.RATE_CARD, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save rate card:', e);
    }
  },

  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Failed to load settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.RATE_CARD);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
};

/**
 * Exports transaction ledger as CSV download
 */
export function exportTransactionsToCSV(transactions = []) {
  if (!transactions.length) return;

  const headers = ['Txn ID', 'Date & Time', 'Customer Name', 'Customer ID', 'Type', 'Items', 'Total (INR)', 'Filtered Noise', 'Status'];
  const rows = transactions.map(t => [
    t.id,
    new Date(t.timestamp).toLocaleString('en-IN'),
    `"${(t.customerName || '').replace(/"/g, '""')}"`,
    t.matchedCustomerId || 'N/A',
    t.transactionType,
    `"${(t.items || []).map(i => `${i.quantity} ${i.name} (₹${i.calculatedPrice})`).join('; ').replace(/"/g, '""')}"`,
    t.totalAmount,
    `"${(t.ignoredNoise || '').replace(/"/g, '""')}"`,
    t.status
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `GallaVoice_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports full ledger backup as JSON
 */
export function exportBackupJSON(transactions, customers, rateCard) {
  const backup = {
    exportedAt: new Date().toISOString(),
    transactions,
    customers,
    rateCard,
    version: '1.0.0'
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `GallaVoice_FullBackup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
