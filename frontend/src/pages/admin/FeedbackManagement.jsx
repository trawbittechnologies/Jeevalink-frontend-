import { useState, useEffect } from 'react';
import { Trash2, Star, Archive, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/appStore.js';
import FilterBar from '../../components/admin/FilterBar.jsx';

import api from '../../store/api.js';

const StatusBadge = ({ status }) => {
  const map = {
    open:     'bg-amber-500/10 text-amber-600 border-amber-500/20',
    replied:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    archived: 'bg-slate-100 text-slate-500 border-slate-500/20',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${map[status] || 'bg-slate-100 text-slate-500 border-slate-500/20'}`}>{status}</span>;
};

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
    ))}
  </div>
);

export default function FeedbackManagement() {
  const { triggerToast } = useAppStore();
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await api.get('/admin/feedback');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFeedback(res.data.data);
        }
      } catch (err) {
        console.error("Fetch feedback error:", err);
      }
    };
    fetchFeedback();
  }, []);

  const handleDeleteFeedback = (id) => {
    if (!window.confirm("Delete this feedback record?")) return;
    setFeedback(f => f.filter(fb => fb._id !== id));
    if (selected?._id === id) setSelected(null);
    triggerToast('Feedback removed.', 'info');
  };

  const filtered = feedback.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || [f.userName, f.subject, f.message].some(x => x.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCount = feedback.filter(f => f.status === 'open').length;
  const resolvedCount = feedback.filter(f => f.status === 'resolved').length;
  const avgRating = feedback.length ? (feedback.reduce((a, b) => a + (b.rating || 0), 0) / feedback.length).toFixed(1) : '0.0';

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSendingReply(true);
    await new Promise(r => setTimeout(r, 600));
    setFeedback(f => f.map(fb => fb._id === selected._id ? { ...fb, reply, status: 'replied' } : fb));
    setSelected(prev => ({ ...prev, reply, status: 'replied' }));
    setReply('');
    setSendingReply(false);
    triggerToast('Reply sent successfully!', 'success');
  };

  const handleResolve = (id) => {
    setFeedback(f => f.map(fb => fb._id === id ? { ...fb, status: 'resolved' } : fb));
    if (selected?._id === id) setSelected(prev => ({ ...prev, status: 'resolved' }));
    triggerToast('Feedback marked as resolved.', 'success');
  };

  const handleArchive = (id) => {
    setFeedback(f => f.map(fb => fb._id === id ? { ...fb, status: 'archived' } : fb));
    if (selected?._id === id) setSelected(null);
    triggerToast('Feedback archived.', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-xl font-black">Feedback Management</h1>
          <p className="text-slate-500 text-xs mt-0.5">{feedback.length} total · {openCount} open</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', value: openCount, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Avg Rating', value: `${avgRating} ★`, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white border rounded-2xl p-4 text-center ${color.split(' ').find(c => c.startsWith('border'))}`}>
            <p className={`text-2xl font-black ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Content Split */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Feedback List */}
        <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl overflow-hidden">
          <FilterBar
            search={search} onSearch={setSearch}
            searchPlaceholder="Search feedback..."
            filters={[
              { key: 'status', label: 'Status', options: [
                { value: 'open', label: 'Open' },
                { value: 'replied', label: 'Replied' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'archived', label: 'Archived' },
              ]},
            ]}
            filterValues={{ status: statusFilter }}
            onFilterChange={(k, v) => setStatusFilter(v)}
            onReset={() => { setSearch(''); setStatusFilter('all'); }}
          />
          <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-600 text-sm">No feedback found.</div>
            )}
            {filtered.map(fb => (
              <motion.div
                key={fb._id}
                onClick={() => { setSelected(fb); setReply(''); }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                className={`p-4 cursor-pointer transition-colors ${selected?._id === fb._id ? 'bg-red-500/5 border-l-2 border-red-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-slate-900 text-xs font-bold truncate">{fb.userName}</p>
                      <StatusBadge status={fb.status} />
                    </div>
                    <p className="text-slate-500 text-xs font-semibold truncate">{fb.subject}</p>
                    <p className="text-slate-600 text-[10px] truncate mt-0.5">{fb.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StarRating rating={fb.rating} />
                    <span className="text-slate-600 text-[10px]">{new Date(fb.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Detail + Reply Panel */}
        <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Select a feedback to view details</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-900 font-bold text-sm">{selected.subject}</p>
                  <p className="text-slate-500 text-[10px]">{selected.userName} · {selected.phone}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={selected.status} />
                  <StarRating rating={selected.rating} />
                </div>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Message bubble */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-slate-500 text-[10px] font-bold mb-1 uppercase">User Message</p>
                  <p className="text-slate-900 text-xs leading-relaxed">{selected.message}</p>
                  <p className="text-slate-600 text-[10px] mt-2">{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
                </div>

                {/* Existing reply */}
                {selected.reply && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                    <p className="text-blue-400 text-[10px] font-bold mb-1 uppercase">Admin Reply</p>
                    <p className="text-slate-900 text-xs leading-relaxed">{selected.reply}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {selected.status !== 'resolved' && (
                    <button onClick={() => handleResolve(selected._id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-colors cursor-pointer">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                  <button onClick={() => handleArchive(selected._id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                  <button onClick={() => handleDeleteFeedback(selected._id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors cursor-pointer" title="Delete Feedback">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {/* Reply box */}
                {selected.status !== 'archived' && selected.status !== 'resolved' && (
                  <div>
                    <label className="text-slate-500 text-[10px] font-bold uppercase mb-1 block">Reply to {selected.userName}</label>
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors resize-none"
                    />
                    <button
                      onClick={handleReply}
                      disabled={!reply.trim() || sendingReply}
                      className="mt-2 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
