import type { MealEntry, MealType } from '../types';
import { calcNutrition } from '../services/mealPlanService';

const MEAL_STYLE: Record<MealType, { gradient: string; accent: string; border: string }> = {
  frukost: { gradient: 'from-amber-500 to-orange-500',   accent: 'text-amber-600 bg-amber-50',  border: 'border-amber-100' },
  lunch:   { gradient: 'from-sky-500 to-blue-500',       accent: 'text-sky-600 bg-sky-50',      border: 'border-sky-100' },
  middag:  { gradient: 'from-indigo-500 to-violet-500',  accent: 'text-indigo-600 bg-indigo-50',border: 'border-indigo-100' },
  snack:   { gradient: 'from-emerald-500 to-teal-500',   accent: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
};

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
  const style = MEAL_STYLE[type];

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-slate-200/60">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-lg shadow-md`}>
            {emoji}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">{label}</h3>
            {n.calories > 0 ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.accent}`}>
                  {Math.round(n.calories)} kcal
                </span>
                <span className="text-xs text-slate-400">
                  P:{Math.round(n.protein)}g · K:{Math.round(n.carbs)}g · F:{Math.round(n.fat)}g
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Ingen mat tillagd</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onAdd(type)}
          className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-md hover:opacity-90 active:scale-95 transition-all duration-150`}
        >
          <span className="text-base leading-none">+</span>
          <span className="hidden sm:inline">Lägg till</span>
        </button>
      </div>

      {/* Separator */}
      {entries.length > 0 && <div className={`h-px mx-5 ${style.border} border-t`} />}

      {/* Rader */}
      {entries.length > 0 && (
        <div className="divide-y divide-slate-50">
          {entries.map((entry) => {
            const kcal    = Math.round((entry.foodItem.calories * entry.grams) / 100);
            const protein = Math.round((entry.foodItem.protein  * entry.grams) / 100);
            const carbs   = Math.round((entry.foodItem.carbs    * entry.grams) / 100);
            const fat     = Math.round((entry.foodItem.fat      * entry.grams) / 100);
            return (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3.5 group hover:bg-slate-50/80 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-semibold text-slate-800 truncate">{entry.foodItem.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.grams}g · P:{protein}g · K:{carbs}g · F:{fat}g
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-extrabold text-slate-700">{kcal} kcal</span>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all duration-150 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
