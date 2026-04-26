import { toDateString, getDayPlan, calcNutrition } from '../services/mealPlanService';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DAY_SHORT = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
const MONTH_SV  = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];

function getWeekDays(anchor: string): string[] {
  const base = new Date(anchor);
  const dow = base.getDay();
  const mon = new Date(base);
  mon.setDate(base.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return toDateString(d);
  });
}

function getWeekNum(iso: string): number {
  const d = new Date(iso);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
}

const DAILY_GOAL = 2000;

export default function WeekNav({ selectedDate, onDateChange }: Props) {
  const today = toDateString(new Date());
  const days  = getWeekDays(selectedDate);
  const week  = getWeekNum(days[0]);
  const isCurrentWeek = days.includes(today);

  const shift = (n: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + n * 7);
    onDateChange(toDateString(d));
  };

  const midDate = new Date(days[3]);

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Toprad */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800">
        <button
          onClick={() => shift(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xl font-thin"
        >
          ‹
        </button>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-white font-extrabold text-sm">Vecka {week}</span>
            <span className="text-slate-400 text-xs ml-2 font-medium">
              {MONTH_SV[midDate.getMonth()]} {midDate.getFullYear()}
            </span>
          </div>
          {!isCurrentWeek && (
            <button
              onClick={() => onDateChange(today)}
              className="text-[11px] font-bold bg-emerald-500 text-white px-3 py-1 rounded-full hover:bg-emerald-400 transition-all"
            >
              Idag
            </button>
          )}
        </div>

        <button
          onClick={() => shift(1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xl font-thin"
        >
          ›
        </button>
      </div>

      {/* Dagknappar */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {days.map((date) => {
          const d         = new Date(date);
          const isSelected = date === selectedDate;
          const isToday    = date === today;
          const plan       = getDayPlan(date);
          const kcal       = Math.round(calcNutrition(plan.entries).calories);
          const hasMeals   = plan.entries.length > 0;
          const fillPct    = Math.min((kcal / DAILY_GOAL) * 100, 100);

          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`relative flex flex-col items-center py-3 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-105'
                  : isToday
                  ? 'bg-emerald-50 border-2 border-emerald-300'
                  : 'hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                isSelected ? 'text-emerald-100' : isToday ? 'text-emerald-500' : 'text-slate-400'
              }`}>
                {DAY_SHORT[d.getDay()]}
              </span>

              <span className={`text-lg font-extrabold leading-tight mt-0.5 ${
                isSelected ? 'text-white' : isToday ? 'text-emerald-700' : 'text-slate-800'
              }`}>
                {d.getDate()}
              </span>

              {hasMeals ? (
                <>
                  <span className={`text-[9px] font-semibold mt-1 ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                  }`}>
                    {kcal} kcal
                  </span>
                  {/* Mini progress bar */}
                  <div className={`mt-1.5 w-6 h-1 rounded-full overflow-hidden ${
                    isSelected ? 'bg-emerald-300/40' : 'bg-slate-200'
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-white' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </>
              ) : (
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-200 opacity-50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
