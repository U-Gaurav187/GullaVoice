import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Edit2, Check, RotateCcw, AlertCircle } from 'lucide-react';
import { INITIAL_RATE_CARD } from '../data/initialRateCard';

export default function RateCardModal({
  isOpen,
  onClose,
  rateCard = [],
  onUpdateRateCard
}) {
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    displayName: '',
    hindiName: '',
    aliases: '',
    unit: 'kg',
    unitPrice: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditPrice(String(item.unitPrice));
  };

  const handleSavePrice = (id) => {
    const val = parseFloat(editPrice);
    if (!isNaN(val) && val > 0) {
      const updated = rateCard.map(rc => 
        rc.id === id ? { ...rc, unitPrice: val } : rc
      );
      onUpdateRateCard(updated);
    }
    setEditingId(null);
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.unitPrice) return;

    const aliasesArray = newItem.aliases
      ? newItem.aliases.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : [newItem.name.toLowerCase()];

    const itemObj = {
      id: `ITEM_${Date.now()}`,
      name: newItem.name,
      displayName: newItem.displayName || newItem.name,
      hindiName: newItem.hindiName || newItem.name,
      aliases: aliasesArray,
      unit: newItem.unit,
      unitPrice: parseFloat(newItem.unitPrice),
      category: 'General'
    };

    onUpdateRateCard([...rateCard, itemObj]);
    setNewItem({
      name: '',
      displayName: '',
      hindiName: '',
      aliases: '',
      unit: 'kg',
      unitPrice: ''
    });
    setShowAddForm(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('क्या आप दर सूची को मूल डिफ़ॉल्ट पर रीसेट करना चाहते हैं?')) {
      onUpdateRateCard(INITIAL_RATE_CARD);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                दुकान दर सूची (Kirana Rate Card)
              </h3>
              <p className="text-xs text-stone-500">
                Used to verify item quantities and catch accent number slips (e.g. 15 vs 88 or 1500 vs 140)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 bg-stone-100/50 border-b border-stone-200 flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-600">
            कुल {rateCard.length} सामान पंजीकृत
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>नया सामान जोड़ें</span>
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-2.5 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors flex items-center gap-1"
              title="डिफ़ॉल्ट रेट कार्ड रीसेट करें"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          </div>
        </div>

        {/* Add New Item Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddNewItem} className="p-4 bg-orange-50/70 border-b border-orange-200 text-xs">
            <h4 className="font-bold text-stone-900 mb-2">नया सामान जोड़ें (Add Item)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">नाम (English):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gur (Jaggery)"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">हिंदी नाम:</label>
                <input
                  type="text"
                  placeholder="e.g. गुड़"
                  value={newItem.hindiName}
                  onChange={(e) => setNewItem({ ...newItem, hindiName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-stone-600 text-[11px] mb-1">दर (₹) प्रति इकाई:</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 55"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                  className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-lg text-stone-600 hover:bg-stone-200"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-orange-600 text-white font-bold"
              >
                सेव करें
              </button>
            </div>
          </form>
        )}

        {/* Items Table */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">सामान (Item)</th>
                  <th className="p-3">इकाई (Unit)</th>
                  <th className="p-3">दर (Price ₹)</th>
                  <th className="p-3">वॉयस उपनाम (Speech Aliases)</th>
                  <th className="p-3 text-right">संपादित करें</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rateCard.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-stone-900 block">{item.displayName || item.name}</span>
                      <span className="text-[11px] text-stone-500 font-devanagari">{item.hindiName}</span>
                    </td>
                    <td className="p-3 text-stone-600 font-mono">
                      1 {item.unit}
                    </td>
                    <td className="p-3 font-bold text-stone-900">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-stone-400">₹</span>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-16 p-1 border border-orange-500 rounded bg-white font-bold"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(item.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-orange-600 font-bold text-sm">
                          ₹{item.unitPrice}
                        </span>
                      )}
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {(item.aliases || []).map((alias, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200 text-[10px]"
                          >
                            {alias}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {editingId !== item.id && (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                          title="कीमत बदलें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            बंद करें (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
