import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore.js';
import { useNavigate } from 'react-router-dom';

// ── Assets ────────────────────────────────────────────────────────────────────
import jeevalinkLogo from '../assets/logo.png';
const DYFI_LOGO_SRC = '/idonate.png';

// ── Config ────────────────────────────────────────────────────────────────────
const DURATION = 3000;
const EXPO     = [0.16, 1, 0.3, 1];

// ── Motion helpers ────────────────────────────────────────────────────────────
const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, delay, ease: EXPO } },
});

const pop = {
  hidden:  { opacity: 0, scale: 0.84 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EXPO } },
};

const appear = (delay = 0) => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55, delay } },
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function Splash({ onComplete }) {
  const { token }  = useAuthStore();
  const timerRef   = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (onComplete) onComplete();
      else navigate(token ? '/donor/dashboard' : '/');
    }, DURATION);
    return () => clearTimeout(timerRef.current);
  }, [navigate, token, onComplete]);

  return (
    <>
      <style>{`
        @keyframes _bar_sweep {
          0%   { transform: translateX(-110%) scaleX(0.5); }
          50%  { transform: translateX(-5%)   scaleX(1);   }
          100% { transform: translateX(110%)  scaleX(0.5); }
        }
        ._bar { animation: _bar_sweep 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          ._bar { animation: none !important; opacity: 0.45; transform: none !important; }
        }
      `}</style>

      <main
        role="main"
        aria-label="Loading DYFI iDonate"
        aria-live="polite"
        aria-busy="true"
        style={{ fontFamily: "'Inter', 'Outfit', system-ui, sans-serif" }}
        className="fixed inset-0 z-[9999] flex flex-col w-full min-h-screen bg-white select-none overflow-hidden"
      >

        {/* ── CENTER BRAND BLOCK ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">

          {/* Logo — compact, well-shadowed */}
          <motion.div variants={pop} initial="hidden" animate="visible" style={{ marginBottom: '1.5rem' }}>
            <img
              src={DYFI_LOGO_SRC}
              alt="DYFI iDonate logo"
              draggable={false}
              style={{
                width:        'clamp(80px, 14vw, 112px)',
                height:       'clamp(80px, 14vw, 112px)',
                objectFit:    'contain',
                borderRadius: '24%',
                boxShadow:    '0 6px 24px -4px rgba(220,38,38,0.25), 0 2px 6px -1px rgba(220,38,38,0.10)',
                display:      'block',
              }}
            />
          </motion.div>

          {/* DYFI iDonate — primary wordmark */}
          <motion.h1
            variants={rise(0.20)}
            initial="hidden"
            animate="visible"
            aria-label="DYFI iDonate"
            style={{
              fontSize:      'clamp(2.1rem, 8.5vw, 3.25rem)',
              fontWeight:    800,
              letterSpacing: '-0.03em',
              lineHeight:    1,
              marginBottom:  '0.5rem',
              color:         '#111827',
            }}
          >
            <span style={{ color: '#DC2626' }}>DYFI </span>iDonate
          </motion.h1>


          {/* DYFI KASARAGOD — district tag */}
          <motion.p
            variants={rise(0.34)}
            initial="hidden"
            animate="visible"
            style={{
              fontSize:      'clamp(0.85rem, 2.8vw, 1rem)',
              fontWeight:    600,
              letterSpacing: '0.18em',
              color:         '#6B7280',
              textTransform: 'uppercase',
              marginBottom:  '2.5rem',
            }}
          >
            DYFI KASARAGOD
          </motion.p>

          {/* Loading bar + label */}
          <motion.div
            variants={appear(0.58)}
            initial="hidden"
            animate="visible"
            role="status"
            aria-label="Loading, please wait"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.55rem' }}
          >
            {/* Track */}
            <div
              style={{
                width:           'clamp(148px, 34vw, 200px)',
                height:          '4px',
                borderRadius:    '9999px',
                backgroundColor: '#F3F4F6',
                overflow:        'hidden',
                position:        'relative',
              }}
            >
              <div
                className="_bar"
                style={{
                  position:     'absolute',
                  inset:        0,
                  borderRadius: '9999px',
                  background:   'linear-gradient(90deg, transparent 0%, #DC2626 38%, #EF4444 62%, transparent 100%)',
                }}
              />
            </div>

            {/* LOADING label */}
            <p
              aria-hidden="true"
              style={{
                fontSize:      '0.58rem',
                fontWeight:    700,
                letterSpacing: '0.26em',
                color:         '#CBD5E1',
                textTransform: 'uppercase',
              }}
            >
              LOADING
            </p>
          </motion.div>

        </div>

        {/* ── FOOTER ── */}
        <motion.footer
          variants={appear(1.05)}
          initial="hidden"
          animate="visible"
          aria-label="Partner credits"
          style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            paddingBottom:  'clamp(1.25rem, 5vw, 2rem)',
            paddingLeft:    '1.5rem',
            paddingRight:   '1.5rem',
          }}
        >
          {/* associated with jeevalink */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.5rem', fontWeight: 500, letterSpacing: '0.18em', color: '#D1D5DB', textTransform: 'uppercase' }}>
              associated with
            </span>
            <img
              src={jeevalinkLogo}
              alt="JeevaLink"
              draggable={false}
              style={{ height: '18px', width: 'auto', objectFit: 'contain', opacity: 0.30, filter: 'grayscale(100%) brightness(0.5)' }}
            />
          </div>

          <div aria-hidden="true" style={{ width: '1px', height: '28px', backgroundColor: '#E5E7EB', margin: '0 1.2rem' }} />

          {/* developed by trawbit */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.5rem', fontWeight: 500, letterSpacing: '0.18em', color: '#D1D5DB', textTransform: 'uppercase' }}>
              developed by
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#BABEC8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Trawbit Technologies
            </span>
          </div>
        </motion.footer>

      </main>
    </>
  );
}
