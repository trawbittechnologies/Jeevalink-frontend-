import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Heart, VolumeX, Volume2, Phone, ChevronLeft, Clock, Droplets } from 'lucide-react';
import api from '../store/api.js';

import { startEmergencySiren, stopEmergencySiren, attachGlobalAudioUnlock } from '../utils/sirenAudio.js';

// ─── Emergency Siren Manager ──────────────────────────────────────────────────

function useSiren() {
  const [sirenActive, setSirenActive] = useState(false);
  const [sirenBlocked, setSirenBlocked] = useState(false);

  const startSiren = useCallback(async () => {
    try {
      const res = await startEmergencySiren(0.85);
      if (res && res.type !== 'none' && !res.blocked) {
        setSirenActive(true);
        setSirenBlocked(false);
        return { success: true, blocked: false };
      } else {
        setSirenActive(false);
        setSirenBlocked(true);
        return { success: false, blocked: true };
      }
    } catch (err) {
      console.warn('[Siren] Playback blocked or failed:', err);
      setSirenBlocked(true);
      setSirenActive(false);
      return { success: false, blocked: true };
    }
  }, []);

  const stopSiren = useCallback(() => {
    stopEmergencySiren();
    setSirenActive(false);
    setSirenBlocked(false);
  }, []);

  return { sirenActive, sirenBlocked, startSiren, stopSiren };
}

// ─── Blood Group Badge ────────────────────────────────────────────────────────

function BloodGroupBadge({ group }) {
  return (
    <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-red-400 bg-red-950/60 shadow-2xl shadow-red-900/50">
      <Droplets className="w-6 h-6 text-red-300 mb-1" />
      <span className="text-3xl font-black text-white tracking-tight leading-none">{group}</span>
    </div>
  );
}

// ─── Animated Pulse Ring ──────────────────────────────────────────────────────

function PulseRing() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      <div className="w-40 h-40 rounded-full border-2 border-red-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
      <div className="absolute w-52 h-52 rounded-full border border-red-500/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
    </div>
  );
}

// ─── Main EmergencyRequest Page ───────────────────────────────────────────────

/**
 * EmergencyRequest — dedicated IMMEDIATE SOS page.
 *
 * Opened when the user taps an "immediate" priority Web Push notification.
 * Route: /emergency-request/:id
 *
 * IMPORTANT:
 * The siren audio plays only AFTER user interaction (browser autoplay policy).
 * If autoplay is blocked, a clear "Tap to activate emergency alert" UI is shown.
 * No hidden audio, no infinite background loops, no autoplay hacks.
 */
