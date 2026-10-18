export type NutriScoreGrade = 'a' | 'b' | 'c' | 'd' | 'e';
export type NovaGroup = 1 | 2 | 3 | 4;

export interface ProductNutrition {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize?: string;
  servingGrams: number;
  caloriesPer100g: number;
  proteinsPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  sugarsPer100g: number;
  fiberPer100g: number;
  sodiumPer100g: number;
  saltPer100g: number;
  nutriscoreGrade?: NutriScoreGrade;
  novaGroup?: NovaGroup;
  ingredientsText?: string;
  allergens?: string[];
  categories?: string[];
  healthSummary?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  product: ProductNutrition;
  quantityGrams: number;
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
  sugars: number;
  fiber: number;
  sodium: number;
  timestamp: number;
}

export interface DailyNutritionGoals {
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export const DEFAULT_GOALS: DailyNutritionGoals = {
  calories: 2000,
  proteins: 120,
  carbs: 230,
  fat: 65,
  fiber: 30,
  sodium: 2.3, // 2300mg
};
