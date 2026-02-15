/** What the AI estimation pipeline returns after parsing a meal description */
export interface AiEstimatedItem {
  food_name: string;
  portion_description: string;
  portion_grams: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_score: number; // 0.0-1.0
  data_source: 'claude' | 'usda' | 'nutritionix' | 'claude+usda';
}

export interface EstimationRequest {
  description: string;
  meal_type?: string;
}

export interface EstimationResponse {
  items: AiEstimatedItem[];
  raw_description: string;
  model_used: string;
}
