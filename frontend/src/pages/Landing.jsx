import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../jl-landing.css";
import MascotVideo from "../components/MascotVideo.jsx";
import { useAppStore } from "../store/appStore.js";
import { getStorageUrl } from "../store/api.js";
import { motion } from "framer-motion";
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Users,
  Search,
  UserPlus,
  Building2,
  HeartHandshake,
  CheckCircle2,
  Check,
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
  const { partners, fetchPartners, requests, fetchRequests, awarenessSettings, fetchAwarenessSettings } = useAppStore();
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  useEffect(() => {
    fetchPartners();
    fetchRequests();
    fetchAwarenessSettings();
  }, [fetchPartners, fetchRequests, fetchAwarenessSettings]);

  // Extract active real requests for display
  const activeRequests = (requests || []).filter(
    (r) => (r.status || 'Pending').toLowerCase() !== 'fulfilled' && (r.status || '').toLowerCase() !== 'cancelled'
  );

  const displayPartners = partners && partners.length > 0 ? partners : [];

  return (
    <div className="jl-root bg-white text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      {/* Community Choice Modal */}
      <CommunityChoiceModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all pt-16 pb-20 border-b">
        <div className="jl-container relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 tracking-tight leading-[1.08] mb-6"
          >
            Be Someone's Hero.<br />
            <span className="text-red-600">
              Donate Blood. Save Lives Today.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-medium"
          >
            Connecting voluntary blood donors with patients in urgent need. Verified through regional DYFI Block Committee coordinators across Kerala.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            {/* Enter Community Button */}
            <button
              type="button"
              onClick={() => setIsCommunityModalOpen(true)}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-red-600/20 hover:scale-105 transition-all duration-200 flex items-center gap-2.5 cursor-pointer group"
            >
              <Users className="w-5 h-5 text-white" />
              <span>Enter Community Portal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Find Donors */}
            <Link
              to="/donor/search"
              className="px-7 py-4 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all hover:bg-slate-50 text-slate-800 hover:text-red-600 font-bold text-base rounded-2xl border transition-all duration-200 flex items-center gap-2"
            >
              <Search className="w-5 h-5 text-red-600" />
              <span>Search Donors</span>
            </Link>

            {/* Request Blood */}
            <Link
              to="/requests"
              className="px-7 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base rounded-2xl transition-all duration-200"
            >
              Request Blood
            </Link>
          </motion.div>

          {/* Trust Indicators Ribbon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs sm:text-sm font-semibold text-slate-500"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
              <span>100% Free & Voluntary</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
              <span>All 14 Kerala Districts</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
              <span>Verified 24/7 Helpline</span>
            </div>
          </motion.div>
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

      {/* ── PARTNERS SHOWCASE ────────────────────────────────────────────── */}
      {displayPartners.length > 0 && (
        <section className="py-16 bg-slate-50/60 border-b border-slate-100">
          <div className="jl-container max-w-5xl mx-auto px-4">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                Collaborating Partner Organizations
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-center">
              {displayPartners.map((partner) => (
                <div
                  key={partner.id || partner._id}
                  className="p-4 rounded-2xl border bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all hover: transition-all text-center flex flex-col items-center justify-center space-y-2"
                >
                  {partner.logo ? (
                    <img
                      src={getStorageUrl(partner.logo)}
                      alt={partner.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-red-600" />
                  )}
                  <span className="text-xs font-bold text-slate-800">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
