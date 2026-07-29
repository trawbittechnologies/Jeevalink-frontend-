import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Clock, User, Shield, Trash2, CheckCircle2, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import FilterBar from '../../components/admin/FilterBar.jsx';

const MOCK_LOGS = [];

const TYPE_CONFIG = {
  login:        { icon: LogIn,        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',  dot: 'bg-emerald-400' },
  logout:       { icon: LogOut,       color: 'text-slate-500 bg-slate-100 border-slate-500/20',        dot: 'bg-slate-400' },
  status_change:{ icon: Shield,       color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',        dot: 'bg-amber-400' },
  resolve:      { icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',           dot: 'bg-blue-400' },
  add:          { icon: User,         color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',      dot: 'bg-purple-400' },
  bulk:         { icon: Filter,       color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',     dot: 'bg-indigo-400' },
  verify:       { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  alert:        { icon: AlertTriangle,color: 'text-red-400 bg-red-500/10 border-red-500/20',             dot: 'bg-red-400' },
  delete:       { icon: Trash2,       color: 'text-red-400 bg-red-500/10 border-red-500/20',             dot: 'bg-red-400' },
  settings:     { icon: Shield,       color: 'text-slate-500 bg-slate-100 border-slate-500/20',       dot: 'bg-slate-400' },
};

export default function ActivityLogs() {
  const [logs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || [l.action, l.details, l.adminName].some(x => x.toLowerCase().includes(q));
    const matchType = typeFilter === 'all' || l.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-xl font-black">Activity Logs</h1>
          <p className="text-slate-500 text-xs mt-0.5">Complete audit trail of admin actions and system events</p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold">● System Online</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's Actions", value: filtered.filter(l => l.createdAt.startsWith(new Date().toISOString().split('T')[0])).length, color: 'text-blue-400' },
          { label: 'Status Changes', value: logs.filter(l => l.type === 'status_change').length, color: 'text-amber-400' },
          { label: 'Logins', value: logs.filter(l => l.type === 'login').length, color: 'text-emerald-400' },
          { label: 'Critical Actions', value: logs.filter(l => l.type === 'delete' || l.type === 'alert').length, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-slate-500 text-[10px]">{label}</p>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <FilterBar
          search={search} onSearch={setSearch}
          searchPlaceholder="Search actions, details..."
          filters={[
            { key: 'type', label: 'Type', options: [
              { value: 'login', label: 'Login' },
              { value: 'logout', label: 'Logout' },
              { value: 'status_change', label: 'Status Change' },
              { value: 'delete', label: 'Deletion' },
              { value: 'alert', label: 'Alert Sent' },
              { value: 'resolve', label: 'Resolved' },
              { value: 'add', label: 'Added' },
            ]},
          ]}
          filterValues={{ type: typeFilter }}
          onFilterChange={(k, v) => setTypeFilter(v)}
          dateFrom={dateFrom} dateTo={dateTo}
          onDateFrom={setDateFrom} onDateTo={setDateTo}
          onReset={() => { setSearch(''); setTypeFilter('all'); setDateFrom(''); setDateTo(''); }}
        />

        {/* Timeline */}
        <div className="p-4 space-y-0 relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-4 bottom-4 w-px bg-white/[0.06]" />

          {filtered.map((log, i) => {
            const config = TYPE_CONFIG[log.type] || TYPE_CONFIG.settings;
            const Icon = config.icon;
            return (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 py-3 relative"
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 z-10 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 bg-slate-50 border border-slate-100 rounded-xl p-3 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-slate-900 text-xs font-bold">{log.action}</p>
                    <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                  <p className="text-slate-500 text-[10px] leading-relaxed">{log.details}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <User className="w-2.5 h-2.5 text-slate-600" />
                    <span className="text-slate-600 text-[9px]">{log.adminName}</span>
                    <span className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${config.color}`}>{log.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-600 text-sm">No activity logs found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
