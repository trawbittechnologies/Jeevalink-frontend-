import { useRef, useState } from 'react';
import { X, Download, RefreshCw, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';

/**
 * PosterModal — Blood Request Poster Generator
 *
 * Uses the DYFI "I Donate Kasaragod" poster as the background template.
 * Overlays: Patient Name, Blood Group, Unit, Hospital, Contact Number.
 *
 * ➜ Place your poster image at:
 *     frontend/src/assets/dyfi_blood_request_template.png
 *
 * The overlay positions (top %) are tuned for the 3:4 DYFI poster layout.
 * Tweak the `top` values below if your image differs slightly.
 */

// Static import — Vite will bundle the image automatically once the file exists.
// If the file isn't added yet, this import will fail at build time (not runtime).
import dyfiTemplate from '../assets/dyfi_blood_request_template.png';

// ─── Small helper used only in fallback card ──────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontWeight: 700, color: '#374151', minWidth: '110px', fontSize: '12px' }}>{label}</span>
      <span style={{ color: '#9ca3af', fontSize: '12px' }}>:</span>
      <span style={{ fontWeight: 800, color: '#111827', fontSize: '13px', flex: 1 }}>{value || '—'}</span>
    </div>
  );
}

export default function PosterModal({ isOpen, onClose, data }) {
  const posterRef  = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !data) return null;

  // ─── Extract request fields ───────────────────────────────────────────────
  const patientName = data.patient_name   || data.patientName   || '';
  const bloodGroup  = data.blood_group    || data.bloodGroup    || 'O+';
  const units       = data.units_required || data.unitsRequired || '1';
  const hospital    = data.hospital_name  || data.hospitalName  || data.venue || data.location || '';
  const phone       = data.contact_phone  || data.contact_number || data.contactNumber || data.mobile || '';
  const requestId   = data.request_id || data.id || data._id || `JL-${Date.now().toString().slice(-4)}`;

  // ─── HD PNG Download ──────────────────────────────────────────────────────
  const handleDownloadPNG = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      await new Promise((res) => setTimeout(res, 250));
      const dataUrl = await toPng(posterRef.current, {
        quality: 1.0,
        pixelRatio: 3,        // 3× = ~1260×1680 px output
        cacheBust: true,
      });
      const link      = document.createElement('a');
      link.download   = `BloodRequest_${bloodGroup}_${requestId}.png`;
      link.href       = dataUrl;
      link.click();
    } catch (err) {
      console.error('Poster PNG render error:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // ─── Share link ───────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = `${window.location.origin}/requests/${requestId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Blood Request: ${bloodGroup}`,
          text: `Urgent need for ${bloodGroup} blood at ${hospital}. Please help!`,
          url,
        });
      } catch (err) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // ─── Overlay style base ───────────────────────────────────────────────────
  // The DYFI poster info section lives in the lower-left area.
  // Positions below are in % of the poster height (aspect ratio 3:4).
  //   Patient Name ≈ 70 %
  //   Blood Group  ≈ 74.5 %
  //   Unit         ≈ 79 %
  //   Hospital     ≈ 83.5 %
  //   Contact      ≈ 88 %
  // Adjust `top` percentages to match your exact poster image.

  const rowBase = {
    position: 'absolute',
    left: '7%',
    right: '50%',          // keep text within the info column (left side)
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    fontFamily: '"Segoe UI", Arial, sans-serif',
    fontSize: 'clamp(8px, 2.5vw, 13px)',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  };

  const labelSt = {
    fontWeight: 700,
    color: '#374151',
    minWidth: '80px',
    flexShrink: 0,
  };

  const colonSt = { color: '#6b7280', margin: '0 3px', flexShrink: 0 };

  const valueSt = (color = '#111827') => ({
    fontWeight: 900,
    color,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(8px)',
      padding: '16px', overflowY: 'auto',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px',
        maxWidth: '440px', width: '100%',
        padding: '24px', boxShadow: '0 32px 64px rgba(0,0,0,0.35)',
        position: 'relative', maxHeight: '92vh', overflowY: 'auto',
      }}>

        {/* ── Close ── */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, width: 36, height: 36,
          border: 'none', borderRadius: '50%', background: '#f1f5f9',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#64748b', zIndex: 10,
        }}>
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '16px', paddingRight: '40px', color: '#0f172a' }}>
          Blood Request Poster
        </h2>

        {/* ── POSTER ── */}
        <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.20)' }}>
          <div
            ref={posterRef}
            style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', overflow: 'hidden' }}
          >
            {/* Background image — the full DYFI template */}
            <img
              src={dyfiTemplate}
              alt="DYFI Blood Request Poster"
              crossOrigin="anonymous"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
            />

            {/* ── OVERLAID DATA FIELDS ── */}

            {/* Patient Name */}
            <div style={{ ...rowBase, top: '70%' }}>
              <span style={labelSt}>Patient Name</span>
              <span style={colonSt}>:</span>
              <span style={valueSt('#111827')}>{patientName}</span>
            </div>

            {/* Blood Group */}
            <div style={{ ...rowBase, top: '74.5%' }}>
              <span style={labelSt}>Blood Group</span>
              <span style={colonSt}>:</span>
              <span style={valueSt('#b91c1c')}>{bloodGroup}</span>
            </div>

            {/* Unit */}
            <div style={{ ...rowBase, top: '79%' }}>
              <span style={labelSt}>Unit</span>
              <span style={colonSt}>:</span>
              <span style={valueSt('#111827')}>{units}</span>
            </div>

            {/* Hospital */}
            <div style={{ ...rowBase, top: '83.5%' }}>
              <span style={labelSt}>Hospital</span>
              <span style={colonSt}>:</span>
              <span style={valueSt('#111827')}>{hospital}</span>
            </div>

            {/* Contact Number */}
            <div style={{ ...rowBase, top: '88%' }}>
              <span style={labelSt}>Contact</span>
              <span style={colonSt}>:</span>
              <span style={valueSt('#111827')}>{phone}</span>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            style={{
              flex: 1, padding: '12px 16px',
              background: '#dc2626', color: '#fff',
              fontWeight: 800, fontSize: '13px',
              border: 'none', borderRadius: '16px',
              cursor: downloading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: downloading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(220,38,38,0.30)',
            }}
          >
            {downloading
              ? <><RefreshCw size={14} className="animate-spin" /> Rendering...</>
              : <><Download size={14} /> Download Poster (PNG)</>}
          </button>

          <button
            onClick={handleShare}
            style={{
              padding: '12px 16px', background: '#f1f5f9',
              color: '#1e293b', fontWeight: 700, fontSize: '13px',
              border: 'none', borderRadius: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <Share2 size={14} /> Share
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '12px 16px', background: '#0f172a',
              color: '#fff', fontWeight: 700, fontSize: '13px',
              border: 'none', borderRadius: '16px', cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
