import type { MealEntry, DayPlan, MealType, NutritionSummary } from '../types';

const STORAGE_KEY = 'halsa_meal_plan';

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function loadAllPlans(): Record<string, DayPlan> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePlans(plans: Record<string, DayPlan>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function getDayPlan(date: string): DayPlan {
  const plans = loadAllPlans();
  return plans[date] ?? { date, entries: [] };
}

export function addEntry(entry: MealEntry): void {
  const plans = loadAllPlans();
  const day = plans[entry.date] ?? { date: entry.date, entries: [] };
  day.entries.push(entry);
  plans[entry.date] = day;
  savePlans(plans);
}

export function removeEntry(date: string, entryId: string): void {
  const plans = loadAllPlans();
  if (!plans[date]) return;
  plans[date].entries = plans[date].entries.filter((e) => e.id !== entryId);
  savePlans(plans);
}

export function calcNutrition(entries: MealEntry[]): NutritionSummary {
  return entries.reduce(
    (acc, e) => {
      const factor = e.grams / 100;
      return {
        calories: acc.calories + e.foodItem.calories * factor,
        protein:  acc.protein  + e.foodItem.protein  * factor,
        carbs:    acc.carbs    + e.foodItem.carbs    * factor,
        fat:      acc.fat      + e.foodItem.fat      * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function calcByMeal(entries: MealEntry[]): Record<MealType, NutritionSummary> {
  const mealTypes: MealType[] = ['frukost', 'lunch', 'middag', 'snack'];
  const result = {} as Record<MealType, NutritionSummary>;
  for (const type of mealTypes) {
    result[type] = calcNutrition(entries.filter((e) => e.mealType === type));
  }
  return result;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
