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

  // Smooth real-time progress bar calculation
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        zIndex: 9999,
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Soft radial background glow */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, rgba(255,255,255,0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo + progress container */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}
      >
        {/* Logo with enlarged pulse rings */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer Ring */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              border: '1.8px solid rgba(220,38,38,0.3)',
            }}
          />
          {/* Inner Ring */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.05, 0.35] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 0.5 }}
            style={{
              position: 'absolute',
              width: '230px',
              height: '230px',
              borderRadius: '50%',
              border: '1.2px solid rgba(220,38,38,0.2)',
            }}
          />

          {/* Official JeevaLink Logo Image ONLY (Size++) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/logo.png"
              alt="JeevaLink Logo"
              style={{
                width: '190px',
                height: '190px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 12px 24px rgba(220,38,38,0.25))',
              }}
            />
          </motion.div>
        </div>

        {/* Slim progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          style={{ width: '180px' }}
        >
          <div
            style={{
              width: '100%',
              height: '3px',
              borderRadius: '99px',
              background: 'rgba(0,0,0,0.07)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: '99px',
                background: 'linear-gradient(90deg, #dc2626, #f87171)',
                transition: 'width 80ms linear',
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Fixed footer branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{
          position: 'absolute',
          bottom: '28px',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        <span style={{ fontSize: '9.5px', letterSpacing: '0.14em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
          Powered by
        </span>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#111827', letterSpacing: '0.01em' }}>
          Trawbit Technologies
        </span>
        <div style={{ width: '20px', height: '1px', background: '#e5e7eb', margin: '5px 0' }} />
        <span style={{ fontSize: '9.5px', letterSpacing: '0.14em', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
          Co-powered by
        </span>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#dc2626', letterSpacing: '0.01em' }}>
          DYFI Kasaragod
        </span>
      </motion.div>
    </div>
  );
}
