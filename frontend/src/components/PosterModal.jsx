import { useRef, useState } from 'react';
import { X, Download, Share2, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';
import posterTemplate from '../assets/poster-template.png';
import { useAuthStore } from '../store/authStore';

const POSTER_CONFIG = {
  patientName: { top: '47mm', left: '34.2mm', fontSize: '4.2mm', color: '#0f172a', fontWeight: '800', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em', width: '32mm', transform: 'translate(-50%, -50%)', textAlign: 'center', lineHeight: '1.1' },
  hospital: { top: '55mm', left: '34.2mm', fontSize: '2.5mm', color: '#475569', fontWeight: '500', fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em', width: '32mm', transform: 'translate(-50%, -50%)', textAlign: 'center', lineHeight: '1.3' },
  phone: { top: '64mm', left: '34.2mm', fontSize: '3.6mm', color: '#dc2626', fontWeight: '700', fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em', width: '32mm', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  bloodGroup: { top: '53mm', left: '67.2mm', fontSize: '7mm', color: '#dc2626', fontWeight: '900', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em', width: '20mm', transform: 'translate(-50%, -50%)', textAlign: 'center', lineHeight: '1', textShadow: 'none' },
  units: { top: '68.1mm', left: '67.8mm', fontSize: '2.2mm', color: '#ffffff', fontWeight: '600', fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em', width: '22.5mm', transform: 'translate(-50%, -50%)', textAlign: 'center', lineHeight: '1', textShadow: '0px 1px 2px rgba(0,0,0,0.4)' },
  location: { top: '82mm', left: '45mm', fontSize: '2.8mm', color: '#ffffff', fontWeight: '700', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.15em', width: '72mm', transform: 'translate(-50%, -50%)', textAlign: 'center', textShadow: '0px 1px 3px rgba(0,0,0,0.5)' },
  date: { top: '109mm', left: '4mm', fontSize: '1.8mm', color: '#94a3b8', fontWeight: '600', fontFamily: "'Inter', sans-serif", textAlign: 'left', textShadow: 'none' }
};

function formatMeghalaCommittee(raw) {
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

function formatUnits(raw) {
  if (raw === undefined || raw === null || raw === '') return '1 UNIT';
  const str = String(raw).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
    return '1 UNIT';
  }
  if (/units?/i.test(str) || /bags?/i.test(str) || /ml/i.test(str)) {
    return str.toUpperCase();
  }
  const digits = str.replace(/[^\d.]/g, '');
  if (!digits) return `${str.toUpperCase()} UNITS`;
  const num = Number(digits);
  return `${digits} ${num === 1 ? 'Unit(s)' : 'Unit(s)'}`; // Adjusted back to Unit(s) as per user's image
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

function formatRequestDateTime(posterData) {
  if (!posterData) {
    return formatDateTime(new Date());
  }

  // Check blood request created date & time fields
  const rawDate =
    posterData.created_at ||
    posterData.createdAt ||
    posterData.request_date ||
    posterData.requestDate ||
    posterData.requested_at ||
    posterData.requestedAt ||
    posterData.date_needed ||
    posterData.dateNeeded ||
    posterData.required_date ||
    posterData.requiredDate ||
    posterData.generated_at ||
    posterData.generatedAt ||
    posterData.updated_at ||
    posterData.updatedAt;

  if (posterData.time_needed || posterData.timeNeeded || posterData.required_time) {
    const timeStr = posterData.time_needed || posterData.timeNeeded || posterData.required_time;
    const dateStr = posterData.date_needed || posterData.dateNeeded || posterData.required_date || posterData.created_at;
    if (dateStr) {
      const datePart = String(dateStr).split('T')[0];
      const combined = new Date(`${datePart} ${timeStr}`);
      if (!isNaN(combined.getTime())) {
        return formatDateTime(combined);
      }
    }
  }

  return formatDateTime(rawDate || new Date());
}

function formatDateTime(dateVal) {
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
  const rawUnits = posterData.units_required || posterData.unitsRequired || posterData.units || posterData.unit || posterData.quantity || '1';
  const unitsText = formatUnits(rawUnits);

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
  const timestampText = formatRequestDateTime(posterData);

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
      <div className="bg-white/5 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl relative text-white border border-white/10 animate-in fade-in zoom-in duration-200">

        {/* Modal Header & Close */}
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-white/10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Generated Blood Request Poster
            </h2>
            <p className="text-[11px] text-slate-300">Preview with live dynamic patient data</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* POSTER RENDER CONTAINER */}
        <div className="mx-auto w-full shadow-2xl rounded-2xl overflow-hidden border border-slate-700/50 flex justify-center bg-slate-100">
          {/* Explicit physical sizing in mm as requested by user */}
          <div ref={posterRef} className="relative bg-white shrink-0 m-0 p-0 overflow-hidden" style={{ width: '90mm', height: '112.5mm' }}>

            {/* Background Template */}
            <img
              src={posterTemplate}
              alt="Blood Request Poster Template"
              className="w-full h-full object-cover block absolute inset-0 pointer-events-none"
              crossOrigin="anonymous"
            />

            {/* Dynamic Text Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <span style={{ position: 'absolute', ...POSTER_CONFIG.patientName }}>{patientName}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.hospital }}>{hospital}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.phone }}>{phone}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.bloodGroup }}>{bloodGroup}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.units }}>{unitsText}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.location }}>{committeeName}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.date }}>{timestampText}</span>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 mt-4">
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer text-xs sm:text-sm disabled:opacity-50"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Rendering HD Poster...' : 'Download Poster (HD)'}
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer border border-slate-600"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

      </div>
    </div>
  );
}
