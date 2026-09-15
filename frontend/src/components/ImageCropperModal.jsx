import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw, Check, Crop } from 'lucide-react';

/**
 * Reusable Image Cropper Modal for Profile Pictures / Avatars
 * 
 * Props:
 * - isOpen: boolean
 * - imageFile: File | Blob | string (the image to crop)
 * - onClose: () => void
 * - onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void
 * - title: string (optional)
 * - outputSize: number (default 500px)
 */
export default function ImageCropperModal({
  isOpen,
  imageFile,
  onClose,
  onCropComplete,
  title = 'Crop & Adjust Profile Picture',
  outputSize = 500,
}) {
  const canvasRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);

  // Crop Controls State
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const VIEWPORT_SIZE = 280; // Size of the interactive crop box in px

  // Load Image Object when imageFile changes or modal opens
  useEffect(() => {
    if (!isOpen || !imageFile) {
      setImageSrc(null);
      setImageObj(null);
      return;
    }

    let url = null;
    if (typeof imageFile === 'string') {
      url = imageFile;
    } else if (imageFile instanceof File || imageFile instanceof Blob) {
      url = URL.createObjectURL(imageFile);
    }

    if (!url) return;
    setImageSrc(url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      // Reset controls
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.onerror = (err) => {
      console.error('Failed to load image for cropping:', err);
    };
    img.src = url;

    return () => {
      if (imageFile instanceof File || imageFile instanceof Blob) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, imageFile]);

  // Calculate Base Scale to cover viewport
  const getBaseScale = useCallback((img, rot) => {
    if (!img) return 1;
    const isRotatedQuarter = rot % 180 !== 0;
    const effW = isRotatedQuarter ? img.naturalHeight : img.naturalWidth;
    const effH = isRotatedQuarter ? img.naturalWidth : img.naturalHeight;

    if (!effW || !effH) return 1;
    return Math.max(VIEWPORT_SIZE / effW, VIEWPORT_SIZE / effH);
  }, [VIEWPORT_SIZE]);

  // Draw current preview on viewport canvas
  const drawViewport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    ctx.save();

    // Move origin to center of viewport
    const centerX = VIEWPORT_SIZE / 2;
    const centerY = VIEWPORT_SIZE / 2;
    ctx.translate(centerX, centerY);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Pan
    ctx.translate(pan.x, pan.y);

    // Zoom & Scale
    const baseScale = getBaseScale(imageObj, rotation);
    const totalScale = baseScale * zoom;
    ctx.scale(totalScale, totalScale);

    // Draw image centered at origin
    ctx.drawImage(
      imageObj,
      -imageObj.naturalWidth / 2,
      -imageObj.naturalHeight / 2,
      imageObj.naturalWidth,
      imageObj.naturalHeight
    );

    ctx.restore();
  }, [imageObj, rotation, pan, zoom, getBaseScale, VIEWPORT_SIZE]);

  useEffect(() => {
    if (isOpen && imageObj) {
      drawViewport();
    }
  }, [isOpen, imageObj, drawViewport]);

  // Mouse & Touch Dragging Logic
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  // Reset controls
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Rotate 90 deg clockwise
  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Rotate 90 deg counter-clockwise
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Generate cropped output image File
  const handleCropSave = () => {
    if (!imageObj) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = outputSize;
    offscreen.height = outputSize;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const ratio = outputSize / VIEWPORT_SIZE;

    ctx.save();
    // Center of offscreen canvas
    ctx.translate(outputSize / 2, outputSize / 2);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Pan with ratio
    ctx.translate(pan.x * ratio, pan.y * ratio);

    // Scale
    const baseScale = getBaseScale(imageObj, rotation);
    const totalScale = baseScale * zoom * ratio;
    ctx.scale(totalScale, totalScale);

    // Draw original image centered
    ctx.drawImage(
      imageObj,
      -imageObj.naturalWidth / 2,
      -imageObj.naturalHeight / 2,
      imageObj.naturalWidth,
      imageObj.naturalHeight
    );

    ctx.restore();

    offscreen.toBlob(
      (blob) => {
        if (blob) {
          const fileName = `donor_profile_${Date.now()}.jpg`;
          const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(croppedFile, previewUrl);
          onClose();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">{title}</h3>
              <p className="text-[10px] text-slate-400">Drag to position, zoom or rotate image</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Viewport Area */}
        <div className="p-6 flex flex-col items-center bg-slate-50 gap-5 overflow-y-auto">
          {/* Interactive Crop Viewport Frame */}
          <div
            className="relative rounded-full overflow-hidden border-4 border-red-500 shadow-xl bg-slate-900 cursor-grab active:cursor-grabbing select-none shrink-0"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              width={VIEWPORT_SIZE}
              height={VIEWPORT_SIZE}
              className="block pointer-events-none"
            />

            {/* Circular Grid & Guideline Overlay */}
            <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-full h-0.5 bg-white" />
              <div className="h-full w-0.5 bg-white absolute" />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium text-center">
            Position face within the circle for best donor profile appearance
          </p>

          {/* Controls Bar */}
          <div className="w-full space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Zoom Controls */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-red-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Action Tools (Rotate & Reset) */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                title="Rotate 90° Left"
              >
                <RotateCcw className="w-3.5 h-3.5" /> -90°
              </button>
              <button
                type="button"
                onClick={handleRotateRight}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                title="Rotate 90° Right"
              >
                <RotateCw className="w-3.5 h-3.5" /> +90°
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                title="Reset Image Alignment"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropSave}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Apply Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
}
