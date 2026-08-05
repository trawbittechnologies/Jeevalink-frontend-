import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { motion } from 'framer-motion';
import {
  HeadphonesIcon, Send, CheckCircle2, Clock, Zap,
  User, Phone, Trash2
} from 'lucide-react';
import FilterBar from '../../components/admin/FilterBar.jsx';
import ConfirmModal from '../../components/admin/ConfirmModal.jsx';

import api from '../../store/api.js';

const PRIORITY_MAP = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low:      'bg-slate-100 text-slate-500 border-slate-500/20',
};

const STATUS_MAP = {
  open:        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  resolved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed:      'bg-slate-100 text-slate-500 border-slate-500/20',
};

const PriorityBadge = ({ priority }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${PRIORITY_MAP[priority] || PRIORITY_MAP.Low}`}>
    {priority === 'Critical' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
    {priority}
  </span>
);

const StatusBadge = ({ status }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_MAP[status] || STATUS_MAP.open}`}>
    {status.replace('_', ' ')}
  </span>
);

export default function SupportCenter() {
  const { triggerToast } = useAppStore();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmClose, setConfirmClose] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/admin/tickets');
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTickets(res.data.data);
        }
      } catch (err) {
        console.error("Fetch tickets error:", err);
      }
    };
    fetchTickets();
  }, []);

  const handleDeleteTicket = (ticketId) => {
    if (!window.confirm("Remove this support ticket issue?")) return;
    setTickets(prev => prev.filter(t => t._id !== ticketId));
    if (selected?._id === ticketId) setSelected(null);
    triggerToast('Ticket issue removed.', 'info');
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || [t.userName, t.ticketId, t.issueType, t.description].some(x => x.toLowerCase().includes(q));
    const matchStatus = filters.status === 'all' || t.status === filters.status;
    const matchPriority = filters.priority === 'all' || t.priority === filters.priority;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'closed').length;

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 600));
    setTickets(ts => ts.map(t => t._id === selected._id ? { ...t, adminReply: reply, status: 'in_progress' } : t));
    setSelected(prev => ({ ...prev, adminReply: reply, status: 'in_progress' }));
    setReply('');
    setSending(false);
    triggerToast('Reply sent to user.', 'success');
  };

  const handleStatusChange = (id, newStatus) => {
    setTickets(ts => ts.map(t => t._id === id ? { ...t, status: newStatus } : t));
    if (selected?._id === id) setSelected(prev => ({ ...prev, status: newStatus }));
    triggerToast(`Ticket ${newStatus.replace('_', ' ')}.`, 'success');
    setConfirmClose(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-xl font-black">Support Center</h1>
          <p className="text-slate-500 text-xs mt-0.5">{tickets.length} total tickets · {openCount} open</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse">
            <Zap className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400 text-xs font-black">{criticalCount} Critical</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Open', value: openCount, color: 'text-amber-400' },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'text-blue-400' },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-400' },
          { label: 'Critical', value: criticalCount, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-4 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-slate-500 text-[10px]">{label}</p>
          </div>
        ))}
      </div>

      {/* Split View */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Ticket List */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl overflow-hidden">
          <FilterBar
            search={search} onSearch={setSearch}
            searchPlaceholder="Search tickets..."
            filters={[
              { key: 'status', label: 'Status', options: [
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]},
              { key: 'priority', label: 'Priority', options: ['Critical','High','Medium','Low'].map(p => ({ value: p, label: p })) },
            ]}
            filterValues={filters}
            onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
            onReset={() => { setSearch(''); setFilters({ status: 'all', priority: 'all' }); }}
          />
          <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
            {filtered.map(ticket => (
              <motion.div
                key={ticket._id}
                onClick={() => { setSelected(ticket); setReply(ticket.adminReply || ''); }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                className={`p-4 cursor-pointer transition-colors ${selected?._id === ticket._id ? 'bg-red-500/5 border-l-2 border-red-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-500 text-[10px] font-mono">{ticket.ticketId}</span>
                  <div className="flex items-center gap-1">
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <p className="text-slate-900 text-xs font-semibold truncate">{ticket.issueType}</p>
                <p className="text-slate-600 text-[10px] truncate mt-0.5">{ticket.userName} · {ticket.phoneNumber}</p>
                <div className="flex items-center justify-between mt-2">
                  <StatusBadge status={ticket.status} />
                  <span className="text-slate-700 text-[10px]">{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-600 text-sm">No tickets found.</div>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-3 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-600">
              <div className="text-center">
                <HeadphonesIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a ticket to view details</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-500 text-[10px] font-mono">{selected.ticketId}</span>
                      <PriorityBadge priority={selected.priority} />
                      <StatusBadge status={selected.status} />
                    </div>
                    <p className="text-slate-900 font-bold">{selected.issueType}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selected.status !== 'resolved' && selected.status !== 'closed' && (
                      <button onClick={() => handleStatusChange(selected._id, 'resolved')}
                        className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    )}
                    {selected.status !== 'closed' && (
                      <button onClick={() => setConfirmClose(selected._id)}
                        className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                        Close
                      </button>
                    )}
                    <button onClick={() => handleDeleteTicket(selected._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Ticket">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <User className="w-3 h-3" /> {selected.userName}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <Phone className="w-3 h-3" /> {selected.phoneNumber}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <Clock className="w-3 h-3" /> {new Date(selected.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {/* Issue description */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Issue Description</p>
                  <p className="text-slate-900 text-xs leading-relaxed">{selected.description}</p>
                </div>

                {/* Admin reply */}
                {selected.adminReply && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                    <p className="text-blue-400 text-[10px] font-bold uppercase mb-1">Admin Response</p>
                    <p className="text-slate-900 text-xs leading-relaxed">{selected.adminReply}</p>
                  </div>
                )}

                {/* Reply area */}
                {selected.status !== 'closed' && (
                  <div>
                    <label className="text-slate-500 text-[10px] font-bold uppercase mb-1 block">Send Reply</label>
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Write your response to the user..."
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 transition-colors resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleReply} disabled={!reply.trim() || sending}
                        className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
                        <Send className="w-3.5 h-3.5" /> {sending ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmClose}
        onClose={() => setConfirmClose(null)}
        onConfirm={() => handleStatusChange(confirmClose, 'closed')}
        title="Close Ticket"
        message="Closing this ticket will mark it as resolved and prevent further updates. Are you sure?"
        confirmLabel="Close Ticket"
        variant="warning"
      />
    </div>
  );
}
