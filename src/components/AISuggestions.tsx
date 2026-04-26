import { useState } from 'react';
import type { Offer, MealType } from '../types';
import { streamMealSuggestions, getSavedApiKey, type MealSuggestion } from '../services/aiService';

interface Props {
  offers: Offer[];
  onOpenApiKey: () => void;
}

const MEAL_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: 'frukost', label: 'Frukost', emoji: '🌅' },
  { value: 'lunch',   label: 'Lunch',   emoji: '☀️' },
  { value: 'middag',  label: 'Middag',  emoji: '🌙' },
  { value: 'snack',   label: 'Snack',   emoji: '🍎' },
];

const MEAL_COLORS: Record<MealType, string> = {
  frukost: 'from-amber-50 border-amber-200',
  lunch:   'from-sky-50 border-sky-200',
  middag:  'from-indigo-50 border-indigo-200',
  snack:   'from-emerald-50 border-emerald-200',
};

function parseSuggestions(text: string): MealSuggestion[] {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  } catch {
    return [];
  }
}

function SuggestionCard({ s }: { s: MealSuggestion }) {
  const [open, setOpen] = useState(false);
  const mealInfo = MEAL_OPTIONS.find((m) => m.value === s.mealType);

  return (
    <div className={`border rounded-2xl bg-gradient-to-b to-white p-5 space-y-3 ${MEAL_COLORS[s.mealType]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-slate-400 mb-1">
            {mealInfo?.emoji} {mealInfo?.label}
          </div>
          <h3 className="text-base font-bold text-slate-800">{s.dishName}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>
        </div>
        <div className="text-center shrink-0 bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
          <div className="text-xl font-bold text-green-600">{s.calories}</div>
          <div className="text-xs text-slate-400">kcal</div>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { label: 'Protein',   value: s.protein, color: 'text-blue-600 bg-blue-50' },
          { label: 'Kolhydr.',  value: s.carbs,   color: 'text-amber-600 bg-amber-50' },
          { label: 'Fett',      value: s.fat,     color: 'text-rose-600 bg-rose-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`flex-1 text-center rounded-lg py-1.5 ${color}`}>
            <div className="text-sm font-bold">{value}g</div>
            <div className="text-xs opacity-70">{label}</div>
          </div>
        ))}
      </div>

      {s.usedOffers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s.usedOffers.map((o) => (
            <span key={o} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              🏷️ {o}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-all"
      >
        {open ? '▲' : '▼'} {open ? 'Dölj detaljer' : 'Visa ingredienser & hälsoinfo'}
      </button>

      {open && (
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Ingredienser</p>
            <ul className="space-y-0.5">
              {s.ingredients.map((ing) => (
                <li key={ing} className="text-sm text-slate-600 flex items-start gap-1.5">
                  <span className="text-slate-300 mt-0.5">•</span> {ing}
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
    </div>
  );
}

export default function AISuggestions({ offers, onOpenApiKey }: Props) {
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(['frukost', 'lunch', 'middag', 'snack']);
  const [preferences, setPreferences] = useState('');
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [error, setError] = useState('');

  const toggleMeal = (type: MealType) =>
    setSelectedMeals((prev) =>
      prev.includes(type) ? prev.filter((m) => m !== type) : [...prev, type],
    );

  const selectAll = () => setSelectedMeals(['frukost', 'lunch', 'middag', 'snack']);

  const handleGenerate = async () => {
    const apiKey = getSavedApiKey();
    if (!apiKey) {
      onOpenApiKey();
      return;
    }
    if (offers.length === 0) {
      setError('Hämta veckans erbjudanden först (gå till fliken Erbjudanden).');
      return;
    }
    if (selectedMeals.length === 0) {
      setError('Välj minst en måltidstyp.');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestions([]);
    setStreaming('');

    try {
      let fullText = '';
      for await (const delta of streamMealSuggestions(apiKey, offers, selectedMeals, preferences)) {
        fullText += delta;
        setStreaming(fullText);
      }
      const parsed = parseSuggestions(fullText);
      setSuggestions(parsed);
      setStreaming('');
      if (parsed.length === 0) setError('Kunde inte tolka AI-svaret. Försök igen.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Okänt fel';
      if (msg.includes('401') || msg.includes('authentication')) {
        setError('Ogiltig API-nyckel. Kontrollera din nyckel under inställningar (🔑).');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const noOffers = offers.length === 0;
  const noKey = !getSavedApiKey();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span>🤖</span> AI-måltidsplanerare
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Baserat på veckans erbjudanden genererar AI hälsosamma måltidsförslag åt dig.
          </p>
        </div>

        {noKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Du behöver en Anthropic API-nyckel för att använda AI-förslagen.{' '}
            <button onClick={onOpenApiKey} className="font-semibold underline hover:no-underline">
              Lägg till nyckel →
            </button>
          </div>
        )}

        {noOffers && !noKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Gå till fliken <strong>Erbjudanden</strong> och hämta veckans erbjudanden först.
          </div>
        )}

        {!noOffers && !noKey && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
            ✓ {offers.length} erbjudanden laddade från{' '}
            {[...new Set(offers.map((o) => o.store))].join(', ')}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-600">Planera för</label>
            <button onClick={selectAll} className="text-xs text-green-600 hover:underline">
              Välj alla
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEAL_OPTIONS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => toggleMeal(value)}
                className={`py-3 rounded-xl border font-medium text-sm transition-all ${
                  selectedMeals.includes(value)
                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-green-300'
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 block mb-2">
            Extra önskemål <span className="font-normal text-slate-400">(valfritt)</span>
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="t.ex. vegetariskt, glutenfritt, hög protein, snabb tillagning..."
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-slate-300"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || selectedMeals.length === 0}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading
            ? '⏳ Genererar förslag...'
            : noKey
            ? '🔑 Lägg till API-nyckel för att fortsätta'
            : '✨ Generera måltidsförslag'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {streaming && !suggestions.length && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <span className="animate-pulse text-green-500">●</span> AI tänker...
          </div>
          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono max-h-32 overflow-hidden">
            {streaming.slice(-300)}
          </pre>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-700">
            {suggestions.length} måltidsförslag genererade
          </h3>
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
