interface UsdaFoodNutrient {
  nutrientId: number;
  value: number;
}

interface UsdaSearchResult {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods: UsdaSearchResult[];
  totalHits: number;
}

const NUTRIENT_IDS = {
  ENERGY: 1008,   // kcal
  PROTEIN: 1003,  // g
  CARBS: 1005,    // g (total carbohydrate)
  FAT: 1004,      // g (total fat)
};

export interface UsdaNutrients {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  per100g: true;
}

/**
 * Look up a food item in USDA FoodData Central.
 * Returns macros per 100g, or null if no API key / no match.
 */
export async function lookupUsda(foodName: string): Promise<UsdaNutrients | null> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('query', foodName);
    url.searchParams.set('pageSize', '3');
    url.searchParams.set('dataType', 'Foundation,SR Legacy');

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data: UsdaSearchResponse = await res.json();
    if (data.totalHits === 0 || data.foods.length === 0) return null;

    const topResult = data.foods[0];
    const getNutrient = (id: number) =>
      topResult.foodNutrients.find((n) => n.nutrientId === id)?.value ?? null;

    const calories = getNutrient(NUTRIENT_IDS.ENERGY);
    if (calories === null) return null;

    return {
      calories,
      protein_g: getNutrient(NUTRIENT_IDS.PROTEIN) ?? 0,
      carbs_g: getNutrient(NUTRIENT_IDS.CARBS) ?? 0,
      fat_g: getNutrient(NUTRIENT_IDS.FAT) ?? 0,
      per100g: true,
    };
  } catch {
    return null;
  }
}
