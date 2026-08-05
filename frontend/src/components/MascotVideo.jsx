import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

export default function MascotVideo({
  className = "w-full h-full object-contain mix-blend-multiply",
  videoUrl = "",
  posterUrl = "",
  showAudioToggle = false,
  showPlayPause = false,
}) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = isMuted;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn("Mascot video autoplay fallback:", err);
          }
        });
      }
    }
  }, [videoUrl]);

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (videoRef.current) {
      const nextState = !videoRef.current.muted;
      videoRef.current.muted = nextState;
      setIsMuted(nextState);
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const activePoster = posterUrl || "/blood_hero_mascot.png";

  return (
    <div className="relative w-full h-full overflow-hidden group flex items-center justify-center">
      <video
        key={videoUrl || 'default-video'}
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        poster={activePoster}
        className={className}
      >
        {videoUrl ? (
          <source src={videoUrl} />
        ) : (
          <>
            <source src="/e65e90f6856645b6ad0d704d686cce0d (1).webm" type="video/webm" />
            <source src="/mascot_video.webm" type="video/webm" />
          </>
        )}
        <img src={activePoster} alt="Awareness Mascot Video" className={className} />
      </video>

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
              className={`px-3.5 py-2 rounded-full backdrop-blur-md border shadow-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold hover:scale-105 active:scale-95 ${
                isMuted
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
