import React, { useState } from 'react';
import { Target, Check, RotateCcw } from 'lucide-react';
import { DailyNutritionGoals, DEFAULT_GOALS } from '../types/nutrition';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: DailyNutritionGoals;
  onSaveGoals: (goals: DailyNutritionGoals) => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  onClose,
  currentGoals,
  onSaveGoals,
}) => {
  const [goals, setGoals] = useState<DailyNutritionGoals>(currentGoals);

  if (!isOpen) return null;

  const presets = [
    {
      name: 'Balanced Nutrition',
      desc: 'Balanced everyday health & energy',
      goals: { calories: 2000, proteins: 120, carbs: 230, fat: 65, fiber: 30, sodium: 2.3 },
    },
    {
      name: 'High Protein / Active',
      desc: 'Muscle maintenance & recovery',
      goals: { calories: 2200, proteins: 160, carbs: 210, fat: 70, fiber: 35, sodium: 2.3 },
    },
    {
      name: 'Lower Carb Focus',
      desc: 'Reduced sugars & refined carbs',
      goals: { calories: 1850, proteins: 130, carbs: 120, fat: 95, fiber: 28, sodium: 2.0 },
    },
    {
      name: 'Heart Health & Low Sodium',
      desc: 'Plant-forward & low salt',
      goals: { calories: 1900, proteins: 105, carbs: 250, fat: 55, fiber: 38, sodium: 1.5 },
    },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoals(goals);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daily Nutrition Goals
              </h3>
              <p className="text-xs text-slate-500">
                Configure your daily calorie & macronutrient targets
              </p>
            </div>
          </div>
          <button
            onClick={() => setGoals(DEFAULT_GOALS)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5">
          {/* Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Quick Diet Presets:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setGoals(preset.goals)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer text-xs"
                >
                  <span className="font-bold text-slate-800 block truncate">{preset.name}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{preset.desc}</span>
                  <span className="text-[10px] text-emerald-700 font-mono tabular-nums block mt-1">
                    {preset.goals.calories} kcal · {preset.goals.proteins}g P
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Calories (kcal)
              </label>
              <input
                type="number"
                min={800}
                max={5000}
                step={50}
                value={goals.calories}
                onChange={(e) => setGoals({ ...goals, calories: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Protein Target (g)
              </label>
              <input
                type="number"
                min={20}
                max={350}
                value={goals.proteins}
                onChange={(e) => setGoals({ ...goals, proteins: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Carbohydrates Target (g)
              </label>
              <input
                type="number"
                min={20}
                max={600}
                value={goals.carbs}
                onChange={(e) => setGoals({ ...goals, carbs: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fats Target (g)
              </label>
              <input
                type="number"
                min={15}
                max={250}
                value={goals.fat}
                onChange={(e) => setGoals({ ...goals, fat: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dietary Fiber (g)
              </label>
              <input
                type="number"
                min={10}
                max={80}
                value={goals.fiber}
                onChange={(e) => setGoals({ ...goals, fiber: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sodium Max (g)
              </label>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={goals.sodium}
                onChange={(e) => setGoals({ ...goals, sodium: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Goals</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
