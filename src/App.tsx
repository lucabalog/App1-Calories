import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './components/TopBar';
import { DailyDiaryView } from './components/DailyDiaryView';
import { ProductDetailCard } from './components/ProductDetailCard';
import { ScannerModal } from './components/ScannerModal';
import { ScanHistoryView } from './components/ScanHistoryView';
import { GoalsModal } from './components/GoalsModal';
import { InsightsView } from './components/InsightsView';
import { MiniSplashScreen } from './components/MiniSplashScreen';
import {
  ProductNutrition,
  MealLogEntry,
  MealType,
  DailyNutritionGoals,
  DEFAULT_GOALS,
} from './types/nutrition';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { formatISODate, calculateServingNutrients } from './utils/nutritionCalculations';
import { Calendar, History, Target, ScanBarcode, TrendingUp, X } from 'lucide-react';

const STORAGE_KEYS = {
  ENTRIES: 'nutriscan_meal_entries',
  GOALS: 'nutriscan_goals',
  HISTORY: 'nutriscan_scanned_history',
};

// Generates rich sample entries across the last 6 days for immediate weekly charts
function generateInitialEntries(): MealLogEntry[] {
  const list: MealLogEntry[] = [];
  const pYogurt = SAMPLE_PRODUCTS[0]; // Fage
  const pBeans = SAMPLE_PRODUCTS[1];  // Heinz
  const pOatMilk = SAMPLE_PRODUCTS[2]; // Oatly
  const pPasta = SAMPLE_PRODUCTS[3];  // Barilla
  const pOats = SAMPLE_PRODUCTS[6];   // Quaker

  const now = new Date();

  // Helper to add entry
  const add = (daysAgo: number, meal: MealType, product: ProductNutrition, grams: number, idSuffix: string) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    const dateStr = formatISODate(d);
    const n = calculateServingNutrients(product, grams);

    list.push({
      id: `seed-${daysAgo}-${idSuffix}`,
      date: dateStr,
      mealType: meal,
      product,
      quantityGrams: grams,
      calories: n.calories,
      proteins: n.proteins,
      carbs: n.carbs,
      fat: n.fat,
      sugars: n.sugars,
      fiber: n.fiber,
      sodium: n.sodium,
      timestamp: d.getTime() + (meal === 'breakfast' ? 3600000 * 8 : meal === 'lunch' ? 3600000 * 13 : 3600000 * 19),
    });
  };

  // Today (0 days ago)
  add(0, 'breakfast', pYogurt, 170, 'bf1');
  add(0, 'breakfast', pOats, 40, 'bf2');
  add(0, 'lunch', pPasta, 100, 'lu1');
  add(0, 'snack', pOatMilk, 200, 'sn1');
  add(0, 'dinner', pBeans, 200, 'di1');

  // 1 day ago (Yesterday)
  add(1, 'breakfast', pOats, 50, 'bf');
  add(1, 'lunch', pBeans, 250, 'lu');
  add(1, 'dinner', pPasta, 120, 'di');
  add(1, 'snack', pYogurt, 150, 'sn');

  // 2 days ago
  add(2, 'breakfast', pYogurt, 200, 'bf');
  add(2, 'lunch', pPasta, 90, 'lu');
  add(2, 'dinner', pBeans, 200, 'di');

  // 3 days ago
  add(3, 'breakfast', pOats, 45, 'bf');
  add(3, 'snack', pOatMilk, 250, 'sn');
  add(3, 'lunch', pBeans, 200, 'lu');
  add(3, 'dinner', pPasta, 110, 'di');

  // 4 days ago
  add(4, 'breakfast', pYogurt, 170, 'bf');
  add(4, 'lunch', pPasta, 100, 'lu');
  add(4, 'dinner', pBeans, 200, 'di');

  // 5 days ago
  add(5, 'breakfast', pOats, 40, 'bf');
  add(5, 'lunch', pBeans, 220, 'lu');
  add(5, 'dinner', pPasta, 95, 'di');

  // 6 days ago
  add(6, 'breakfast', pYogurt, 170, 'bf');
  add(6, 'lunch', pPasta, 110, 'lu');
  add(6, 'dinner', pBeans, 200, 'di');

  return list;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<'diary' | 'insights' | 'history' | 'goals'>('diary');
  const [selectedDate, setSelectedDate] = useState<string>(formatISODate(new Date()));
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [targetMeal, setTargetMeal] = useState<MealType | undefined>(undefined);
  const [inspectedProduct, setInspectedProduct] = useState<ProductNutrition | null>(null);

  // Initialize goals from localStorage
  const [goals, setGoals] = useState<DailyNutritionGoals>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      return saved ? JSON.parse(saved) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  // Initialize scan history
  const [scannedHistory, setScannedHistory] = useState<ProductNutrition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : SAMPLE_PRODUCTS.slice(0, 6);
    } catch {
      return SAMPLE_PRODUCTS.slice(0, 6);
    }
  });

  // Initialize meal entries (with sample entries for the week so Recharts is immediately populated)
  const [entries, setEntries] = useState<MealLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return generateInitialEntries();
    } catch {
      return generateInitialEntries();
    }
  });

  // Persist entries
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to save entries to localStorage', e);
    }
  }, [entries]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(scannedHistory));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [scannedHistory]);

  // Persist goals
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.warn('Failed to save goals to localStorage', e);
    }
  }, [goals]);

  // Handle scanned product found
  const handleProductFound = (product: ProductNutrition) => {
    // Add to scan history if not already there
    setScannedHistory((prev) => {
      const exists = prev.some((p) => p.barcode === product.barcode);
      if (exists) return prev;
      return [product, ...prev];
    });

    // Open detail inspection card
    setInspectedProduct(product);
  };

  // Add meal to diary
  const handleAddToDiary = (
    product: ProductNutrition,
    mealType: MealType,
    quantityGrams: number
  ) => {
    const nutrients = calculateServingNutrients(product, quantityGrams);
    const newEntry: MealLogEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: selectedDate,
      mealType,
      product,
      quantityGrams,
      calories: nutrients.calories,
      proteins: nutrients.proteins,
      carbs: nutrients.carbs,
      fat: nutrients.fat,
      sugars: nutrients.sugars,
      fiber: nutrients.fiber,
      sodium: nutrients.sodium,
      timestamp: Date.now(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setCurrentTab('diary');
  };

  // Delete diary entry
  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Open scanner for specific meal
  const handleOpenScannerForMeal = (meal: MealType) => {
    setTargetMeal(meal);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased pb-20 md:pb-10">
      {/* Mini loading splash screen when app is starting */}
      {showSplash && (
        <MiniSplashScreen onFinish={() => setShowSplash(false)} durationMs={1200} />
      )}

      {/* Top Bar adhering to Top Bar Contract (hidden on mobile) */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'goals') {
            setIsGoalsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenScanner={() => {
          setTargetMeal('breakfast');
          setIsScannerOpen(true);
        }}
      />

      {/* Main Container with Smooth Animated View Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* If user clicked to inspect a product, show the Detail Card */}
        {inspectedProduct && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Scanned Product Nutrition Analysis
              </h2>
              <button
                onClick={() => setInspectedProduct(null)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Dismiss Card</span>
              </button>
            </div>
            <ProductDetailCard
              product={inspectedProduct}
              initialMealType={targetMeal || 'breakfast'}
              onAddToDiary={handleAddToDiary}
              onClose={() => setInspectedProduct(null)}
            />
          </div>
        )}

        {/* Animated View Transitions between tabs */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentTab === 'diary' && (
              <DailyDiaryView
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                entries={entries}
                goals={goals}
                onDeleteEntry={handleDeleteEntry}
                onOpenScannerForMeal={handleOpenScannerForMeal}
              />
            )}

            {currentTab === 'insights' && (
              <InsightsView
                entries={entries}
                goals={goals}
                onSelectDate={(d) => setSelectedDate(d)}
                onSwitchToDiary={() => setCurrentTab('diary')}
              />
            )}

            {currentTab === 'history' && (
              <ScanHistoryView
                scannedHistory={scannedHistory}
                onSelectProduct={(p) => setInspectedProduct(p)}
                onClearHistory={() => setScannedHistory([])}
                onOpenScanner={() => {
                  setTargetMeal('snack');
                  setIsScannerOpen(true);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Ergonomic Bottom Tab Bar (Pattern 1 from Mobile Guidelines) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setCurrentTab('diary')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
              currentTab === 'diary' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Diary</span>
          </button>

          <button
            onClick={() => setCurrentTab('insights')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
              currentTab === 'insights' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Insights</span>
          </button>

          <button
            onClick={() => {
              setTargetMeal('snack');
              setIsScannerOpen(true);
            }}
            className="flex flex-col items-center justify-center text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center -mt-2 shadow-sm">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 tracking-tight mt-0.5">Scan</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
              currentTab === 'history' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">History</span>
          </button>

          <button
            onClick={() => setIsGoalsOpen(true)}
            className="flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Target className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Goals</span>
          </button>
        </div>
      </nav>

      {/* Barcode & AI Label Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProductFound={handleProductFound}
        targetMeal={targetMeal}
      />

      {/* Goals Modal */}
      <GoalsModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        currentGoals={goals}
        onSaveGoals={setGoals}
      />
    </div>
  );
}
