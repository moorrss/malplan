import type { FoodItem } from '../types';

// Open Food Facts API – gratis, ingen API-nyckel krävs
const OFF_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

interface OFFProduct {
  id: string;
  product_name?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  serving_size?: string;
}

function parseServingGrams(servingSize?: string): number {
  if (!servingSize) return 100;
  const match = servingSize.match(/(\d+(?:[.,]\d+)?)\s*g/i);
  return match ? parseFloat(match[1].replace(',', '.')) : 100;
}

export async function searchFood(query: string): Promise<FoodItem[]> {
  if (!query.trim()) return [];

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: 'id,product_name,nutriments,serving_size',
      lc: 'sv',
      cc: 'se',
    });

    const res = await fetch(`${OFF_URL}?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    const products: OFFProduct[] = data.products ?? [];

    return products
      .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'])
      .map((p) => {
        const n = p.nutriments!;
        return {
          id: p.id,
          name: p.product_name!,
          calories: Math.round(n['energy-kcal_100g'] ?? 0),
          protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
          carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
          fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
          servingSize: parseServingGrams(p.serving_size),
          servingUnit: 'g',
        };
      })
      .slice(0, 15);
  } catch {
    return [];
  }
}

// Vanliga svenska livsmedel som fallback / snabbval
export const COMMON_FOODS: FoodItem[] = [
  { id: 'havregrot',  name: 'Havregrynsgröt',       calories: 68,  protein: 2.4, carbs: 11.6, fat: 1.4, servingSize: 250, servingUnit: 'g' },
  { id: 'mjolk',      name: 'Mjölk (3%)',            calories: 61,  protein: 3.2, carbs: 4.7,  fat: 3.0, servingSize: 200, servingUnit: 'ml' },
  { id: 'banan',      name: 'Banan',                 calories: 89,  protein: 1.1, carbs: 22.8, fat: 0.3, servingSize: 120, servingUnit: 'g' },
  { id: 'agg',        name: 'Ägg (kokt)',             calories: 155, protein: 13,  carbs: 1.1,  fat: 11,  servingSize: 60,  servingUnit: 'g' },
  { id: 'rostat',     name: 'Rostat bröd (fullkorn)', calories: 259, protein: 9,   carbs: 46,   fat: 3.6, servingSize: 30,  servingUnit: 'g' },
  { id: 'smor',       name: 'Smör',                  calories: 717, protein: 0.9, carbs: 0.1,  fat: 81,  servingSize: 10,  servingUnit: 'g' },
  { id: 'kycklingfil',name: 'Kycklingfilé (tillagad)',calories: 165, protein: 31,  carbs: 0,    fat: 3.6, servingSize: 150, servingUnit: 'g' },
  { id: 'lax',        name: 'Laxfilé (ugnsrostad)',  calories: 208, protein: 20,  carbs: 0,    fat: 13,  servingSize: 150, servingUnit: 'g' },
  { id: 'pasta',      name: 'Pasta (kokt)',           calories: 131, protein: 5,   carbs: 25,   fat: 1.1, servingSize: 200, servingUnit: 'g' },
  { id: 'ris',        name: 'Ris (kokt)',             calories: 130, protein: 2.7, carbs: 28,   fat: 0.3, servingSize: 200, servingUnit: 'g' },
  { id: 'broccoli',   name: 'Broccoli',              calories: 34,  protein: 2.8, carbs: 5,    fat: 0.4, servingSize: 150, servingUnit: 'g' },
  { id: 'morötter',   name: 'Morötter',              calories: 41,  protein: 0.9, carbs: 10,   fat: 0.2, servingSize: 100, servingUnit: 'g' },
  { id: 'majs',       name: 'Majs (konserv)',         calories: 86,  protein: 3.2, carbs: 18,   fat: 1.2, servingSize: 80,  servingUnit: 'g' },
  { id: 'yoghurt',    name: 'Yoghurt (naturell)',     calories: 61,  protein: 3.5, carbs: 4.7,  fat: 3.2, servingSize: 200, servingUnit: 'g' },
  { id: 'kvarg',      name: 'Kvarg (vanilj)',         calories: 75,  protein: 8,   carbs: 8,    fat: 0.3, servingSize: 200, servingUnit: 'g' },
  { id: 'notter',     name: 'Blandade nötter',       calories: 607, protein: 15,  carbs: 14,   fat: 54,  servingSize: 30,  servingUnit: 'g' },
  { id: 'apple',      name: 'Äpple',                 calories: 52,  protein: 0.3, carbs: 14,   fat: 0.2, servingSize: 150, servingUnit: 'g' },
  { id: 'smagas',     name: 'Smågodis',              calories: 350, protein: 2,   carbs: 80,   fat: 1,   servingSize: 50,  servingUnit: 'g' },
];
