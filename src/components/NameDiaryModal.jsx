import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Search,
  Trash2,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import {
  formatAksharaChips,
  getExactConsonantSkeleton,
  compareAlphabetSimilarity
} from '../utils/alphabetDifferentiator.js';

export default function NameDiaryModal({
  isOpen,
  onClose,
  nameDiary = [],
  customers = [],
  onUpdateNameDiary,
  strictAlphabet = true,
  language = 'hi'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newEnglish, setNewEnglish] = useState('');
  const [newHindi, setNewHindi] = useState('');
  const [newAliases, setNewAliases] = useState('');

  // Interactive Alphabet-by-Alphabet Comparator (e.g. Vaishali vs Vaisari)
  const [compareWordA, setCompareWordA] = useState('वैशाली');
  const [compareWordB, setCompareWordB] = useState('वैसारी');

  const compareResult = useMemo(
    () => compareAlphabetSimilarity(compareWordA, compareWordB),
    [compareWordA, compareWordB]
  );

  const chipsA = useMemo(() => formatAksharaChips(compareWordA), [compareWordA]);
  const chipsB = useMemo(() => formatAksharaChips(compareWordB), [compareWordB]);

  if (!isOpen) return null;

  const isHindi = language === 'hi';

  const handleAddEntry = (e) => {
    e.preventDefault();
    const eng = newEnglish.trim();
    const hin = newHindi.trim() || eng;
    if (!eng && !hin) return;

    const finalEng = eng || hin;
    const aliasesList = newAliases
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newEntry = {
      id: `DICT_${Date.now()}`,
      name: finalEng,
      hindiName: hin,
      aliases: aliasesList,
      isCustom: true,
      category: 'Shop Diary'
    };

    onUpdateNameDiary([newEntry, ...nameDiary]);
    setNewEnglish('');
    setNewHindi('');
    setNewAliases('');
  };

  const handleQuickAddVariant = (eng, hin) => {
    const exists = nameDiary.some(
      d => d.name.toLowerCase() === eng.toLowerCase() || d.hindiName === hin
    );
    if (exists) return;
    const entry = {
      id: `DICT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: eng,
      hindiName: hin,
      aliases: [],
      isCustom: true,
      category: 'Distinct Variant'
    };
    onUpdateNameDiary([entry, ...nameDiary]);
  };

  const handleDeleteEntry = (id) => {
    onUpdateNameDiary(nameDiary.filter(d => d.id !== id));
  };

  // Merge active customer accounts + name diary for display (marking customer-linked ones)
  const customerNameSet = new Set(
    customers.map(c => (c.name || '').toLowerCase().trim()).filter(Boolean)
  );

  const filteredDiary = nameDiary.filter(d => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (d.name || '').toLowerCase().includes(q) ||
      (d.hindiName || '').includes(searchTerm.trim()) ||
      (d.aliases || []).some(a => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>{isHindi ? 'नाम डायरी व अक्षर शब्दकोश' : 'Customer Name Diary & Dictionary'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  strictAlphabet
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {strictAlphabet ? 'Exact Alphabet ON' : 'Accent Tolerant'}
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                {isHindi
                  ? 'वैशाली, वैसाली, वैशारी जैसे हर अक्षर को अलग पहचानने व सही शब्द लिखने के लिए डायरी'
                  : 'Offline dictionary & exact akshara differentiator (keeps every consonant letter distinct)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5 text-xs">
          {/* Live Alphabet-by-Alphabet Differentiator Tool */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-orange-600" />
                <span>अक्षर-दर-अक्षर जाँच (Live Alphabet Differentiator):</span>
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                Zero-Key Local Engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <input
                  type="text"
                  value={compareWordA}
                  onChange={(e) => setCompareWordA(e.target.value)}
                  placeholder="शब्द 1 (e.g. वैशाली / Vaishali)"
                  className="w-full text-sm font-bold text-stone-900 border-b border-stone-200 pb-1 focus:outline-none focus:border-orange-500"
                />
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {chipsA.map((ch, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-900 font-bold text-xs">
                      {ch}
                    </span>
                  ))}
                  <span className="ml-auto text-[10px] font-mono text-stone-400">
                    [{getExactConsonantSkeleton(compareWordA)}]
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <input
                  type="text"
                  value={compareWordB}
                  onChange={(e) => setCompareWordB(e.target.value)}
                  placeholder="शब्द 2 (e.g. वैसारी / Vaisari)"
                  className="w-full text-sm font-bold text-stone-900 border-b border-stone-200 pb-1 focus:outline-none focus:border-orange-500"
                />
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {chipsB.map((ch, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
                      {ch}
                    </span>
                  ))}
                  <span className="ml-auto text-[10px] font-mono text-stone-400">
                    [{getExactConsonantSkeleton(compareWordB)}]
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison Verdict */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
              compareResult.exactMatch
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : compareResult.sameConsonants
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {compareResult.exactMatch ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>एकदम समान अक्षर (Exact Alphabet Match — 100%)</span>
                  </>
                ) : compareResult.sameConsonants ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>व्यंजन समान, केवल मात्रा अलग है ({Math.round(compareResult.exactAlphabetSimilarity * 100)}%)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      अलग-अलग नाम (Strict Separate):{' '}
                      {compareResult.consonantDiffs.map(d => `${d.token1} ≠ ${d.token2}`).join(', ')}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => { setCompareWordA('वैशाली'); setCompareWordB('Vaishali'); }}
                  className="px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  वैशाली = Vaishali
                </button>
                <button
                  type="button"
                  onClick={() => { setCompareWordA('वैशाली'); setCompareWordB('वैसाली'); }}
                  className="px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  वैशाली vs वैसाली
                </button>
                <button
                  type="button"
                  onClick={() => { setCompareWordA('वैशाली'); setCompareWordB('वैशारी'); }}
                  className="px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  वैशाली vs वैशारी
                </button>
              </div>
            </div>
          </div>

          {/* Add New Word / Customer Name to Diary */}
          <form onSubmit={handleAddEntry} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-stone-900">
                डायरी में नया नाम जोड़ें (Add Exact Word Spelling):
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAddVariant('Vaisali', 'वैसाली')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 cursor-pointer"
                >
                  + वैसाली (Vaisali)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddVariant('Vaishari', 'वैशारी')}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 cursor-pointer"
                >
                  + वैशारी (Vaishari)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="English (e.g. Vaishali)"
                value={newEnglish}
                onChange={(e) => setNewEnglish(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="हिन्दी नाम (जैसे: वैशाली)"
                value={newHindi}
                onChange={(e) => setNewHindi(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="वैकल्पिक उपनाम (optional slips)"
                value={newAliases}
                onChange={(e) => setNewAliases(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {(newEnglish || newHindi) && (
              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <div className="flex items-center gap-1 text-stone-600">
                  <span>अक्षर:</span>
                  {formatAksharaChips(newHindi || newEnglish).map((c, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-amber-200 font-bold text-stone-900">
                      {c}
                    </span>
                  ))}
                  <span className="font-mono text-stone-400 ml-1">
                    [{getExactConsonantSkeleton(newHindi || newEnglish)}]
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>डायरी में जोड़ें</span>
                </button>
              </div>
            )}
          </form>

          {/* Search & Diary Words List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-stone-800">
                सहेजे गए नाम ({filteredDiary.length} शब्द):
              </span>
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="शब्द खोजें..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredDiary.map((entry) => {
                const isActiveCustomer = customerNameSet.has((entry.name || '').toLowerCase().trim());
                const chips = formatAksharaChips(entry.hindiName || entry.name);
                return (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between gap-2 hover:border-orange-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 truncate">
                          {entry.hindiName || entry.name}
                        </span>
                        <span className="text-[11px] text-stone-500 truncate">
                          ({entry.name})
                        </span>
                        {isActiveCustomer && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shrink-0">
                            <Users className="w-2.5 h-2.5" /> Khata
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {chips.map((c, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-semibold">
                            {c}
                          </span>
                        ))}
                        <span className="text-[9px] font-mono text-stone-400 ml-1">
                          {getExactConsonantSkeleton(entry.hindiName || entry.name)}
                        </span>
                      </div>
                    </div>

                    {entry.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Remove from Diary"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            डायरी के सभी शब्द ऑफलाइन व ऑनलाइन दोनों मोड में Whisper और अक्षर पहचान को सटीक बनाते हैं।
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer"
          >
            बंद करें (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
