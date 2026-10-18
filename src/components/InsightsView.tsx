import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Dumbbell,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MealLogEntry, DailyNutritionGoals, MealType } from '../types/nutrition';
import { formatISODate, getNutriScoreDetails, getNovaDetails } from '../utils/nutritionCalculations';

interface InsightsViewProps {
  entries: MealLogEntry[];
  goals: DailyNutritionGoals;
  onSelectDate: (date: string) => void;
  onSwitchToDiary: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  entries,
  goals,
  onSelectDate,
  onSwitchToDiary,
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'calories' | 'protein' | 'both'>('both');
  const [photoFilterMeal, setPhotoFilterMeal] = useState<'all' | MealType>('all');
  const [selectedPhotoEntry, setSelectedPhotoEntry] = useState<MealLogEntry | null>(null);

  // Generate the last 7 days array
  const weeklyData = useMemo(() => {
    const days: {
      date: string;
      dayLabel: string;
      shortDay: string;
      calories: number;
      proteins: number;
      carbs: number;
      fat: number;
      targetCalories: number;
      targetProteins: number;
      calorieDelta: number;
      proteinDelta: number;
      itemsCount: number;
      entries: MealLogEntry[];
    }[] = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = formatISODate(d);
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dayNum = d.getDate();
      const dayLabel = `${dayName} ${dayNum}`;

      const dayEntries = entries.filter((e) => e.date === iso);
      const dayCalories = dayEntries.reduce((sum, e) => sum + e.calories, 0);
      const dayProteins = Number(dayEntries.reduce((sum, e) => sum + e.proteins, 0).toFixed(1));
      const dayCarbs = Number(dayEntries.reduce((sum, e) => sum + e.carbs, 0).toFixed(1));
      const dayFat = Number(dayEntries.reduce((sum, e) => sum + e.fat, 0).toFixed(1));

      days.push({
        date: iso,
        dayLabel,
        shortDay: dayName,
        calories: dayCalories,
        proteins: dayProteins,
        carbs: dayCarbs,
        fat: dayFat,
        targetCalories: goals.calories,
        targetProteins: goals.proteins,
        calorieDelta: dayCalories - goals.calories,
        proteinDelta: Number((dayProteins - goals.proteins).toFixed(1)),
        itemsCount: dayEntries.length,
        entries: dayEntries,
      });
    }
    return days;
  }, [entries, goals]);

  // Aggregate weekly statistics
  const weeklyStats = useMemo(() => {
    const totalCals = weeklyData.reduce((acc, d) => acc + d.calories, 0);
    const totalProt = weeklyData.reduce((acc, d) => acc + d.proteins, 0);
    const activeDays = weeklyData.filter((d) => d.itemsCount > 0).length || 1;
    const avgCalories = Math.round(totalCals / activeDays);
    const avgProtein = Number((totalProt / activeDays).toFixed(1));

    const daysCalorieTargetHit = weeklyData.filter(
      (d) => d.itemsCount > 0 && Math.abs(d.calories - goals.calories) <= 150
    ).length;

    const daysProteinTargetHit = weeklyData.filter(
      (d) => d.itemsCount > 0 && d.proteins >= goals.proteins
    ).length;

    return {
      avgCalories,
      avgProtein,
      daysCalorieTargetHit,
      daysProteinTargetHit,
      totalEatenItems: entries.length,
    };
  }, [weeklyData, goals, entries]);

  // Extract all logged entries for "What You Ate" visual photo gallery
  const eatenMealsWithImages = useMemo(() => {
    const filtered = photoFilterMeal === 'all'
      ? entries
      : entries.filter((e) => e.mealType === photoFilterMeal);

    // Sort newest first
    return [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  }, [entries, photoFilterMeal]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">
            {data.dayLabel} ({data.date})
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-emerald-400 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Calories:
            </span>
            <span className="font-mono tabular-nums font-bold">
              {data.calories} / {goals.calories} kcal
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-blue-400 flex items-center gap-1">
              <Dumbbell className="w-3 h-3" /> Protein:
            </span>
            <span className="font-mono tabular-nums font-bold">
              {data.proteins} / {goals.proteins}g
            </span>
          </div>

          <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            {data.itemsCount} {data.itemsCount === 1 ? 'item' : 'items'} logged this day
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header / Context */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Weekly Performance & Visual Log</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Nutrition Insights & What You Ate
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare 7-day caloric and protein intake against your daily benchmarks and view your meal photos
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveMetricTab('both')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeMetricTab === 'both'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Metrics
          </button>
          <button
            onClick={() => setActiveMetricTab('calories')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeMetricTab === 'calories'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calories
          </button>
          <button
            onClick={() => setActiveMetricTab('protein')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeMetricTab === 'protein'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Protein
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Avg Daily Calories</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {weeklyStats.avgCalories}
            <span className="text-xs text-slate-500 font-sans font-normal ml-1">kcal</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 block">
            Target: {goals.calories} kcal
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Avg Daily Protein</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {weeklyStats.avgProtein}
            <span className="text-xs text-slate-500 font-sans font-normal ml-1">g</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5 block">
            Target: {goals.proteins}g
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Protein Goal Achieved</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums mt-1">
            {weeklyStats.daysProteinTargetHit}
            <span className="text-xs text-slate-500 font-sans font-normal ml-1">/ 7 days</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            ≥ {goals.proteins}g daily goal
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Logged Food Items</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1">
            {weeklyStats.totalEatenItems}
            <span className="text-xs text-slate-500 font-sans font-normal ml-1">foods</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across your meal logs
          </span>
        </div>
      </div>

      {/* RECHARTS SECTION 1: WEEKLY CALORIES VS DAILY GOAL */}
      {(activeMetricTab === 'calories' || activeMetricTab === 'both') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Weekly Calories vs Set Daily Goal</span>
              </h3>
              <p className="text-xs text-slate-500">
                Dashed green line marks your daily target of {goals.calories} kcal
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
                <span className="text-slate-600 font-medium">Daily Calories</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-600 border-t border-dashed border-emerald-600 inline-block" />
                <span className="text-emerald-700 font-semibold font-mono tabular-nums">
                  Target ({goals.calories} kcal)
                </span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onSelectDate(e.activePayload[0].payload.date);
                    onSwitchToDiary();
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  unit=" kcal"
                  domain={[0, (dataMax: number) => Math.max(dataMax + 200, goals.calories + 300)]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={goals.calories}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Daily Goal: ${goals.calories} kcal`,
                    position: 'top',
                    fill: '#059669',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="calories"
                  name="Calories (kcal)"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                >
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cal-cell-${index}`}
                      fill={entry.calories > goals.calories + 200 ? '#F43F5E' : '#059669'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Click on any day's bar to jump directly to that date in your Daily Diary.
          </p>
        </div>
      )}

      {/* RECHARTS SECTION 2: WEEKLY PROTEIN VS DAILY GOAL */}
      {(activeMetricTab === 'protein' || activeMetricTab === 'both') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-600" />
                <span>Weekly Protein Intake vs Set Daily Goal</span>
              </h3>
              <p className="text-xs text-slate-500">
                Dashed blue line marks your daily protein target of {goals.proteins}g
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                <span className="text-slate-600 font-medium">Protein (g)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-600 border-t border-dashed border-blue-600 inline-block" />
                <span className="text-blue-700 font-semibold font-mono tabular-nums">
                  Target ({goals.proteins}g)
                </span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onSelectDate(e.activePayload[0].payload.date);
                    onSwitchToDiary();
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  unit="g"
                  domain={[0, (dataMax: number) => Math.max(dataMax + 20, goals.proteins + 30)]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={goals.proteins}
                  stroke="#2563EB"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Daily Goal: ${goals.proteins}g`,
                    position: 'top',
                    fill: '#2563EB',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="proteins"
                  name="Protein (g)"
                  fill="#3B82F6"
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SECTION 3: "WHAT YOU ATE" VISUAL PHOTO GALLERY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                What You Ate · Visual Food Photo Gallery
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Images of food products and packaging logged to your meals
            </p>
          </div>

          {/* Meal Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPhotoFilterMeal(m)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors capitalize cursor-pointer ${
                  photoFilterMeal === m
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {eatenMealsWithImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {eatenMealsWithImages.map((entry) => {
              const nutri = getNutriScoreDetails(entry.product.nutriscoreGrade);
              const nova = getNovaDetails(entry.product.novaGroup);

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedPhotoEntry(entry)}
                  className="bg-slate-50/60 rounded-xl border border-slate-200 hover:border-emerald-500 overflow-hidden cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
                >
                  {/* Image Container with Fallback */}
                  <div className="relative aspect-square w-full bg-white flex items-center justify-center p-3 overflow-hidden border-b border-slate-100">
                    {entry.product.imageUrl ? (
                      <img
                        src={entry.product.imageUrl}
                        alt={entry.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Package className="w-10 h-10 stroke-1" />
                        <span className="text-[10px] text-slate-400 mt-1">Supermarket Food</span>
                      </div>
                    )}

                    {/* Meal Type Tag */}
                    <span className="absolute top-2 left-2 text-[10px] font-semibold capitalize bg-white/90 backdrop-blur-md text-slate-800 px-2 py-0.5 rounded-md shadow-xs border border-slate-200">
                      {entry.mealType}
                    </span>

                    {/* Nutri-Score badge */}
                    <span
                      className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shadow-xs ${nutri.bgColor} ${nutri.textColor}`}
                    >
                      {entry.product.nutriscoreGrade ? `Score ${entry.product.nutriscoreGrade}` : 'Score N/A'}
                    </span>
                  </div>

                  {/* Caption & Macros */}
                  <div className="p-3 space-y-1">
                    {entry.product.brand && (
                      <span className="text-[11px] font-semibold text-slate-500 block truncate">
                        {entry.product.brand}
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                      {entry.product.name}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums pt-1 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-800">{entry.calories} kcal</span>
                      <span className="text-emerald-700 font-medium">{entry.proteins}g P</span>
                      <span className="text-slate-400 font-sans text-[10px]">{entry.date.slice(5)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-400">
            No meals logged for this filter category yet.
          </div>
        )}
      </div>

      {/* Selected Meal Photo Lightbox Modal */}
      {selectedPhotoEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold capitalize text-emerald-700">
                  {selectedPhotoEntry.mealType} · {selectedPhotoEntry.date}
                </span>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedPhotoEntry.product.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPhotoEntry(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-slate-900 flex items-center justify-center max-h-80 overflow-hidden">
              {selectedPhotoEntry.product.imageUrl ? (
                <img
                  src={selectedPhotoEntry.product.imageUrl}
                  alt={selectedPhotoEntry.product.name}
                  referrerPolicy="no-referrer"
                  className="max-h-72 w-auto object-contain"
                />
              ) : (
                <div className="text-white/60 text-xs">No image uploaded</div>
              )}
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Calories</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{selectedPhotoEntry.calories} kcal</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Protein</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{selectedPhotoEntry.proteins}g</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Carbs</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{selectedPhotoEntry.carbs}g</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Portion</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{selectedPhotoEntry.quantityGrams}g</span>
                </div>
              </div>

              {selectedPhotoEntry.product.ingredientsText && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] max-h-24 overflow-y-auto">
                  <strong className="text-slate-800">Ingredients: </strong>
                  {selectedPhotoEntry.product.ingredientsText}
                </div>
              )}

              <button
                onClick={() => {
                  onSelectDate(selectedPhotoEntry.date);
                  setSelectedPhotoEntry(null);
                  onSwitchToDiary();
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                View in Diary ({selectedPhotoEntry.date})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
