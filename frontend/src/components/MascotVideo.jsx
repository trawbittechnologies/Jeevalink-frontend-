import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MascotVideo({
  className = "w-full h-full object-contain mix-blend-multiply",
  videoUrl = "",
  posterUrl = "",
  showAudioToggle = false,
  showPlayPause = false,
  showBubble = true,
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);


  const videoRefs = useRef([]);
  const prevActiveIdx = useRef(activeIdx);

  const creativeMessages = [
    "Hello! I'm Hemo! 🩸",
    "Ready to save a life? ❤️",
    "Be a hero today! 🦸‍♂️",
    "Every drop counts! ✨",
    "How can I help? 💬"
  ];

  useEffect(() => {
    if (!showBubble) return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % creativeMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [showBubble]);

  const defaultVideos = [
    "/mascot_video.webm",
    "/mascot 3.webm",
    "/vedio 2.webm"
  ];

  const videosToRender = videoUrl ? [videoUrl] : defaultVideos;

  useEffect(() => {
    // Keep muted state in sync across all videos
    videoRefs.current.forEach((video) => {
      if (video) video.muted = isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    const activeVideo = videoRefs.current[activeIdx];
    if (activeVideo) {
      if (prevActiveIdx.current !== activeIdx) {
        activeVideo.currentTime = 0; // Start from beginning when switched
        prevActiveIdx.current = activeIdx;
      }

      if (isPlaying) {
        const playPromise = activeVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (err.name !== 'AbortError') {
              console.warn("Autoplay prevented:", err);
            }
          });
        }
      } else {
        activeVideo.pause();
      }
    }
  }, [activeIdx, isPlaying]);

  const toggleMute = (e) => {
    e?.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    setIsPlaying(prev => !prev);
  };

  const handleVideoEnd = () => {
    if (videoUrl) return;

    // Immediately switch to next video for seamless continuous feel
    setActiveIdx((prev) => (prev + 1) % defaultVideos.length);
  };

  const activePoster = posterUrl;

  return (
    <div className="relative w-full h-full overflow-visible group flex items-center justify-center">
      {/* Comic Style Red & White Bubble - Repositioned to Left with Right Tail */}
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
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span className="text-[10px] font-bold text-white tracking-wider">
                  CLICK TO CHAT
                </span>
              </div>

              {/* Clean Tail pointing down */}
              <div className="absolute -bottom-[8px] right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white"></div>
            </motion.div>

          </AnimatePresence>
        </motion.div>
      )}

      {videosToRender.map((src, idx) => {
        const isActive = idx === activeIdx;
        const videoSpecificStyles = !videoUrl && idx === 0 ? "scale-[1.15]" : "scale-[1.4]";

        return (
          <motion.video
            key={src}
            ref={(el) => videoRefs.current[idx] = el}
            loop={!!videoUrl}
            muted={isMuted}
            playsInline
            preload="auto"
            poster={activePoster}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 10 : 0
            }}
            transition={{ duration: 0.1 }} // Ultra-fast crossfade (100ms) for gapless feel
            className={`${className} absolute inset-0 ${videoSpecificStyles} ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
            onEnded={isActive ? handleVideoEnd : undefined}
          >
            <source src={src} type="video/webm" />
          </motion.video>
        );
      })}

      {/* Modern Floating Controls (Audio ON/OFF & Play/Pause) */}
      {(showAudioToggle || showPlayPause) && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {showPlayPause && (
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? "Pause Video" : "Play Video"}
              aria-label={isPlaying ? "Pause Video" : "Play Video"}
              className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white backdrop-blur-md border border-white/20 shadow-xl transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-current" />}
            </button>
          )}

          {showAudioToggle && (
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Turn Audio ON" : "Turn Audio OFF"}
              aria-label={isMuted ? "Turn Audio ON" : "Turn Audio OFF"}
              className={`px-3.5 py-2 rounded-full backdrop-blur-md border shadow-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold hover:scale-105 active:scale-95 ${isMuted
                ? "bg-slate-900/80 hover:bg-slate-950 text-slate-200 border-white/20"
                : "bg-red-600/90 hover:bg-red-600 text-white border-red-400/30"
                }`}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-400" />
                  <span>Audio OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                  <span>Audio ON</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

