import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore.js';
import MascotVideo from '../../components/MascotVideo.jsx';
import {
  Video, Film, Image, Sparkles, Upload, Save, RefreshCw,
  CheckCircle2, AlertCircle, Eye, Play, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AwarenessManagement() {
  const { awarenessSettings, updateAwarenessSettings, fetchAwarenessSettings } = useAppStore();
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [savingAwareness, setSavingAwareness] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [awarenessForm, setAwarenessForm] = useState({
    videoUrl: '',
    posterUrl: '',
    badgeText: '',
    quoteTitle: '',
    quoteDescription: '',
    buttonLabel: ''
  });

  useEffect(() => {
    fetchAwarenessSettings();
  }, [fetchAwarenessSettings]);

  useEffect(() => {
    if (awarenessSettings) {
      setAwarenessForm({
        videoUrl: awarenessSettings.videoUrl || '',
        posterUrl: awarenessSettings.posterUrl || '',
        badgeText: awarenessSettings.badgeText || '',
        quoteTitle: awarenessSettings.quoteTitle || '',
        quoteDescription: awarenessSettings.quoteDescription || '',
        buttonLabel: awarenessSettings.buttonLabel || ''
      });
    }
  }, [awarenessSettings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAwarenessSettings();
    setRefreshing(false);
  };

  const handleSaveAwareness = async (e) => {
    e.preventDefault();
    setSavingAwareness(true);

    try {
      const formData = new FormData();
      if (videoFile) {
        formData.append('video_file', videoFile);
      } else if (awarenessForm.videoUrl) {
        formData.append('video_url', awarenessForm.videoUrl);
      }

      if (posterFile) {
        formData.append('poster_file', posterFile);
      } else if (awarenessForm.posterUrl) {
        formData.append('poster_url', awarenessForm.posterUrl);
      }

      formData.append('badge_text', awarenessForm.badgeText || '');
      formData.append('quote_title', awarenessForm.quoteTitle || '');
      formData.append('quote_description', awarenessForm.quoteDescription || '');
      formData.append('button_label', awarenessForm.buttonLabel || '');

      const res = await updateAwarenessSettings(formData);
      if (res?.success) {
        setVideoFile(null);
        setPosterFile(null);
        await fetchAwarenessSettings();
      }
    } finally {
      setSavingAwareness(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Landing Page Customizer
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Video className="w-7 h-7 text-red-600" />
            Awareness Video & Content Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
            Upload custom awareness campaign videos, configure high-res poster thumbnails, and edit quotes displayed on the public landing page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Control Side */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-red-600" />
              Configure Video & Text Content
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes will take effect instantly on the public website upon saving.
            </p>
          </div>

          <form onSubmit={handleSaveAwareness} className="space-y-4 text-xs font-semibold">
            {/* Video File / URL Input */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-slate-800 font-bold flex items-center gap-2 text-xs">
                <Film className="w-4 h-4 text-red-600" />
                Awareness Video (Upload File or Enter URL)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Option A: Upload Video File</span>
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-dashed border-slate-300 rounded-xl hover:border-red-400 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 text-[11px] font-bold truncate">
                      {videoFile ? videoFile.name : "Choose Video (.webm, .mp4)"}
                    </span>
                    <input
                      type="file"
                      accept="video/webm,video/mp4,video/*"
                      onChange={(e) => setVideoFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Option B: Video URL</span>
                  <input
                    type="text"
                    value={awarenessForm.videoUrl}
                    onChange={(e) => setAwarenessForm({ ...awarenessForm, videoUrl: e.target.value })}
                    placeholder="https://... or /storage/video.webm"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Poster Image File / URL Input */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-slate-800 font-bold flex items-center gap-2 text-xs">
                <Image className="w-4 h-4 text-red-600" />
                Poster / Thumbnail Image (Upload File or Enter URL)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Upload Poster File</span>
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white border border-dashed border-slate-300 rounded-xl hover:border-red-400 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 text-[11px] font-bold truncate">
                      {posterFile ? posterFile.name : "Choose Image (.png, .jpg)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPosterFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Image URL</span>
                  <input
                    type="text"
                    value={awarenessForm.posterUrl}
                    onChange={(e) => setAwarenessForm({ ...awarenessForm, posterUrl: e.target.value })}
                    placeholder="/poster.png or https://..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Awareness Section Fields */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Badge Tagline</label>
                <input
                  type="text"
                  value={awarenessForm.badgeText}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, badgeText: e.target.value })}
                  placeholder="e.g. Lifesaving Dialogue"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Main Quote / Headline</label>
                <textarea
                  rows={2}
                  value={awarenessForm.quoteTitle}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, quoteTitle: e.target.value })}
                  placeholder="Enter main awareness quote..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold leading-relaxed focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description Subtext</label>
                <textarea
                  rows={3}
                  value={awarenessForm.quoteDescription}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, quoteDescription: e.target.value })}
                  placeholder="Enter paragraph description..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium leading-relaxed focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Action Button Text</label>
                <input
                  type="text"
                  value={awarenessForm.buttonLabel}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, buttonLabel: e.target.value })}
                  placeholder="e.g. Join Our Community"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingAwareness}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {savingAwareness ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Awareness Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Live Preview Side */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Live Preview (Landing Page Layout)
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
              Realtime Preview
            </span>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800/80 p-5 space-y-4">
            <div className="relative h-56 bg-black rounded-2xl overflow-hidden border border-slate-800">
              <MascotVideo
                videoUrl={videoFile ? URL.createObjectURL(videoFile) : awarenessForm.videoUrl}
                posterUrl={posterFile ? URL.createObjectURL(posterFile) : awarenessForm.posterUrl}
                showAudioToggle={true}
                showPlayPause={true}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 text-xs">
              <div className="inline-block px-2.5 py-0.5 bg-red-500/20 text-red-400 font-bold rounded-full text-[10px] uppercase tracking-wider">
                {awarenessForm.badgeText || "Lifesaving Dialogue"}
              </div>

              <blockquote className="font-bold text-xs leading-snug italic text-white/95 border-l-2 border-red-500 pl-3 py-0.5">
                {awarenessForm.quoteTitle || "“In critical emergency moments, one voluntary donor’s courage turns fear into hope for an entire family.”"}
              </blockquote>

              <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                {awarenessForm.quoteDescription || "Every second counts when a patient requires blood. JeevaLink connects you directly with verified voluntary donors and regional coordinators across Kerala."}
              </p>

              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl shadow-md">
                  {awarenessForm.buttonLabel || "Join Our Community"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Awareness Section Visibility</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                This content is prominently featured on the public homepage to educate visitors on blood donation and encourage voluntary donor registrations.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
