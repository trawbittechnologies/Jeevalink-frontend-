import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';

const DURATION = 3200;

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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-slate-50 via-white to-red-50/30 select-none overflow-hidden py-10 px-4">
      {/* Background ambient radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-red-500/10 via-red-500/0 to-transparent pointer-events-none blur-2xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-rose-400/5 pointer-events-none blur-3xl animate-pulse" />

      {/* Top spacer for alignment balance */}
      <div className="w-full h-4" />

      {/* Center content: Logo, Title, Loading Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-8 relative z-10 my-auto"
      >
        {/* Animated Logo Container with Pulse Rings */}
        <div className="relative flex items-center justify-center p-6">
          {/* Outer Pulsing Aura Ring 1 */}
          <motion.div
            animate={{ scale: [0.95, 1.3, 0.95], opacity: [0.3, 0, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
            className="absolute w-72 h-72 rounded-full border border-red-500/25 pointer-events-none"
          />

          {/* Inner Pulsing Ring 2 */}
          <motion.div
            animate={{ scale: [0.98, 1.15, 0.98], opacity: [0.4, 0.05, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut', delay: 0.4 }}
            className="absolute w-56 h-56 rounded-full border border-rose-500/30 pointer-events-none"
          />

          {/* Soft Glow Disc behind logo */}
          <div className="absolute w-44 h-44 rounded-full bg-red-500/10 blur-xl pointer-events-none" />

          {/* Logo Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="relative z-10 flex items-center justify-center p-4 rounded-3xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xl shadow-red-950/5"
          >
            <img
              src="/logo.png"
              alt="JeevaLink Logo"
              className="w-36 h-36 object-contain drop-shadow-md"
            />
          </motion.div>
        </div>

        {/* Brand Name & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-1.5 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Jeeva<span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Link</span>
          </h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Connecting Donors • Saving Lives
          </p>
        </motion.div>

        {/* Minimal Progress Bar & Percentage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col items-center gap-2.5 mt-2"
        >
          <div className="w-56 sm:w-64 h-2 rounded-full bg-slate-200/70 p-0.5 border border-slate-300/40 shadow-inner overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 transition-all duration-75 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            {Math.round(progress)}%
          </span>
        </motion.div>
      </motion.div>

      {/* Credits Branding Section (Increased Text Size & Glassmorphic Pill) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="relative z-10 mt-auto"
      >
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-200/50 px-6 sm:px-8 py-3.5 rounded-2xl sm:rounded-full flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left transition-all">
          {/* Powered by Trawbit */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Powered by
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Trawbit Technologies
            </span>
          </div>

          {/* Separator Dot / Line */}
          <div className="hidden sm:block h-4 w-[1.5px] bg-slate-300/80 rounded-full" />
          <div className="sm:hidden w-12 h-[1.5px] bg-slate-200 rounded-full" />

          {/* Co-powered by DYFI Kasaragod */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Co-powered by
            </span>
            <span className="text-sm sm:text-base font-extrabold text-red-600 tracking-tight">
              DYFI Kasaragod
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
