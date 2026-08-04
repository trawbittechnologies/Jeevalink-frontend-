import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';

const DURATION = 3000;

export default function Splash({ onComplete }) {
  const { token } = useAuthStore();
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // Smooth real-time progress calculation
  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const pct = Math.min(((now - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Navigate on timer completion
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        navigate(token ? '/donor/dashboard' : '/');
      }
    }, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [navigate, token, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white text-slate-900 select-none overflow-hidden py-12 px-6">
      {/* Top spacer */}
      <div className="w-full" />

      {/* Main Content: Clean, Human, Handcrafted & Minimal */}
      <div className="flex flex-col items-center gap-8 text-center my-auto max-w-sm w-full">
        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative flex items-center justify-center"
        >
          <img
            src="/logo.png"
            alt="JeevaLink"
            className="w-28 h-32 sm:w-32 sm:h-36 object-contain drop-shadow-md"
          />
        </motion.div>

        {/* Brand Title & Human Copy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-col items-center gap-2"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Jeeva<span className="text-red-600">Link</span>
          </h1>
          <p className="text-sm font-normal text-slate-500 max-w-[260px] leading-relaxed">
            Connecting voluntary blood donors with patients across Kerala.
          </p>
        </motion.div>

        {/* Humanized Minimal Progress Line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="w-40 flex flex-col items-center gap-2 mt-2"
        >
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Loading...
          </span>
        </motion.div>
      </div>

      {/* Humanized Clean Credits Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center text-xs text-slate-500 pt-4 border-t border-slate-100 sm:border-0 w-full sm:w-auto"
      >
        <div className="flex items-center gap-1.5">
          <span className="font-normal text-slate-400 text-xs">Powered by</span>
          <span className="font-bold text-slate-800 text-sm">Trawbit Technologies</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <div className="flex items-center gap-1.5">
          <span className="font-normal text-slate-400 text-xs">Co-powered by</span>
          <span className="font-bold text-red-600 text-sm">DYFI Kasaragod</span>
        </div>
      </motion.div>
    </div>
  );
}
