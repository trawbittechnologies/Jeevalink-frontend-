/**
 * sirenAudio.js — Emergency Alert & Siren Audio Engine
 *
 * Provides both HTML5 Audio playback (using /sounds/emergency-siren.mp3)
 * and an in-memory Web Audio API synthesized emergency siren fallback.
 */

let activeAudioElement = null;
let activeWebAudioSiren = null;

/**
 * Start playing the emergency siren continuously.
 * Returns a controller object { stop: Function, isPlaying: boolean }.
 */
export async function startEmergencySiren(volume = 0.85) {
  stopEmergencySiren();

  // Try HTML5 Audio with generated siren audio file
  try {
    const audio = new Audio('/sounds/emergency-siren.mp3');
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.preload = 'auto';

    activeAudioElement = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }

    return {
      type: 'audio-element',
      stop: stopEmergencySiren,
    };
  } catch (err) {
    console.warn('[Siren] HTML5 Audio play failed or blocked, falling back to Web Audio API:', err?.message);
  }

  // Fallback: Web Audio API Oscillator Siren
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const mainGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      // Modulate frequency between ~650Hz and 1150Hz
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1.2, ctx.currentTime); // 1.2s sweep
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(osc.frequency);
      osc.connect(mainGain);
      mainGain.connect(ctx.destination);
      mainGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);

      lfo.start();
      osc.start();

      activeWebAudioSiren = {
        ctx,
        stop: () => {
          try {
            mainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            setTimeout(() => {
              osc.stop();
              lfo.stop();
              ctx.close().catch(() => {});
            }, 120);
          } catch (stopErr) {
            console.debug('[Siren] WebAudio stop error:', stopErr);
          }
          activeWebAudioSiren = null;
        }
      };

      return {
        type: 'web-audio',
        stop: stopEmergencySiren,
      };
    }
  } catch (webAudioErr) {
    console.error('[Siren] Web Audio fallback also failed:', webAudioErr);
  }

  return {
    type: 'none',
    stop: stopEmergencySiren,
  };
}

/**
 * Stop any active emergency siren (both audio element and Web Audio).
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
 * Play a brief 3.5-second emergency siren alert tone
 * (useful when a notification popup arrives in foreground).
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
 * Play standard soft chime for moderate / critical notifications.
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

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
