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

export default function MascotVideo({ showBubble = true }) {
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
      });
      animRefs.current[idx] = anim;

      anim.addEventListener('complete', () => {
        const next = (idx + 1) % CHARACTER_FILES.length;

        // Reset the NEXT animation to frame 0, then play it
        animRefs.current[next].goToAndPlay(0, true);

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
    <div className="relative w-full h-full overflow-visible flex items-center justify-center">
      {/* Speech bubble */}
      {showBubble && (
        <motion.div
          className="absolute -top-[70px] sm:-top-[80px] left-[30%] sm:left-[20%] -translate-x-1/2 z-30 pointer-events-none w-max drop-shadow-md"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={msgIdx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative bg-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl flex flex-col items-center whitespace-nowrap cursor-pointer pointer-events-auto"
            >
              <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 flex items-center justify-center gap-1.5 mb-1.5">
                {creativeMessages[msgIdx]}
              </p>
              <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-wider">CLICK TO CHAT</span>
              </div>
              {/* Tail */}
              <div className="absolute -bottom-[8px] right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Both lottie containers stacked — only active one is visible */}
      {CHARACTER_FILES.map((_, idx) => (
        <div
          key={idx}
          ref={el => (containerRefs.current[idx] = el)}
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'visible',
            opacity: active === idx ? 1 : 0,
            // No transition delay — swap is instantaneous
            transition: 'none',
            pointerEvents: active === idx ? 'auto' : 'none',
          }}
        />
      ))}
    </div>
  );
}