export default function EmergencyRequest() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { sirenActive, sirenBlocked, startSiren, stopSiren } = useSiren();

  const [request, setRequest]   = useState(null);
  const [loading, setLoading]   = useState(!!id);
  const [error, setError]       = useState(!id ? 'No request ID specified.' : null);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Fetch blood request details
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    api.get('/requests')
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data?.requests || res.data?.data || [];
        const found = Array.isArray(list)
          ? list.find((r) => String(r.id || r._id) === String(id))
          : null;

        if (found) {
          setRequest(found);
          setError(null);
        } else {
          // Try direct endpoint fallback
          return api.get(`/requests?id=${id}`).then((r2) => {
            if (cancelled) return;
            const list2 = r2.data?.data?.requests || r2.data?.data || [];
            const found2 = Array.isArray(list2)
              ? list2.find((r) => String(r.id || r._id) === String(id))
              : null;
            if (found2) {
              setRequest(found2);
            } else {
              setError('Emergency request not found or may have been fulfilled.');
            }
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Failed to load request details. Please check your connection.');
        console.error('[EmergencyRequest] Fetch error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  // Auto-attempt siren on load, with reliable auto-unlock on first tap/interaction
  useEffect(() => {
    if (!loading && !error && request) {
      let isCancelled = false;
      let cleanupUnlock = null;

      const attemptSirenFlow = async () => {
        const res = await startSiren();
        if (isCancelled) return;

        // If browser autoplay blocked sound, auto-unlock on first user interaction anywhere
        if (res?.blocked) {
          cleanupUnlock = attachGlobalAudioUnlock(async () => {
            if (isCancelled) return;
            await startSiren();
          });
        }
      };

      const timer = setTimeout(attemptSirenFlow, 400);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (typeof cleanupUnlock === 'function') {
          cleanupUnlock();
        }
        stopSiren();
      };
    }
  }, [loading, error, request, startSiren, stopSiren]);

  // Accept blood request
  const handleAccept = async () => {
    if (accepting || accepted) return;
    setAccepting(true);
    try {
      await api.patch(`/requests/${id}/accept`);
      setAccepted(true);
      stopSiren();
    } catch (err) {
      console.error('[EmergencyRequest] Accept error:', err);
    } finally {
      setAccepting(false);
    }
  };

  // Open location in maps
  const handleViewLocation = () => {
    const hospital = request?.hospitalName || request?.hospital_name || '';
    const query    = encodeURIComponent(hospital || 'Hospital');
    window.open(`https://maps.google.com/maps?q=${query}`, '_blank', 'noopener');
  };

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-red-300 font-semibold text-lg">Loading Emergency Request...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Request Unavailable</h1>
          <p className="text-red-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/requests')}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
          >
            View All Requests
          </button>
        </div>
      </div>
    );
  }

  const bloodGroup  = request?.bloodGroup || request?.blood_group || 'Unknown';
  const hospital    = request?.hospitalName || request?.hospital_name || 'Unknown Hospital';
  const city        = request?.city || '';
  const district    = request?.district || '';
  const location    = [city, district].filter(Boolean).join(', ') || 'Location unavailable';
  const contact     = request?.contactNumber || request?.contact_number || '';
  const unitsNeeded = request?.unitsRequired || request?.units_required || 1;
  const status      = accepted ? 'ACCEPTED' : (request?.status || 'URGENT');

  // ─── Emergency UI ─────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-red-950 text-white"
      style={{
        background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #450a0a 100%)',
      }}
    >
      {/* Reduce-motion: hide pulses */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-ping { animation: none !important; }
        }
      `}</style>

      {/* Back navigation */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 pt-4 pb-2 bg-red-950/80 backdrop-blur-md border-b border-red-900/40">
        <button
          onClick={() => { stopSiren(); navigate(-1); }}
          className="flex items-center gap-1 text-red-300 hover:text-white transition-colors min-h-[44px] px-2"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back</span>
        </button>
        <span className="text-xs font-black uppercase tracking-widest text-red-400">
          Emergency Alert
        </span>
        <div className="w-20" aria-hidden="true" />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-red-600/30 border border-red-500/50 rounded-full px-4 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-red-300">Immediate SOS</span>
          </div>

          <h1 className="text-3xl font-black text-white leading-tight">
            🚨 IMMEDIATE<br />BLOOD REQUEST
          </h1>

          {/* Status badge */}
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-black uppercase tracking-wider ${
            accepted
              ? 'bg-green-600/30 border border-green-500/50 text-green-300'
              : 'bg-red-600/30 border border-red-500/50 text-red-300 animate-pulse'
          }`}>
            {status}
          </div>
        </div>

        {/* ─── Blood Group + Details ────────────────────────────────────────── */}
        <div className="bg-red-900/40 border border-red-700/40 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="relative">
              <PulseRing />
              <BloodGroupBadge group={bloodGroup} />
            </div>

            <div className="flex-1 pl-6 space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Blood Group</p>
                <p className="text-2xl font-black text-white">{bloodGroup}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Units Required</p>
                <p className="text-xl font-black text-white">{unitsNeeded} unit{unitsNeeded !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Hospital */}
          <div className="flex items-start gap-3 pt-3 border-t border-red-700/30">
            <div className="w-9 h-9 rounded-xl bg-red-800/60 flex items-center justify-center shrink-0 mt-0.5">
              <Heart className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Hospital</p>
              <p className="text-lg font-bold text-white leading-snug">{hospital}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-800/60 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Location</p>
              <p className="text-base font-semibold text-white">{location}</p>
            </div>
          </div>

          {/* Contact */}
          {contact && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-800/60 flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Contact</p>
                <a
                  href={`tel:${contact}`}
                  className="text-base font-bold text-red-300 hover:text-white transition-colors underline underline-offset-2"
                >
                  {contact}
                </a>
              </div>
            </div>
          )}

          {/* Time */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-800/60 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Created</p>
              <p className="text-sm text-red-300">
                {request?.createdAt
                  ? new Date(request.createdAt).toLocaleString()
                  : 'Just now'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Siren Status ─────────────────────────────────────────────────── */}
        {sirenBlocked && (
          <div
            className="bg-amber-950/60 border-2 border-amber-500/60 rounded-2xl p-4 text-center shadow-lg shadow-amber-950/40"
            role="alert"
          >
            <Volume2 className="w-6 h-6 text-amber-300 mx-auto mb-1.5 animate-bounce" />
            <p className="text-sm font-black text-white mb-0.5">
              🚨 Emergency Siren Ready
            </p>
            <p className="text-xs text-amber-200 mb-3">
              Tap anywhere on screen or click below to sound the siren
            </p>
            <button
              type="button"
              onClick={startSiren}
              className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer text-sm"
            >
              🔊 Activate Emergency Siren
            </button>
          </div>
        )}

        {sirenActive && (
          <div className="bg-red-900/60 border border-red-500/50 rounded-2xl p-3.5 flex items-center gap-3 shadow-md shadow-red-950/40">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <p className="text-sm text-red-200 font-bold flex-1">🚨 Emergency siren is active</p>
            <button
              type="button"
              onClick={stopSiren}
              className="text-xs font-bold text-red-200 hover:text-white bg-red-950 hover:bg-red-900 px-3 py-1.5 rounded-lg border border-red-800 transition-colors cursor-pointer"
            >
              Mute
            </button>
          </div>
        )}

        {/* ─── Action Buttons ───────────────────────────────────────────────── */}
        <div className="space-y-3 pb-6">

          {/* Accept Request */}
          {!accepted ? (
            <button
              id="accept-request-btn"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-red-50 active:bg-red-100 text-red-900 font-black text-lg py-4 px-6 rounded-2xl transition-all shadow-xl shadow-red-950/40 min-h-[56px] disabled:opacity-60"
              aria-busy={accepting}
            >
              <Heart className="w-5 h-5" fill="currentColor" />
              {accepting ? 'Accepting...' : 'ACCEPT REQUEST'}
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-3 bg-green-700/30 border border-green-600/50 text-green-300 font-black text-lg py-4 px-6 rounded-2xl min-h-[56px]">
              <Heart className="w-5 h-5" fill="currentColor" />
              ACCEPTED — Thank You!
            </div>
          )}

          {/* View Location */}
          <button
            id="view-location-btn"
            onClick={handleViewLocation}
            className="w-full flex items-center justify-center gap-3 bg-red-700/50 hover:bg-red-600/60 active:bg-red-800/60 border border-red-600/40 text-white font-bold text-base py-4 px-6 rounded-2xl transition-all min-h-[56px]"
          >
            <MapPin className="w-5 h-5" />
            VIEW LOCATION
          </button>

          {/* Stop Siren */}
          {(sirenActive || sirenBlocked) && (
            <button
              id="stop-siren-btn"
              onClick={stopSiren}
              className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-red-900/30 active:bg-red-900/50 border border-red-700/40 text-red-400 hover:text-red-300 font-bold text-base py-3.5 px-6 rounded-2xl transition-all min-h-[52px]"
            >
              <VolumeX className="w-5 h-5" />
              STOP SIREN
            </button>
          )}

          {/* Back to all requests */}
          <button
            onClick={() => { stopSiren(); navigate('/requests'); }}
            className="w-full text-center text-red-500 hover:text-red-400 font-semibold text-sm py-2 transition-colors min-h-[44px]"
          >
            Back to All Requests
          </button>
        </div>

      </div>
    </div>
  );
}
