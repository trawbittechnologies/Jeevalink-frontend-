import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';

const DURATION = 2600;

export default function Splash({ onComplete }) {
  const { token } = useAuthStore();
  const timerRef = useRef(null);
  const navigate = useNavigate();

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
      style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white text-slate-900 select-none overflow-hidden"
    >
      {/* ── Main Center Composition ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">

        {/* 1. iDonate — Primary, dominant wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 9vw, 3.5rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: '#0f172a',
            }}
          >
            <span style={{ color: '#dc2626' }}>i</span>Donate
          </h1>
        </motion.div>


        {/* 2. by DYFI Kasaragod — secondary, with logo */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-2 mb-4"
        >
          <span
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#dc2626',
              textTransform: 'uppercase',
            }}
          >
            by DYFI Kasaragod
          </span>
        </motion.div>

        {/* 3. Associated with JeevaLink — subtle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
          style={{
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: '#94a3b8',
            textTransform: 'uppercase',
          }}
        >
          Associated with JeevaLink
        </motion.p>

        {/* Minimal pulse loader */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ marginTop: '2.5rem', display: 'flex', gap: '6px', alignItems: 'center' }}
        >
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.2,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#dc2626',
                display: 'block',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* 4. Development by Trawbit Technologies — discreet footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.6 }}
        style={{ paddingBottom: '2rem', textAlign: 'center' }}
      >
        <p
          style={{
            fontSize: '0.625rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            color: '#cbd5e1',
            textTransform: 'uppercase',
          }}
        >
          Development by{' '}
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Trawbit Technologies</span>
        </p>
      </motion.div>
    </div>
  );
}
