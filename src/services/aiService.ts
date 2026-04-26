import Groq from 'groq-sdk';
import type { Offer, MealType } from '../types';

export const AI_KEY_STORAGE = 'malplan_groq_key';
const MODEL = 'llama-3.3-70b-versatile';

export interface MealSuggestion {
  mealType: MealType;
  dishName: string;
  description: string;
  ingredients: string[];
  usedOffers: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthNote: string;
  recipe: string;
}

export interface ShoppingItem {
  item: string;
  amount: string;
  estimatedPrice: number;
}

export interface AIResult {
  suggestions: MealSuggestion[];
  shoppingList: ShoppingItem[];
  totalEstimatedCost: number;
}

export interface Budget {
  label: string;
  emoji: string;
  description: string;
  weeklyMin: number;
  weeklyMax: number;
  weeklyDefault: number;
  weeklyKr: number; // aktuellt valt värde
}

export const BUDGET_PRESETS: Omit<Budget, 'weeklyKr'>[] = [
  { label: 'Rikemansbarn',   emoji: '💸', weeklyMin: 1000, weeklyMax: 3000, weeklyDefault: 1400, description: 'Premium råvaror, inga kompromisser' },
  { label: 'Har jobb',       emoji: '💼', weeklyMin: 500,  weeklyMax: 1000, weeklyDefault: 700,  description: 'Vällagat till rimlig kostnad' },
  { label: 'Arbetslös',      emoji: '📋', weeklyMin: 200,  weeklyMax: 500,  weeklyDefault: 350,  description: 'Budgetvänligt och mättande' },
  { label: 'Fattig student', emoji: '📚', weeklyMin: 300,  weeklyMax: 500,  weeklyDefault: 350,  description: 'Maximera värde för pengarna' },
];

export const BUDGETS: Budget[] = BUDGET_PRESETS.map((p) => ({ ...p, weeklyKr: p.weeklyDefault }));

export const BUDGET_STORAGE = 'malplan_budget';

export function getSavedApiKey(): string {
  return localStorage.getItem(AI_KEY_STORAGE) ?? '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(AI_KEY_STORAGE, key.trim());
}

export function getSavedBudget(): Budget {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE);
    if (raw) {
      const saved = JSON.parse(raw) as Budget;
      const preset = BUDGET_PRESETS.find((p) => p.label === saved.label);
      if (preset) return { ...preset, weeklyKr: saved.weeklyKr ?? preset.weeklyDefault };
    }
  } catch { /* ignore */ }
  return BUDGETS[1]; // default: Har jobb
}

export function saveBudget(budget: Budget): void {
  localStorage.setItem(BUDGET_STORAGE, JSON.stringify({ label: budget.label, weeklyKr: budget.weeklyKr }));
}

function buildPrompt(
  offers: Offer[],
  mealTypes: MealType[],
  budget: Budget,
  preferences?: string,
): string {
  const dailyKr = Math.round(budget.weeklyKr / 7);
  const offerList = offers
    .map(
      (o) =>
        `• ${o.productName}${o.price ? ` (${o.price})` : ''} — ${o.store}${o.description ? `: ${o.description}` : ''}`,
    )
    .join('\n');

  const mealLabels: Record<string, string> = {
    frukost: 'frukost', lunch: 'lunch', middag: 'middag', snack: 'snack',
  };
  const selectedMeals = mealTypes.map((m) => mealLabels[m] ?? m).join(', ');

  return `Du är en svensk nutritionsexpert och kock. Föreslå hälsosamma maträtter baserade på veckans svenska butikserbjudanden.

Veckans erbjudanden:
${offerList}

Planera ${selectedMeals} för en dag.

Budget: ${budget.emoji} ${budget.label} — ca ${dailyKr} kr per dag (${budget.weeklyKr} kr/vecka). ${budget.description}.${preferences ? `\nExtra önskemål: ${preferences}` : ''}

Regler:
- Anpassa ingredienser och portionsstorlekar strikt efter budgeten (${dailyKr} kr/dag, ${budget.weeklyKr} kr/vecka)
- Använd MINST ett erbjudandeprodukt per måltid om möjligt
- Alla måltider ska vara hälsosamma och balanserade
- Ange ungefärliga kalorier per portion (kcal)
- Inkludera ett kort steg-för-steg recept per rätt
- Svara ENBART på svenska

Svara i detta JSON-format (INGET annat utanför JSON-blocket):
{
  "suggestions": [
    {
      "mealType": "frukost|lunch|middag|snack",
      "dishName": "Rättens namn",
      "description": "Kort beskrivning",
      "ingredients": ["ingrediens med mängd"],
      "usedOffers": ["produktnamn från erbjudandena"],
      "calories": 450,
      "protein": 25,
      "carbs": 40,
      "fat": 15,
      "healthNote": "Varför det är hälsosamt",
      "recipe": "1. Förbered... 2. Tillaga... 3. Servera..."
    }
  ],
  "shoppingList": [
    { "item": "Kycklingfilé", "amount": "400g", "estimatedPrice": 45 }
  ],
  "totalEstimatedCost": 145
}`;
}

export function parseAIResult(text: string): AIResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { suggestions: [], shoppingList: [], totalEstimatedCost: 0 };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      shoppingList: Array.isArray(parsed.shoppingList) ? parsed.shoppingList : [],
      totalEstimatedCost: typeof parsed.totalEstimatedCost === 'number' ? parsed.totalEstimatedCost : 0,
    };
  } catch {
    return { suggestions: [], shoppingList: [], totalEstimatedCost: 0 };
  }
}

export async function* streamMealSuggestions(
  apiKey: string,
  offers: Offer[],
  mealTypes: MealType[],
  budget: Budget,
  preferences?: string,
): AsyncGenerator<string> {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  const prompt = buildPrompt(offers.slice(0, 30), mealTypes, budget, preferences);

  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) yield delta;
  }
}
