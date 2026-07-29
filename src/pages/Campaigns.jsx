import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import {
  Heart, Share2, Download, Plus, Search, Calendar, MapPin, Phone,
  Clock, ShieldCheck, Sparkles, X, Copy, Check, MessageSquare, Megaphone,
  Trash2, Activity, Stethoscope, Droplets, UserCheck, Users,
  HeartHandshake, Smile, Upload, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Campaigns() {
  const { user } = useAuthStore();
  const {
    campaignPosts,
    fetchCampaignPosts,
    createCampaignPost,
    toggleLikeCampaignPost,
    incrementShareCampaignPost,
    deleteCampaignPost,
    triggerToast
  } = useAppStore();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareModalPost, setShareModalPost] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [attendingPosts, setAttendingPosts] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'blood_donation',
    description: '',
    venue: '',
    event_date: '',
    event_time: '',
    organizer_name: user?.full_name || 'JeevaLink Squad',
    contact_phone: user?.phone_number || '',
    image_url: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=1000',
    district: user?.district || '',
    block: user?.block || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaignPosts(activeCategory, searchQuery);
  }, [activeCategory, searchQuery, fetchCampaignPosts]);

  const canCreate = ['super_admin', 'admin', 'volunteer', 'technical_admin'].includes(user?.role);

  const presetImages = {
    blood_donation: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=1000',
    health_checkup: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000',
    awareness: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1000',
    campaign: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=1000'
  };

  const toggleAttending = (postId) => {
    setAttendingPosts((prev) => {
      const isAttending = !prev[postId];
      if (isAttending) {
        triggerToast('Marked as attending! Thank you.', 'success');
      }
      return { ...prev, [postId]: isAttending };
    });
  };

  const handleCategoryChangeInForm = (cat) => {
    setFormData((prev) => ({
      ...prev,
      category: cat,
      image_url: presetImages[cat] || prev.image_url
    }));
  };

  // Image File Upload Handler (Base64 conversion)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Please select a valid image file (PNG, JPG, JPEG).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Image size should be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        image_url: event.target?.result
      }));
      triggerToast('Poster image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      triggerToast('Please fill out title and description.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createCampaignPost({
        ...formData,
        author_name: user?.full_name || 'Volunteer Lead',
        author_role: user?.role || 'volunteer'
      });
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'blood_donation',
        description: '',
        venue: '',
        event_date: '',
        event_time: '',
        organizer_name: user?.full_name || 'JeevaLink Squad',
        contact_phone: user?.phone_number || '',
        image_url: presetImages.blood_donation,
        district: user?.district || '',
        block: user?.block || ''
      });
    } catch (err) {
      triggerToast('Failed to create campaign.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Red & White Poster Canvas Downloader
  const downloadPoster = (post) => {
    setDownloadingId(post.id);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      // Crisp White Canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1080, 1350);

      // Top Red Banner Section
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(0, 0, 1080, 240);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'extrabold 40px Inter, sans-serif';
      ctx.fillText('JEEVALINK BLOOD & HEALTH HUB', 70, 100);

      ctx.fillStyle = '#FEE2E2';
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText('Official Community Health Campaign & Blood Donation Drive', 70, 145);

      // Category Pill
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(70, 175, 280, 44, 22);
      ctx.fill();

      ctx.fillStyle = '#DC2626';
      ctx.font = 'bold 18px Inter, sans-serif';
      const catText = post.category === 'blood_donation' ? 'BLOOD DONATION' :
                      post.category === 'health_checkup' ? 'HEALTH CHECKUP' : 'AWARENESS DRIVE';
      ctx.fillText(catText, 95, 203);

      // Main Title
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 44px Inter, sans-serif';
      const words = post.title.split(' ');
      let line = '';
      let y = 330;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 920 && n > 0) {
          ctx.fillText(line, 70, y);
          line = words[n] + ' ';
          y += 54;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 70, y);

      // Divider Line
      y += 30;
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(1010, y);
      ctx.stroke();

      // Details Red & White Box
      y += 40;
      ctx.fillStyle = '#FEF2F2';
      ctx.beginPath();
      ctx.roundRect(70, y, 940, 340, 24);
      ctx.fill();
      ctx.strokeStyle = '#FECDD3';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#DC2626';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText('EVENT DETAILS', 110, y + 55);

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('📅 Date:', 110, y + 115);
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText(post.event_date || 'Date Announced Soon', 250, y + 115);

      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('⏰ Time:', 110, y + 165);
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText(post.event_time || '09:00 AM onwards', 250, y + 165);

      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('📍 Venue:', 110, y + 215);
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText(post.venue || 'Local Community Auditorium', 250, y + 215);

      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('📞 Contact:', 110, y + 265);
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText(post.contact_phone || '+91 JeevaLink Care Team', 250, y + 265);

      // Description Box
      y += 390;
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText('About This Program:', 70, y);

      ctx.fillStyle = '#475569';
      ctx.font = '400 21px Inter, sans-serif';
      const descWords = (post.description || '').split(' ');
      let descLine = '';
      let descY = y + 36;
      for (let n = 0; n < descWords.length; n++) {
        const testLine = descLine + descWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 920 && n > 0) {
          ctx.fillText(descLine, 70, descY);
          descLine = descWords[n] + ' ';
          descY += 32;
          if (descY > y + 140) break;
        } else {
          descLine = testLine;
        }
      }
      if (descY <= y + 140) {
        ctx.fillText(descLine, 70, descY);
      }

      // Footer Banner
      const footerY = 1200;
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.roundRect(70, footerY, 940, 90, 20);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText(`Organized by: ${post.organizer_name || 'JeevaLink Team'}`, 110, footerY + 52);
      ctx.font = '500 20px Inter, sans-serif';
      ctx.fillText('JeevaLink • Save Lives Together', 600, footerY + 52);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `JeevaLink-Campaign-${post.id}.png`;
      link.href = dataUrl;
      link.click();

      triggerToast('Flyer poster downloaded!', 'success');
    } catch (err) {
      console.error('Failed poster generation', err);
      triggerToast('Failed to generate poster.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const openShareModal = (post) => {
    setShareModalPost(post);
    setCopiedLink(false);
  };

  const handleCopyLink = (post) => {
    const shareUrl = window.location.origin + `/campaigns?id=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    incrementShareCampaignPost(post.id);
    triggerToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleWhatsAppShare = (post) => {
    const text = `🩸 *${post.title}* 🩸\n\n📌 *Category:* ${post.category.replace('_', ' ').toUpperCase()}\n📅 *Date:* ${post.event_date || 'TBA'}\n📍 *Venue:* ${post.venue}\n📞 *Contact:* ${post.contact_phone}\n\n${post.description}\n\n*Organized by:* ${post.organizer_name}\n\nJoin us on JeevaLink: ${window.location.origin}/campaigns`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    incrementShareCampaignPost(post.id);
  };

  const filteredPosts = campaignPosts.filter((post) => {
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.venue && post.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.organizer_name && post.organizer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">

      {/* Red & White Curved Hero Banner */}
      <div className="pt-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-red-600/15 relative overflow-hidden">
          {/* Subtle curved background decorative glow */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-900/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-red-600 text-xs font-extrabold uppercase tracking-wider mb-4 shadow-sm">
                <HeartHandshake className="w-4 h-4 text-red-600" />
                <span>Community Health Hub</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Campaigns & Health Drives
              </h1>
              <p className="mt-2 text-red-100 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
                Join local blood donation camps, free health checkups, and awareness programs across Kerala.
              </p>
            </div>

            {canCreate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-red-600 font-extrabold text-sm shadow-lg hover:bg-red-50 transition self-start md:self-center shrink-0 border border-white/20"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Publish Program</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 relative z-10">

        {/* Filter & Search Bar - Clean Red & White */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All Programs', icon: Megaphone },
                { id: 'blood_donation', label: 'Blood Camps', icon: Droplets },
                { id: 'health_checkup', label: 'Health Checkups', icon: Stethoscope },
                { id: 'awareness', label: 'Awareness', icon: Activity }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-white text-slate-700 border border-red-200 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-red-600'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search camps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-red-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-red-100 shadow-sm max-w-md mx-auto my-12">
            <Smile className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Active Campaigns</h3>
            <p className="text-slate-500 text-xs mt-1">There are no programs posted yet under this filter. Click below to publish your first campaign!</p>
            {canCreate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-red-700 transition"
              >
                Publish First Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const isOwnerOrAdmin =
                user && (user.role === 'super_admin' || user.role === 'technical_admin' || user.role === 'admin' || post.author_name === user.full_name);
              const isAttending = !!attendingPosts[post.id];

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl overflow-hidden border-t-4 border-t-red-600 border-x border-b border-red-100 shadow-sm hover:shadow-xl hover:border-red-300 transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Banner */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                      <img
                        src={post.image_url || presetImages[post.category] || presetImages.blood_donation}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-md">
                          {post.category.replace('_', ' ')}
                        </span>

                        {isOwnerOrAdmin && (
                          <button
                            onClick={() => deleteCampaignPost(post.id)}
                            className="w-7 h-7 rounded-full bg-slate-900/70 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-sm transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Author Pill */}
                      <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold drop-shadow">
                        <span>{post.author_name || 'JeevaLink Squad'}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                      <h2 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 hover:text-red-600 transition">
                        {post.title}
                      </h2>

                      <p className="text-slate-600 text-xs mt-2 line-clamp-3 leading-relaxed">
                        {post.description}
                      </p>

                      {/* Key Details Tags */}
                      <div className="mt-4 space-y-2 text-xs font-medium border-t border-red-50 pt-3">
                        {post.event_date && (
                          <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>{post.event_date} {post.event_time ? `• ${post.event_time}` : ''}</span>
                          </div>
                        )}
                        {post.venue && (
                          <div className="flex items-center gap-2 text-slate-700 px-3 py-1.5 rounded-lg bg-slate-50">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="truncate">{post.venue}</span>
                          </div>
                        )}
                        {post.organizer_name && (
                          <div className="flex items-center gap-2 text-slate-500 text-[11px] px-3 py-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Organized by {post.organizer_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-4 py-3 bg-red-50/40 border-t border-red-100 flex items-center justify-between text-xs">

                    {/* RSVP */}
                    <button
                      onClick={() => toggleAttending(post.id)}
                      className={`flex items-center gap-1 font-bold text-[11px] transition ${
                        isAttending ? 'text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200' : 'text-slate-600 hover:text-red-600'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{isAttending ? 'Attending' : 'RSVP'}</span>
                    </button>

                    {/* Like */}
                    <button
                      onClick={() => toggleLikeCampaignPost(post.id)}
                      className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700 transition"
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.is_liked ? 'fill-red-600 text-red-600' : ''}`} />
                      <span>{post.likes_count || 0}</span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => openShareModal(post)}
                      className="flex items-center gap-1 font-bold text-slate-700 hover:text-red-600 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>

                    {/* Download Poster */}
                    <button
                      disabled={downloadingId === post.id}
                      onClick={() => downloadPoster(post)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingId === post.id ? '...' : 'Flyer'}</span>
                    </button>

                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl border border-red-100 w-full max-w-lg overflow-hidden"
            >
              <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Publish New Campaign</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-red-100 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Program Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kannur Blood Donation Mega Camp"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Category *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'blood_donation', label: 'Blood Camp' },
                      { id: 'health_checkup', label: 'Health Checkup' },
                      { id: 'awareness', label: 'Awareness' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChangeInForm(cat.id)}
                        className={`p-2 rounded-lg border text-center font-bold transition ${
                          formData.category === cat.id
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white border-red-200 text-slate-700 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Poster Image File Upload & Preview Box */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Poster Cover Image *</label>
                  
                  {formData.image_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-red-200 group bg-slate-900 h-40">
                      <img
                        src={formData.image_url}
                        alt="Poster Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center gap-2 opacity-90 transition">
                        <label className="px-3 py-1.5 rounded-lg bg-white/90 text-red-600 font-bold text-[11px] cursor-pointer hover:bg-white flex items-center gap-1 shadow">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Change File</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-red-200 hover:border-red-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-red-50/30 hover:bg-red-50/70 transition group text-center">
                      <Upload className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition" />
                      <span className="font-bold text-slate-800 text-xs">Click to Upload Poster Image</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG (Max 5MB)</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Venue / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Town Hall, Kannur"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Organizer Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. DYFI Unit Squad"
                      value={formData.organizer_name}
                      onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Event Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Aug 15, 2026"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide program details, doctors attending, eligibility criteria..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-slate-900"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-red-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md shadow-red-600/30"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Campaign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm text-center border border-red-100 shadow-2xl"
            >
              <h3 className="text-base font-extrabold text-slate-900">Share Program</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{shareModalPost.title}</p>

              <div className="mt-5 space-y-2">
                <button
                  onClick={() => handleWhatsAppShare(shareModalPost)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Share via WhatsApp
                </button>
                <button
                  onClick={() => handleCopyLink(shareModalPost)}
                  className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition"
                >
                  {copiedLink ? 'Link Copied!' : 'Copy Direct Link'}
                </button>
              </div>

              <button
                onClick={() => setShareModalPost(null)}
                className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
