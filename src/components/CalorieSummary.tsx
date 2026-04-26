import type { MealEntry, MealType, NutritionSummary } from '../types';
import { calcByMeal, calcNutrition } from '../services/mealPlanService';

const MEAL_LABELS: Record<MealType, string> = {
  frukost: '🌅 Frukost',
  lunch:   '☀️ Lunch',
  middag:  '🌙 Middag',
  snack:   '🍎 Snack',
};

const MEAL_COLORS: Record<MealType, string> = {
  frukost: 'bg-amber-50 border-amber-200',
  lunch:   'bg-sky-50 border-sky-200',
  middag:  'bg-indigo-50 border-indigo-200',
  snack:   'bg-emerald-50 border-emerald-200',
};

interface Props {
  entries: MealEntry[];
  dailyGoal: number;
}

function NutritionBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-0.5">
        <span>{label}</span>
        <span>{Math.round(value)} / {max} kcal</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MiniNutrition({ n }: { n: NutritionSummary }) {
  return (
    <div className="flex gap-3 text-xs text-slate-500 mt-1">
      <span>P: {Math.round(n.protein)}g</span>
      <span>K: {Math.round(n.carbs)}g</span>
      <span>F: {Math.round(n.fat)}g</span>
    </div>
  );
}

export default function CalorieSummary({ entries, dailyGoal }: Props) {
  const total = calcNutrition(entries);
  const byMeal = calcByMeal(entries);
  const remaining = dailyGoal - total.calories;
  const pct = Math.min((total.calories / dailyGoal) * 100, 100);

  const barColor =
    pct < 75 ? 'bg-emerald-500' :
    pct < 95 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
      <h2 className="text-lg font-semibold text-slate-800">Kalorier idag</h2>

      {/* Totalt */}
      <div className="text-center py-3">
        <div className="text-4xl font-bold text-slate-800">{Math.round(total.calories)}</div>
        <div className="text-sm text-slate-400">av {dailyGoal} kcal</div>
        <div className="mt-3">
          <NutritionBar label="" value={total.calories} max={dailyGoal} color={barColor} />
        </div>
        <div className={`mt-2 text-sm font-medium ${remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {remaining >= 0
            ? `${Math.round(remaining)} kcal kvar`
            : `${Math.round(Math.abs(remaining))} kcal över`}
        </div>
      </div>

      {/* Makronutrienter */}
      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        {[
          { label: 'Protein', value: total.protein, unit: 'g', color: 'text-blue-600' },
          { label: 'Kolhydr.', value: total.carbs, unit: 'g', color: 'text-amber-600' },
          { label: 'Fett', value: total.fat, unit: 'g', color: 'text-rose-600' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="text-center bg-slate-50 rounded-xl p-3">
            <div className={`text-xl font-bold ${color}`}>{Math.round(value)}{unit}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Per måltid */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Per måltid</h3>
        {(Object.entries(byMeal) as [MealType, NutritionSummary][]).map(([type, n]) => (
          <div key={type} className={`rounded-xl border p-3 ${MEAL_COLORS[type]}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">{MEAL_LABELS[type]}</span>
              <span className="text-sm font-bold text-slate-800">{Math.round(n.calories)} kcal</span>
            </div>
            {n.calories > 0 && <MiniNutrition n={n} />}
          </div>
        ))}
      </div>
    </div>
  );
}
