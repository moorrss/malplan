import { useState, useCallback } from 'react';
import type { FoodItem, MealType } from '../types';
import { searchFood, COMMON_FOODS } from '../services/foodService';

interface Props {
  onAdd: (food: FoodItem, grams: number, mealType: MealType) => void;
  onClose: () => void;
  defaultMeal?: MealType;
}

const MEAL_OPTIONS: { value: MealType; label: string; emoji: string; gradient: string }[] = [
  { value: 'frukost', label: 'Frukost', emoji: '🌅', gradient: 'from-amber-500 to-orange-500' },
  { value: 'lunch',   label: 'Lunch',   emoji: '☀️', gradient: 'from-sky-500 to-blue-500' },
  { value: 'middag',  label: 'Middag',  emoji: '🌙', gradient: 'from-indigo-500 to-violet-500' },
  { value: 'snack',   label: 'Snack',   emoji: '🍎', gradient: 'from-emerald-500 to-teal-500' },
];

export default function AddFoodModal({ onAdd, onClose, defaultMeal = 'lunch' }: Props) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams,    setGrams]    = useState(100);
  const [mealType, setMealType] = useState<MealType>(defaultMeal);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState<'common' | 'search'>('common');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(await searchFood(query));
    setLoading(false);
  }, [query]);

  const handleSelect = (food: FoodItem) => { setSelected(food); setGrams(food.servingSize); };
  const handleAdd    = () => { if (!selected) return; onAdd(selected, grams, mealType); onClose(); };
  const calcKcal     = (f: FoodItem, g: number) => Math.round((f.calories * g) / 100);
  const displayList  = tab === 'search' ? results : COMMON_FOODS;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex justify-between items-center rounded-t-3xl">
          <div>
            <h2 className="text-white font-extrabold text-lg">Lägg till mat</h2>
            <p className="text-slate-400 text-xs mt-0.5">Sök eller välj från listan</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-700 transition-all">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Måltid */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Måltid</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMealType(opt.value)}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-95 ${
                    mealType === opt.value
                      ? `bg-gradient-to-br ${opt.gradient} text-white shadow-md`
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <div>{opt.emoji}</div>
                  <div className="mt-0.5">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Flikar */}
          <div className="flex bg-slate-100 rounded-2xl p-1">
            {(['common', 'search'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'common' ? '⭐ Vanliga' : '🔍 Sök'}
              </button>
            ))}
          </div>

          {/* Sökfält */}
          {tab === 'search' && (
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Sök livsmedel..."
                className="flex-1 border-2 border-slate-100 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-4 font-bold text-sm disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? '…' : 'Sök'}
              </button>
            </div>
          )}

          {/* Lista */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {tab === 'search' && displayList.length === 0 && (
              <p className="text-sm text-slate-300 text-center py-6">Sök efter ett livsmedel ovan</p>
            )}
            {displayList.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelect(food)}
                className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all duration-150 ${
                  selected?.id === food.id
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700 truncate pr-2">{food.name}</span>
                  <span className="text-xs font-bold text-slate-400 shrink-0">{food.calories} kcal/100g</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  P:{food.protein}g · K:{food.carbs}g · F:{food.fat}g
                </p>
              </button>
            ))}
          </div>

          {/* Portionsstorlek */}
          {selected && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mängd</label>
                <span className="text-lg font-extrabold text-emerald-600">{calcKcal(selected, grams)} kcal</span>
              </div>
              <input
                type="range"
                min={10} max={1000} step={5}
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
                style={{ accentColor: '#10b981' }}
                className="w-full"
              />
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2.5">
                  <input
                    type="number"
                    min={1}
                    value={grams}
                    onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))}
                    className="w-16 bg-transparent font-extrabold text-slate-800 text-sm focus:outline-none"
                  />
                  <span className="text-sm text-slate-400 font-medium">gram</span>
                </div>
                <p className="text-xs text-slate-400 flex-1">
                  Rekommenderat: {selected.servingSize}{selected.servingUnit}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100">
          <button
            onClick={handleAdd}
            disabled={!selected}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-2xl py-4 font-extrabold shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {selected ? `Lägg till ${selected.name}` : 'Välj ett livsmedel'}
          </button>
        </div>
      </div>
    </div>
  );
}
