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
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: EXPO } },
});

const pop = {
  hidden:  { opacity: 0, scale: 0.82 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.75, ease: EXPO } },
};

const appear = (delay = 0) => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, delay } },
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
          0%   { transform: translateX(-110%) scaleX(0.6); }
          50%  { transform: translateX(-10%)  scaleX(1);   }
          100% { transform: translateX(110%)  scaleX(0.6); }
        }
        ._bar { animation: _bar_sweep 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          ._bar { animation: none !important; opacity: 0.5; transform: none !important; }
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
        {/* CENTER */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">

          {/* Logo */}
          <motion.div variants={pop} initial="hidden" animate="visible" className="mb-8">
            <img
              src={DYFI_LOGO_SRC}
              alt="DYFI iDonate logo"
              draggable={false}
              style={{
                width:        'clamp(72px, 13vw, 108px)',
                height:       'clamp(72px, 13vw, 108px)',
                objectFit:    'contain',
                borderRadius: '22%',
                boxShadow:    '0 8px 32px -4px rgba(220,38,38,0.22), 0 2px 8px -2px rgba(220,38,38,0.12)',
              }}
            />
          </motion.div>

          {/* DYFI iDonate wordmark */}
          <motion.h1
            variants={rise(0.22)}
            initial="hidden"
            animate="visible"
            aria-label="DYFI iDonate"
            style={{
              fontSize:      'clamp(2rem, 8vw, 3rem)',
              fontWeight:    800,
              letterSpacing: '-0.03em',
              lineHeight:    1,
              marginBottom:  '0.55rem',
            }}
          >
            <span style={{ color: '#DC2626' }}>DYFI </span>
            <span style={{ color: '#111827' }}>iDonate</span>
          </motion.h1>

          {/* Malayalam */}
          <motion.p
            lang="ml"
            variants={rise(0.36)}
            initial="hidden"
            animate="visible"
            style={{
              fontSize:     'clamp(1rem, 3.8vw, 1.35rem)',
              fontWeight:   700,
              color:        '#DC2626',
              lineHeight:   1.4,
              marginBottom: '0.45rem',
            }}
          >
            രക്തദാന സേന
          </motion.p>

          {/* DYFI KASARAGOD */}
          <motion.p
            variants={rise(0.48)}
            initial="hidden"
            animate="visible"
            style={{
              fontSize:      'clamp(0.6rem, 1.8vw, 0.72rem)',
              fontWeight:    600,
              letterSpacing: '0.2em',
              color:         '#9CA3AF',
              textTransform: 'uppercase',
              marginBottom:  '2.8rem',
            }}
          >
            DYFI KASARAGOD
          </motion.p>

          {/* Loading bar */}
          <motion.div
            variants={appear(0.78)}
            initial="hidden"
            animate="visible"
            role="status"
            aria-label="Loading, please wait"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}
          >
            <div
              style={{
                width:           'clamp(140px, 32vw, 192px)',
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
                  background:   'linear-gradient(90deg, transparent 0%, #DC2626 40%, #EF4444 60%, transparent 100%)',
                }}
              />
            </div>
            <p
              aria-hidden="true"
              style={{
                fontSize:      '0.55rem',
                fontWeight:    700,
                letterSpacing: '0.28em',
                color:         '#C4C8D0',
                textTransform: 'uppercase',
              }}
            >
              LOADING
            </p>
          </motion.div>
        </div>

        {/* FOOTER */}
        <motion.footer
          variants={appear(1.1)}
          initial="hidden"
          animate="visible"
          aria-label="Partner credits"
          style={{
            width:          '100%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            paddingBottom:  'clamp(1.25rem, 4vw, 2rem)',
            paddingLeft:    '1.5rem',
            paddingRight:   '1.5rem',
          }}
        >
          {/* associated with jeevalink */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.47rem', fontWeight: 500, letterSpacing: '0.2em', color: '#D1D5DB', textTransform: 'uppercase' }}>
              associated with
            </span>
            <img
              src={jeevalinkLogo}
              alt="JeevaLink"
              draggable={false}
              style={{ height: '18px', width: 'auto', objectFit: 'contain', opacity: 0.32, filter: 'grayscale(100%) brightness(0.55)' }}
            />
          </div>

          {/* Separator */}
          <div aria-hidden="true" style={{ width: '1px', height: '30px', backgroundColor: '#EAECEF', margin: '0 1.25rem' }} />

          {/* developed by trawbit */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.47rem', fontWeight: 500, letterSpacing: '0.2em', color: '#D1D5DB', textTransform: 'uppercase' }}>
              developed by
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#B8BCC8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Trawbit Technologies
            </span>
          </div>
        </motion.footer>

      </main>
    </>
  );
}
