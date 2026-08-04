import { useEffect, useRef } from 'react';

export default function MascotVideo({
  className = "w-full h-full object-cover",
  videoUrl = "",
  posterUrl = ""
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.defaultMuted = true;
      el.muted = true;
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Mascot video autoplay fallback:", err);
        });
      }
    }
  }, [videoUrl]);

  const activePoster = posterUrl || "/blood_hero_mascot.png";

  return (
    <video
      key={videoUrl || 'default-video'}
      ref={videoRef}
      autoPlay
      loop
      muted
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
  );
}
