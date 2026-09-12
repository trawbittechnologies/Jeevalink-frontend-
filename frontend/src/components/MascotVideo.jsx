import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { getStorageUrl } from '../store/api.js';

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
  videoUrl,
  posterUrl,
  showBubble = false,
  showAudioToggle = false,
  showPlayPause = false,
  className = ""
}) {
  // Video player state
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Lottie mascot state
  const containerRefs = useRef([null, null]);
  const animRefs    = useRef([null, null]);
  const activeRef   = useRef(0);
  const [active, setActive] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  // Cycle speech bubble messages
  useEffect(() => {
    if (!showBubble) return;
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % creativeMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [showBubble]);

  // If a custom videoUrl is given, we play the video instead of Lottie
  const hasCustomVideo = Boolean(videoUrl && typeof videoUrl === 'string' && videoUrl.trim() !== '');
  const resolvedVideoSrc = hasCustomVideo
    ? (videoUrl.startsWith('blob:') || videoUrl.startsWith('data:') || videoUrl.startsWith('http')
        ? videoUrl
        : (getStorageUrl(videoUrl) || videoUrl))
    : null;

  const resolvedPosterSrc = posterUrl && typeof posterUrl === 'string' && posterUrl.trim() !== ''
    ? (posterUrl.startsWith('blob:') || posterUrl.startsWith('data:') || posterUrl.startsWith('http')
        ? posterUrl
        : (getStorageUrl(posterUrl) || posterUrl))
    : undefined;

  // Preload Lottie only when not rendering video
  useEffect(() => {
    if (hasCustomVideo) return;

    CHARACTER_FILES.forEach((path, idx) => {
      const container = containerRefs.current[idx];
      if (!container) return;

      const anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: idx === 0,
        path,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
        },
      });
      animRefs.current[idx] = anim;

      anim.addEventListener('complete', () => {
        const next = (idx + 1) % CHARACTER_FILES.length;
        animRefs.current[next]?.goToAndPlay(0, true);
        activeRef.current = next;
        setActive(next);
      });
    });

    return () => {
      animRefs.current.forEach(a => a?.destroy());
      animRefs.current = [null, null];
    };
  }, [hasCustomVideo]);

  if (hasCustomVideo && resolvedVideoSrc) {
    return (
      <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-black group ${className}`}>
        <video
          ref={videoRef}
          key={resolvedVideoSrc}
          src={resolvedVideoSrc}
          poster={resolvedPosterSrc}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Video Control Overlays */}
        {(showPlayPause || showAudioToggle) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20 opacity-80 group-hover:opacity-100 transition-opacity">
            {showAudioToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md border border-white/20 transition cursor-pointer"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            )}

            {showPlayPause && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    if (isPlaying) {
                      videoRef.current.pause();
                    } else {
                      videoRef.current.play();
                    }
                  }
                }}
                className="p-2 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md border border-white/20 transition cursor-pointer"
                title={isPlaying ? "Pause Video" : "Play Video"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-visible flex items-center justify-center ${className}`}>
      {/* Speech bubble */}
      {showBubble && (
        <motion.div
          className="absolute bottom-[96%] sm:bottom-[100%] right-0 sm:right-2 z-30 pointer-events-none drop-shadow-md mb-1"
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
              className="relative bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl flex flex-col items-center whitespace-nowrap cursor-pointer pointer-events-auto border border-red-100 shadow-md shadow-red-500/10 max-w-[190px] sm:max-w-none"
            >
              <p className="text-[11px] sm:text-[12.5px] font-bold text-slate-800 flex items-center justify-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 truncate">
                {creativeMessages[msgIdx]}
              </p>
              <div className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] sm:text-[9px] font-bold text-white tracking-wider">CLICK TO CHAT</span>
              </div>
              {/* Tail pointing down to mascot */}
              <div className="absolute -bottom-[6px] right-8 sm:right-12 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-white" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Both lottie containers stacked — only active one is visible */}
      {CHARACTER_FILES.map((_, idx) => (
        <div
          key={idx}
          ref={el => (containerRefs.current[idx] = el)}
          className="w-full h-full flex items-center justify-center scale-115 sm:scale-110 origin-bottom transition-transform"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'visible',
            opacity: active === idx ? 1 : 0,
            transition: 'opacity 0.1s ease',
            pointerEvents: active === idx ? 'auto' : 'none',
          }}
        />
      ))}
    </div>
  );
}
