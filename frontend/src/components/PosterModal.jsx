import { useRef, useState } from 'react';
import { X, Download, Share2, RefreshCw, MapPin, Phone, Droplets, HeartHandshake } from 'lucide-react';
import { toPng } from 'html-to-image';
import dyfiLogo from '../assets/poster_logo/dyfi_logo.png';
import jeevalinkLogo from '../assets/poster_logo/jeevalink_logo.png';
import { useAuthStore } from '../store/authStore';

export function formatMeghalaCommittee(raw) {
  if (!raw || typeof raw !== 'string') return 'DYFI KASARAGOD DISTRICT COMMITTEE';
  const clean = raw.trim();
  if (!clean || clean.toLowerCase() === 'n/a' || clean.toLowerCase() === 'null') {
    return 'DYFI KASARAGOD DISTRICT COMMITTEE';
  }

  const lower = clean.toLowerCase();

  if (lower.includes('meghala') && lower.includes('committee')) {
    return clean.toUpperCase();
  }

  if (lower.includes('meghala')) {
    return `${clean} COMMITTEE`.toUpperCase();
  }

  if (lower.includes('committee')) {
    return clean.toUpperCase();
  }

  return `${clean} MEGHALA COMMITTEE`.toUpperCase();
}

function toTitleCase(str) {
  if (!str) return 'Patient Name';
  return String(str)
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatPhoneNumber(num) {
  if (!num) return '79026 19430';
  const digits = String(num).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return String(num).trim();
}

function formatGeneratedDateTime(dateVal) {
  const d = dateVal ? new Date(dateVal) : new Date();
  const valid = !isNaN(d.getTime()) ? d : new Date();

  const day = String(valid.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[valid.getMonth()];
  const year = valid.getFullYear();

  let hours = valid.getHours();
  const minutes = String(valid.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `Generated · ${day} ${month} ${year} · ${formattedHours}:${minutes} ${ampm}`;
}

export default function PosterModal({ isOpen, onClose, data, requestData }) {
  const posterRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const posterData = data || requestData;

  if (!isOpen || !posterData) return null;

  const currentUser = useAuthStore.getState().user;

  // Extract fields with fallbacks
  const hospital = posterData.hospital_name || posterData.hospitalName || posterData.venue || 'Aster MIMS Hospital';
  const rawPatientName = posterData.patient_name || posterData.patientName || 'Pradeep';
  const patientName = toTitleCase(rawPatientName);
  const rawPhone = posterData.contact_phone || posterData.contact_number || posterData.contactNumber || posterData.mobile || '79026 19430';
  const phone = formatPhoneNumber(rawPhone);
  const bloodGroup = (posterData.blood_group || posterData.bloodGroup || 'B+').toUpperCase();
  const rawUnits = posterData.units_required || posterData.unitsRequired || '2';
  const unitsNumber = String(rawUnits).replace(/\D/g, '') || '2';
  const unitsText = `${unitsNumber} UNIT${Number(unitsNumber) > 1 ? 'S' : ''}`;

  const rawLocation =
    posterData.meghala_committee_name ||
    posterData.meghalaCommitteeName ||
    posterData.meghala_name ||
    posterData.meghalaName ||
    posterData.requester_meghala ||
    posterData.requesterMeghala ||
    posterData.meghala ||
    posterData.requester?.meghalaCommitteeName ||
    posterData.requester?.meghala_committee_name ||
    posterData.requester?.meghala_name ||
    posterData.requester?.meghala ||
    posterData.requester?.city ||
    posterData.requester?.organization_name ||
    posterData.unit ||
    posterData.city ||
    currentUser?.meghala ||
    currentUser?.city ||
    currentUser?.organization_name ||
    'Kasaragod District Committee';

  const committeeName = formatMeghalaCommittee(rawLocation);
  const requestId = posterData.request_id || posterData.id || posterData._id || 'JL-REQ';
  const timestampText = formatGeneratedDateTime(posterData.generated_at || new Date());

  const handleDownloadPNG = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      await new Promise((res) => setTimeout(res, 150)); // Allow font rendering

      const dataUrl = await toPng(posterRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Ultra-crisp high-res output for print & social media
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `DYFI-iDonate-${bloodGroup}-${patientName.replace(/\s+/g, '_')}-${requestId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Poster PNG rendering error:", err);
      alert('Failed to generate poster image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/requests/${requestId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `URGENT: ${bloodGroup} Blood Needed for ${patientName}`,
          text: `🚨 Urgent requirement for ${bloodGroup} blood (${unitsText}) at ${hospital}. Please contact: ${phone}`,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl relative text-white border border-slate-800 animate-in fade-in zoom-in duration-200">

        {/* Modal Header & Close */}
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Social Media Request Poster
            </h2>
            <p className="text-[11px] text-slate-400">Auto-generated dynamic canvas preview</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* POSTER VIEWPORT WRAPPER */}
        <div className="mx-auto w-full flex justify-center items-center rounded-2xl overflow-hidden shadow-2xl border border-teal-900/60 bg-[#072422]">
          
          {/* ============================================================
              MASTER POSTER CANVAS (Standard 4:5 Social Media Ratio)
             ============================================================ */}
          <div
            ref={posterRef}
            className="relative bg-gradient-to-b from-[#063b38] via-[#084945] to-[#042826] text-white flex flex-col justify-between overflow-hidden"
            style={{
              width: '380px',
              height: '520px',
              fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* Background Medical Textures & Organic Waves */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Subtle radial glow */}
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-teal-400/10 blur-3xl"></div>
              <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"></div>
              <div className="absolute -bottom-10 right-0 w-48 h-48 rounded-full bg-red-500/10 blur-2xl"></div>

              {/* Abstract medical curves / cross grid */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="medical-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M 14 10 L 14 18 M 10 14 L 18 14" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#medical-grid)" />
              </svg>

              {/* Soft medical wave at bottom */}
              <svg className="absolute bottom-10 left-0 right-0 w-full h-24 opacity-15" viewBox="0 0 380 96" fill="none">
                <path d="M0 45 C 95 10, 190 80, 285 30 C 330 10, 360 40, 380 35 L 380 96 L 0 96 Z" fill="#ffffff" />
              </svg>

              {/* Subtle medical donor tubing accent along right and bottom edge */}
              <svg className="absolute top-28 right-1 w-24 h-64 opacity-20 pointer-events-none" viewBox="0 0 100 260" fill="none">
                <path d="M 60 0 C 60 70, 95 90, 85 160 C 75 220, 20 230, 0 255" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" />
              </svg>
            </div>

            {/* ------------------------------------------------------------
                1. HEADER SECTION
               ------------------------------------------------------------ */}
            <div className="relative z-10 pt-3 px-4 pb-1">
              {/* Malayalam Slogan */}
              <div className="text-center mb-1.5">
                <span className="inline-block text-[9.5px] font-semibold text-emerald-200/90 tracking-wide bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-500/20 shadow-sm">
                  രക്തദാനം മഹാദാനം • ഒരു ജീവൻ രക്ഷിക്കാം
                </span>
              </div>

              {/* Header Branding Row */}
              <div className="flex items-center justify-between gap-2">
                {/* DYFI Kasaragod Branding */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/95 p-1 shadow-sm flex items-center justify-center shrink-0 border border-white/40">
                    <img
                      src={dyfiLogo}
                      alt="DYFI Logo"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[12px] font-black tracking-tight text-white uppercase drop-shadow-sm">
                      DYFI iDonate
                    </div>
                    <div className="text-[8.5px] font-bold text-emerald-300 tracking-wider uppercase">
                      Kasaragod District
                    </div>
                  </div>
                </div>

                {/* iDonate / JeevaLink Logo on Upper Right */}
                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-white/10 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-white p-0.5 shadow-sm flex items-center justify-center">
                    <img
                      src={jeevalinkLogo}
                      alt="iDonate Logo"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[10.5px] font-extrabold tracking-tight text-white block leading-none">
                      iDONATE
                    </span>
                    <span className="text-[7px] font-bold text-red-300 tracking-widest uppercase">
                      BLOOD WING
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------
                2. MAIN CONTENT AREA (Blood Card + Blood Bag Visual)
               ------------------------------------------------------------ */}
            <div className="relative z-10 px-3.5 flex items-center gap-2.5 my-auto">
              
              {/* MAIN WHITE REQUEST CARD */}
              <div className="flex-1 bg-white rounded-2xl p-3 shadow-xl text-slate-900 border border-slate-100/90 relative overflow-hidden">
                {/* Card Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600"></div>

                {/* Card Header: Blood Group Badge + BLOOD NEEDED Headline */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-md shadow-red-600/30 border border-red-500">
                      <span className="text-xl font-black tracking-tight leading-none">
                        {bloodGroup}
                      </span>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-red-600 tracking-wider uppercase leading-none">
                        EMERGENCY
                      </div>
                      <div className="text-[14px] font-black text-slate-900 tracking-tight leading-tight">
                        BLOOD NEEDED
                      </div>
                    </div>
                  </div>

                  {/* Units Compact Red Badge */}
                  <div className="bg-red-50 border border-red-200 px-2 py-1 rounded-lg text-center shadow-xs shrink-0">
                    <span className="text-[11px] font-black text-red-600 tracking-wide block leading-none">
                      {unitsText}
                    </span>
                  </div>
                </div>

                {/* Patient Information Section */}
                <div className="py-2">
                  <span className="text-[8.5px] font-bold tracking-widest text-slate-400 uppercase block mb-0.5">
                    PATIENT
                  </span>
                  <div className="text-[17px] font-black text-slate-900 tracking-tight leading-tight truncate">
                    {patientName}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 w-full"></div>

                {/* Hospital Section */}
                <div className="py-2">
                  <span className="text-[8.5px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1 mb-0.5">
                    <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0" />
                    HOSPITAL
                  </span>
                  <div className="text-[12px] font-bold text-slate-700 tracking-normal leading-snug line-clamp-2">
                    {hospital}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 w-full"></div>

                {/* Contact Section */}
                <div className="pt-2">
                  <span className="text-[8.5px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1 mb-0.5">
                    <Phone className="w-2.5 h-2.5 text-red-500 shrink-0" />
                    CONTACT FOR BLOOD
                  </span>
                  <div className="text-[18px] font-black text-red-600 tracking-wider leading-none font-mono">
                    {phone}
                  </div>
                </div>
              </div>

              {/* 3. BLOOD BAG VISUAL (Supporting Visual) */}
              <div className="w-[84px] shrink-0 flex flex-col items-center justify-center">
                <div className="relative w-full aspect-[2/3] max-h-[175px] filter drop-shadow-lg">
                  {/* Clean SVG Blood Bag */}
                  <svg viewBox="0 0 100 150" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Top Loop / Hanger */}
                    <path d="M 40 10 C 40 4, 60 4, 60 10 L 60 16 L 40 16 Z" fill="#94a3b8" />
                    <circle cx="50" cy="8" r="3" fill="#063b38" />

                    {/* Main Bag Outer Translucent Shell */}
                    <rect x="15" y="16" width="70" height="114" rx="14" fill="#ffffff" fillOpacity="0.88" stroke="#cbd5e1" strokeWidth="2" />

                    {/* Fluid Liquid inside bag */}
                    <rect x="18" y="42" width="64" height="84" rx="10" fill="url(#blood-gradient)" />

                    {/* Graduation Measurement Marks */}
                    <line x1="22" y1="55" x2="30" y2="55" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" />
                    <line x1="22" y1="70" x2="34" y2="70" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" />
                    <line x1="22" y1="85" x2="30" y2="85" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" />
                    <line x1="22" y1="100" x2="34" y2="100" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" />

                    {/* White Label on Bag with Blood Group */}
                    <rect x="36" y="52" width="40" height="42" rx="6" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))" />
                    <text x="56" y="70" textAnchor="middle" fill="#dc2626" fontSize="18" fontWeight="900" fontFamily="'Inter', system-ui, sans-serif">
                      {bloodGroup}
                    </text>
                    <text x="56" y="84" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="800" letterSpacing="0.5">
                      DONOR
                    </text>

                    {/* Bottom Ports / Tubes */}
                    <rect x="30" y="128" width="10" height="12" rx="2" fill="#64748b" />
                    <rect x="60" y="128" width="10" height="12" rx="2" fill="#64748b" />
                    <path d="M 35 140 Q 35 152 45 150" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" />

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="blood-gradient" x1="50" y1="42" x2="50" y2="126" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="60%" stopColor="#dc2626" />
                        <stop offset="100%" stopColor="#991b1b" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

            </div>

            {/* ------------------------------------------------------------
                6. COMMITTEE SECTION & 7. TIMESTAMP
               ------------------------------------------------------------ */}
            <div className="relative z-10 px-3.5 pb-2 space-y-1.5">
              
              {/* Committee Dark Translucent Bar */}
              <div className="bg-black/40 backdrop-blur-md rounded-xl py-1.5 px-3 border border-white/15 flex items-center justify-between text-center">
                <div className="w-full text-center">
                  <span className="text-[7.5px] font-extrabold text-emerald-300/80 tracking-widest uppercase block leading-none mb-0.5">
                    REQUESTED & VERIFIED BY
                  </span>
                  <span className="text-[10px] font-black text-white tracking-wide uppercase block truncate">
                    {committeeName}
                  </span>
                </div>
              </div>

              {/* Timestamp Pill */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-1.5 bg-teal-950/70 border border-teal-400/20 text-teal-200/90 text-[8px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {timestampText}
                </div>
              </div>

            </div>

            {/* ------------------------------------------------------------
                8. CLEAN FOOTER
               ------------------------------------------------------------ */}
            <div className="relative z-10 bg-white text-slate-900 px-4 py-2 flex items-center justify-between border-t border-slate-200/80 shadow-md">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                <div className="text-[10px] font-black tracking-tight text-slate-900 uppercase">
                  DYFI iDONATE
                </div>
              </div>
              <div className="text-[8.5px] font-extrabold text-slate-600 tracking-wide uppercase">
                Kerala • Kasaragod District Committee
              </div>
            </div>

          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap gap-2.5 mt-4">
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer text-xs sm:text-sm disabled:opacity-50"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Rendering HD Poster...' : 'Download Poster (HD)'}
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer border border-slate-700"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

      </div>
    </div>
  );
}


