import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Apple, ScanBarcode, Sparkles } from 'lucide-react';

interface MiniSplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const MiniSplashScreen: React.FC<MiniSplashScreenProps> = ({
  onFinish,
  durationMs = 1200,
}) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Animate progress bar quickly to 100%
    const pInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(pInterval);
          return 100;
        }
        return prev + 25;
      });
    }, durationMs / 5);

    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearTimeout(timer);
      clearInterval(pInterval);
    };
  }, [durationMs, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6 select-none"
          onClick={() => {
            setVisible(false);
            if (onFinish) onFinish();
          }}
        >
          {/* Logo & Scanning Icon container */}
          <div className="relative mb-6">
            {/* Soft background glow */}
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />

            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <Apple className="w-9 h-9 text-emerald-400" />

                {/* Laser scan line sweep */}
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="absolute left-0 right-0 h-0.5 bg-emerald-300 shadow-[0_0_8px_#34d399]"
                />
              </div>
            </div>

            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <ScanBarcode className="w-4 h-4" />
            </div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-center space-y-1"
          >
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
              <span>NutriScan</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Supermarket Barcode Nutrition & Calories Monitor
            </p>
          </motion.div>

          {/* Mini progress bar */}
          <div className="w-44 mt-8 space-y-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Starting up...</span>
              <span>{Math.min(100, progress)}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
