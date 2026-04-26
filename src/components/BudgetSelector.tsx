import { useState } from 'react';
import { BUDGET_PRESETS, getSavedBudget, saveBudget, type Budget } from '../services/aiService';

interface Props {
  value: Budget;
  onChange: (budget: Budget) => void;
}

const COLORS: Record<string, { inactive: string; active: string; slider: string }> = {
  Rikemansbarn:     { inactive: 'border-amber-300 bg-amber-50 text-amber-800',   active: 'bg-amber-400 text-white border-amber-400',   slider: 'accent-amber-400' },
  'Har jobb':       { inactive: 'border-blue-300 bg-blue-50 text-blue-800',      active: 'bg-blue-500 text-white border-blue-500',      slider: 'accent-blue-500' },
  'Arbetslös':      { inactive: 'border-slate-300 bg-slate-50 text-slate-700',   active: 'bg-slate-500 text-white border-slate-500',    slider: 'accent-slate-500' },
  'Fattig student': { inactive: 'border-rose-300 bg-rose-50 text-rose-800',      active: 'bg-rose-500 text-white border-rose-500',      slider: 'accent-rose-500' },
};

export function useBudget() {
  return getSavedBudget();
}

export default function BudgetSelector({ value, onChange }: Props) {
  const [weeklyAmounts, setWeeklyAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(BUDGET_PRESETS.map((p) => [p.label, p.weeklyDefault])),
  );

  const handleSelect = (preset: typeof BUDGET_PRESETS[0]) => {
    const budget: Budget = { ...preset, weeklyKr: weeklyAmounts[preset.label] };
    saveBudget(budget);
    onChange(budget);
  };

  const handleSlider = (label: string, weekly: number) => {
    setWeeklyAmounts((prev) => ({ ...prev, [label]: weekly }));
    if (value.label === label) {
      const preset = BUDGET_PRESETS.find((p) => p.label === label)!;
      const budget: Budget = { ...preset, weeklyKr: weekly };
      saveBudget(budget);
      onChange(budget);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-600 block mb-2">
        Din ekonomiska situation
      </label>
      <div className="grid grid-cols-2 gap-2">
        {BUDGET_PRESETS.map((preset) => {
          const isActive = value.label === preset.label;
          const colors = COLORS[preset.label];
          const weekly = weeklyAmounts[preset.label];
          const daily = Math.round(weekly / 7);

          return (
            <div
              key={preset.label}
              className={`rounded-xl border-2 transition-all overflow-hidden ${
                isActive ? colors.active : colors.inactive
              }`}
            >
              <button
                onClick={() => handleSelect(preset)}
                className="w-full text-left p-3"
              >
                <div className="font-bold text-sm">{preset.emoji} {preset.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? 'opacity-90' : 'opacity-60'}`}>
                  {weekly} kr/vecka · ~{daily} kr/dag
                </div>
              </button>

              {isActive && (
                <div className="px-3 pb-3 space-y-1">
                  <input
                    type="range"
                    min={preset.weeklyMin}
                    max={preset.weeklyMax}
                    step={10}
                    value={weekly}
                    onChange={(e) => handleSlider(preset.label, Number(e.target.value))}
                    className={`w-full h-1.5 rounded-full ${colors.slider}`}
                  />
                  <div className="flex justify-between text-[10px] opacity-70">
                    <span>{preset.weeklyMin} kr</span>
                    <span>{preset.weeklyMax} kr</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
