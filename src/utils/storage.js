/**
 * Local Storage Persistence & Backup Utilities
 * Manages Kirana ledger transactions, customer accounts, and settings on localhost.
 */

import { INITIAL_CUSTOMERS } from '../data/initialCustomers.js';
import { INITIAL_RATE_CARD } from '../data/initialRateCard.js';
import { INITIAL_TRANSACTIONS } from '../data/initialTransactions.js';

const STORAGE_KEYS = {
  TRANSACTIONS: 'gallavoice_transactions_v1',
  CUSTOMERS: 'gallavoice_customers_v1',
  RATE_CARD: 'gallavoice_ratecard_v1',
  SETTINGS: 'gallavoice_settings_v1'
};

export const DEFAULT_SETTINGS = {
  engine: 'LOCAL_ZERO_KEY', // 'LOCAL_ZERO_KEY' | 'GROQ_LLAMA' | 'GEMINI_FLASH'
  groqApiKey: '',
  geminiApiKey: '',
  audioFeedbackEnabled: true,
  autoReadback: true,
  speechLanguage: 'hi-IN',
  accentToleranceLevel: 'MODERATE' // 'STRICT' | 'MODERATE' | 'LENIENT'
};

export const storage = {
  getTransactions: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
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
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : INITIAL_CUSTOMERS;
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
      return data ? JSON.parse(data) : INITIAL_RATE_CARD;
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
