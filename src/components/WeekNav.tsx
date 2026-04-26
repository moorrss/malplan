import { toDateString } from '../services/mealPlanService';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DAY_NAMES = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

export default function WeekNav({ selectedDate, onDateChange }: Props) {
  const today = toDateString(new Date());

  // Bygg veckan kring idag
  const days: string[] = [];
  const base = new Date();
  // Börja från måndag
  const dow = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((dow + 6) % 7));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(toDateString(d));
  }

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

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={goBack} className="text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all">‹</button>
        <span className="text-sm font-medium text-slate-500">
          {new Date(days[0]).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={goForward} className="text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const isSelected = date === selectedDate;
          const isToday = date === today;
          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all text-xs font-medium ${
                isSelected
                  ? 'bg-green-500 text-white shadow-sm'
                  : isToday
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'hover:bg-slate-50 text-slate-500'
              }`}
            >
              <span>{fmt(date).split(' ')[0]}</span>
              <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                {fmt(date).split(' ')[1]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
