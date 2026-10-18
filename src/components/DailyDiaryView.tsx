import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Heart,
  ShieldCheck,
  AlertCircle,
  Package,
} from 'lucide-react';
import { MealLogEntry, MealType, DailyNutritionGoals } from '../types/nutrition';
import {
  formatISODate,
  getDayLabel,
  calculateDayTotals,
  getNutriScoreDetails,
  getNovaDetails,
} from '../utils/nutritionCalculations';

interface DailyDiaryViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  entries: MealLogEntry[];
  goals: DailyNutritionGoals;
  onDeleteEntry: (id: string) => void;
  onOpenScannerForMeal: (mealType: MealType) => void;
}

export const DailyDiaryView: React.FC<DailyDiaryViewProps> = ({
  selectedDate,
  onSelectDate,
  entries,
  goals,
  onDeleteEntry,
  onOpenScannerForMeal,
}) => {
  const dayEntries = entries.filter((e) => e.date === selectedDate);
  const dayTotals = calculateDayTotals(dayEntries);

  // Shift day
  const handleShiftDay = (delta: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + delta);
    onSelectDate(formatISODate(current));
  };

  const isToday = selectedDate === formatISODate(new Date());

  // Meal categories
  const meals: { type: MealType; label: string; iconTime: string }[] = [
    { type: 'breakfast', label: 'Breakfast', iconTime: 'Morning' },
    { type: 'lunch', label: 'Lunch', iconTime: 'Midday' },
    { type: 'dinner', label: 'Dinner', iconTime: 'Evening' },
    { type: 'snack', label: 'Snacks & Drinks', iconTime: 'Anytime' },
  ];

  // Calculate percentages toward goals
  const caloriePercent = Math.min(100, Math.round((dayTotals.calories / goals.calories) * 100));
  const proteinPercent = Math.min(100, Math.round((dayTotals.proteins / goals.proteins) * 100));
  const carbsPercent = Math.min(100, Math.round((dayTotals.carbs / goals.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((dayTotals.fat / goals.fat) * 100));
  const remainingCalories = Math.max(0, goals.calories - dayTotals.calories);

  // NOVA food processing breakdown
  const novaCounts = { 1: 0, 2: 0, 3: 0, 4: 0, unknown: 0 };
  dayEntries.forEach((e) => {
    const grp = e.product.novaGroup;
    if (grp && grp >= 1 && grp <= 4) {
      novaCounts[grp] += 1;
    } else {
      novaCounts.unknown += 1;
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex items-center justify-between shadow-xs">
        <button
          onClick={() => handleShiftDay(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          aria-label="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {getDayLabel(selectedDate)}
          </h2>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            ({selectedDate})
          </span>
          {!isToday && (
            <button
              onClick={() => onSelectDate(formatISODate(new Date()))}
              className="ml-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md cursor-pointer"
            >
              Back to Today
            </button>
          )}
        </div>

        <button
          onClick={() => handleShiftDay(1)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          aria-label="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Nutrition KPI Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calorie Dial Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">Calories Balance</span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                {dayTotals.calories}
              </span>
              <span className="text-sm text-slate-500 font-mono tabular-nums">
                / {goals.calories} kcal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {remainingCalories > 0
                ? `${remainingCalories} kcal remaining for today`
                : `${dayTotals.calories - goals.calories} kcal over target`}
            </p>
          </div>

          {/* Calorie Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  dayTotals.calories > goals.calories ? 'bg-rose-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums mt-1.5">
              <span>0 kcal</span>
              <span>{caloriePercent}% completed</span>
              <span>{goals.calories} kcal</span>
            </div>
          </div>
        </div>

        {/* Macronutrient Bars */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
          <span className="text-xs font-bold text-slate-900 block">
            Macronutrient Targets
          </span>

          {/* Protein */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                Protein
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {dayTotals.proteins}g <span className="text-slate-400 font-normal">/ {goals.proteins}g</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <Wheat className="w-3.5 h-3.5 text-amber-500" />
                Carbohydrates
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {dayTotals.carbs}g <span className="text-slate-400 font-normal">/ {goals.carbs}g</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-rose-500" />
                Fats
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {dayTotals.fat}g <span className="text-slate-400 font-normal">/ {goals.fat}g</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Processing & Food Quality Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">Food Quality & Processing</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>

            {dayEntries.length > 0 ? (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-medium">NOVA 1 (Unprocessed):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{novaCounts[1]} items</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-800 font-medium">NOVA 2 (Culinary):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{novaCounts[2]} items</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-800 font-medium">NOVA 3 (Processed):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{novaCounts[3]} items</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-800 font-medium">NOVA 4 (Ultra-Processed):</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">{novaCounts[4]} items</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">
                No items logged yet today.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Fiber: <strong className="text-slate-800 font-mono tabular-nums">{dayTotals.fiber}g</strong></span>
            <span>Sugars: <strong className="text-slate-800 font-mono tabular-nums">{dayTotals.sugars}g</strong></span>
            <span>Sodium: <strong className="text-slate-800 font-mono tabular-nums">{dayTotals.sodium}g</strong></span>
          </div>
        </div>
      </div>

      {/* What You Ate Today - Visual Photo Gallery */}
      {dayEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                What You Ate Today · Food Photos
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {dayEntries.length} {dayEntries.length === 1 ? 'item' : 'items'} logged
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {dayEntries.map((item) => {
              const nutri = getNutriScoreDetails(item.product.nutriscoreGrade);
              return (
                <div
                  key={`photo-strip-${item.id}`}
                  className="w-36 shrink-0 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-emerald-500 transition-colors group"
                >
                  <div className="h-24 w-full bg-white flex items-center justify-center p-2 relative overflow-hidden border-b border-slate-100">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300 stroke-1" />
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold capitalize bg-slate-900/80 text-white px-1.5 py-0.2 rounded">
                      {item.mealType}
                    </span>
                    {item.product.nutriscoreGrade && (
                      <span
                        className={`absolute top-1.5 right-1.5 text-[9px] font-bold uppercase px-1 py-0.2 rounded text-white ${nutri.bgColor}`}
                      >
                        {item.product.nutriscoreGrade}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-slate-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono tabular-nums">
                      {item.calories} kcal · {item.quantityGrams}g
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meal Group Sections */}
      <div className="space-y-4">
        {meals.map((meal) => {
          const mealEntries = dayEntries.filter((e) => e.mealType === meal.type);
          const mealTotals = calculateDayTotals(mealEntries);

          return (
            <div
              key={meal.type}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
              {/* Meal Group Header */}
              <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{meal.label}</span>
                    <span className="text-xs font-normal text-slate-400">· {meal.iconTime}</span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    <span className="font-semibold text-slate-800">{mealTotals.calories} kcal</span>
                    <span>·</span>
                    <span>P: {mealTotals.proteins}g</span>
                    <span>·</span>
                    <span>C: {mealTotals.carbs}g</span>
                    <span>·</span>
                    <span>F: {mealTotals.fat}g</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenScannerForMeal(meal.type)}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Scan Food</span>
                </button>
              </div>

              {/* Food Item Rows */}
              {mealEntries.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {mealEntries.map((entry) => {
                    const nutri = getNutriScoreDetails(entry.product.nutriscoreGrade);
                    const nova = getNovaDetails(entry.product.novaGroup);

                    return (
                      <div
                        key={entry.id}
                        className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {entry.product.imageUrl ? (
                            <img
                              src={entry.product.imageUrl}
                              alt={entry.product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {entry.product.brand && (
                                <span className="text-xs font-semibold text-slate-500 truncate">
                                  {entry.product.brand}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${nutri.bgColor} ${nutri.textColor}`}
                              >
                                {entry.product.nutriscoreGrade || 'Score'}
                              </span>
                              {entry.product.novaGroup && (
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${nova.badgeColor}`}
                                >
                                  NOVA {entry.product.novaGroup}
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                              {entry.product.name}
                            </h4>

                            <p className="text-xs text-slate-500 font-mono tabular-nums">
                              {entry.quantityGrams}g portion · P: {entry.proteins}g · C: {entry.carbs}g · F: {entry.fat}g
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                            {entry.calories} <span className="text-xs text-slate-400 font-normal">kcal</span>
                          </span>
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  <p>No food logged for {meal.label.toLowerCase()} yet.</p>
                  <button
                    onClick={() => onOpenScannerForMeal(meal.type)}
                    className="mt-2 text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Scan barcode or search food</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
