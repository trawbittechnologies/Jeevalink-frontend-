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
  Handshake,
  ExternalLink,
  Globe,
  Sparkles
} from "lucide-react";
import CommunityChoiceModal from "../components/CommunityChoiceModal.jsx";

/* ── Inline Brand Social Icons ───────────────────────── */
const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const XTwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const ThreadsIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M12.186 24h-.007C5.463 23.972 0 18.576 0 11.972 0 5.38 5.449 0 12.153 0 18.736 0 24 5.253 24 11.697c0 5.765-4.225 10.024-9.988 10.08-3.088.028-5.748-1.12-7.3-3.149l1.834-1.397c1.196 1.572 3.297 2.43 5.485 2.408 4.398-.043 7.683-3.238 7.683-7.64 0-4.796-3.882-8.706-8.665-8.706-4.782 0-8.664 3.91-8.664 8.706 0 4.887 3.96 8.86 8.825 8.88 2.505.011 4.757-.96 6.34-2.735l1.737 1.517C19.261 21.933 16.035 24 12.186 24z"/>
  </svg>
);

const getSocialPlatformConfig = (platform) => {
  const p = (platform || '').toLowerCase().trim();
  switch (p) {
    case 'facebook':
    case 'fb':
      return {
        label: 'Facebook',
        icon: FacebookIcon,
        className: 'bg-blue-50 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border-blue-200 hover:border-[#1877F2]',
      };
    case 'instagram':
    case 'ig':
    case 'insta':
      return {
        label: 'Instagram',
        icon: InstagramIcon,
        className: 'bg-pink-50 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-[#E4405F] hover:to-purple-600 text-[#E4405F] hover:text-white border-pink-200 hover:border-transparent',
      };
    case 'youtube':
    case 'yt':
      return {
        label: 'YouTube',
        icon: YoutubeIcon,
        className: 'bg-red-50 hover:bg-[#FF0000] text-[#FF0000] hover:text-white border-red-200 hover:border-[#FF0000]',
      };
    case 'linkedin':
      return {
        label: 'LinkedIn',
        icon: LinkedinIcon,
        className: 'bg-sky-50 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white border-sky-200 hover:border-[#0A66C2]',
      };
    case 'whatsapp':
    case 'wa':
      return {
        label: 'WhatsApp',
        icon: WhatsAppIcon,
        className: 'bg-emerald-50 hover:bg-[#25D366] text-[#25D366] hover:text-white border-emerald-200 hover:border-[#25D366]',
      };
    case 'x':
    case 'twitter':
      return {
        label: 'X (Twitter)',
        icon: XTwitterIcon,
        className: 'bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white border-slate-200 hover:border-slate-900',
      };
    case 'threads':
      return {
        label: 'Threads',
        icon: ThreadsIcon,
        className: 'bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white border-slate-200 hover:border-slate-900',
      };
    default:
      return {
        label: 'Website / Link',
        icon: Globe,
        className: 'bg-slate-50 hover:bg-red-600 text-slate-700 hover:text-white border-slate-200 hover:border-red-600',
      };
  }
};

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

const fallbackPartners = [
  {
    _id: 'default-1',
    name: 'DYFI Blood Wing Kerala',
    logo: '/hemo_avatar.png',
    social_media_type: 'facebook',
    social_media_link: 'https://facebook.com',
  },
  {
    _id: 'default-2',
    name: 'Kerala Voluntary Donor Council',
    logo: '/hemo_avatar.png',
    social_media_type: 'instagram',
    social_media_link: 'https://instagram.com',
  },
  {
    _id: 'default-3',
    name: 'Youth Emergency Helpline Kerala',
    logo: '/hemo_avatar.png',
    social_media_type: 'whatsapp',
    social_media_link: 'https://wa.me',
  },
  {
    _id: 'default-4',
    name: 'Kerala Health & Transfusion Care',
    logo: '/hemo_avatar.png',
    social_media_type: 'youtube',
    social_media_link: 'https://youtube.com',
  }
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

  const displayPartners = partners && partners.length > 0 ? partners : fallbackPartners;

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

      {/* ── PARTNERSHIP DETAILS SECTION (AFTER HERO SECTION) ─────────────── */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-slate-50/60 to-white border-b border-slate-100 relative overflow-hidden">
        {/* Ambient Decorative Backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="jl-container max-w-6xl mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center space-y-3 mb-12 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-black tracking-wide uppercase shadow-xs">
              <Handshake className="w-3.5 h-3.5 text-red-600" />
              <span>Partnership Details & Collaborations</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Our Life-Saving Partner Network
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
              Collaborating directly with verified grassroots organizations, community youth wings, and healthcare groups saving lives across Kerala.
            </p>
          </div>

          {/* Dynamic Partner Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayPartners.map((partner) => {
              const platformType = partner.social_media_type || partner.socialMediaType || partner.socialPlatform || 'link';
              const platformConfig = getSocialPlatformConfig(platformType);
              const SocialIcon = platformConfig.icon;
              const linkUrl = partner.social_media_link || partner.socialMediaLink || partner.socialLink || '#';

              return (
                <motion.div
                  key={partner.id || partner._id || partner.name}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/95 backdrop-blur-xl border border-slate-200/90 hover:border-red-300 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden"
                >
                  {/* Partner Logo */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-slate-50 to-red-50/40 border border-slate-200/90 p-3 flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 group-hover:border-red-200 transition-all duration-300 shadow-inner">
                    {partner.logo ? (
                      <img
                        src={getStorageUrl(partner.logo)}
                        alt={partner.name}
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNSIgZmlsbD0iI0YzRjRGNiIvPjx0ZXh0IHg9IjMwIiB5PSIzNSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxPR088L3RleHQ+PC9zdmc+';
                        }}
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-red-500" />
                    )}
                  </div>

                  {/* Partner Name */}
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1 mb-1">
                    {partner.name}
                  </h3>

                  <p className="text-[11px] font-semibold text-slate-400 mb-5 uppercase tracking-wider">
                    Community Partner
                  </p>

                  {/* Dynamic Single Selected Social Media Button */}
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs group/btn ${platformConfig.className}`}
                  >
                    <SocialIcon className="w-4 h-4 shrink-0 transition-transform group-hover/btn:scale-110" />
                    <span className="truncate">{platformConfig.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0 group-hover/btn:translate-x-0.5 transition-transform" />
                  </a>
                </motion.div>
              );
            })}
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
