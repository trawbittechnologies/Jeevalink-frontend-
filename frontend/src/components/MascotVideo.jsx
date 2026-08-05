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
          className="absolute -top-[70px] sm:-top-[80px] left-[30%] sm:left-[20%] -translate-x-1/2 z-30 pointer-events-none w-max"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={msgIdx}
              initial={{ opacity: 0, y: 10, scale: 0.8, rotate: 3 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: -2 }}
              exit={{ opacity: 0, y: -5, scale: 0.9, rotate: -5 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.6 }}
              className="relative bg-white px-4 py-2 rounded-[1.25rem] shadow-[4px_4px_0px_#dc2626] border-[3px] border-red-600 flex flex-col items-center whitespace-nowrap"
            >
              <p className="text-[12px] sm:text-[13px] font-black text-red-600 uppercase tracking-tight flex items-center justify-center gap-1.5 mb-1">
                {creativeMessages[msgIdx]}
              </p>

              <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-[3px] rounded-full shadow-inner mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_4px_#fff]"></span>
                <span className="text-[9px] uppercase tracking-widest font-black text-white">
                  Click to Chat
                </span>
              </div>

              {/* Comic Tail pointing down-right */}
              <svg
                className="absolute -bottom-[16px] right-6 w-6 h-6 text-white drop-shadow-[4px_4px_0px_#dc2626]"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 0 L22 0 L22 22 Z" className="fill-white stroke-red-600 stroke-[3px] stroke-linejoin-round" />
              </svg>

              {/* White patch to hide the overlapping border */}
              <div className="absolute -bottom-[3px] right-[26px] w-[18px] h-1.5 bg-white z-10"></div>
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

