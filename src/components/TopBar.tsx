import React from 'react';
import { ScanBarcode, Apple } from 'lucide-react';

interface TopBarProps {
  currentTab: 'diary' | 'insights' | 'history' | 'goals';
  onSelectTab: (tab: 'diary' | 'insights' | 'history' | 'goals') => void;
  onOpenScanner: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenScanner,
}) => {
  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Apple className="w-5 h-5" />
          </div>
          <button
            onClick={() => onSelectTab('diary')}
            className="text-left group cursor-pointer"
          >
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              NutriScan
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('diary')}
            className={`cursor-pointer whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'diary'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Daily Diary
          </button>
          <button
            onClick={() => onSelectTab('insights')}
            className={`cursor-pointer whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'insights'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`cursor-pointer whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'history'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Scan History
          </button>
          <button
            onClick={() => onSelectTab('goals')}
            className={`cursor-pointer whitespace-nowrap transition-colors pb-1 border-b-2 ${
              currentTab === 'goals'
                ? 'border-emerald-600 text-emerald-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Nutrition Goals
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenScanner}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <ScanBarcode className="w-4 h-4" />
            <span>Scan Product</span>
          </button>
        </div>
      </div>
    </header>
  );
};
