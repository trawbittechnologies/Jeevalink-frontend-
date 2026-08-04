import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';

const DURATION = 3400;

const QUOTES = [
  "“Every drop counts, every donor is a hero.”",
  "“Connecting hearts, saving lives across Kerala.”",
  "“Be the reason for someone's heartbeat today.”",
  "“Your blood donation can save up to 3 lives.”"
];

export default function Splash({ onComplete }) {
  const { token } = useAuthStore();
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

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

  // Cycle through quotes smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 1500);
    return () => clearInterval(interval);
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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-slate-50 via-white to-red-50/20 select-none overflow-hidden py-10 px-4">
      {/* Soft ambient background backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      <div className="w-full h-4" />

      {/* Center content: Logo, Animated "JeevaLink", Quotes & Progress */}
      <div className="flex flex-col items-center gap-7 relative z-10 my-auto max-w-sm w-full">
        {/* Minimal Animated Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center"
        >
          {/* Subtle Ambient Pulse Glow */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.05, 0.25] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute w-44 h-44 rounded-full bg-red-500/10 blur-xl pointer-events-none"
          />

          <img
            src="/logo.png"
            alt="JeevaLink Logo"
            className="w-32 h-36 object-contain drop-shadow-xl filter transition-transform duration-500 hover:scale-105"
          />
        </motion.div>

        {/* Animated Brand Name "JeevaLink" */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-0.5">
            <span className="text-slate-900">Jeeva</span>
            <motion.span
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 bg-clip-text text-transparent"
            >
              Link
            </motion.span>
          </h1>

          {/* Animated Quotes Carousel */}
          <div className="h-10 flex items-center justify-center px-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={quoteIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="text-xs font-semibold text-slate-500 italic text-center tracking-wide line-clamp-1 max-w-xs"
              >
                {QUOTES[quoteIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Minimal Line Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="w-48 flex flex-col items-center gap-2"
        >
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-75 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            {Math.round(progress)}%
          </span>
        </motion.div>
      </div>

      {/* Credits Branding Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 mt-auto"
      >
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-md shadow-slate-200/40 px-6 sm:px-8 py-3 rounded-full flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Powered by
            </span>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              Trawbit Technologies
            </span>
          </div>

          <div className="hidden sm:block h-4 w-[1.5px] bg-slate-300/80 rounded-full" />
          <div className="sm:hidden w-12 h-[1.5px] bg-slate-200 rounded-full" />

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Co-powered by
            </span>
            <span className="text-sm font-extrabold text-red-600 tracking-tight">
              DYFI Kasaragod
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
