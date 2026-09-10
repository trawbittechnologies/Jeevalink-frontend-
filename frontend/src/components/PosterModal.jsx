import { useRef, useState } from 'react';
import { X, Download, Share2, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';
import posterTemplate from '../assets/poster-template.png';
import { useAuthStore } from '../store/authStore';

const POSTER_CONFIG = {
  patientName: {
    top: '45mm',
    left: '34.2mm',
    fontSize: '4.6mm',
    color: '#0f172a',
    fontWeight: '900',
    fontFamily: "'Inter', system-ui, sans-serif",
    letterSpacing: '-0.02em',
    width: '36mm',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    lineHeight: '1.15'
  },
  hospital: {
    top: '53.8mm',
    left: '34.2mm',
    fontSize: '2.8mm',
    color: '#334155',
    fontWeight: '700',
    fontFamily: "'Inter', system-ui, sans-serif",
    letterSpacing: '0.01em',
    width: '36mm',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    lineHeight: '1.25'
  },
  phone: {
    top: '63.2mm',
    left: '34.2mm',
    fontSize: '4.2mm',
    color: '#dc2626',
    fontWeight: '900',
    fontFamily: "'Inter', system-ui, sans-serif",
    letterSpacing: '0.04em',
    width: '36mm',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  bloodGroup: {
    top: '53mm',
    left: '67.2mm',
    fontSize: '7.8mm',
    color: '#dc2626',
    fontWeight: '900',
    fontFamily: "'Inter', system-ui, sans-serif",
    letterSpacing: '-0.03em',
    width: '22mm',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    lineHeight: '1',
    textShadow: 'none'
  },
  units: {
    top: '68.2mm',
    left: '67.8mm',
    fontSize: '2.4mm',
    color: '#ffffff',
    fontWeight: '800',
    fontFamily: "'Inter', system-ui, sans-serif",
    letterSpacing: '0.04em',
    width: '24mm',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    lineHeight: '1',
    textShadow: '0px 1px 3px rgba(0,0,0,0.8), 0px 0px 4px rgba(0,0,0,0.5)',
    textTransform: 'uppercase'
  },
  location: {
    top: '81.5mm',
    left: '45mm',
    fontSize: '3.0mm',
    color: '#ffffff',
    fontWeight: '900',
    fontFamily: "'Inter', system-ui, sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    width: '80mm',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.6)'
  },
  generatedAt: {
    top: '88.5mm',
    left: '45mm',
    fontSize: '1.9mm',
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: "'Inter', system-ui, sans-serif",
    letterSpacing: '0.04em',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    background: 'rgba(15, 23, 42, 0.65)',
    border: '0.25mm solid rgba(255, 255, 255, 0.35)',
    padding: '0.6mm 2.8mm',
    borderRadius: '9999px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap'
  }
};

export function formatMeghalaCommittee(raw) {
  if (!raw || typeof raw !== 'string') return 'DYFI Meghala Committee';
  const clean = raw.trim();
  if (!clean || clean.toLowerCase() === 'n/a' || clean.toLowerCase() === 'null') {
    return 'DYFI Meghala Committee';
  }

  const lower = clean.toLowerCase();

  // If clean already contains both meghala and committee
  if (lower.includes('meghala') && lower.includes('committee')) {
    return clean;
  }

  // If clean ends with / contains "meghala" (e.g. "Cheemeni Meghala")
  if (lower.includes('meghala')) {
    return `${clean} Committee`;
  }

  // If clean contains "committee"
  if (lower.includes('committee')) {
    return clean;
  }

  // Pure area / meghala name (e.g. "Cheemeni", "Kanhangad", "Nileshwar")
  return `${clean} Meghala Committee`;
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
  if (!num) return 'Contact Number';
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

  return `Generated: ${day} ${month} ${year} • ${formattedHours}:${minutes} ${ampm}`;
}

export default function PosterModal({ isOpen, onClose, data, requestData }) {
  const posterRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const posterData = data || requestData;

  if (!isOpen || !posterData) return null;

  const currentUser = useAuthStore.getState().user;

  // Extract fields based on existing data structure variations
  const hospital = posterData.hospital_name || posterData.hospitalName || posterData.venue || 'Hospital Name';
  const rawPatientName = posterData.patient_name || posterData.patientName || 'Patient Name';
  const patientName = toTitleCase(rawPatientName);
  const rawPhone = posterData.contact_phone || posterData.contact_number || posterData.contactNumber || posterData.mobile || 'Contact Number';
  const phone = formatPhoneNumber(rawPhone);
  const bloodGroup = posterData.blood_group || posterData.bloodGroup || 'O+';
  const rawUnits = posterData.units_required || posterData.unitsRequired || '1';
  const unitsText = `${rawUnits} UNIT${Number(rawUnits) > 1 || isNaN(Number(rawUnits)) ? 'S' : ''}`;

  // Extract and format the Meghala Name accurately
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
    '';

  const location = formatMeghalaCommittee(rawLocation);

  const requestId = posterData.request_id || posterData.id || posterData._id || 'JL-REQ';
  const generatedTimeText = formatGeneratedDateTime(posterData.generated_at || new Date());

  const handleDownloadPNG = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      await new Promise((res) => setTimeout(res, 100)); // wait for fonts/render

      const dataUrl = await toPng(posterRef.current, {
        quality: 1.0,
        pixelRatio: 2, // High resolution
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `idonate-blood-request-${requestId}.png`;
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
          title: `Emergency Blood Request: ${bloodGroup}`,
          text: `Urgent need for ${bloodGroup} blood at ${hospital}. Please help!`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-900 border border-slate-200 animate-in fade-in zoom-in duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 pr-10">
          <h2 className="text-xl font-bold">Generated Blood Request Poster</h2>
          <p className="text-xs text-slate-500">Preview the dynamic poster below.</p>
        </div>

        {/* POSTER RENDER CONTAINER */}
        <div className="mx-auto w-full shadow-lg rounded-xl overflow-x-auto overflow-y-hidden border border-slate-200 flex justify-center bg-slate-50">
          {/* Explicit physical sizing in mm as requested by user */}
          <div ref={posterRef} className="relative bg-white shrink-0 m-0 p-0" style={{ width: '90mm', height: '112.5mm' }}>

            {/* Background Template */}
            <img
              src={posterTemplate}
              alt="Blood Request Poster Template"
              className="w-full h-full object-cover block"
              crossOrigin="anonymous"
            />

            {/* Dynamic Text Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <span style={{ position: 'absolute', ...POSTER_CONFIG.patientName }}>{patientName}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.hospital }}>{hospital}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.phone }}>{phone}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.bloodGroup }}>{bloodGroup}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.units }}>{unitsText}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.location }}>{location}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.generatedAt }}>{generatedTimeText}</span>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition cursor-pointer text-sm disabled:opacity-50"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Rendering HD Poster...' : 'Download Poster'}
          </button>

          <button
            onClick={handleShare}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

      </div>
    </div>
  );
}

