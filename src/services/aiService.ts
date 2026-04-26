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
}

export function getSavedApiKey(): string {
  return localStorage.getItem(AI_KEY_STORAGE) ?? '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(AI_KEY_STORAGE, key.trim());
}

function buildPrompt(offers: Offer[], mealTypes: MealType[], preferences?: string): string {
  const offerList = offers
    .map(
      (o) =>
        `• ${o.productName}${o.price ? ` (${o.price})` : ''} — ${o.store}${o.description ? `: ${o.description}` : ''}`,
    )
    .join('\n');

  const mealLabels: Record<string, string> = {
    frukost: 'frukost',
    lunch: 'lunch',
    middag: 'middag',
    snack: 'snack',
  };

  const selectedMeals = mealTypes.map((m) => mealLabels[m] ?? m).join(', ');

  return `Du är en svensk nutritionsexpert och kock. Din uppgift är att föreslå hälsosamma maträtter baserade på veckans erbjudanden i svenska butiker.

Veckans erbjudanden:
${offerList}

Planera ${selectedMeals} för en dag.${preferences ? `\nExtra önskemål: ${preferences}` : ''}

Regler:
- Använd MINST ett erbjudandeprodukt per måltid om möjligt
- Alla måltider ska vara hälsosamma och balanserade
- Ange ungefärliga kalorier per portion (kcal)
- Förklara kortfattat varför rätten är hälsosam
- Svara på svenska

Svara i detta JSON-format (och INGET annat, ingen text utanför JSON):
{
  "suggestions": [
    {
      "mealType": "frukost|lunch|middag|snack",
      "dishName": "Rättens namn",
      "description": "Kort beskrivning",
      "ingredients": ["ingrediens 1", "ingrediens 2"],
      "usedOffers": ["produktnamn från erbjudandena"],
      "calories": 450,
      "protein": 25,
      "carbs": 40,
      "fat": 15,
      "healthNote": "Varför det är hälsosamt"
    }
  ]
}`;
}

export async function* streamMealSuggestions(
  apiKey: string,
  offers: Offer[],
  mealTypes: MealType[],
  preferences?: string,
): AsyncGenerator<string> {
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  const prompt = buildPrompt(offers.slice(0, 30), mealTypes, preferences);

  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) yield delta;
  }
}
