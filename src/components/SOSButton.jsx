import { useEffect, useRef, useCallback } from 'react';
import { Siren, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';

export default function SOSButton() {
  const {
    sosCountdownActive,
    sosCountdown,
    sirenPlaying,
    startSOSCountdown,
    cancelSOS,
    stopSiren,
  } = useAppStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const audioCtxRef = useRef(null);
  const oscRef1 = useRef(null);
  const oscRef2 = useRef(null);
  const gainRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  const stopSirenSound = useCallback(() => {
    try {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
      if (oscRef1.current) {
        try { oscRef1.current.stop(); } catch { /* ignore */ }
        oscRef1.current.disconnect();
        oscRef1.current = null;
      }
      if (oscRef2.current) {
        try { oscRef2.current.stop(); } catch { /* ignore */ }
        oscRef2.current.disconnect();
        oscRef2.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch { /* ignore */ }
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.error('Failed to stop audio context', e);
    }
  }, []);

  const startSirenSound = useCallback(() => {
    try {
      if (audioCtxRef.current) return; // already playing

      // Initialize Web Audio API context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.connect(audioCtx.destination);
      gainRef.current = gainNode;

      // Create two oscillators for a rich, warning siren tone
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc1.connect(gainNode);
      oscRef1.current = osc1;

      const osc2 = audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(604, audioCtx.currentTime);
      osc2.connect(gainNode);
      oscRef2.current = osc2;

      // Modulate frequency to create the wailing effect
      const now = audioCtx.currentTime;
      osc1.frequency.linearRampToValueAtTime(800, now + 0.5);
      osc2.frequency.linearRampToValueAtTime(804, now + 0.5);

      let up = true;
      sirenIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtx.state === 'closed') {
          clearInterval(sirenIntervalRef.current);
          return;
        }
        const time = audioCtx.currentTime;
        if (up) {
          osc1.frequency.linearRampToValueAtTime(600, time + 0.5);
          osc2.frequency.linearRampToValueAtTime(604, time + 0.5);
        } else {
          osc1.frequency.linearRampToValueAtTime(800, time + 0.5);
          osc2.frequency.linearRampToValueAtTime(804, time + 0.5);
        }
        up = !up;
      }, 500);

      osc1.start();
      osc2.start();
    } catch (e) {
      console.warn('Web Audio API not supported or user gesture blocked:', e);
    }
  }, []);

  // Sync wailing siren audio with store state
  useEffect(() => {
    if (sirenPlaying) {
      startSirenSound();
    } else {
      stopSirenSound();
    }
  }, [sirenPlaying, startSirenSound, stopSirenSound]);

  // Stop sound and interval on component unmount
  useEffect(() => {
    return () => {
      stopSirenSound();
    };
  }, [stopSirenSound]);

  const handleSOSClick = () => {
    if (sirenPlaying) {
      stopSiren();
    } else {
      startSOSCountdown(user);
    }
  };

  // Hide button on splash, register, login, and landing pages
  if (['/splash', '/login', '/register', '/'].includes(location.pathname)) return null;

  return (
    <>
      {/* Floating SOS Trigger Button */}
      <div className="fixed right-6 bottom-20 md:bottom-6 z-45">
        <button
          onClick={handleSOSClick}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer select-none transition-all duration-300 relative border-2 ${
            sirenPlaying
              ? 'bg-red-650 border-white text-white animate-pulse'
              : 'bg-red-500 hover:bg-red-600 border-red-400 text-white hover:scale-105 active:scale-95'
          }`}
        >
          {/* Pulsing visual indicator */}
          {!sirenPlaying && <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-pulse-ring" />}
          
          <Siren className={`w-7 h-7 ${sirenPlaying ? 'animate-bounce' : ''}`} />
        </button>
      </div>

      {/* SOS Triggering Countdown Modal overlay */}
      {sosCountdownActive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600 animate-pulse" />
            
            <div className="w-20 h-20 bg-red-100 dark:bg-red-950/45 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-900 animate-siren">
              <Siren className="w-10 h-10 text-red-600 animate-bounce" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Broadcasting SOS</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
              JeevaLink will send emergency alerts to matching blood donors nearby in:
            </p>

            <div className="text-6xl font-black text-red-600 mb-8 tracking-tighter animate-ping scale-90">
              {sosCountdown}
            </div>

            <button
              onClick={cancelSOS}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-semibold rounded-2xl transition-all duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel SOS
            </button>
          </div>
        </div>
      )}

      {/* Floating Siren Mute controls if siren is playing */}
      {sirenPlaying && (
        <div className="fixed bottom-36 md:bottom-24 right-6 z-45 bg-zinc-900/90 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg border border-white/10 backdrop-blur-md animate-bounce">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Siren Active
          <button 
            onClick={stopSiren}
            className="ml-2 font-bold hover:underline cursor-pointer flex items-center gap-1 text-red-400"
          >
            Mute <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </>
  );
}
