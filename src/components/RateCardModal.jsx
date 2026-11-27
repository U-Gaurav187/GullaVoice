import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, X, Plus, Check, RotateCcw, Trash2, Sparkles } from 'lucide-react';
import { INITIAL_RATE_CARD } from '../data/initialRateCard';
import { extractRateCardUpdatesFromText } from '../services/localParser';

const EMPTY_ROW = () => ({ name: '', hindiName: '', unit: 'kg', unitPrice: '' });

export default function RateCardModal({
  isOpen,
  onClose,
  rateCard = [],
  onUpdateRateCard
}) {
  // Batch inline edits: { [id]: { unitPrice, unit } }
  const [draftEdits, setDraftEdits] = useState({});
  // Multi-item quick text entry
  const [bulkText, setBulkText] = useState('');
  // Multi-row manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRows, setNewRows] = useState([EMPTY_ROW()]);

  useEffect(() => {
    if (isOpen) {
      setDraftEdits({});
    }
  }, [isOpen]);

  const parsedBulkPreview = useMemo(() => {
    if (!bulkText.trim()) return [];
    return extractRateCardUpdatesFromText(bulkText, rateCard);
  }, [bulkText, rateCard]);

  if (!isOpen) return null;

  const pendingEditCount = Object.keys(draftEdits).length;

  const handleFieldEdit = (item, field, value) => {
    setDraftEdits(prev => {
      const current = prev[item.id] || { unitPrice: item.unitPrice, unit: item.unit };
      const updated = { ...current, [field]: value };
      if (Number(updated.unitPrice) === Number(item.unitPrice) && updated.unit === item.unit) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return { ...prev, [item.id]: updated };
    });
  };

  const handleSaveAllEdits = () => {
    if (pendingEditCount === 0) return;
    const updated = rateCard.map(rc => {
      const edit = draftEdits[rc.id];
      if (!edit) return rc;
      const numPrice = parseFloat(edit.unitPrice);
      return {
        ...rc,
        unitPrice: !isNaN(numPrice) && numPrice > 0 ? numPrice : rc.unitPrice,
        unit: edit.unit || rc.unit
      };
    });
    onUpdateRateCard(updated);
    setDraftEdits({});
  };

  const handleApplyBulkText = () => {
    if (parsedBulkPreview.length === 0) return;
    let nextRateCard = [...rateCard];

    for (const upd of parsedBulkPreview) {
      const idx = nextRateCard.findIndex(rc =>
        rc.id === upd.id ||
        rc.name.toLowerCase() === upd.name.toLowerCase() ||
        (rc.hindiName && rc.hindiName === upd.hindiName)
      );

      if (idx >= 0) {
        nextRateCard[idx] = {
          ...nextRateCard[idx],
          unitPrice: upd.newPrice,
          unit: upd.unit || nextRateCard[idx].unit
        };
      } else {
        nextRateCard.push({
          id: upd.id,
          name: upd.name,
          displayName: upd.name,
          hindiName: upd.hindiName || upd.name,
          aliases: Array.from(new Set([upd.name.toLowerCase(), upd.hindiName].filter(Boolean))),
          unit: upd.unit || 'kg',
          unitPrice: upd.newPrice,
          category: 'General'
        });
      }
    }

    onUpdateRateCard(nextRateCard);
    setBulkText('');
  };

  const handleSaveNewRows = (e) => {
    e.preventDefault();
    const validRows = newRows.filter(r => r.name.trim() && parseFloat(r.unitPrice) > 0);
    if (validRows.length === 0) return;

    const addedItems = validRows.map((r, i) => ({
      id: `ITEM_${Date.now()}_${i}`,
      name: r.name.trim(),
      displayName: r.name.trim(),
      hindiName: r.hindiName.trim() || r.name.trim(),
      aliases: Array.from(new Set([r.name.trim().toLowerCase(), r.hindiName.trim()].filter(Boolean))),
      unit: r.unit || 'kg',
      unitPrice: parseFloat(r.unitPrice),
      category: 'General'
    }));

    onUpdateRateCard([...rateCard, ...addedItems]);
    setNewRows([EMPTY_ROW()]);
    setShowAddForm(false);
  };

  const handleDeleteItem = (id) => {
    onUpdateRateCard(rateCard.filter(rc => rc.id !== id));
  };

  const handleResetToDefault = () => {
    if (window.confirm('क्या आप दर सूची को मूल डिफ़ॉल्ट पर रीसेट करना चाहते हैं?')) {
      onUpdateRateCard(INITIAL_RATE_CARD);
      setDraftEdits({});
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
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
                एक साथ कई सामान जोड़ें या सीधे कीमत बदलें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Item Quick Bulk Add / Update Bar */}
        <div className="p-4 bg-amber-50/60 border-b border-amber-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>एक साथ कई सामान जोड़ें / रेट बदलें (Quick Bulk Add & Update):</span>
            </span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              कॉमा या नई लाइन से लिखें
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="उदाहरण: Mooli 40 kilo, Cheeni 60 kilo, Aloo 45 pao, Gur 55 kilo"
              className="flex-1 p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500 text-xs font-medium resize-none"
            />
            <button
              type="button"
              onClick={handleApplyBulkText}
              disabled={parsedBulkPreview.length === 0}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
            >
              एक साथ लागू करें ({parsedBulkPreview.length})
            </button>
          </div>

          {parsedBulkPreview.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {parsedBulkPreview.map((item, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
                    item.isNew
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-orange-200 text-orange-900'
                  }`}
                >
                  {item.isNew ? '+ नया: ' : 'अपडेट: '}
                  {item.hindiName || item.name} ₹{item.newPrice}/{item.unitLabel}
                  {!item.isNew && item.oldPrice !== null && (
                    <span className="text-stone-400 font-normal ml-1">(पहले ₹{item.oldPrice})</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-stone-100/60 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-stone-600">
            कुल {rateCard.length} सामान पंजीकृत
          </span>
          <div className="flex items-center gap-2">
            {pendingEditCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAllEdits}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>सभी बदलाव सेव करें ({pendingEditCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>नई पंक्तियों से जोड़ें</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-2.5 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="डिफ़ॉल्ट रेट कार्ड रीसेट करें"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          </div>
        </div>

        {/* Multi-Row Add New Items Form */}
        {showAddForm && (
          <form onSubmit={handleSaveNewRows} className="p-4 bg-stone-50 border-b border-stone-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900">एक साथ कई नए सामान जोड़ें (Multi-Row Add)</h4>
              <button
                type="button"
                onClick={() => setNewRows([...newRows, EMPTY_ROW()])}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ एक और पंक्ति</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {newRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="English Name (e.g. Gur)"
                    value={row.name}
                    onChange={(e) => {
                      const next = [...newRows];
                      next[idx].name = e.target.value;
                      setNewRows(next);
                    }}
                    className="col-span-4 p-2 rounded-lg border border-stone-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="हिंदी नाम (गुड़)"
                    value={row.hindiName}
                    onChange={(e) => {
                      const next = [...newRows];
                      next[idx].hindiName = e.target.value;
                      setNewRows(next);
                    }}
                    className="col-span-3 p-2 rounded-lg border border-stone-300 bg-white"
                  />
                  <select
                    value={row.unit}
                    onChange={(e) => {
                      const next = [...newRows];
                      next[idx].unit = e.target.value;
                      setNewRows(next);
                    }}
                    className="col-span-2 p-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="pkt">pkt</option>
                    <option value="ltr">ltr</option>
                    <option value="pao">pao</option>
                    <option value="pc">pc</option>
                  </select>
                  <input
                    type="number"
                    required
                    placeholder="₹ दर"
                    value={row.unitPrice}
                    onChange={(e) => {
                      const next = [...newRows];
                      next[idx].unitPrice = e.target.value;
                      setNewRows(next);
                    }}
                    className="col-span-2 p-2 rounded-lg border border-stone-300 bg-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setNewRows(newRows.length > 1 ? newRows.filter((_, i) => i !== idx) : [EMPTY_ROW()])}
                    className="col-span-1 p-1.5 text-stone-400 hover:text-red-600 flex justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-200 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer"
              >
                सभी सेव करें ({newRows.filter(r => r.name.trim() && r.unitPrice).length})
              </button>
            </div>
          </form>
        )}

        {/* Inline Editable Items Table */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">सामान (Item)</th>
                  <th className="p-3">इकाई (Unit)</th>
                  <th className="p-3">दर (Price ₹)</th>
                  <th className="p-3">वॉयस उपनाम (Aliases)</th>
                  <th className="p-3 text-right">हटाएं</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rateCard.map((item) => {
                  const edit = draftEdits[item.id];
                  const activePrice = edit ? edit.unitPrice : item.unitPrice;
                  const activeUnit = edit ? edit.unit : item.unit;

                  return (
                    <tr key={item.id} className={`transition-colors ${edit ? 'bg-amber-50/70' : 'hover:bg-stone-50'}`}>
                      <td className="p-3">
                        <span className="font-bold text-stone-900 block">{item.displayName || item.name}</span>
                        <span className="text-[11px] text-stone-500 font-devanagari">{item.hindiName}</span>
                      </td>
                      <td className="p-3">
                        <select
                          value={activeUnit}
                          onChange={(e) => handleFieldEdit(item, 'unit', e.target.value)}
                          className="p-1 rounded-lg border border-stone-200 bg-white text-stone-700 font-mono text-xs cursor-pointer"
                        >
                          <option value="kg">1 kg</option>
                          <option value="pkt">1 pkt</option>
                          <option value="ltr">1 ltr</option>
                          <option value="pao">1 pao</option>
                          <option value="pc">1 pc</option>
                        </select>
                      </td>
                      <td className="p-3 font-bold text-stone-900">
                        <div className="flex items-center gap-1">
                          <span className="text-stone-400">₹</span>
                          <input
                            type="number"
                            value={activePrice}
                            onChange={(e) => handleFieldEdit(item, 'unitPrice', e.target.value)}
                            className={`w-20 p-1.5 rounded-lg border font-bold text-sm focus:outline-none focus:border-orange-500 ${
                              edit ? 'border-orange-400 bg-white text-orange-700' : 'border-stone-200 bg-stone-50 text-stone-900'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="p-3 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {(item.aliases || []).slice(0, 4).map((alias, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 text-[10px]"
                            >
                              {alias}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="सामान हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            {pendingEditCount > 0
              ? `⚠️ ${pendingEditCount} सामान में बदलाव बिना सेव हैं`
              : 'कीमतें सीधे लिखकर बदलें या ऊपर एक साथ टाइप करें'}
          </span>
          <div className="flex items-center gap-2">
            {pendingEditCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAllEdits}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                सभी बदलाव सेव करें ({pendingEditCount})
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold cursor-pointer"
            >
              बंद करें (Done)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
