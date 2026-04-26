import { toDateString, getDayPlan } from '../services/mealPlanService';
import { calcNutrition } from '../services/mealPlanService';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DAY_SHORT = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function getWeekDays(anchorDate: string): string[] {
  const base = new Date(anchorDate);
  const dow = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateString(d);
  });
}

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
}

export default function WeekNav({ selectedDate, onDateChange }: Props) {
  const today = toDateString(new Date());
  const days = getWeekDays(selectedDate);
  const weekNum = getWeekNumber(days[0]);

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onDateChange(toDateString(d));
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onDateChange(toDateString(d));
  };

  const goToday = () => onDateChange(today);
  const isCurrentWeek = days.includes(today);

  const month = new Date(days[3]).getMonth();
  const year = new Date(days[3]).getFullYear();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Veckorubrik */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-green-50/30 border-b border-slate-100">
        <button
          onClick={goBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-700 transition-all text-lg font-light"
        >
          ‹
        </button>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              {MONTH_SHORT[month]} {year}
            </div>
            <div className="text-sm font-bold text-slate-700">Vecka {weekNum}</div>
          </div>
          {!isCurrentWeek && (
            <button
              onClick={goToday}
              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-full font-medium transition-all"
            >
              Idag
            </button>
          )}
        </div>

        <button
          onClick={goForward}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-700 transition-all text-lg font-light"
        >
          ›
        </button>
      </div>

      {/* Dagknappar */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {days.map((date) => {
          const d = new Date(date);
          const isSelected = date === selectedDate;
          const isToday = date === today;
          const plan = getDayPlan(date);
          const kcal = Math.round(calcNutrition(plan.entries).calories);
          const hasEntries = plan.entries.length > 0;

          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`relative flex flex-col items-center py-2.5 px-1 rounded-xl transition-all ${
                isSelected
                  ? 'bg-green-500 text-white shadow-md scale-105'
                  : isToday
                  ? 'bg-green-50 border-2 border-green-300 text-green-800'
                  : 'hover:bg-slate-50 text-slate-600 border-2 border-transparent'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                isSelected ? 'text-green-100' : isToday ? 'text-green-600' : 'text-slate-400'
              }`}>
                {DAY_SHORT[d.getDay()]}
              </span>
              <span className={`text-lg font-bold leading-tight ${
                isSelected ? 'text-white' : isToday ? 'text-green-700' : 'text-slate-800'
              }`}>
                {d.getDate()}
              </span>
              {hasEntries ? (
                <span className={`text-[9px] font-medium mt-0.5 ${
                  isSelected ? 'text-green-100' : 'text-slate-400'
                }`}>
                  {kcal} kcal
                </span>
              ) : (
                <span className="text-[9px] mt-0.5 opacity-0">—</span>
              )}
              {hasEntries && !isSelected && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
