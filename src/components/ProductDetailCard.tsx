import React, { useState } from 'react';
import {
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Heart,
  Plus,
  Check,
  Package,
  AlertTriangle,
  Info,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { ProductNutrition, MealType } from '../types/nutrition';
import {
  calculateServingNutrients,
  getNutriScoreDetails,
  getNovaDetails,
} from '../utils/nutritionCalculations';

interface ProductDetailCardProps {
  product: ProductNutrition;
  onAddToDiary: (product: ProductNutrition, mealType: MealType, quantityGrams: number) => void;
  onClose?: () => void;
  initialMealType?: MealType;
}

export const ProductDetailCard: React.FC<ProductDetailCardProps> = ({
  product,
  onAddToDiary,
  onClose,
  initialMealType = 'breakfast',
}) => {
  const [quantityGrams, setQuantityGrams] = useState<number>(product.servingGrams || 100);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [isLogged, setIsLogged] = useState(false);
  const [imageError, setImageError] = useState(false);

  const nutrients = calculateServingNutrients(product, quantityGrams);
  const nutriDetails = getNutriScoreDetails(product.nutriscoreGrade);
  const novaDetails = getNovaDetails(product.novaGroup);

  const handleLog = () => {
    onAddToDiary(product, mealType, quantityGrams);
    setIsLogged(true);
    setTimeout(() => {
      setIsLogged(false);
      if (onClose) onClose();
    }, 1200);
  };

  const quickPortions = [
    { label: '50g', val: 50 },
    { label: '100g', val: 100 },
    { label: '1 Serving', val: product.servingGrams || 100 },
    { label: '200g', val: 200 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Top Banner / Product Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {/* Product Image Slot with Fallback */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shrink-0 overflow-hidden">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-lg">
              <Package className="w-8 h-8 stroke-1 text-slate-400" />
              <span className="text-[10px] text-slate-500 mt-1">Item Preview</span>
            </div>
          )}
        </div>

        {/* Title, Brand & Barcode */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
            {product.brand && <span className="font-semibold text-slate-700">{product.brand}</span>}
            {product.brand && <span>·</span>}
            <span className="font-mono tabular-nums text-slate-400">Barcode: {product.barcode}</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 leading-snug">
            {product.name}
          </h3>

          {/* Clean Unboxed Health Indicators */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-slate-100 text-xs">
            {/* Nutri-Score Pill-free Tag */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Nutri-Score:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[11px] ${nutriDetails.bgColor} ${nutriDetails.textColor}`}>
                Grade {product.nutriscoreGrade || 'N/A'}
              </span>
            </div>

            <span className="text-slate-300" aria-hidden="true">·</span>

            {/* NOVA Group */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Processing:</span>
              <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${novaDetails.badgeColor}`}>
                NOVA {product.novaGroup || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Nutri-Score & NOVA Educational Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Nutri-Score Card */}
          <div className={`p-3.5 rounded-xl border text-xs ${nutriDetails.lightBg} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-600" />
                <span>{nutriDetails.label}</span>
              </span>
              {/* Visual Nutri-Score Scale A-E */}
              <div className="flex items-center gap-1">
                {(['a', 'b', 'c', 'd', 'e'] as const).map((letter) => {
                  const isActive = product.nutriscoreGrade === letter;
                  const colors = {
                    a: 'bg-emerald-600 text-white',
                    b: 'bg-lime-500 text-white',
                    c: 'bg-amber-400 text-slate-900',
                    d: 'bg-orange-500 text-white',
                    e: 'bg-rose-600 text-white',
                  };
                  return (
                    <span
                      key={letter}
                      className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold uppercase transition-transform ${
                        isActive ? `${colors[letter]} scale-110 shadow-sm ring-1 ring-black/20` : 'bg-slate-200 text-slate-500 opacity-40'
                      }`}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">{nutriDetails.description}</p>
          </div>

          {/* NOVA Processing Card */}
          <div className={`p-3.5 rounded-xl border text-xs ${novaDetails.lightBg} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>{novaDetails.label}</span>
              </span>
              {/* NOVA 1-4 indicator dots */}
              <div className="flex items-center gap-1">
                {([1, 2, 3, 4] as const).map((num) => {
                  const isActive = product.novaGroup === num;
                  return (
                    <span
                      key={num}
                      className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
                        isActive ? `${novaDetails.badgeColor} scale-110 shadow-sm` : 'bg-slate-200 text-slate-400 opacity-40'
                      }`}
                    >
                      {num}
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">{novaDetails.description}</p>
          </div>
        </div>

        {/* Portion & Serving Size Adjuster */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold text-slate-900">
                Adjust Serving Portion:
              </label>
            </div>
            {/* Quick portion chips */}
            <div className="flex items-center gap-1.5">
              {quickPortions.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setQuantityGrams(p.val)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                    quantityGrams === p.val
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={quantityGrams}
              onChange={(e) => setQuantityGrams(Number(e.target.value))}
              className="flex-1 accent-emerald-600 cursor-pointer"
            />
            <div className="flex items-center gap-1 font-mono font-bold text-sm text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 tabular-nums">
              <span>{quantityGrams}</span>
              <span className="text-xs text-slate-500 font-sans">g</span>
            </div>
          </div>
        </div>

        {/* Nutritional Facts Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-900 tracking-wider">
              Nutritional Breakdown
            </h4>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Calculated for {quantityGrams}g portion
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Calories */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Calories</span>
                <Flame className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {nutrients.calories}
                <span className="text-xs text-slate-500 font-sans font-normal ml-1">kcal</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                {product.caloriesPer100g} kcal / 100g
              </div>
            </div>

            {/* Protein */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Protein</span>
                <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {nutrients.proteins}
                <span className="text-xs text-slate-500 font-sans font-normal ml-1">g</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                {product.proteinsPer100g}g / 100g
              </div>
            </div>

            {/* Carbs & Sugars */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Carbs</span>
                <Wheat className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {nutrients.carbs}
                <span className="text-xs text-slate-500 font-sans font-normal ml-1">g</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                of which sugars: {nutrients.sugars}g
              </div>
            </div>

            {/* Fat */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Total Fat</span>
                <Droplet className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {nutrients.fat}
                <span className="text-xs text-slate-500 font-sans font-normal ml-1">g</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                {product.fatPer100g}g / 100g
              </div>
            </div>
          </div>

          {/* Secondary micro nutrients: Fiber, Salt, Sodium */}
          <div className="mt-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Dietary Fiber</span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">{nutrients.fiber}g</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Sodium</span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">{nutrients.sodium}g</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Salt</span>
              <span className="font-bold text-slate-900 font-mono tabular-nums">{nutrients.salt}g</span>
            </div>
          </div>
        </div>

        {/* Ingredients & Allergens */}
        {product.ingredientsText && (
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-slate-800">Ingredients:</span>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
              {product.ingredientsText}
            </p>
          </div>
        )}

        {/* Allergens Flags */}
        {product.allergens && product.allergens.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-700">Contains Allergens:</span>
            <span className="text-slate-600 font-medium">
              {product.allergens.join(', ')}
            </span>
          </div>
        )}

        {/* AI Health Summary Note if available */}
        {product.healthSummary && (
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
            <span className="font-bold">Nutrition Assessment: </span>
            <span>{product.healthSummary}</span>
          </div>
        )}

        {/* Action Panel: Meal Category Selection & Log Button */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Log as Meal:
            </span>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer capitalize"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleLog}
              disabled={isLogged}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                isLogged
                  ? 'bg-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
              }`}
            >
              {isLogged ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Logged to {mealType}!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to {mealType}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
