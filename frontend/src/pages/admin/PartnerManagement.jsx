import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { getStorageUrl } from '../../store/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake, Plus, Edit2, Trash2, Globe, Link as LinkIcon, Save, X, AlertTriangle,
  Upload, Image as ImageIcon, Loader2
} from 'lucide-react';

/* ── Inline Social Icons ───────────────────────── */
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

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { value: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { value: 'youtube', label: 'YouTube', icon: YoutubeIcon },
  { value: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { value: 'x', label: 'X (Twitter)', icon: XTwitterIcon },
  { value: 'threads', label: 'Threads', icon: ThreadsIcon },
  { value: 'link', label: 'General Website / Link', icon: LinkIcon }
];

export default function PartnerManagement() {
  const { partners, fetchPartners, addPartner, updatePartner, deletePartner, triggerToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('facebook');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const openAddModal = () => {
    setEditingPartner(null);
    setName('');
    setSocialLink('');
    setSocialPlatform('facebook');
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setName(partner.name);
    setSocialLink(partner.socialMediaLink || partner.socialLink || '');
    setSocialPlatform(partner.socialMediaType || partner.socialPlatform || 'facebook');
    setLogoFile(null);
    setLogoPreview(getFullLogoUrl(partner.logo));
    setShowModal(true);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return triggerToast('Name is required', 'error');
    if (!socialLink.trim()) return triggerToast('Social link is required', 'error');
    if (!logoFile && !editingPartner && !logoPreview) {
      return triggerToast('Please upload a logo image', 'error');
    }

    setLoading(true);

    let logoData = editingPartner ? editingPartner.logo : '';
    if (logoFile) {
      logoData = await compressImage(logoFile);
    }

    const payload = {
      name: name.trim(),
      social_media_link: socialLink.trim(),
      social_media_type: socialPlatform,
      logo: logoData
    };

    let res;
    if (editingPartner) {
      res = await updatePartner(editingPartner._id, payload);
    } else {
      res = await addPartner(payload);
    }

    setLoading(false);

    if (res.success) {
      setShowModal(false);
      fetchPartners();
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    const res = await deletePartner(id);
    setLoading(false);
    if (res.success) {
      setConfirmDeleteId(null);
      fetchPartners();
    }
  };

  const getFullLogoUrl = (path) => {
    if (!path) return '';
    return getStorageUrl(path) || '';
  };

  const getSocialIcon = (platform) => {
    const item = SOCIAL_PLATFORMS.find(p => p.value === platform.toLowerCase());
    return item ? item.icon : Globe;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 text-xl font-black">Partners & Collaborators</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage landing page organization cards and social media profiles</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* Partners Cards Grid */}
      {loading ? (
        <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading partners data...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            <Handshake className="w-7 h-7" />
          </div>
          <h3 className="text-slate-800 font-bold text-sm">No Custom Partners Registered</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            The landing page is currently displaying the default fallback list of local DYFI committees. Start adding partners to customize your network dynamically!
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-red-100 inline-block"
          >
            Create First Partner Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {partners.map((partner) => {
            const SocialIcon = getSocialIcon(partner.socialMediaType || partner.socialPlatform || 'link');

            return (
              <motion.div
                key={partner._id}
                layout
                className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden transition-all group hover:"
              >
                {/* Logo wrapper */}
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 mb-4 overflow-hidden relative shadow-sm">
                  {partner.logo ? (
                    <img
                      src={getFullLogoUrl(partner.logo)}
                      alt={partner.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNSIgZmlsbD0iI0YzRjRGNiIvPjx0ZXh0IHg9IjMwIiB5PSIzNSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxPR088L3RleHQ+PC9zdmc+';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <h3 className="text-slate-800 font-bold text-sm mb-1 leading-snug">{partner.name}</h3>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-[10px] font-bold mt-2 mb-5 hover:bg-slate-100 transition-colors">
                  <SocialIcon className="w-3.5 h-3.5" />
                  <a href={partner.socialMediaLink || partner.socialLink} target="_blank" rel="noopener noreferrer" className="hover:underline capitalize truncate max-w-[120px]">
                    {partner.socialMediaType || partner.socialPlatform || 'Link'}
                  </a>
                </div>

                {/* Confirm Delete modal is rendered globally */}

                {/* Edit/Delete controls */}
                <div className="flex items-center gap-2 mt-auto w-full border-t border-slate-50 pt-4">
                  <button
                    onClick={() => openEditModal(partner)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[10px] font-bold rounded-lg border border-slate-100 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(partner._id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50/50 hover:bg-red-50 text-red-500 hover:text-red-600 text-[10px] font-bold rounded-lg border border-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal - Add / Edit Partner */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Head Banner */}
              <div className="bg-red-600 p-6 relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all/20 rounded-xl flex items-center justify-center text-white">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-black tracking-tight">
                        {editingPartner ? 'Edit Partner Card' : 'Add New Partner'}
                      </h3>
                      <p className="text-red-100 text-[10px] font-medium">Configure community partner details & social links</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Partner Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. DYFI Cheemeni East"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                {/* Logo Image */}
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Logo Image *</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 relative">
                      <label htmlFor="logo-upload" className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-red-50 border border-red-200 border-dashed rounded-xl text-red-600 text-xs font-bold cursor-pointer hover:bg-red-100/50 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Choose Logo File
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <p className="text-slate-400 text-[10px] mt-1.5 ml-1">Upload a small square image (PNG, JPG)</p>
                    </div>
                    <div className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden p-1 shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Social media platform type */}
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Social Platform Type *</label>
                  <select
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary transition-all capitalize cursor-pointer"
                  >
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Social Media Link */}
                <div>
                  <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Social Profile Link *</label>
                  <input
                    type="url"
                    required
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    placeholder="https://facebook.com/dyfi..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                {/* Form Action Controls */}
                <div className="flex gap-3 pt-3 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Partner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Delete Confirmation */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden my-8 p-6 text-center relative"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-slate-900 font-black text-lg mb-2">Delete Partner?</h3>
              <p className="text-slate-500 text-xs mb-6">
                Are you sure you want to remove this partner? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
