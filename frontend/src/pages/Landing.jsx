import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../jl-landing.css";
import { useAppStore } from "../store/appStore.js";
import { getStorageUrl } from "../store/api.js";
import { motion } from "framer-motion";
import {
  Heart,
  Droplets,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Users,
  Search,
  UserPlus,
  Building2,
  Bell,
  HeartHandshake,
  CheckCircle2,
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
    title: "Direct Connection & Donation",
    desc: "Connect directly with donors or recipients to complete the lifesaving blood donation.",
  },
];

export default function Landing() {
  const { partners, fetchPartners, requests, fetchRequests } = useAppStore();
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  useEffect(() => {
    fetchPartners();
    fetchRequests();
  }, [fetchPartners, fetchRequests]);

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

      {/* ── HERO SECTION (Ultra-Clean, Humanized & Serene) ───────────── */}
      <section className="relative min-h-[75vh] flex items-center justify-center bg-white pt-14 pb-20 border-b border-slate-100">
        <div className="jl-container relative z-10 max-w-4xl mx-auto px-4 text-center">

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 tracking-tight leading-[1.08] mb-6"
          >
            Be Someone's Hero.<br />
            <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              Donate Blood. Save Lives Today.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-medium"
          >
            Every blood donation brings hope to a patient in urgent need. Connect directly with voluntary donors and verified DYFI Block Committee coordinators across Kerala.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
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
              className="px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 hover:text-red-600 font-bold text-base rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 flex items-center gap-2"
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
        </div>
      </section>

      {/* ── REAL ACTIVE BLOOD REQUESTS SECTION ───────────────────────────── */}
      <section className="py-16 bg-slate-50/70 border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-red-600 font-extrabold text-xs uppercase tracking-wider mb-1">
                <Bell className="w-4 h-4 text-red-600" />
                Live Active Sourcing Feed
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Current Blood Requests
              </h2>
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
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 rounded-xl text-lg font-black">
                          {bg}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isEmergency
                              ? "bg-red-600 text-white animate-pulse"
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
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900">No Active Emergency Requests</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                There are currently no urgent pending blood requests in the system. Registered voluntary donors stand ready for future emergency calls.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS (4 Minimalist Human Steps) ──────────────────────── */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-14">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-xs font-extrabold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-red-600 fill-current" />
              How JeevaLink Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Simple Steps. <span className="text-red-600">Lifesaving Impact.</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Our community framework facilitates direct connection between donors and patients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-red-300 hover:bg-white hover:shadow-lg transition-all space-y-4 group"
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

          {/* Safety First Banner */}
          <div className="mt-12 p-4 rounded-2xl bg-red-50/70 border border-red-200/80 flex items-center gap-3 text-xs text-slate-700 max-w-2xl mx-auto">
            <ShieldCheck className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-semibold">
              <strong className="text-red-700">Verification First:</strong> Blood requests and coordinator listings are verified by regional DYFI Block Committee officers.
            </p>
          </div>
        </div>
      </section>

      {/* ── BLOOD GROUPS DIRECTORY ───────────────────────────────────────── */}
      <section className="py-20 bg-slate-50/60 border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-xs font-extrabold uppercase tracking-wider">
              <Droplets className="w-3.5 h-3.5 text-red-600" />
              Blood Group Directory
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Browse By <span className="text-red-600">Blood Group</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
              Select a blood group to view registered voluntary donors in your district.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bloodTypes.map((type) => (
              <Link
                key={type}
                to={`/donor/search?blood_group=${encodeURIComponent(type)}`}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-500 hover:bg-red-600 hover:text-white shadow-sm hover:shadow-xl hover:shadow-red-500/20 text-center transition-all duration-200 group cursor-pointer"
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

      {/* ── PARTNERS SHOWCASE (REAL DATA) ────────────────────────────────── */}
      {displayPartners.length > 0 && (
        <section className="py-16 bg-white border-b border-slate-100">
          <div className="jl-container max-w-5xl mx-auto px-4">
            <div className="text-center space-y-2 mb-10">
              <span className="text-xs font-black uppercase tracking-wider text-red-600">
                Partner Networks
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                Our Collaborating Organizations
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 items-center">
              {displayPartners.map((partner) => (
                <div
                  key={partner.id || partner._id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all text-center flex flex-col items-center justify-center space-y-2"
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

      {/* ── SPOTLIGHT: COMMUNITY ACCESS PORTAL CARD ─────────────────────── */}
      <section className="py-16 bg-white relative">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="relative bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-3xl p-8 md:p-12 shadow-xl overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-red-100 text-xs font-black uppercase tracking-wider">
                  <span>COMMUNITY ACCESS PORTAL</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Connect With Regional DYFI Block Coordinators
                </h2>

                <p className="text-red-100/90 text-xs sm:text-sm max-w-xl leading-relaxed font-medium">
                  Access your local committee helpline, log in to your account, or explore volunteer directories across Kerala.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCommunityModalOpen(true)}
                className="px-8 py-4 bg-white hover:bg-red-50 text-red-600 font-extrabold text-base rounded-2xl shadow-lg transition-all transform hover:scale-105 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <span>Enter Community</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-b from-white to-red-50/40">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-lg space-y-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <span className="px-3.5 py-1 bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider rounded-full">
                Voluntary Blood Sourcing
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                Be the reason <span className="text-red-600">someone receives timely help.</span>
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                Register as a voluntary donor today to support patients and hospitals across Kerala.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsCommunityModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4 text-white" />
                <span>Enter Community</span>
              </button>

              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all text-center"
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
