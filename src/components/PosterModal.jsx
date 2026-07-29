import { useRef, useState } from 'react';
import {
  X, Download, Phone, Calendar, Clock, MapPin,
  Heart, RefreshCw, MessageSquare, Droplet, Share2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

export default function PosterModal({ isOpen, onClose, data }) {
  const posterRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !data) return null;

  // Extract clean template variables
  const bloodGroup = data.blood_group || data.bloodGroup || 'O+';
  const date = data.date || data.required_date || new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = data.time || data.required_time || 'Immediate / Urgent';
  const venue = data.venue || data.hospital_name || data.hospitalName || data.location || 'Local Hospital';
  const phone = data.contact_phone || data.contact_number || data.contactNumber || data.mobile || '9876543210';
  const whatsapp = data.whatsapp_number || data.whatsapp || phone;
  const requestId = data.request_id || data.id || data._id || 'JL-REQ';

  // 100% DOM-to-PNG Pixel-Perfect Exporter
  const handleDownloadPNG = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      // Small timeout to ensure all SVGs and fonts are rendered
      await new Promise((res) => setTimeout(res, 100));

      const dataUrl = await toPng(posterRef.current, {
        quality: 1.0,
        pixelRatio: 3, // 3x Ultra-HD Resolution Output
        cacheBust: true,
        backgroundColor: '#FFFFFF',
      });

      const link = document.createElement('a');
      link.download = `Blood_Request_${bloodGroup}_${requestId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Poster PNG rendering error:", err);
      // Fallback print if browser restricts DOM canvas capture
      window.print();
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
          text: `Urgent need for ${bloodGroup} blood at ${venue}. Please help!`,
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
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl relative text-slate-900 border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>



        {/* Wrapper to prevent html-to-image boundary clipping bug caused by margins/shadows */}
        <div className="mx-auto w-full max-w-[480px] shadow-2xl">
          {/* 100% PIXEL PERFECT POSTER DOM CONTAINER FOR PREVIEW & HD PNG EXPORT */}
          <div ref={posterRef} className="print-area bg-[#f8fafc] relative overflow-hidden border border-slate-200/80 w-full m-0">
          
          {/* Top Section - Deep Red Premium Gradient */}
          <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-rose-700 px-8 pt-12 pb-20 overflow-hidden">
            {/* Abstract Background Shapes for Depth (Canvas-safe) */}
            <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(239,68,68,0.6)_0%,rgba(239,68,68,0)_70%)] rounded-full"></div>
            <div className="absolute bottom-[-50px] left-[-50px] w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(244,63,94,0.6)_0%,rgba(244,63,94,0)_70%)] rounded-full"></div>
            
            {/* Diagonal Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNyIvPjwvc3ZnPg==')] opacity-40 transform -rotate-12 scale-150"></div>

            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-4">
                {/* Typography */}
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] mt-2" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                  Blood <br/>
                  <span className="text-red-200">Request</span>
                </h1>
              </div>

              {/* Blood Group Badge - Solid 3D Effect (Canvas-safe) */}
              <div className="relative z-20">
                <div className="absolute inset-0 bg-red-950/20 rounded-3xl translate-y-2"></div>
                <div className="relative bg-gradient-to-b from-white to-slate-50 rounded-3xl p-5 border border-white shadow-xl flex flex-col items-center justify-center min-w-[100px] transform rotate-3">
                  <Droplet className="w-8 h-8 text-red-600 mb-1" fill="currentColor" />
                  <span className="text-5xl font-black text-red-600 leading-none tracking-tighter">{bloodGroup}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Group</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section - Overlapping Card */}
          <div className="relative bg-white mx-5 -mt-10 rounded-3xl p-6 shadow-xl border border-slate-100 z-20">
            
            <div className="space-y-5">
              {/* Venue Row */}
              <div className="flex gap-4 items-start p-1">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100/50 shadow-inner">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <div className="pt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Hospital / Venue</p>
                  <p className="text-base font-bold text-slate-900 leading-tight">{venue}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="flex gap-3 items-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                    <p className="text-xs font-bold text-slate-900 leading-tight break-words pr-1">{date}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex gap-3 items-center p-3 rounded-2xl bg-slate-50/80 border border-slate-100/50 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                    <p className="text-xs font-bold text-slate-900 leading-tight break-words pr-1">{time}</p>
                  </div>
                </div>
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 border-dashed">
                {/* Call */}
                <div className="flex gap-3 items-center">
                  <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center shrink-0 shadow-md">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Call</p>
                    <p className="text-sm font-black text-slate-900 leading-tight break-words">{phone}</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex gap-3 items-center">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp</p>
                    <p className="text-sm font-black text-slate-900 leading-tight break-words">{whatsapp}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Call to Action */}
          <div className="px-6 pt-8 pb-8 relative z-10">
            {/* CTA & QR Card */}
            <div className="flex items-center justify-between bg-slate-900 text-white rounded-3xl p-4 shadow-xl border border-slate-800 relative overflow-hidden">
              {/* Subtle background glow in CTA (Canvas-safe) */}
              <div className="absolute right-[-20px] top-[-20px] w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(220,38,38,0.25)_0%,rgba(220,38,38,0)_70%)] rounded-full"></div>
              
              <div className="pl-3 pr-4 relative z-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Save a Life Today</p>
                <p className="text-xl font-black uppercase leading-[1.1] tracking-tight">Donate<br/><span className="text-red-500">Blood</span></p>
              </div>
              <div className="bg-white p-2.5 rounded-2xl relative z-10 shadow-inner">
                <div id="pure-code-qr-code">
                  <QRCodeSVG
                    value={`${window.location.origin}/requests/${requestId}`}
                    size={60}
                    level="Q"
                    includeMargin={false}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Branding Footer */}
            <div className="mt-8 flex items-center justify-between px-2">
              <div>
                <h3 className="text-lg font-black text-red-600 uppercase tracking-tighter leading-none flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-red-600" /> JEEVALINK
                </h3>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-5">Connecting Life</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-px h-8 bg-slate-300"></div>
                <div className="text-right">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none">DYFI Kasaragod</h3>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Professional Committee</p>
                </div>
              </div>
            </div>
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
            {downloading ? 'Rendering HD Poster...' : 'Download Poster (PNG Image)'}
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
