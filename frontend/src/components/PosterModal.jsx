import { useRef, useState } from 'react';
import { X, Download, Share2, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';
import posterTemplate from '../assets/poster-template.png';

const POSTER_CONFIG = {
  patientName: { top: '42%', left: '38%', fontSize: '4.5cqi', color: '#0f172a', fontWeight: '900', width: '34%', transform: 'translate(-50%, -50%)', textAlign: 'center', lineHeight: '1.1' },
  hospital: { top: '50%', left: '38%', fontSize: '3.2cqi', color: '#334155', fontWeight: '700', width: '34%', transform: 'translate(-50%, -50%)', textAlign: 'center', lineHeight: '1.2' },
  phone: { top: '58%', left: '38%', fontSize: '4.2cqi', color: '#b91c1c', fontWeight: '900', width: '34%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  bloodGroup: { top: '47.5%', left: '72%', fontSize: '7cqi', color: '#dc2626', fontWeight: 'black', width: '20%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  units: { top: '59%', left: '72%', fontSize: '3.2cqi', color: '#ffffff', fontWeight: 'bold', width: '25%', transform: 'translate(-50%, -50%)', textAlign: 'center', textShadow: '0px 1px 3px rgba(0,0,0,0.6)' },
  location: { top: '72%', left: '50%', fontSize: '3.5cqi', color: '#ffffff', fontWeight: '700', width: '80%', transform: 'translate(-50%, -50%)', textAlign: 'center', textShadow: '0px 1px 3px rgba(0,0,0,0.6)' }
};

export default function PosterModal({ isOpen, onClose, data }) {
  const posterRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !data) return null;

  // Extract fields based on existing data structure variations
  const hospital = data.hospital_name || data.hospitalName || data.venue || 'Hospital Name';
  const patientName = data.patient_name || data.patientName || 'Patient Name';
  const phone = data.contact_phone || data.contact_number || data.contactNumber || data.mobile || 'Contact Number';
  const bloodGroup = data.blood_group || data.bloodGroup || 'O+';
  const units = data.units_required || data.unitsRequired || '1';
  
  // Extract and format the Meghala Name
  const rawLocation = data.meghala_name || data.meghala || data.unit || data.location || data.city || '';
  const location = rawLocation 
    ? (rawLocation.toLowerCase().includes('meghala') ? rawLocation : `${rawLocation} Meghala`)
    : 'Meghala Name';
    
  const requestId = data.request_id || data.id || data._id || 'JL-REQ';

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
        <div className="mx-auto w-full shadow-lg rounded-xl overflow-hidden border border-slate-200">
          {/* Container Queries enabled for perfectly responsive font sizes using 'cqi' */}
          <div ref={posterRef} className="relative w-full bg-white m-0 p-0" style={{ containerType: 'inline-size' }}>
            
            {/* Background Template */}
            <img 
              src={posterTemplate} 
              alt="Blood Request Poster Template" 
              className="w-full h-auto block"
              crossOrigin="anonymous"
            />

            {/* Dynamic Text Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <span style={{ position: 'absolute', ...POSTER_CONFIG.patientName }}>{patientName}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.hospital }}>{hospital}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.phone }}>{phone}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.bloodGroup }}>{bloodGroup}</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.units }}>{units} Unit(s)</span>
              <span style={{ position: 'absolute', ...POSTER_CONFIG.location }}>{location}</span>
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

