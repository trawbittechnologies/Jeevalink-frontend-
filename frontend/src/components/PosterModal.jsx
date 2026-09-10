import { useRef, useState } from 'react';
import { X, Download, Share2, RefreshCw, MapPin, Phone, Users, Calendar } from 'lucide-react';
import { toPng } from 'html-to-image';
import posterTemplate from '../assets/poster-template.png';
import { useAuthStore } from '../store/authStore';

export function formatMeghalaCommittee(raw) {
  if (!raw || typeof raw !== 'string') return 'TEST MEGHALA COMMITTEE';
  const clean = raw.trim();
  if (!clean || clean.toLowerCase() === 'n/a' || clean.toLowerCase() === 'null') {
    return 'TEST MEGHALA COMMITTEE';
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
  if (!str) return 'Pradeep';
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
    return `${digits.slice(2, 7)} ${digits.slice(7)}`;
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

  return `${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
}

export default function PosterModal({ isOpen, onClose, data, requestData }) {
  const posterRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const posterData = data || requestData;

  if (!isOpen || !posterData) return null;

  const currentUser = useAuthStore.getState().user;

  // Extract dynamic data fields
  const hospital = posterData.hospital_name || posterData.hospitalName || posterData.venue || 'Aster MIMS Hospital';
  const rawPatientName = posterData.patient_name || posterData.patientName || 'Pradeep';
  const patientName = toTitleCase(rawPatientName);
  const rawPhone = posterData.contact_phone || posterData.contact_number || posterData.contactNumber || posterData.mobile || '79026 19430';
  const phone = formatPhoneNumber(rawPhone);
  const bloodGroup = (posterData.blood_group || posterData.bloodGroup || 'B+').toUpperCase();
  const rawUnits = posterData.units_required || posterData.unitsRequired || '2';
  const unitsNumber = String(rawUnits).replace(/\D/g, '') || '2';
  const unitsText = `${unitsNumber} UNITS`;

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
    'TEST MEGHALA COMMITTEE';

  const committeeName = formatMeghalaCommittee(rawLocation);
  const requestId = posterData.request_id || posterData.id || posterData._id || 'JL-REQ';
  const timestampText = formatGeneratedDateTime(posterData.generated_at || new Date());

  const handleDownloadPNG = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      await new Promise((res) => setTimeout(res, 150));

      const dataUrl = await toPng(posterRef.current, {
        quality: 1.0,
        pixelRatio: 2.5, // Ultra-crisp HD export
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
              Generated Blood Request Poster
            </h2>
            <p className="text-[11px] text-slate-400">Preview with live dynamic patient data</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* POSTER VIEWPORT CONTAINER */}
        <div className="mx-auto w-full flex justify-center items-center rounded-2xl overflow-hidden shadow-2xl border border-teal-900/60 bg-[#072422]">
          
          {/* ============================================================
              MASTER POSTER CONTAINER (Matching 992 x 1280 Template Aspect Ratio)
             ============================================================ */}
          <div
            ref={posterRef}
            className="relative bg-white shrink-0 overflow-hidden select-none"
            style={{
              width: '400px',
              height: '516px',
              fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* 1. Base Template Image (Preserved exactly) */}
            <img
              src={posterTemplate}
              alt="Poster Template"
              className="w-full h-full object-cover block absolute inset-0 pointer-events-none"
              crossOrigin="anonymous"
            />

            {/* 2. DYNAMIC CONTENT OVERLAY */}
            <div className="absolute inset-0 z-10 pointer-events-none">

              {/* ------------------------------------------------------------
                  A. MAIN WHITE CARD DYNAMIC CONTENT
                  (Expanded width: 45.2% and left: 15.8% to display full phone number without clipping)
                 ------------------------------------------------------------ */}
              <div
                className="absolute flex flex-col justify-between overflow-hidden"
                style={{
                  top: '32.2%',
                  left: '15.8%',
                  width: '45.2%',
                  height: '32.2%',
                  padding: '6px 8px 6px 8px',
                }}
              >
                {/* 1. Blood Group Header Row */}
                <div className="flex items-center gap-2">
                  {/* Blood Group Red Rounded Box */}
                  <div
                    className="bg-[#d31818] rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ width: '58px', height: '38px' }}
                  >
                    <span className="text-[21px] font-black tracking-tight leading-none">
                      {bloodGroup}
                    </span>
                  </div>

                  {/* BLOOD NEEDED Bold Text */}
                  <div className="leading-tight">
                    <div className="text-[13.5px] font-black text-[#d31818] tracking-tight leading-none">
                      BLOOD
                    </div>
                    <div className="text-[13.5px] font-black text-[#d31818] tracking-tight leading-none mt-0.5">
                      NEEDED
                    </div>
                  </div>
                </div>

                {/* 2. Patient Name Section */}
                <div className="pt-0.5">
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                    Patient
                  </div>
                  <div className="text-[18px] font-black text-[#0f172a] tracking-tight leading-tight truncate mt-0.5">
                    {patientName}
                  </div>
                </div>

                {/* Thin Divider */}
                <div className="h-[1px] bg-slate-200/90 w-full"></div>

                {/* 3. Hospital Section */}
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                    Hospital
                  </div>
                  <div className="text-[11.5px] font-bold text-[#0f172a] flex items-center gap-1 mt-0.5 tracking-tight truncate">
                    <MapPin className="w-3 h-3 text-slate-700 shrink-0 inline-block fill-slate-700/20" />
                    <span className="truncate">{hospital}</span>
                  </div>
                </div>

                {/* Thin Divider */}
                <div className="h-[1px] bg-slate-200/90 w-full"></div>

                {/* 4. Contact & Units Row */}
                <div className="flex items-center justify-between gap-1">
                  {/* Contact Number */}
                  <div className="shrink-0">
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                      Contact
                    </div>
                    <div className="text-[13px] font-black text-[#d31818] flex items-center gap-1 mt-0.5 tracking-tight leading-none whitespace-nowrap">
                      <Phone className="w-3 h-3 text-slate-800 fill-slate-800 shrink-0" />
                      <span>{phone}</span>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-5 w-[1px] bg-slate-200/90 shrink-0 mx-0.5"></div>

                  {/* Units Red Rounded Badge */}
                  <div className="bg-[#d31818] text-white px-2 py-1 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                    <span className="text-[9.5px] font-black tracking-wide leading-none whitespace-nowrap">
                      {unitsText}
                    </span>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  B. BLOOD BAG LABEL DYNAMIC CONTENT
                  (Centered over the white label on the blood bag)
                 ------------------------------------------------------------ */}
              <div
                className="absolute flex flex-col items-center justify-between text-center"
                style={{
                  top: '42.8%',
                  left: '65.2%',
                  width: '14.2%',
                  height: '8.4%',
                  padding: '2px 0',
                }}
              >
                {/* Red Droplet Icon */}
                <div className="w-2.5 h-2.5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="#d31818" className="w-full h-full">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>

                {/* GIVE BLOOD GIVE LIFE Text */}
                <div className="leading-[1.1] text-[#334155]">
                  <div className="text-[5.2px] font-black tracking-wider uppercase">GIVE</div>
                  <div className="text-[5.2px] font-black tracking-wider uppercase">BLOOD</div>
                  <div className="text-[5.2px] font-black tracking-wider uppercase">GIVE LIFE</div>
                </div>

                {/* Barcode Graphic */}
                <div className="w-[85%] h-[4.5px] flex justify-between items-center opacity-85">
                  <span className="w-[1px] h-full bg-slate-800"></span>
                  <span className="w-[1.8px] h-full bg-slate-800"></span>
                  <span className="w-[0.8px] h-full bg-slate-800"></span>
                  <span className="w-[2.2px] h-full bg-slate-800"></span>
                  <span className="w-[1px] h-full bg-slate-800"></span>
                  <span className="w-[1.6px] h-full bg-slate-800"></span>
                  <span className="w-[0.8px] h-full bg-slate-800"></span>
                  <span className="w-[1.8px] h-full bg-slate-800"></span>
                  <span className="w-[1px] h-full bg-slate-800"></span>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  C. COMMITTEE SECTION (Dark Translucent Bar)
                 ------------------------------------------------------------ */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top: '66.2%',
                  left: '28.0%',
                  width: '45.0%',
                  height: '4.8%',
                }}
              >
                <div className="w-full h-full bg-[#053733]/92 backdrop-blur-md rounded-xl border border-teal-400/25 px-2.5 flex items-center justify-center gap-2 shadow-md">
                  {/* Users Icon */}
                  <Users className="w-3.5 h-3.5 text-white shrink-0 fill-white" />

                  {/* Text */}
                  <div className="leading-tight text-left min-w-0">
                    <div className="text-[6.5px] font-semibold text-teal-200/90 tracking-wider uppercase leading-none">
                      REQUESTED BY
                    </div>
                    <div className="text-[8.5px] font-black text-white tracking-wide uppercase truncate leading-snug mt-0.5">
                      {committeeName}
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  D. TIMESTAMP PILL
                 ------------------------------------------------------------ */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top: '72.2%',
                  left: '32.5%',
                  width: '36.0%',
                  height: '2.6%',
                }}
              >
                <div className="w-full h-full bg-[#042825]/90 border border-teal-400/25 rounded-full px-2 flex items-center justify-center gap-1.5 shadow-sm">
                  <Calendar className="w-2.5 h-2.5 text-teal-300 shrink-0" />
                  <span className="text-[7px] font-medium text-teal-100 whitespace-nowrap leading-none">
                    Generated: {timestampText}
                  </span>
                </div>
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
