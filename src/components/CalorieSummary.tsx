import type { MealEntry, MealType, NutritionSummary } from '../types';
import { calcByMeal, calcNutrition } from '../services/mealPlanService';

const MEAL_META: Record<MealType, { label: string; emoji: string; color: string; bg: string }> = {
  frukost: { label: 'Frukost', emoji: '🌅', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
  lunch:   { label: 'Lunch',   emoji: '☀️', color: 'text-sky-600',    bg: 'bg-sky-50 border-sky-100' },
  middag:  { label: 'Middag',  emoji: '🌙', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  snack:   { label: 'Snack',   emoji: '🍎', color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100' },
};

interface Props {
  entries: MealEntry[];
  dailyGoal: number;
}

function CircleProgress({ value, max, size = 140 }: { value: number; max: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const over = value > max;
  const dash = circ * pct;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0fdf4" strokeWidth={12} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={over ? '#f43f5e' : pct > 0.85 ? '#f59e0b' : '#10b981'}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
}

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex-1 text-center py-3 rounded-2xl ${color}`}>
      <div className="text-lg font-extrabold">{Math.round(value)}<span className="text-xs font-semibold ml-0.5">g</span></div>
      <div className="text-xs font-medium opacity-70 mt-0.5">{label}</div>
    </div>
  );
}

export default function CalorieSummary({ entries, dailyGoal }: Props) {
  const total = calcNutrition(entries);
  const byMeal = calcByMeal(entries);
  const remaining = dailyGoal - total.calories;

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
      {/* Toppsektionen */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex flex-col items-center">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Kalorier idag</p>

        {/* Cirkel */}
        <div className="relative">
          <CircleProgress value={total.calories} max={dailyGoal} size={148} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-white leading-none">
              {Math.round(total.calories)}
            </span>
            <span className="text-slate-400 text-xs mt-1">av {dailyGoal} kcal</span>
          </div>
        </div>

        {/* Status */}
        <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold ${
          remaining >= 0
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/20 text-rose-300'
        }`}>
          {remaining >= 0
            ? `${Math.round(remaining)} kcal kvar`
            : `${Math.round(Math.abs(remaining))} kcal över`}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Makros */}
        <div className="flex gap-2">
          <MacroPill label="Protein"  value={total.protein} color="bg-blue-50 text-blue-700" />
          <MacroPill label="Kolhydr." value={total.carbs}   color="bg-amber-50 text-amber-700" />
          <MacroPill label="Fett"     value={total.fat}     color="bg-rose-50 text-rose-700" />
        </div>

        {/* Per måltid */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Per måltid</p>
            {(Object.entries(byMeal) as [MealType, NutritionSummary][])
              .filter(([, n]) => n.calories > 0)
              .map(([type, n]) => {
                const meta = MEAL_META[type];
                const barPct = Math.min((n.calories / dailyGoal) * 100, 100);
                return (
                  <div key={type} className={`rounded-2xl border p-3 ${meta.bg}`}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-sm font-bold ${meta.color}`}>
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="text-sm font-extrabold text-slate-700">
                        {Math.round(n.calories)} kcal
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-current transition-all duration-500"
                        style={{ width: `${barPct}%`, color: 'currentColor' }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">🍽️</p>
            <p className="text-sm text-slate-400 font-medium">Lägg till mat för att se statistik</p>
          </div>
        )}
      </div>
    </div>
  );
}
