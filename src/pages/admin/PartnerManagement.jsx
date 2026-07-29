import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake, Plus, Edit2, Trash2, Globe, Link as LinkIcon, Save, X, AlertTriangle,
  Upload, Image as ImageIcon, Loader2
} from 'lucide-react';

/* ── Inline Social Icons ───────────────────────── */
const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z"/>
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
  </svg>
);

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { value: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { value: 'youtube', label: 'YouTube', icon: YoutubeIcon },
  { value: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon },
  { value: 'x', label: 'X (Twitter)', icon: Globe },
  { value: 'threads', label: 'Threads', icon: LinkIcon },
  { value: 'link', label: 'General Link', icon: LinkIcon }
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
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseApi = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
    const domain = baseApi.replace('/api/v1', '');
    return `${domain}${path}`;
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
        <div className="bg-white border border-slate-100 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading partners data...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
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
                className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden transition-all shadow-sm group hover:border-slate-200"
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
              className="bg-white border border-slate-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Head Banner */}
              <div className="bg-red-600 p-6 relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
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
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
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
              className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden my-8 p-6 text-center relative"
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
