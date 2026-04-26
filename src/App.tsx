import { useState, useCallback } from 'react';
import type { MealType, FoodItem, MealEntry, Offer } from './types';
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

export default function App() {
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [dayPlan, setDayPlan] = useState(() => getDayPlan(toDateString(new Date())));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMeal, setModalMeal] = useState<MealType>('lunch');
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [loadedOffers, setLoadedOffers] = useState<Offer[]>([]);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);

  const refresh = useCallback((date: string) => {
    setDayPlan(getDayPlan(date));
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    refresh(date);
  };

  const handleAdd = (food: FoodItem, grams: number, mealType: MealType) => {
    const entry: MealEntry = {
      id: generateId(),
      foodItem: food,
      grams,
      mealType,
      date: selectedDate,
    };
    addEntry(entry);
    refresh(selectedDate);
  };

  const handleRemove = (entryId: string) => {
    removeEntry(selectedDate, entryId);
    refresh(selectedDate);
  };

  const openModal = (type: MealType) => {
    setModalMeal(type);
    setModalOpen(true);
  };

  const entriesFor = (type: MealType) =>
    dayPlan.entries.filter((e) => e.mealType === type);

  const dateLabel = new Date(selectedDate).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'plan',   label: 'Måltidsplan', emoji: '📋' },
    { id: 'offers', label: 'Erbjudanden', emoji: '🏷️' },
    { id: 'ai',     label: 'AI-förslag',  emoji: '✨' },
  ];

  const hasKey = getSavedApiKey().length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <h1 className="text-xl font-bold text-slate-800">MålPlan</h1>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {tabs.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === id
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setApiKeyOpen(true)}
              title="Anthropic API-nyckel"
              className={`p-2 rounded-xl border text-sm transition-all ${
                hasKey
                  ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-amber-300 hover:text-amber-500'
              }`}
            >
              🔑
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'plan' && (
          <div className="space-y-4">
            <WeekNav selectedDate={selectedDate} onDateChange={handleDateChange} />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700 capitalize">{dateLabel}</h2>
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
          <OffersPanel onOffersLoaded={setLoadedOffers} />
        )}

        {activeTab === 'ai' && (
          <AISuggestions offers={loadedOffers} onOpenApiKey={() => setApiKeyOpen(true)} />
        )}
      </main>

      {modalOpen && (
        <AddFoodModal
          onAdd={handleAdd}
          onClose={() => setModalOpen(false)}
          defaultMeal={modalMeal}
        />
      )}

      {apiKeyOpen && <ApiKeyModal onClose={() => setApiKeyOpen(false)} />}
    </div>
  );
}
