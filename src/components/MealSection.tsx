import type { MealEntry, MealType } from '../types';
import { calcNutrition } from '../services/mealPlanService';

interface Props {
  type: MealType;
  label: string;
  emoji: string;
  entries: MealEntry[];
  onAdd: (type: MealType) => void;
  onRemove: (id: string) => void;
}

export default function MealSection({ type, label, emoji, entries, onAdd, onRemove }: Props) {
  const n = calcNutrition(entries);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="font-semibold text-slate-700">{label}</h3>
          {n.calories > 0 && (
            <span className="text-xs bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
              {Math.round(n.calories)} kcal
            </span>
          )}
        </div>
        <button
          onClick={() => onAdd(type)}
          className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-all"
        >
          <span className="text-lg leading-none">+</span> Lägg till
        </button>
      </div>

      {/* Rader */}
      <div className="divide-y divide-slate-50">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-300 text-center py-6">Ingen mat tillagd</p>
        ) : (
          entries.map((entry) => {
            const kcal = Math.round((entry.foodItem.calories * entry.grams) / 100);
            const protein = Math.round((entry.foodItem.protein * entry.grams) / 100);
            const carbs = Math.round((entry.foodItem.carbs * entry.grams) / 100);
            const fat = Math.round((entry.foodItem.fat * entry.grams) / 100);
            return (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3 group hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium text-slate-700">{entry.foodItem.name}</div>
                  <div className="text-xs text-slate-400">
                    {entry.grams}g · P:{protein}g · K:{carbs}g · F:{fat}g
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">{kcal} kcal</span>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
                    title="Ta bort"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
