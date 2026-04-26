import { BUDGETS, getSavedBudget, saveBudget, type Budget } from '../services/aiService';

interface Props {
  value: Budget;
  onChange: (budget: Budget) => void;
}

const COLORS: Record<string, string> = {
  Rikemansbarn:   'border-amber-400 bg-amber-50 text-amber-800',
  'Har jobb':     'border-blue-400 bg-blue-50 text-blue-800',
  Arbetslös:      'border-slate-400 bg-slate-50 text-slate-700',
  'Fattig student': 'border-rose-400 bg-rose-50 text-rose-800',
};

const ACTIVE_COLORS: Record<string, string> = {
  Rikemansbarn:   'bg-amber-400 text-white border-amber-400',
  'Har jobb':     'bg-blue-500 text-white border-blue-500',
  Arbetslös:      'bg-slate-500 text-white border-slate-500',
  'Fattig student': 'bg-rose-500 text-white border-rose-500',
};

export function useBudget() {
  return getSavedBudget();
}

export default function BudgetSelector({ value, onChange }: Props) {
  const handleSelect = (budget: Budget) => {
    saveBudget(budget);
    onChange(budget);
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-600 block mb-2">
        Din ekonomiska situation
      </label>
      <div className="grid grid-cols-2 gap-2">
        {BUDGETS.map((budget) => {
          const isActive = value.label === budget.label;
          return (
            <button
              key={budget.label}
              onClick={() => handleSelect(budget)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                isActive ? ACTIVE_COLORS[budget.label] : `${COLORS[budget.label]} hover:opacity-80`
              }`}
            >
              <div className="font-semibold text-sm">
                {budget.emoji} {budget.label}
              </div>
              <div className={`text-xs mt-0.5 ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                ~{budget.dailyKr} kr/dag
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
