import { useState, useCallback } from 'react';
import type { FoodItem, MealType } from '../types';
import { searchFood, COMMON_FOODS } from '../services/foodService';

interface Props {
  onAdd: (food: FoodItem, grams: number, mealType: MealType) => void;
  onClose: () => void;
  defaultMeal?: MealType;
}

const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'frukost', label: '🌅 Frukost' },
  { value: 'lunch',   label: '☀️ Lunch' },
  { value: 'middag',  label: '🌙 Middag' },
  { value: 'snack',   label: '🍎 Snack' },
];

export default function AddFoodModal({ onAdd, onClose, defaultMeal = 'lunch' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState(100);
  const [mealType, setMealType] = useState<MealType>(defaultMeal);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'search' | 'common'>('common');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchFood(query);
    setResults(res);
    setLoading(false);
  }, [query]);

  const handleSelect = (food: FoodItem) => {
    setSelected(food);
    setGrams(food.servingSize);
  };

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected, grams, mealType);
    onClose();
  };

  const calcKcal = (food: FoodItem, g: number) =>
    Math.round((food.calories * g) / 100);

  const displayList = tab === 'search' ? results : COMMON_FOODS;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Lägg till mat</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Måltid */}
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-2">Måltid</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMealType(opt.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all ${
                    mealType === opt.value
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-green-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flikar */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setTab('common')}
              className={`flex-1 py-2 text-sm font-medium transition-all ${tab === 'common' ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Vanliga livsmedel
            </button>
            <button
              onClick={() => setTab('search')}
              className={`flex-1 py-2 text-sm font-medium transition-all ${tab === 'search' ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Sök databas
            </button>
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
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-green-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-all"
              >
                {loading ? '...' : 'Sök'}
              </button>
            </div>
          )}

          {/* Lista */}
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {displayList.length === 0 && tab === 'search' && (
              <p className="text-sm text-slate-400 text-center py-4">Sök efter livsmedel ovan</p>
            )}
            {displayList.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelect(food)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selected?.id === food.id
                    ? 'border-green-400 bg-green-50'
                    : 'border-slate-100 hover:border-green-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 truncate pr-2">{food.name}</span>
                  <span className="text-xs text-slate-500 shrink-0">{food.calories} kcal/100g</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  P:{food.protein}g · K:{food.carbs}g · F:{food.fat}g
                </div>
              </button>
            ))}
          </div>

          {/* Portionsstorlek */}
          {selected && (
            <div className="border-t border-slate-100 pt-4">
              <label className="text-sm font-medium text-slate-600 block mb-2">
                Mängd (gram) — <span className="text-green-600 font-bold">{calcKcal(selected, grams)} kcal</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={5}
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                  className="flex-1 accent-green-500"
                />
                <input
                  type="number"
                  min={1}
                  value={grams}
                  onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))}
                  className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <span className="text-sm text-slate-500">g</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100">
          <button
            onClick={handleAdd}
            disabled={!selected}
            className="w-full bg-green-500 text-white rounded-xl py-3 font-medium hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Lägg till
          </button>
        </div>
      </div>
    </div>
  );
}
