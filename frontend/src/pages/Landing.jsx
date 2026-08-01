import { useEffect, useRef, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import "../jl-landing.css";
import { useAppStore } from "../store/appStore.js";
import { getStorageUrl } from "../store/api.js";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  Heart, Droplets, MapPin, ArrowRight, Shield, Users,
  Activity, Zap, Handshake, Bell, Search, UserPlus,
  Building2, Star, Clock, TrendingUp, Globe, Sparkles, LogIn, PhoneCall
} from "lucide-react";
import CommunityChoiceModal from "../components/CommunityChoiceModal.jsx";

/* ── Inline Social Icons ───────────────────────── */
const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Youtube: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z"/>
    </svg>
  ),
  Linkedin: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
    </svg>
  ),
};

/* ── Animated Counter ─────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useSpring(count, { duration: duration * 1000 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { if (isInView) count.set(target); }, [isInView, target, count]);
  useEffect(() => rounded.on("change", (v) => setDisplay(Math.round(v))), [rounded]);
  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

/* ── Motion variants ─────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", damping: 24, stiffness: 110, delay: i * 0.08 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { type: "spring", damping: 22, stiffness: 100, delay: i * 0.1 },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: 50 },
  show: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { type: "spring", damping: 22, stiffness: 90, delay: i * 0.08 },
  }),
};

/* ── Data ─────────────────────────────────────── */
const heroStats = [
  { icon: Users, value: "12K+", label: "Active Donors" },
  { icon: Heart, value: "3.5K+", label: "Lives Saved" },
  { icon: MapPin, value: "28+", label: "Cities Active" },
  { icon: Clock, value: "< 5 min", label: "Avg Response" },
];

const bloodTypes = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

const tickerItems = [
  { urgency: "CRITICAL", type: "O+ Blood", city: "Kozhikode Medical College" },
  { urgency: "URGENT", type: "A- Blood", city: "Ernakulam General Hospital" },
  { urgency: "EMERGENCY", type: "B+ Blood", city: "Thiruvananthapuram RCC" },
  { urgency: "CRITICAL", type: "AB+ Blood", city: "Thrissur Jubilee Mission" },
];

const processSteps = [
  { num: "1", icon: UserPlus, title: "Register Account", desc: "Sign up as a voluntary blood donor in under 2 minutes." },
  { num: "2", icon: Search, title: "Find or Request", desc: "Instantly match with verified donors or post an emergency request." },
  { num: "3", icon: Bell, title: "Instant Notification", desc: "Regional volunteer coordinators and nearby donors get notified." },
  { num: "4", icon: Heart, title: "Save A Life", desc: "Connect directly, complete donation, and track your impact." },
];

const impactStats = [
  { icon: Users, value: 12842, suffix: "+", label: "Registered Donors" },
  { icon: Droplets, value: 3587, suffix: "+", label: "Lives Saved" },
  { icon: Building2, value: 320, suffix: "+", label: "Partner Hospitals" },
  { icon: Heart, value: 1150, suffix: "+", label: "Emergency Fulfilled" },
];

const features = [
  {
    icon: Zap,
    title: "AI Real-Time Matching",
    desc: "Smart proximity matching connects blood recipients with nearby active donors within seconds.",
  },
  {
    icon: Shield,
    title: "Verified & Secure",
    desc: "Every donor profile is verified by regional DYFI Block Committee officers for maximum safety.",
  },
  {
    icon: MapPin,
    title: "Location-Aware Locator",
    desc: "GPS-powered radius search lets you find donors and volunteer helplines across all 14 districts.",
  },
];

const ctaVisualCards = [
  { icon: TrendingUp, label: "Lives Saved", value: "4,521", sub: "across Kerala", accent: true },
  { icon: Globe, label: "Cities Active", value: "28+", sub: "district networks", accent: false },
  { icon: Clock, label: "Avg Response", value: "< 5 min", sub: "rapid response", accent: false },
  { icon: Users, label: "Volunteers Active", value: "1,200+", sub: "ready 24/7", accent: true },
];

