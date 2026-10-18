import { MealLogEntry, NutriScoreGrade, NovaGroup, ProductNutrition } from '../types/nutrition';

export function calculateServingNutrients(product: ProductNutrition, quantityGrams: number) {
  const factor = quantityGrams / 100;
  return {
    calories: Math.round(product.caloriesPer100g * factor),
    proteins: Number((product.proteinsPer100g * factor).toFixed(1)),
    carbs: Number((product.carbsPer100g * factor).toFixed(1)),
    fat: Number((product.fatPer100g * factor).toFixed(1)),
    sugars: Number((product.sugarsPer100g * factor).toFixed(1)),
    fiber: Number((product.fiberPer100g * factor).toFixed(1)),
    sodium: Number((product.sodiumPer100g * factor).toFixed(2)),
    salt: Number((product.saltPer100g * factor).toFixed(2)),
  };
}

export function getNutriScoreDetails(grade?: NutriScoreGrade) {
  switch (grade?.toLowerCase()) {
    case 'a':
      return {
        label: 'Nutri-Score A',
        bgColor: 'bg-emerald-600',
        textColor: 'text-white',
        borderColor: 'border-emerald-600',
        lightBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        description: 'Very good nutritional quality. High in fiber and protein, low saturated fat.',
      };
    case 'b':
      return {
        label: 'Nutri-Score B',
        bgColor: 'bg-lime-500',
        textColor: 'text-white',
        borderColor: 'border-lime-500',
        lightBg: 'bg-lime-50 text-lime-800 border-lime-200',
        description: 'Good nutritional quality. Balanced daily option with favorable nutrients.',
      };
    case 'c':
      return {
        label: 'Nutri-Score C',
        bgColor: 'bg-amber-400',
        textColor: 'text-slate-900',
        borderColor: 'border-amber-400',
        lightBg: 'bg-amber-50 text-amber-900 border-amber-200',
        description: 'Average nutritional profile. Moderate sugar, salt, or saturated fats.',
      };
    case 'd':
      return {
        label: 'Nutri-Score D',
        bgColor: 'bg-orange-500',
        textColor: 'text-white',
        borderColor: 'border-orange-500',
        lightBg: 'bg-orange-50 text-orange-900 border-orange-200',
        description: 'Poor nutritional quality. Consume in moderation due to sugar or fat content.',
      };
    case 'e':
      return {
        label: 'Nutri-Score E',
        bgColor: 'bg-rose-600',
        textColor: 'text-white',
        borderColor: 'border-rose-600',
        lightBg: 'bg-rose-50 text-rose-900 border-rose-200',
        description: 'Low nutritional quality. High in sugars, sodium, or unhealthy saturated fats.',
      };
    default:
      return {
        label: 'Nutri-Score N/A',
        bgColor: 'bg-slate-400',
        textColor: 'text-white',
        borderColor: 'border-slate-300',
        lightBg: 'bg-slate-100 text-slate-700 border-slate-200',
        description: 'Nutri-Score classification not calculated for this product.',
      };
  }
}

export function getNovaDetails(group?: NovaGroup) {
  switch (group) {
    case 1:
      return {
        label: 'NOVA 1 · Unprocessed / Minimally Processed',
        badgeColor: 'bg-emerald-700 text-white',
        lightBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        description: 'Whole foods altered only by drying, boiling, freezing, or pasteurization without added ingredients.',
      };
    case 2:
      return {
        label: 'NOVA 2 · Processed Culinary Ingredients',
        badgeColor: 'bg-amber-600 text-white',
        lightBg: 'bg-amber-50 text-amber-900 border-amber-200',
        description: 'Direct kitchen cooking essentials extracted from nature (butter, olive oil, salt, cane sugar).',
      };
    case 3:
      return {
        label: 'NOVA 3 · Processed Foods',
        badgeColor: 'bg-orange-600 text-white',
        lightBg: 'bg-orange-50 text-orange-900 border-orange-200',
        description: 'Made by combining Group 1 with Group 2 foods (canned vegetables in brine, simple bread, cured meat).',
      };
    case 4:
      return {
        label: 'NOVA 4 · Ultra-Processed Food (UPF)',
        badgeColor: 'bg-rose-700 text-white',
        lightBg: 'bg-rose-50 text-rose-900 border-rose-200',
        description: 'Industrial formulations containing artificial emulsifiers, flavor enhancers, high fructose corn syrup, or cosmetic additives.',
      };
    default:
      return {
        label: 'NOVA N/A · Processing Level Unknown',
        badgeColor: 'bg-slate-500 text-white',
        lightBg: 'bg-slate-100 text-slate-700 border-slate-200',
        description: 'Food processing level not categorized.',
      };
  }
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayLabel(isoString: string): string {
  const today = formatISODate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatISODate(yesterdayDate);

  if (isoString === today) return 'Today';
  if (isoString === yesterday) return 'Yesterday';

  const date = new Date(isoString + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateDayTotals(entries: MealLogEntry[]) {
  return entries.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      proteins: Number((acc.proteins + item.proteins).toFixed(1)),
      carbs: Number((acc.carbs + item.carbs).toFixed(1)),
      fat: Number((acc.fat + item.fat).toFixed(1)),
      sugars: Number((acc.sugars + item.sugars).toFixed(1)),
      fiber: Number((acc.fiber + item.fiber).toFixed(1)),
      sodium: Number((acc.sodium + item.sodium).toFixed(2)),
    }),
    {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fat: 0,
      sugars: 0,
      fiber: 0,
      sodium: 0,
    }
  );
}
