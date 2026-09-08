import { useRef, useState } from 'react';
import {
  X, Download, RefreshCw, Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import posterBg from '../assets/blank_poster_template.png';

export default function PosterModal({ isOpen, onClose, data }) {
  const posterRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !data) return null;

  // Extract clean template variables
  const patientName = data.patient_name || data.patientName || '';
  const bloodGroup  = data.blood_group  || data.bloodGroup  || 'O+';
  const units       = data.units_required || data.unitsRequired || '1';
  const hospital    = data.hospital_name  || data.hospitalName  || data.venue || data.location || '';
  const phone       = data.contact_phone  || data.contact_number || data.contactNumber || data.mobile || '8848601076';
  const requestId   = data.request_id || data.id || data._id || `JL-${Date.now().toString().slice(-4)}`;

  // ─── PNG Export ───────────────────────────────────────────────────────────
  const handleDownloadPNG = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      await new Promise((res) => setTimeout(res, 150));
      const dataUrl = await toPng(posterRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `Blood_Request_${bloodGroup}_${requestId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Poster PNG rendering error:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // ─── Share ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = `${window.location.origin}/requests/${requestId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Emergency Blood Request: ${bloodGroup}`,
          text: `Urgent need for ${bloodGroup} blood at ${hospital}. Please help!`,
          url,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-900 border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-black text-slate-800 mb-4 pr-10">Blood Request Poster</h2>

        {/* ── POSTER ── */}
        <div className="mx-auto w-full max-w-[420px] shadow-2xl rounded-xl overflow-hidden">
          <div
            ref={posterRef}
            className="relative w-full"
            style={{ aspectRatio: '3/4', fontFamily: 'sans-serif' }}
          >
            {/* Background template image */}
            <img
              src={posterBg}
              alt="poster background"
              className="absolute inset-0 w-full h-full object-fill"
              crossOrigin="anonymous"
            />

            {/* ── DATA OVERLAY ── */}
            {/* These absolute-positioned elements sit on top of the template image.
                Percentages are tuned to the blank_poster_template.png layout.
                The template has:
                  BLOOD GROUP | DATE
                  TIME        | CONTACT
                  VENUE       | WHATSAPP
                rows inside a rounded card that starts at ~42% from top. */}

            {/* Row 1 – Blood Group */}
            <span
              style={{
                position: 'absolute',
                top: '44.5%',
                left: '30%',
                fontSize: '2.8vw',
                fontWeight: 900,
                color: '#b91c1c',
                letterSpacing: '-0.01em',
                lineHeight: 1,
                maxWidth: '16%',
                whiteSpace: 'nowrap',
              }}
            >
              {bloodGroup}
            </span>

            {/* Row 1 – Date (using "Unit" value as units required) */}
            <span
              style={{
                position: 'absolute',
                top: '44.5%',
                left: '67%',
                fontSize: '2.4vw',
                fontWeight: 800,
                color: '#1e293b',
                maxWidth: '28%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>

            {/* Row 2 – Time */}
            <span
              style={{
                position: 'absolute',
                top: '54.5%',
                left: '18%',
                fontSize: '2.4vw',
                fontWeight: 800,
                color: '#1e293b',
                maxWidth: '22%',
                whiteSpace: 'nowrap',
              }}
            >
              Urgent
            </span>

            {/* Row 2 – Contact */}
            <span
              style={{
                position: 'absolute',
                top: '54.5%',
                left: '55%',
                fontSize: '2.4vw',
                fontWeight: 800,
                color: '#1e293b',
                maxWidth: '40%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {phone}
            </span>

            {/* Row 3 – Venue (Hospital) */}
            <span
              style={{
                position: 'absolute',
                top: '64.5%',
                left: '18%',
                fontSize: '2.2vw',
                fontWeight: 800,
                color: '#1e293b',
                maxWidth: '36%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {hospital || '—'}
            </span>

            {/* Row 3 – WhatsApp */}
            <span
              style={{
                position: 'absolute',
                top: '64.5%',
                left: '55%',
                fontSize: '2.4vw',
                fontWeight: 800,
                color: '#1e293b',
                maxWidth: '40%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {phone}
            </span>

            {/* Patient name badge near top-center (optional callout) */}
            <div
              style={{
                position: 'absolute',
                top: '36%',
                left: '5%',
                right: '5%',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {patientName && (
                <span
                  style={{
                    fontSize: '2.6vw',
                    fontWeight: 900,
                    color: '#1e293b',
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                  }}
                >
                  Patient: {patientName}
                </span>
              )}
              {units && (
                <span
                  style={{
                    fontSize: '2.4vw',
                    fontWeight: 800,
                    color: '#b91c1c',
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                    marginLeft: 'auto',
                  }}
                >
                  Units: {units}
                </span>
              )}
            </div>

            {/* QR code over the template QR zone */}
            <div
              style={{
                position: 'absolute',
                bottom: '8.5%',
                right: '8%',
                background: '#fff',
                padding: '4px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              }}
            >
              <QRCodeSVG
                value={`${window.location.origin}/requests/${requestId}`}
                size={52}
                level="Q"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition cursor-pointer text-sm disabled:opacity-50"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Rendering HD Poster...' : 'Download Poster (PNG)'}
          </button>

          <button
            onClick={handleShare}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
