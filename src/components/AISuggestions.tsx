import { useState } from 'react';
import type { Offer, MealType, FoodItem, MealEntry } from '../types';
import {
  streamMealSuggestions,
  getSavedApiKey,
  getSavedBudget,
  parseAIResult,
  type MealSuggestion,
  type ShoppingItem,
  type Budget,
} from '../services/aiService';
import { addEntry, generateId } from '../services/mealPlanService';
import BudgetSelector from './BudgetSelector';

interface Props {
  offers: Offer[];
  onOpenApiKey: () => void;
  selectedDate: string;
  onPlanUpdated: () => void;
}

const MEAL_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: 'frukost', label: 'Frukost', emoji: '🌅' },
  { value: 'lunch',   label: 'Lunch',   emoji: '☀️' },
  { value: 'middag',  label: 'Middag',  emoji: '🌙' },
  { value: 'snack',   label: 'Snack',   emoji: '🍎' },
];

const MEAL_COLORS: Record<MealType, { card: string; badge: string }> = {
  frukost: { card: 'from-amber-50 border-amber-200',   badge: 'bg-amber-100 text-amber-700' },
  lunch:   { card: 'from-sky-50 border-sky-200',       badge: 'bg-sky-100 text-sky-700' },
  middag:  { card: 'from-indigo-50 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  snack:   { card: 'from-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

function SuggestionCard({
  s,
  onSaveToDay,
  savedToDay,
}: {
  s: MealSuggestion;
  onSaveToDay: (s: MealSuggestion) => void;
  savedToDay: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const mealInfo = MEAL_OPTIONS.find((m) => m.value === s.mealType);
  const colors = MEAL_COLORS[s.mealType];

  return (
    <div className={`border-2 rounded-2xl bg-gradient-to-b to-white p-5 space-y-3 ${colors.card}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${colors.badge}`}>
            {mealInfo?.emoji} {mealInfo?.label}
          </span>
          <h3 className="text-base font-bold text-slate-800 leading-snug">{s.dishName}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>
        </div>
        <div className="text-center shrink-0 bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{s.calories}</div>
          <div className="text-xs text-slate-400">kcal</div>
        </div>
      </div>

      {/* Makros */}
      <div className="flex gap-2">
        {[
          { label: 'Protein',  value: s.protein, color: 'bg-blue-50 text-blue-700' },
          { label: 'Kolhydr.', value: s.carbs,   color: 'bg-amber-50 text-amber-700' },
          { label: 'Fett',     value: s.fat,      color: 'bg-rose-50 text-rose-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`flex-1 text-center rounded-xl py-2 ${color}`}>
            <div className="text-sm font-bold">{value}g</div>
            <div className="text-xs opacity-70">{label}</div>
          </div>
        ))}
      </div>

      {/* Erbjudanden */}
      {s.usedOffers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s.usedOffers.map((o) => (
            <span key={o} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              🏷️ {o}
            </span>
          ))}
        </div>
      )}

      {/* Knappar */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 text-xs border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 rounded-xl py-2 transition-all"
        >
          {open ? '▲ Dölj ingredienser' : '▼ Ingredienser & hälsa'}
        </button>
        {s.recipe && (
          <button
            onClick={() => setRecipeOpen(!recipeOpen)}
            className="flex-1 text-xs border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 rounded-xl py-2 transition-all"
          >
            {recipeOpen ? '▲ Dölj recept' : '📖 Recept'}
          </button>
        )}
        <button
          onClick={() => onSaveToDay(s)}
          disabled={savedToDay}
          className={`flex-1 text-xs font-semibold rounded-xl py-2 transition-all ${
            savedToDay
              ? 'bg-green-100 text-green-600 border border-green-200'
              : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
          }`}
        >
          {savedToDay ? '✓ Sparad' : '+ Spara i plan'}
        </button>
      </div>

      {/* Ingredienser & hälsonot */}
      {open && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Ingredienser</p>
            <ul className="space-y-1">
              {s.ingredients.map((ing) => (
                <li key={ing} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5 shrink-0">•</span> {ing}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">Varför hälsosamt</p>
            <p className="text-sm text-green-800">{s.healthNote}</p>
          </div>
        </div>
      )}

      {/* Recept */}
      {recipeOpen && s.recipe && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-2">📖 Tillagning</p>
          <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed bg-white rounded-xl p-3 border border-slate-100">
            {s.recipe}
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingListPanel({ items, total }: { items: ShoppingItem[]; total: number }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          🛒 Handlingslista
        </h3>
        <span className="text-sm font-bold text-green-700 bg-white px-3 py-1 rounded-full border border-green-200 shadow-sm">
          ~{total} kr
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded border-2 border-slate-200 shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-700">{item.item}</span>
                <span className="text-xs text-slate-400 ml-2">{item.amount}</span>
              </div>
            </div>
            {item.estimatedPrice > 0 && (
              <span className="text-sm font-semibold text-slate-600">~{item.estimatedPrice} kr</span>
            )}
          </div>
        ))}
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-600">Totalt uppskattad kostnad</span>
        <span className="text-base font-bold text-green-600">~{total} kr</span>
      </div>
    </div>
  );
}

export default function AISuggestions({ offers, onOpenApiKey, selectedDate, onPlanUpdated }: Props) {
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(['frukost', 'lunch', 'middag', 'snack']);
  const [budget, setBudget] = useState<Budget>(getSavedBudget);
  const [preferences, setPreferences] = useState('');
  const [result, setResult] = useState<{ suggestions: MealSuggestion[]; shoppingList: ShoppingItem[]; totalEstimatedCost: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleMeal = (type: MealType) =>
    setSelectedMeals((prev) =>
      prev.includes(type) ? prev.filter((m) => m !== type) : [...prev, type],
    );

  const selectAll = () => setSelectedMeals(['frukost', 'lunch', 'middag', 'snack']);

  const handleGenerate = async () => {
    const apiKey = getSavedApiKey();
    if (!apiKey) { onOpenApiKey(); return; }
    if (offers.length === 0) { setError('Hämta veckans erbjudanden först (fliken Erbjudanden).'); return; }
    if (selectedMeals.length === 0) { setError('Välj minst en måltidstyp.'); return; }

    setLoading(true);
    setError('');
    setResult(null);
    setStreaming('');
    setSavedIds(new Set());

    try {
      let fullText = '';
      for await (const delta of streamMealSuggestions(apiKey, offers, selectedMeals, budget, preferences)) {
        fullText += delta;
        setStreaming(fullText);
      }
      const parsed = parseAIResult(fullText);
      setResult(parsed);
      setStreaming('');
      if (parsed.suggestions.length === 0) setError('Kunde inte tolka AI-svaret. Försök igen.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Okänt fel';
      if (msg.includes('401') || msg.includes('authentication') || msg.includes('invalid_api_key')) {
        setError('Ogiltig Groq API-nyckel. Hämta en gratis nyckel på console.groq.com/keys (🔑).');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDay = (s: MealSuggestion) => {
    const id = `${s.mealType}-${s.dishName}`;
    const foodItem: FoodItem = {
      id: `ai-${Date.now()}`,
      name: s.dishName,
      calories: s.calories,
      protein: s.protein,
      carbs: s.carbs,
      fat: s.fat,
      servingSize: 1,
      servingUnit: 'portion',
    };
    const entry: MealEntry = {
      id: generateId(),
      foodItem,
      grams: 1,
      mealType: s.mealType,
      date: selectedDate,
    };
    addEntry(entry);
    setSavedIds((prev) => new Set([...prev, id]));
    onPlanUpdated();
  };

  const noOffers = offers.length === 0;
  const noKey = !getSavedApiKey();

  return (
    <div className="space-y-5">
      {/* Konfigurationskort */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            🤖 AI-måltidsplanerare
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Baserat på veckans erbjudanden och din budget genererar AI hälsosamma måltidsförslag.
          </p>
        </div>

        {noKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Du behöver en Groq API-nyckel (gratis).{' '}
            <button onClick={onOpenApiKey} className="font-bold underline hover:no-underline">
              Lägg till →
            </button>
          </div>
        )}

        {noOffers && !noKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Gå till <strong>Erbjudanden</strong> och hämta veckans erbjudanden först.
          </div>
        )}

        {!noOffers && !noKey && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
            ✓ {offers.length} erbjudanden från {[...new Set(offers.map((o) => o.store))].join(', ')}
          </div>
        )}

        {/* Budget */}
        <BudgetSelector value={budget} onChange={setBudget} />

        {/* Välj måltider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-600">Planera för</label>
            <button onClick={selectAll} className="text-xs text-green-600 hover:underline">Välj alla</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_OPTIONS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => toggleMeal(value)}
                className={`py-2.5 rounded-xl border font-medium text-sm transition-all ${
                  selectedMeals.includes(value)
                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-green-300'
                }`}
              >
                {emoji}<span className="hidden sm:inline"> {label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Extra önskemål */}
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-2">
            Extra önskemål <span className="font-normal text-slate-400">(valfritt)</span>
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="t.ex. vegetariskt, glutenfritt, hög protein..."
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-slate-300"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || selectedMeals.length === 0}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl py-3.5 font-bold text-sm hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading ? '⏳ Genererar förslag...' : noKey ? '🔑 Lägg till API-nyckel' : `✨ Generera förslag (${budget.emoji} ${budget.dailyKr} kr/dag)`}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Streaming */}
      {streaming && !result && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <span className="animate-pulse text-green-500 text-lg">●</span> AI tänker...
          </div>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono max-h-24 overflow-hidden">
            {streaming.slice(-200)}
          </pre>
        </div>
      )}

      {/* Resultat */}
      {result && result.suggestions.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-700">
              {result.suggestions.length} måltidsförslag
            </h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              budget.label === 'Rikemansbarn' ? 'bg-amber-100 text-amber-700' :
              budget.label === 'Har jobb' ? 'bg-blue-100 text-blue-700' :
              budget.label === 'Arbetslös' ? 'bg-slate-100 text-slate-600' :
              'bg-rose-100 text-rose-700'
            }`}>
              {budget.emoji} {budget.label}
            </span>
          </div>

          {result.suggestions.map((s, i) => (
            <SuggestionCard
              key={i}
              s={s}
              onSaveToDay={handleSaveToDay}
              savedToDay={savedIds.has(`${s.mealType}-${s.dishName}`)}
            />
          ))}

          <ShoppingListPanel items={result.shoppingList} total={result.totalEstimatedCost} />
        </>
      )}
    </div>
  );
}