/* ════════════════════════════════════════════════ */
export default function Landing() {
  const { partners, fetchPartners } = useAppStore();
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const getSocialIconComponent = (platform) => {
    const type = (platform || '').toLowerCase();
    if (type === 'facebook') return SocialIcons.Facebook;
    if (type === 'instagram') return SocialIcons.Instagram;
    if (type === 'youtube') return SocialIcons.Youtube;
    if (type === 'linkedin') return SocialIcons.Linkedin;
    if (type === 'x' || type === 'twitter') return SocialIcons.Twitter;
    return (props) => <Globe className="w-4 h-4" {...props} />;
  };

  const getLogoSrc = (logoPath) => {
    if (!logoPath) return '';
    return getStorageUrl(logoPath) || '';
  };

  const displayPartners = partners && partners.length > 0 ? partners : [];

  return (
    <div className="jl-root bg-white text-slate-900 font-sans selection:bg-red-500 selection:text-white">

      {/* Community Choice Modal */}
      <CommunityChoiceModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />

      {/* ── HERO SECTION (Ultra-Clean Minimalist White & Red Theme) ───────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-red-50/40 via-white to-white overflow-hidden pt-12 pb-20">
        
        {/* Subtle Ambient Red Light Orbs */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Fine Grid Graphic Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="jl-container relative z-10 max-w-5xl mx-auto px-4 text-center">

          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 bg-red-50 border border-red-200/80 rounded-full text-red-600 text-xs font-black uppercase tracking-widest shadow-sm mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>24/7 Emergency Blood Donation Platform</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 tracking-tight leading-[1.08] mb-6"
          >
            Donate Blood.<br />
            <span className="bg-gradient-to-r from-red-600 via-red-500 to-rose-600 bg-clip-text text-transparent">
              Save Lives Today.
            </span><br />
            Be Someone's Hero.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-600 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-medium"
          >
            JeevaLink connects generous donors with patients in urgent need across Kerala.
            Real-time GPS matching, verified donors, and immediate volunteer support.
          </motion.p>

          {/* Creative Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            {/* Enter the Community Button */}
            <button
              type="button"
              onClick={() => setIsCommunityModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-red-600/30 ring-4 ring-red-500/20 hover:scale-105 transition-all duration-300 flex items-center gap-3 cursor-pointer group"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <span>Enter the Community</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Become a Donor */}
            <Link
              to="/register"
              className="px-7 py-4 bg-white hover:bg-red-50/60 text-slate-800 hover:text-red-600 font-bold text-base rounded-2xl border border-slate-200 hover:border-red-300 shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <span>Become a Donor</span>
            </Link>

            {/* Request Blood */}
            <Link
              to="/requests"
              className="px-7 py-4 bg-white hover:bg-slate-50 text-slate-600 font-bold text-base rounded-2xl border border-slate-200 transition-all duration-200"
            >
              Request Blood
            </Link>
          </motion.div>

          {/* Inline Hero Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-100"
          >
            {heroStats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 leading-none mb-1">{s.value}</p>
                    <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>
      </section>

      {/* ── SPOTLIGHT: CREATIVE COMMUNITY ACCESS PORTAL CARD ─────────────── */}
      <section className="py-12 bg-white relative">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-red-600 via-red-600 to-rose-700 text-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-red-600/20 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-red-100 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>COMMUNITY PORTAL SPOTLIGHT</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Enter The Community & Connect With Area Volunteers
                </h2>

                <p className="text-red-100/90 text-sm sm:text-base max-w-xl leading-relaxed">
                  Looking for your local DYFI Block Committee Coordinator or signing in to your existing account? Click below to proceed instantly.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCommunityModalOpen(true)}
                className="px-8 py-4 bg-white hover:bg-red-50 text-red-600 font-extrabold text-base rounded-2xl shadow-xl transition-all transform hover:scale-105 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <span>Enter the Community</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── EMERGENCY LIVE TICKER BAR ────────────────────────────────────── */}
      <section className="py-4 bg-slate-900 text-slate-100 border-y border-slate-800">
        <div className="jl-container max-w-6xl mx-auto px-4 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/40 rounded-full text-red-400 text-xs font-extrabold shrink-0 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Live SOS Alerts
          </div>

          <div className="overflow-hidden flex-1 relative whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-300">
            <div className="inline-flex gap-8 animate-marquee">
              {tickerItems.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-red-500 fill-current" />
                  <strong className="text-white">{item.urgency}:</strong> {item.type} needed at {item.city}
                  <span className="text-slate-600 ml-4">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOOD TYPES REGISTRY (Minimal White & Red Cards) ─────────────── */}
      <section className="py-20 bg-slate-50/60 border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-xs font-extrabold uppercase tracking-wider">
              <Droplets className="w-3.5 h-3.5 text-red-600" />
              Blood Group Directory
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              We Support <span className="text-red-600">Every Blood Type</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
              Select any blood group to browse verified active donors available in your region.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {bloodTypes.map((type, i) => (
              <motion.div
                key={type}
                variants={scaleIn}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-500 hover:bg-red-600 hover:text-white shadow-sm hover:shadow-xl hover:shadow-red-500/20 text-center transition-all duration-300 group cursor-pointer"
              >
                <span className="block text-3xl font-black text-slate-900 group-hover:text-white transition-colors mb-1">
                  {type}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 group-hover:text-red-100 transition-colors">
                  Donors Ready
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (4 Minimalist Steps) ────────────────────────────── */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-xs font-extrabold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-red-600" />
              How JeevaLink Works
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Simple Steps. <span className="text-red-600">Lifesaving Impact.</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
              Our platform connects recipients and donors seamlessly in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-red-300 hover:shadow-xl hover:shadow-red-500/10 transition-all space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-red-200 group-hover:text-red-500 transition-colors">
                      0{step.num}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-red-600 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Safety banner */}
          <div className="mt-12 p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-center gap-3 text-xs text-slate-700 max-w-2xl mx-auto">
            <Shield className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-semibold">
              <strong className="text-red-700">Safety First:</strong> All donor profiles & blood requests undergo strict verification by DYFI District & Block Committee officers.
            </p>
          </div>
        </div>
      </section>

      {/* ── OUR IMPACT COUNTER GRID ───────────────────────────────────────── */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent pointer-events-none" />

        <div className="jl-container max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {impactStats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  variants={scaleIn}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    <AnimatedCounter target={s.value} suffix={s.suffix} />
                  </div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY JEEVALINK (3 CORE FEATURES) ────────────────────────────────── */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-3 mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-xs font-extrabold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 text-red-600" />
              Why JeevaLink
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Built For <span className="text-red-600">Emergencies.</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
              Advanced blood matching technology engineered for rapid response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-red-300 hover:bg-white hover:shadow-2xl hover:shadow-red-500/10 transition-all space-y-4 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-red-600 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-red-50/50">
        <div className="jl-container max-w-5xl mx-auto px-4">
          <div className="bg-white border border-red-200 rounded-3xl p-8 md:p-14 shadow-2xl space-y-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <span className="px-3.5 py-1 bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider rounded-full">
                Be The Hero
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Be the reason <span className="text-red-600">someone lives today.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Join thousands of voluntary blood donors across Kerala. One single donation can save up to 3 lives.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCommunityModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
                <span>Enter the Community</span>
              </button>

              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-base rounded-2xl transition-all text-center"
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
