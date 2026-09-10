import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { motion, AnimatePresence } from 'framer-motion';

const CHARACTER_FILES = [
  '/hupng-mp4-to-lottie-1788794978563.json',
  '/hupng-mp4-to-lottie-1788795025178.json',
];

const creativeMessages = [
  "Hello! I'm Hemo! 🩸",
  "Ready to save a life? ❤️",
  "Be a hero today! 🦸‍♂️",
  "Every drop counts! ✨",
  "How can I help? 💬"
];

export default function MascotVideo({ showBubble = true, className = "" }) {
  // Two separate container divs — both loaded at mount, only one visible at a time
  const containerRefs = useRef([null, null]);
  const animRefs    = useRef([null, null]);
  const activeRef   = useRef(0);           // which index is currently visible
  const [active, setActive] = useState(0); // drives CSS visibility
  const [msgIdx, setMsgIdx] = useState(0);

  // Cycle speech bubble messages
  useEffect(() => {
    if (!showBubble) return;
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % creativeMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [showBubble]);

  useEffect(() => {
    // Pre-load BOTH animations simultaneously so switching is instant (no fetch gap)
    CHARACTER_FILES.forEach((path, idx) => {
      const container = containerRefs.current[idx];
      if (!container) return;

      const anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: idx === 0, // only the first one auto-plays
        path,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
        },
      });
      animRefs.current[idx] = anim;

      anim.addEventListener('complete', () => {
        const next = (idx + 1) % CHARACTER_FILES.length;

        // Reset the NEXT animation to frame 0, then play it
        animRefs.current[next]?.goToAndPlay(0, true);

        // Instantly swap visibility — zero gap
        activeRef.current = next;
        setActive(next);
      });
    });

    return () => {
      animRefs.current.forEach(a => a?.destroy());
      animRefs.current = [null, null];
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-visible flex items-center justify-center ${className}`}>
      {/* Speech bubble */}
      {showBubble && (
        <motion.div
          className="absolute bottom-[102%] right-0 sm:right-2 z-30 pointer-events-none w-max drop-shadow-md mb-1"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={msgIdx}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative bg-white/95 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl flex flex-col items-center whitespace-nowrap cursor-pointer pointer-events-auto border border-red-100 shadow-md shadow-red-500/10"
            >
              <p className="text-[11.5px] sm:text-[12.5px] font-bold text-slate-800 flex items-center justify-center gap-1.5 mb-1">
                {creativeMessages[msgIdx]}
              </p>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] font-bold text-white tracking-wider">CLICK TO CHAT</span>
              </div>
              {/* Tail pointing down to mascot */}
              <div className="absolute -bottom-[7px] right-8 sm:right-10 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-white" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Both lottie containers stacked — only active one is visible */}
      {CHARACTER_FILES.map((_, idx) => (
        <div
          key={idx}
          ref={el => (containerRefs.current[idx] = el)}
          className="w-full h-full flex items-center justify-center scale-100 sm:scale-105 origin-bottom transition-transform"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'visible',
            opacity: active === idx ? 1 : 0,
            // No transition delay — swap is instantaneous
            transition: 'opacity 0.1s ease',
            pointerEvents: active === idx ? 'auto' : 'none',
          }}
        />
      ))}
    </div>
  );
}
