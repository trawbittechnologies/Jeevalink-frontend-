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

export default function MascotVideo({
  className = "",
  showBubble = true,
}) {
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const [msgIdx, setMsgIdx] = useState(0);

  // Cycle speech bubble messages
  useEffect(() => {
    if (!showBubble) return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % creativeMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [showBubble]);

  // Load character animation by index, play once then advance
  const loadAnim = (index) => {
    if (!containerRef.current) return;
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: CHARACTER_FILES[index],
    });
    animRef.current = anim;
    anim.addEventListener('complete', () => {
      const next = (index + 1) % CHARACTER_FILES.length;
      loadAnim(next);
    });
  };

  useEffect(() => {
    loadAnim(0);
    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full overflow-visible flex items-center justify-center">
      {/* Speech bubble */}
      {showBubble && (
        <motion.div
          className="absolute -top-[70px] sm:-top-[80px] left-[30%] sm:left-[20%] -translate-x-1/2 z-30 pointer-events-none w-max drop-shadow-md"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
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
                <span className="text-[10px] font-bold text-white tracking-wider">
                  CLICK TO CHAT
                </span>
              </div>
              {/* Tail */}
              <div className="absolute -bottom-[8px] right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lottie character container */}
      <div
        ref={containerRef}
        className={className}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      />
    </div>
  );
}
