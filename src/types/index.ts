export type MealType = 'frukost' | 'lunch' | 'middag' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;      // kcal per 100g
  protein: number;       // g per 100g
  carbs: number;         // g per 100g
  fat: number;           // g per 100g
  servingSize: number;   // gram
  servingUnit: string;
}

export interface MealEntry {
  id: string;
  foodItem: FoodItem;
  grams: number;
  mealType: MealType;
  date: string; // YYYY-MM-DD
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  entries: MealEntry[];
}

export interface Offer {
  id: string;
  store: string;
  storeLogo?: string;
  productName: string;
  description: string;
  price?: string;
  imageUrl?: string;
  validFrom: string;
  validTo: string;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
