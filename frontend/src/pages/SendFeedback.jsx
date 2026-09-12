import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import api from '../store/api.js';
import {
  MessageSquare, Star, Send, Clock, CheckCircle2,
  AlertCircle, RefreshCw, Sparkles, User, Phone,
  ChevronRight, HeartHandshake, ShieldCheck, HelpCircle,
  MessageCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DONOR_CATEGORIES = [
  'Donation Experience',
  'Blood Request Process',
  'Health Eligibility',
  'App Usability & Design',
  'Notification & Alerts',
  'General Suggestion',
  'Other'
];

const VOLUNTEER_CATEGORIES = [
  'Field Operations',
  'Donor Verification & Coordination',
  'Unit Squad Committee',
  'Emergency SOS Handling',
  'App Usability & Tools',
  'Feature Request',
  'Other'
];

const RATING_LABELS = {
  1: 'Needs Significant Improvement',
  2: 'Fair / Could Be Better',
  3: 'Good / Satisfactory',
  4: 'Very Good / Impressed',
  5: 'Outstanding / Excellent'
};

export default function SendFeedback() {
  const { user } = useAuthStore();
  const { triggerToast } = useAppStore();

  const isVolunteerOrSquad = ['volunteer', 'unit_squad'].includes(user?.role);
  const categories = isVolunteerOrSquad ? VOLUNTEER_CATEGORIES : DONOR_CATEGORIES;

  const [activeTab, setActiveTab] = useState('send'); // 'send' | 'history'
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState(categories[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [customPhone, setCustomPhone] = useState(user?.phone || '');
  const [customName, setCustomName] = useState(user?.primaryName || user?.primary_name || user?.name || '');
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/feedback/my');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setHistory(res.data.data);
      } else if (Array.isArray(res.data?.feedbacks)) {
        setHistory(res.data.feedbacks);
      }
    } catch (err) {
      console.error('Failed to load feedback history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      triggerToast('Please provide a subject for your feedback.', 'warning');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      triggerToast('Please write a brief feedback message (at least 5 characters).', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        subject: `[${category}] ${subject.trim()}`,
        message: message.trim(),
        rating,
        user_name: customName || 'Community Member',
        phone: customPhone || undefined
      };

      const res = await api.post('/feedback', payload);
      if (res.data?.success) {
        triggerToast('Thank you! Your feedback has been submitted to administrators.', 'success');
        setSubject('');
        setMessage('');
        setRating(5);
        fetchHistory();
        setActiveTab('history');
      } else {
        triggerToast(res.data?.message || 'Could not submit feedback.', 'error');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      triggerToast(err.response?.data?.message || 'Error submitting feedback. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'replied':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <MessageCircle className="w-3 h-3" /> Replied by Admin
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Archived
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16 font-sans text-slate-900">
      
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-red-50">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {isVolunteerOrSquad ? 'Volunteer Feedback Channel' : 'Donor & User Feedback Channel'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Share Your Thoughts & Feedback
            </h1>
            <p className="text-red-100 text-xs sm:text-sm max-w-xl leading-relaxed">
              Your feedback directly shapes JeevaLink. Super administrators review every submission to improve blood donation coordination and platform reliability.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-red-950/40 p-1 rounded-2xl shrink-0 self-start sm:self-center border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('send')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'send'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Send Feedback
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              My Feedback ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Section ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'send' ? (
          <motion.div
            key="send-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. Rating Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Rate Your Experience With JeevaLink
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 text-slate-300 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* 2. Category Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Select Feedback Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Subject Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    isVolunteerOrSquad
                      ? 'e.g., Blood verification request delay, UI suggestion for squad'
                      : 'e.g., Quick response from donor, Suggestion for health checklist'
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:border-red-500 focus:outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* 4. Detailed Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Your Message / Suggestions *
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {message.length} characters
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Share details about what went well, what could be improved, or any issue you encountered. Super admins will carefully read and respond..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:border-red-500 focus:outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* 5. Submitter Info (Pre-filled) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Contact Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback to Super Admin
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        ) : (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Showing {history.length} Feedback Submissions
              </p>
              <button
                type="button"
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingHistory ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-red-600 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">Loading feedback records...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">No Feedback Submitted Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you submit feedback, you can track its review progress and read replies from the super administration right here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('send')}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Submit First Feedback
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((fb) => (
                  <div
                    key={fb._id || fb.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    {/* Item Top */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-slate-900">
                          {fb.subject}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Submitted on {new Date(fb.createdAt || fb.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (fb.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        {getStatusBadge(fb.status)}
                      </div>
                    </div>

                    {/* User's Original Message */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Your Feedback
                      </p>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {fb.message}
                      </p>
                    </div>

                    {/* Admin Reply (if exists) */}
                    {fb.reply ? (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-800 font-black text-xs">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                            <span>Response from Super Administration</span>
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                            Official Reply
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap pt-1 font-medium">
                          {fb.reply}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-xs italic px-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting review and reply from Super Administration</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
