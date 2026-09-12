import { useState, useEffect, useCallback } from 'react';
import { Trash2, Star, Archive, CheckCircle2, MessageSquare, Send, RefreshCw, UserCheck, Shield, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/appStore.js';
import FilterBar from '../../components/admin/FilterBar.jsx';
import api from '../../store/api.js';

const StatusBadge = ({ status }) => {
  const map = {
    open:     'bg-amber-500/10 text-amber-700 border-amber-500/20',
    replied:  'bg-blue-500/10 text-blue-700 border-blue-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    archived: 'bg-slate-100 text-slate-600 border-slate-300/40',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${map[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {status}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const normRole = (role || 'user').toLowerCase();
  const map = {
    volunteer: { label: 'Volunteer', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    unit_squad: { label: 'Unit Squad', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    block_admin: { label: 'Block Admin', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    super_admin: { label: 'Super Admin', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    user: { label: 'Donor / User', bg: 'bg-red-50 text-red-700 border-red-200' },
  };
  const config = map[normRole] || map.user;
  return (
    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.bg}`}>
      {config.label}
    </span>
  );
};

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
    ))}
  </div>
);

export default function FeedbackManagement() {
  const { triggerToast } = useAppStore();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/feedback');
      let list = [];
      if (res.data?.success && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (res.data?.data && Array.isArray(res.data.data.feedbacks)) {
        list = res.data.data.feedbacks;
      } else if (Array.isArray(res.data?.feedbacks)) {
        list = res.data.feedbacks;
      }

      const formatted = list.map(fb => ({
        ...fb,
        _id: fb._id || fb.id,
        userName: fb.userName || fb.user_name || 'Community Member',
        createdAt: fb.createdAt || fb.created_at || new Date().toISOString(),
        role: fb.user_role || fb.role || 'user'
      }));

      setFeedback(formatted);
      if (selected) {
        const found = formatted.find(f => f._id === selected._id);
        if (found) setSelected(found);
      }
    } catch (err) {
      console.error("Fetch feedback error:", err);
      triggerToast("Failed to fetch feedback records.", "error");
    } finally {
      setLoading(false);
    }
  }, [triggerToast, selected]);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm("Permanently delete this feedback record?")) return;
    try {
      const res = await api.delete(`/admin/feedback/${id}`);
      if (res.data?.success) {
        setFeedback(f => f.filter(fb => fb._id !== id));
        if (selected?._id === id) setSelected(null);
        triggerToast('Feedback removed permanently.', 'info');
      } else {
        triggerToast(res.data?.message || 'Failed to delete feedback.', 'error');
      }
    } catch (err) {
      console.error("Delete feedback error:", err);
      triggerToast(err.response?.data?.message || 'Error deleting feedback.', 'error');
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSendingReply(true);
    try {
      const res = await api.post(`/admin/feedback/${selected._id}/reply`, { reply: reply.trim() });
      if (res.data?.success) {
        const updatedItem = {
          ...selected,
          reply: reply.trim(),
          status: 'replied'
        };
        setFeedback(f => f.map(fb => fb._id === selected._id ? updatedItem : fb));
        setSelected(updatedItem);
        setReply('');
        triggerToast('Reply saved and sent to user!', 'success');
      } else {
        triggerToast(res.data?.message || 'Failed to send reply.', 'error');
      }
    } catch (err) {
      console.error("Reply feedback error:", err);
      triggerToast(err.response?.data?.message || 'Error sending reply.', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await api.patch(`/admin/feedback/${id}/status`, { status: 'resolved' });
      if (res.data?.success) {
        setFeedback(f => f.map(fb => fb._id === id ? { ...fb, status: 'resolved' } : fb));
        if (selected?._id === id) setSelected(prev => ({ ...prev, status: 'resolved' }));
        triggerToast('Feedback marked as resolved.', 'success');
      } else {
        triggerToast(res.data?.message || 'Failed to update status.', 'error');
      }
    } catch (err) {
      console.error("Resolve feedback error:", err);
      triggerToast('Error marking feedback resolved.', 'error');
    }
  };

  const handleArchive = async (id) => {
    try {
      const res = await api.patch(`/admin/feedback/${id}/status`, { status: 'archived' });
      if (res.data?.success) {
        setFeedback(f => f.map(fb => fb._id === id ? { ...fb, status: 'archived' } : fb));
        if (selected?._id === id) setSelected(null);
        triggerToast('Feedback archived.', 'success');
      } else {
        triggerToast(res.data?.message || 'Failed to archive.', 'error');
      }
    } catch (err) {
      console.error("Archive feedback error:", err);
      triggerToast('Error archiving feedback.', 'error');
    }
  };

  const filtered = feedback.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || [f.userName, f.subject, f.message, f.phone, f.user_email].some(x => x && x.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchRole = roleFilter === 'all' || (f.role || 'user').toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchStatus && matchRole;
  });

  const openCount = feedback.filter(f => f.status === 'open').length;
  const repliedCount = feedback.filter(f => f.status === 'replied').length;
  const resolvedCount = feedback.filter(f => f.status === 'resolved').length;
  const avgRating = feedback.length ? (feedback.reduce((a, b) => a + (Number(b.rating) || 0), 0) / feedback.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-left font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-red-600 uppercase text-xl sm:text-2xl font-black tracking-tight">
            Feedback & Inquiries Management
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Super Administrator channel for Donor and Volunteer submissions ({feedback.length} total · {openCount} open · {repliedCount} replied)
          </p>
        </div>
        <button
          type="button"
          onClick={fetchFeedback}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open Submissions', value: openCount, color: 'text-amber-600 border-amber-500/20 bg-amber-50/50' },
          { label: 'Replied by Admin', value: repliedCount, color: 'text-blue-600 border-blue-500/20 bg-blue-50/50' },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-600 border-emerald-500/20 bg-emerald-50/50' },
          { label: 'Average Rating', value: `${avgRating} ★`, color: 'text-amber-500 border-amber-500/20 bg-amber-50/50' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white border rounded-2xl p-4 text-center ${color.split(' ').find(c => c.startsWith('border'))}`}>
            <p className={`text-2xl font-black ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-slate-500 text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Content Split */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Left: Feedback List (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-xs rounded-3xl overflow-hidden flex flex-col">
          <FilterBar
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search by user, phone, or keyword..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'open', label: 'Open' },
                  { value: 'replied', label: 'Replied' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'archived', label: 'Archived' },
                ]
              },
              {
                key: 'role',
                label: 'User Role',
                options: [
                  { value: 'user', label: 'Donor / User' },
                  { value: 'volunteer', label: 'Volunteer' },
                  { value: 'unit_squad', label: 'Unit Squad' },
                  { value: 'block_admin', label: 'Block Admin' },
                ]
              }
            ]}
            filterValues={{ status: statusFilter, role: roleFilter }}
            onFilterChange={(k, v) => {
              if (k === 'status') setStatusFilter(v);
              if (k === 'role') setRoleFilter(v);
            }}
            onReset={() => { setSearch(''); setStatusFilter('all'); setRoleFilter('all'); }}
          />

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {loading && feedback.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                Loading feedback entries...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No feedback entries match your criteria.
              </div>
            ) : (
              filtered.map(fb => (
                <motion.div
                  key={fb._id}
                  onClick={() => { setSelected(fb); setReply(fb.reply || ''); }}
                  whileHover={{ backgroundColor: 'rgba(248,250,252,0.8)' }}
                  className={`p-4 cursor-pointer transition-colors ${
                    selected?._id === fb._id ? 'bg-red-50/50 border-l-4 border-red-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-slate-900 text-xs font-bold truncate">{fb.userName}</p>
                        <RoleBadge role={fb.role} />
                        <StatusBadge status={fb.status} />
                      </div>
                      <p className="text-slate-800 text-xs font-bold truncate">{fb.subject}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{fb.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StarRating rating={Number(fb.rating) || 5} />
                      <span className="text-slate-400 text-[10px] font-medium">
                        {new Date(fb.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right: Detail + Reply Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-xs rounded-3xl flex flex-col min-h-[500px]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs p-8 text-center">
              <div>
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-600">Select a Feedback Record</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click on any submission on the left to read user feedback, view details, and send official replies.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Selected Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RoleBadge role={selected.role} />
                    <StatusBadge status={selected.status} />
                  </div>
                  <h3 className="text-slate-900 font-bold text-sm leading-snug">{selected.subject}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span className="font-semibold text-slate-700">{selected.userName}</span>
                    {selected.phone && <span>· {selected.phone}</span>}
                    {selected.user_email && <span>· {selected.user_email}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  <StarRating rating={Number(selected.rating) || 5} />
                </div>
              </div>

              {/* Selected Body */}
              <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto">
                {/* User Message Bubble */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                    User Message
                  </p>
                  <p className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                  <p className="text-slate-400 text-[10px] mt-3 font-medium">
                    Received: {new Date(selected.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Existing Reply Bubble */}
                {selected.reply && (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
                    <p className="text-blue-700 text-[10px] font-black uppercase tracking-wider mb-1.5">
                      Current Admin Response
                    </p>
                    <p className="text-slate-900 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {selected.reply}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {selected.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleResolve(selected._id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  )}
                  {selected.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(selected._id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteFeedback(selected._id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer ml-auto"
                    title="Delete Feedback"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {/* Reply Form */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <label className="text-slate-700 text-xs font-bold block">
                    {selected.reply ? 'Update Reply to ' : 'Send Official Reply to '}
                    <span className="text-red-600">{selected.userName}</span>
                  </label>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Write a clear response to the user. This will appear on their dashboard and trigger a notification..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none transition-all resize-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={!reply.trim() || sendingReply}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingReply ? 'Sending Reply...' : selected.reply ? 'Update Reply' : 'Send Official Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
