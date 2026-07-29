import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, RotateCcw, Check, AlertCircle } from 'lucide-react';

export default function CameraCapture({ onCapture, value }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [error, setError] = useState(null);

  const filePreviewUrl = useMemo(() => {
    if (value && value instanceof File) {
      return URL.createObjectURL(value);
    }
    return null;
  }, [value]);

  useEffect(() => {
    if (filePreviewUrl) {
      return () => URL.revokeObjectURL(filePreviewUrl);
    }
  }, [filePreviewUrl]);

  const photoUrl = capturedPhotoUrl || filePreviewUrl;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);
    setCapturedPhotoUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check your browser permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create a canvas to draw the centered square crop
    const canvas = document.createElement('canvas');
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const size = Math.min(videoWidth, videoHeight);
    
    // Set canvas dimensions to a high-quality square (e.g. 500x500)
    canvas.width = 500;
    canvas.height = 500;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate top-left point to crop the center square
    const sx = (videoWidth - size) / 2;
    const sy = (videoHeight - size) / 2;
    
    // Draw the cropped frame (with horizontal flip to preserve natural mirror orientation)
    ctx.translate(500, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 500, 500);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        const localUrl = URL.createObjectURL(blob);
        setCapturedPhotoUrl(localUrl);
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    onCapture(null);
    startCamera();
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-slate-200 shadow-inner bg-slate-100 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt="Captured Selfie" className="w-full h-full object-cover animate-fade-in" />
        ) : isActive ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Circular face alignment overlay guide */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/60 pointer-events-none m-2" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Camera className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-[10px] text-gray-500 font-semibold leading-tight">Live Selfie Required</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-750 rounded-xl text-[10px] font-bold border border-red-100 text-center max-w-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isActive && !photoUrl && (
          <button
            type="button"
            onClick={startCamera}
            className="px-4 py-2.5 bg-primary hover:bg-red-750 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" /> Start Camera
          </button>
        )}

        {isActive && (
          <button
            type="button"
            onClick={capturePhoto}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" /> Take Photo
          </button>
        )}

        {photoUrl && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetake}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
            <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-1">
              <Check className="w-4 h-4" /> Selected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
