import React from 'react';
import { History, ArrowRight, Package, Trash2, ScanBarcode } from 'lucide-react';
import { ProductNutrition } from '../types/nutrition';
import { getNutriScoreDetails, getNovaDetails } from '../utils/nutritionCalculations';

interface ScanHistoryViewProps {
  scannedHistory: ProductNutrition[];
  onSelectProduct: (product: ProductNutrition) => void;
  onClearHistory: () => void;
  onOpenScanner: () => void;
}

export const ScanHistoryView: React.FC<ScanHistoryViewProps> = ({
  scannedHistory,
  onSelectProduct,
  onClearHistory,
  onOpenScanner,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Scanned Supermarket Products
            </h3>
            <p className="text-xs text-slate-500">
              All barcodes and food labels you've inspected
            </p>
          </div>
        </div>

        {scannedHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {scannedHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {scannedHistory.map((product) => {
            const nutri = getNutriScoreDetails(product.nutriscoreGrade);
            const nova = getNovaDetails(product.novaGroup);

            return (
              <div
                key={product.barcode + product.name}
                onClick={() => onSelectProduct(product)}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {product.brand && (
                        <span className="text-xs font-semibold text-slate-500 truncate">
                          {product.brand}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${nutri.bgColor} ${nutri.textColor}`}
                      >
                        Score {product.nutriscoreGrade || 'N/A'}
                      </span>
                      {product.novaGroup && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${nova.badgeColor}`}
                        >
                          NOVA {product.novaGroup}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 truncate mt-0.5">
                      {product.name}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mt-1">
                      <span className="font-semibold text-slate-800">{product.caloriesPer100g} kcal/100g</span>
                      <span>·</span>
                      <span>P: {product.proteinsPer100g}g</span>
                      <span>·</span>
                      <span>C: {product.carbsPer100g}g</span>
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ScanBarcode className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">No scanned items yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Scan product barcodes at the supermarket or upload nutrition labels to build your personal food library.
            </p>
          </div>
          <button
            onClick={onOpenScanner}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <ScanBarcode className="w-4 h-4" />
            <span>Scan First Product</span>
          </button>
        </div>
      )}
    </div>
  );
};
