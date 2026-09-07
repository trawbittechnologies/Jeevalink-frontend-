import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import lottie from 'lottie-web';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';

const DURATION = 3000;

export default function Splash({ onComplete }) {
  const { token } = useAuthStore();
  const timerRef = useRef(null);
  const lottieContainerRef = useRef(null);
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // Mount looping loading animation
  useEffect(() => {
    if (!lottieContainerRef.current) return;
    const anim = lottie.loadAnimation({
      container: lottieContainerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/hupng-mp4-to-lottie-1788790621586.json',
    });
    return () => anim.destroy();
  }, []);

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
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-slate-900 select-none overflow-hidden px-6 gap-6">

      {/* 1. Loading Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex items-center justify-center"
        style={{ width: 'min(75vw, 280px)', height: 'min(75vw, 280px)' }}
      >
        <div ref={lottieContainerRef} style={{ width: '100%', height: '100%', overflow: 'visible' }} />
      </motion.div>



      {/* 3. JeevaLink brand name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center gap-2"
      >
        <h1
          className="text-4xl font-bold tracking-tight leading-none text-slate-900"
          style={{ fontFamily: "'Comfortaa', sans-serif" }}
        >
          Jeeva<span className="text-red-600 font-bold">Link</span>
        </h1>
        <span className="mt-0.5 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          {Math.round(progress)}%
        </span>
      </motion.div>

      {/* 4. DYFI Kasaragod */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-0.5 -mt-2"
      >
        <span className="text-xl font-black text-red-600 tracking-tight">DYFI Kasaragod</span>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-8 text-[10px] text-slate-400 font-medium tracking-wide"
      >
        Powered by <span className="font-bold text-slate-600">Trawbit Technologies</span>
      </motion.p>
    </div>
  );
}
