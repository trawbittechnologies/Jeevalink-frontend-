import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../jl-landing.css";
import MascotVideo from "../components/MascotVideo.jsx";
import { useAppStore } from "../store/appStore.js";
import { motion } from "framer-motion";
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Users,
  Search,
  UserPlus,
  HeartHandshake,
  CheckCircle2
} from "lucide-react";
import CommunityChoiceModal from "../components/CommunityChoiceModal.jsx";

const bloodTypes = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

const processSteps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Register Account",
    desc: "Sign up as a voluntary blood donor in under 2 minutes with basic location details.",
  },
  {
    num: "02",
    icon: Search,
    title: "Find or Request Blood",
    desc: "Search for nearby donors by blood group or post an urgent hospital request.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Coordinator Verification",
    desc: "Regional DYFI Block Committee officers verify request authenticity for donor safety.",
  },
  {
    num: "04",
    icon: HeartHandshake,
    title: "Direct Connection",
    desc: "Connect directly with voluntary donors or recipients to complete the lifesaving donation.",
  },
];

export default function Landing() {
  const { requests, fetchRequests, awarenessSettings, fetchAwarenessSettings } = useAppStore();
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchAwarenessSettings();
  }, [fetchRequests, fetchAwarenessSettings]);

  // Extract active real requests for display
  const activeRequests = (requests || []).filter(
    (r) => (r.status || 'Pending').toLowerCase() !== 'fulfilled' && (r.status || '').toLowerCase() !== 'cancelled'
  );

  return (
    <div className="jl-root bg-white text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      {/* Community Choice Modal */}
      <CommunityChoiceModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Full-bleed background image */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img
            src="/image.png"
            alt=""
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              display: 'block',
            }}
          />
        </motion.div>

        {/* Layered overlays — seamless blend, no hard edges */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Primary: strong white on left, fades across */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 28%, rgba(255,255,255,0.82) 42%, rgba(255,255,255,0.35) 58%, rgba(255,255,255,0.08) 72%, transparent 85%)',
          }} />
          {/* Bottom fade into next section */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
            background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 30%, transparent 100%)',
          }} />
          {/* Top subtle fade */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '15%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 100%)',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 py-28">
          <div className="max-w-lg">

            {/* Organization label */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '1.75rem' }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                fontSize: '0.6rem', fontWeight: 800,
                letterSpacing: '0.24em', color: '#dc2626',
                textTransform: 'uppercase',
              }}>
                <span style={{ width: 24, height: 2, background: '#dc2626', display: 'inline-block', borderRadius: 2, flexShrink: 0 }} />
                DYFI Kasaragod · JeevaLink
              </span>
            </motion.div>

            {/* iDonate wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '1.25rem' }}
            >
              <div style={{
                fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                fontWeight: 500, color: '#94a3b8',
                marginBottom: '0.5rem', letterSpacing: '0.02em',
              }}>
                Introducing
              </div>
              <h1 style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 'clamp(3.8rem, 8vw, 6rem)',
                fontWeight: 900,
                letterSpacing: '-0.045em',
                lineHeight: 0.9,
                color: '#0f172a',
                margin: 0,
              }}>
                <span style={{ color: '#dc2626' }}>i</span>Donate
              </h1>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <p style={{
                fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
                fontWeight: 700, color: '#1e293b',
                lineHeight: 1.3, letterSpacing: '-0.02em',
                margin: 0,
              }}>
                Be someone's reason<br />
                <span style={{ color: '#dc2626' }}>to live.</span>
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                fontSize: '0.875rem', fontWeight: 500,
                color: '#64748b', lineHeight: 1.8,
                maxWidth: '390px', marginBottom: '2.25rem',
              }}
            >
              Connecting voluntary blood donors with patients in urgent need —
              verified by DYFI Block Committee coordinators across Kerala.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '3rem' }}
            >
              <button
                type="button"
                onClick={() => setIsCommunityModalOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '13px 26px',
                  background: '#dc2626', color: '#fff',
                  fontWeight: 800, fontSize: '0.82rem',
                  letterSpacing: '0.01em', borderRadius: '12px', border: 'none',
                  boxShadow: '0 8px 24px rgba(220,38,38,0.28)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(220,38,38,0.38)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(220,38,38,0.28)'; }}
              >
                <Users style={{ width: 15, height: 15 }} />
                Enter Community
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>

              <Link
                to="/donor/search"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '13px 20px',
                  background: 'rgba(255,255,255,0.85)', color: '#0f172a',
                  fontWeight: 700, fontSize: '0.82rem',
                  borderRadius: '12px', border: '1.5px solid rgba(226,232,240,0.8)',
                  backdropFilter: 'blur(8px)',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(226,232,240,0.8)'; e.currentTarget.style.color = '#0f172a'; }}
              >
                <Search style={{ width: 14, height: 14, color: '#dc2626' }} />
                Search Donors
              </Link>

              <Link
                to="/requests"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '13px 18px',
                  background: 'rgba(255,255,255,0.7)', color: '#475569',
                  fontWeight: 700, fontSize: '0.82rem',
                  borderRadius: '12px', border: '1.5px solid rgba(226,232,240,0.7)',
                  backdropFilter: 'blur(8px)',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1e293b'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
              >
                Request Blood
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                display: 'flex', gap: '2rem',
                paddingTop: '1.75rem', borderTop: '1px solid rgba(241,245,249,0.8)',
              }}
            >
              {[
                { val: 'Kerala-wide', label: 'Donor Reach' },
                { val: 'Verified', label: 'Block Committees' },
                { val: 'Real-time', label: 'SOS Response' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', marginBottom: 3 }}>{s.val}</div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>



      {/* ── FEATURED AWARENESS VIDEO & DIALOGUE ──────────────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Emergency Sourcing & Awareness
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium">
              Every second counts when a patient requires blood. Learn how voluntary donors & regional coordinators work together.
            </p>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-12 items-center">
            {/* Video Player */}
            <div className="md:col-span-7 relative h-72 sm:h-96 md:h-[400px] bg-black overflow-hidden">
              <MascotVideo
                videoUrl={awarenessSettings?.videoUrl}
                posterUrl={awarenessSettings?.posterUrl}
                showAudioToggle={true}
                showPlayPause={true}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Dialogue & Message Content */}
            <div className="md:col-span-5 p-7 sm:p-9 space-y-6 flex flex-col justify-center">
              <div className="space-y-4">
                <blockquote className="text-lg sm:text-xl font-bold leading-snug text-white/95 italic border-l-2 border-red-500 pl-4 py-1">
                  {awarenessSettings?.quoteTitle || "“In critical emergency moments, one voluntary donor’s courage turns fear into hope for an entire family.”"}
                </blockquote>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {awarenessSettings?.quoteDescription || "Every second counts when a patient requires blood. JeevaLink connects you directly with verified voluntary donors and regional coordinators across Kerala."}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsCommunityModalOpen(true)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/35 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span>{awarenessSettings?.buttonLabel || "Join Our Community"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REAL ACTIVE BLOOD REQUESTS SECTION ───────────────────────────── */}
      <section className="py-16 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border-b">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Current Blood Requests
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                Active emergency sourcing calls across Kerala hospitals.
              </p>
            </div>

            <Link
              to="/requests"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              <span>View All Requests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Real Requests Cards Grid */}
          {activeRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeRequests.slice(0, 6).map((req) => {
                const bg = req.blood_group || req.bloodGroup || "O+";
                const hospital = req.hospital_name || req.hospitalName || "Hospital";
                const district = req.district || req.city || "Kerala";
                const units = req.units_required || req.unitsRequired || 1;
                const urgency = req.urgency_level || req.urgencyLevel || "Urgent";
                const isEmergency = urgency.toLowerCase().includes("emergency") || urgency.toLowerCase().includes("sos");

                return (
                  <div
                    key={req.id || req._id}
                    className="p-6 rounded-2xl bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border hover:border-red-300 hover: transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 rounded-xl text-lg font-black">
                          {bg}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${isEmergency
                              ? "bg-red-600 text-white"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                        >
                          {urgency}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {hospital}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {district}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-bold">
                        {units} Unit{units > 1 ? "s" : ""} Needed
                      </span>
                      <Link
                        to="/requests"
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Help Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900">No Active Emergency Requests</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                There are currently no urgent pending blood requests in the system. Registered voluntary donors stand ready for future emergency calls.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50/60 border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              How JeevaLink Works
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
              Simple steps connecting voluntary donors directly with patients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 hover:border-red-300 hover: transition-all space-y-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-slate-300 group-hover:text-red-500 transition-colors">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-red-600 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Safety First Note */}
          <div className="mt-12 p-4 rounded-2xl bg-red-50/70 border border-red-200/80 flex items-center gap-3 text-xs text-slate-700 max-w-2xl mx-auto">
            <ShieldCheck className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-semibold">
              <strong className="text-red-700">Verification First:</strong> Blood requests and coordinator listings are verified by regional DYFI Block Committee officers.
            </p>
          </div>
        </div>
      </section>

      {/* ── BLOOD GROUPS DIRECTORY ───────────────────────────────────────── */}
      <section className="py-20 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border-b">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Browse By Blood Group
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
              Select a blood group to find registered voluntary donors near you.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bloodTypes.map((type) => (
              <Link
                key={type}
                to={`/donor/search?blood_group=${encodeURIComponent(type)}`}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-500 hover:bg-red-600 hover:text-white shadow-sm hover:shadow-xl hover:shadow-red-500/20 text-center transition-all duration-200 group cursor-pointer"
              >
                <span className="block text-3xl font-black text-slate-900 group-hover:text-white transition-colors mb-1">
                  {type}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 group-hover:text-red-100 transition-colors">
                  Search Donors →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNIFIED FINAL CALL TO ACTION ─────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-red-50/40">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-8 md:p-14 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Be the reason someone receives timely help.
              </h2>
              <p className="text-red-100 text-sm leading-relaxed font-medium">
                Register as a voluntary donor today or access regional DYFI Block Committee directories for emergency helpline support.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsCommunityModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all hover:bg-red-50 text-red-600 font-extrabold text-base rounded-2xl transition-all transform hover:scale-105 shrink-0 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Users className="w-5 h-5 text-red-600" />
                <span>Enter Community</span>
              </button>

              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-base rounded-2xl transition-all text-center border border-white/10"
              >
                Register as Donor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
