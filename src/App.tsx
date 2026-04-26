import { useState, useCallback } from 'react';
import type { MealType, FoodItem, Offer } from './types';
import { getDayPlan, addEntry, removeEntry, generateId, toDateString } from './services/mealPlanService';
import CalorieSummary from './components/CalorieSummary';
import MealSection from './components/MealSection';
import AddFoodModal from './components/AddFoodModal';
import OffersPanel from './components/OffersPanel';
import AISuggestions from './components/AISuggestions';
import WeekNav from './components/WeekNav';
import ApiKeyModal from './components/ApiKeyModal';
import { getSavedApiKey } from './services/aiService';

const MEALS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'frukost', label: 'Frukost', emoji: '🌅' },
  { type: 'lunch',   label: 'Lunch',   emoji: '☀️' },
  { type: 'middag',  label: 'Middag',  emoji: '🌙' },
  { type: 'snack',   label: 'Snack',   emoji: '🍎' },
];

const DAILY_GOAL = 2000;
type Tab = 'plan' | 'offers' | 'ai';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'plan',   label: 'Måltidsplan', icon: '📋' },
  { id: 'offers', label: 'Erbjudanden', icon: '🏷️' },
  { id: 'ai',     label: 'AI-förslag',  icon: '✨' },
];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [dayPlan, setDayPlan] = useState(() => getDayPlan(toDateString(new Date())));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMeal, setModalMeal] = useState<MealType>('lunch');
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [loadedOffers, setLoadedOffers] = useState<Offer[]>([]);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);

  const refresh = useCallback((date: string) => setDayPlan(getDayPlan(date)), []);

  const handleDateChange = (date: string) => { setSelectedDate(date); refresh(date); };

  const handleAdd = (food: FoodItem, grams: number, mealType: MealType) => {
    addEntry({ id: generateId(), foodItem: food, grams, mealType, date: selectedDate });
    refresh(selectedDate);
  };

  const handleRemove = (id: string) => { removeEntry(selectedDate, id); refresh(selectedDate); };
  const openModal = (type: MealType) => { setModalMeal(type); setModalOpen(true); };
  const entriesFor = (type: MealType) => dayPlan.entries.filter((e) => e.mealType === type);

  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const hasKey = getSavedApiKey().length > 0;

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900 shadow-2xl shadow-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/30">
              🥗
            </div>
            <div className="leading-none">
              <span className="text-white font-extrabold text-lg tracking-tight">MålPlan</span>
              <span className="ml-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Beta</span>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/60 rounded-2xl p-1">
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* Key btn */}
          <button
            onClick={() => setApiKeyOpen(true)}
            title={hasKey ? 'API-nyckel konfigurerad' : 'Lägg till Groq API-nyckel'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-200 ${
              hasKey
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 animate-pulse-soft'
            }`}
          >
            🔑
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {activeTab === 'plan' && (
          <div className="space-y-6 animate-fade-in">
            <WeekNav selectedDate={selectedDate} onDateChange={handleDateChange} />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 capitalize">{dateLabel}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{dayPlan.entries.length} livsmedel loggade</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {MEALS.map(({ type, label, emoji }) => (
                  <MealSection
                    key={type}
                    type={type}
                    label={label}
                    emoji={emoji}
                    entries={entriesFor(type)}
                    onAdd={openModal}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <CalorieSummary entries={dayPlan.entries} dailyGoal={DAILY_GOAL} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="animate-fade-in">
            <OffersPanel onOffersLoaded={setLoadedOffers} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="animate-fade-in">
            <AISuggestions
              offers={loadedOffers}
              onOpenApiKey={() => setApiKeyOpen(true)}
              selectedDate={selectedDate}
              onPlanUpdated={() => refresh(selectedDate)}
            />
          </div>
        )}
      </main>

      {modalOpen && (
        <AddFoodModal onAdd={handleAdd} onClose={() => setModalOpen(false)} defaultMeal={modalMeal} />
      )}
      {apiKeyOpen && <ApiKeyModal onClose={() => setApiKeyOpen(false)} />}
    </div>
  );
}
