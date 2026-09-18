/**
 * sirenAudio.js — Emergency Alert & Siren Audio Engine
 *
 * Provides:
 * - HTML5 Audio playback (/sounds/emergency-siren.mp3)
 * - Synthesized Web Audio API emergency siren fallback
 * - Autoplay block detection and seamless global auto-unlock on first user interaction
 */

let activeAudioElement = null;
let activeWebAudioSiren = null;

/**
 * Start playing the emergency siren continuously.
 * Returns a controller object { type: string, stop: Function, blocked?: boolean }.
 */
export async function startEmergencySiren(volume = 0.85) {
  stopEmergencySiren();

  const clampedVolume = Math.max(0, Math.min(1, volume));

  // 1. Try HTML5 Audio element with mp3
  try {
    const audio = new Audio('/sounds/emergency-siren.mp3');
    audio.loop = true;
    audio.volume = clampedVolume;
    audio.preload = 'auto';

    activeAudioElement = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }

    return {
      type: 'audio-element',
      stop: stopEmergencySiren,
      blocked: false,
    };
  } catch (html5Err) {
    console.warn('[Siren] HTML5 Audio play blocked or failed, attempting Web Audio API fallback:', html5Err?.message);
    if (activeAudioElement) {
      try {
        activeAudioElement.pause();
        activeAudioElement.src = '';
      } catch {
        // ignore
      }
      activeAudioElement = null;
    }
  }

  // 2. Fallback: Web Audio API Oscillator Siren
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();

      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          // Autoplay policy prevents resume without user gesture
        }
      }

      // If context remains suspended, browser autoplay policy is actively blocking sound
      if (ctx.state === 'suspended') {
        console.warn('[Siren] Web Audio context is suspended (autoplay policy requires user gesture).');
        try {
          ctx.close().catch(() => {});
        } catch {
          // ignore
        }
        return {
          type: 'none',
          stop: stopEmergencySiren,
          blocked: true,
        };
      }

      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const mainGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      // Modulate frequency between ~650Hz and 1150Hz
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1.2, ctx.currentTime);
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(osc.frequency);
      osc.connect(mainGain);
      mainGain.connect(ctx.destination);
      mainGain.gain.setValueAtTime(clampedVolume * 0.4, ctx.currentTime);

      lfo.start();
      osc.start();

      activeWebAudioSiren = {
        ctx,
        stop: () => {
          try {
            mainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            setTimeout(() => {
              try { osc.stop(); } catch { /* ignore */ }
              try { lfo.stop(); } catch { /* ignore */ }
              ctx.close().catch(() => {});
            }, 120);
          } catch (stopErr) {
            console.debug('[Siren] WebAudio stop error:', stopErr);
          }
          activeWebAudioSiren = null;
        },
      };

      return {
        type: 'web-audio',
        stop: stopEmergencySiren,
        blocked: false,
      };
    }
  } catch (webAudioErr) {
    console.error('[Siren] Web Audio fallback also failed:', webAudioErr);
  }

  return {
    type: 'none',
    stop: stopEmergencySiren,
    blocked: true,
  };
}

/**
 * Stop any active emergency siren.
 */
export function stopEmergencySiren() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
    } catch (err) {
      console.debug('[Siren] Audio element pause error:', err);
    }
    activeAudioElement = null;
  }

  if (activeWebAudioSiren) {
    try {
      activeWebAudioSiren.stop();
    } catch (err) {
      console.debug('[Siren] WebAudio stop error:', err);
    }
    activeWebAudioSiren = null;
  }
}

/**
 * Attaches a one-time global user interaction listener to unlock and play audio
 * as soon as the user taps, clicks, or presses any key.
 */
export function attachGlobalAudioUnlock(onUnlocked) {
  if (typeof window === 'undefined') return () => {};

  let unlocked = false;
  const events = ['pointerdown', 'touchstart', 'click', 'keydown'];

  const unlockHandler = async (e) => {
    if (unlocked) return;
    unlocked = true;

    events.forEach((evt) => {
      window.removeEventListener(evt, unlockHandler, true);
    });

    if (typeof onUnlocked === 'function') {
      try {
        await onUnlocked(e);
      } catch (err) {
        console.debug('[Siren] Unlock callback error:', err);
      }
    }
  };

  events.forEach((evt) => {
    window.addEventListener(evt, unlockHandler, { capture: true, once: true });
  });

  return () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, unlockHandler, true);
    });
  };
}

/**
 * Play a brief 3.5-second emergency siren alert tone
 */
export async function playEmergencyAlertBurst() {
  try {
    const controller = await startEmergencySiren(0.8);
    setTimeout(() => {
      stopEmergencySiren();
    }, 3800);
    return controller;
  } catch (err) {
    console.debug('[Siren] Burst play error:', err);
  }
}

/**
 * Play standard soft chime for notifications.
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch (err) {
    console.debug('[Siren] Chime error:', err);
  }
}
