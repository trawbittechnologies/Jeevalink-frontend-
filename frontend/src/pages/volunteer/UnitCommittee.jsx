import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Eye, EyeOff, X, Loader2, Lock, KeyRound, Trash2,
  CheckCircle2, XCircle, Clock, Building2
} from 'lucide-react';
import FilterBar from '../../components/admin/FilterBar.jsx';
import ConfirmModal from '../../components/admin/ConfirmModal.jsx';

const StatusBadge = ({ status }) => {
  const map = {
    Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'Pending Approval': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Rejected: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    rejected: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    Disabled: 'bg-slate-100 text-slate-600 border-slate-300',
    disabled: 'bg-slate-100 text-slate-600 border-slate-300',
  };
  const label = (status || 'Active').replace('_', ' ');
  return (
    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {label}
    </span>
  );
};

export default function UnitCommittee() {
  const { allUsers, fetchUsers, volunteerAddUser, updateUnitSquadStatus, deleteUser, triggerToast } = useAppStore();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all' });
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });

  const [selectedSquad, setSelectedSquad] = useState(null);
  const [form, setForm] = useState({ unit: '', email: '', mobile: '', full_name: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState({ open: false, squad: null, newPassword: '', showPass: false });
  const [credentialsModal, setCredentialsModal] = useState({ open: false, email: '', password: '' });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ONLY Unit Squad Accounts
  const unitSquads = allUsers.filter(u => (u.role || '').toLowerCase() === 'unit_squad');

  const filtered = unitSquads.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || [v.meghala, v.unit, v.unit_name, v.fullName, v.name, v.email, v.mobile, v.city, v.district]
      .some(f => String(f || '').toLowerCase().includes(q));
    const matchStatus = filters.status === 'all' || (v.status || '').toLowerCase() === filters.status.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleAddUnitSquadSubmit = async (e) => {
    e.preventDefault();
    if (!form.unit || !form.full_name || !form.email || !form.password) {
      triggerToast('Please fill in Unit Name, Convener Name, Email, and Password.', 'warning');
      return;
    }
    setLoading(true);

    const fd = new FormData();
    fd.append('role', 'unit_squad');
    fd.append('unit', form.unit);
    fd.append('meghala', user?.meghala || form.unit);
    fd.append('district', user?.district || 'Kozhikode');
    fd.append('full_name', form.full_name);
    fd.append('email', form.email);
    fd.append('password', form.password);

    const res = await volunteerAddUser(fd);
    if (res.success) {
      setShowAddModal(false);
      setForm({ unit: '', email: '', mobile: '', full_name: '', password: '' });
      await fetchUsers();
    }
    setLoading(false);
  };

  const handleStatusToggle = async (squadItem, newStatus) => {
    const userId = squadItem._id || squadItem.id;
    setLoading(true);
    await updateUnitSquadStatus(userId, newStatus);
    setLoading(false);
    fetchUsers();
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordModal.squad || !resetPasswordModal.newPassword) {
      triggerToast('Please enter a new password.', 'warning');
      return;
    }
    const squadId = resetPasswordModal.squad._id || resetPasswordModal.squad.id;
    setLoading(true);
    const res = await updateUnitSquadStatus(squadId, resetPasswordModal.squad.status || 'Active', false, resetPasswordModal.newPassword);
    setLoading(false);
    if (res.success) {
      setResetPasswordModal({ open: false, squad: null, newPassword: '', showPass: false });
      fetchUsers();
    }
  };

  const handleDeleteSquad = async (squadItem) => {
    if (!squadItem) return;
    const userId = squadItem._id || squadItem.id;
    setLoading(true);
    await deleteUser(userId);
    setLoading(false);
    setConfirmModal({ open: false, item: null });
    fetchUsers();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ─── HEADER BANNER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-slate-900 text-xl font-black tracking-tight">Unit Squad Management</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Add local Unit Squad accounts, set manual login passwords, and track account status.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setForm({ unit: '', email: '', mobile: '', full_name: '', password: '' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-red-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Unit Squad
        </button>
      </div>

      {/* ─── SQUAD KPI STATS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Unit Squads', val: unitSquads.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Squads', val: unitSquads.filter(m => m.status === 'Active' || m.status === 'active' || m.is_verified).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Squads', val: unitSquads.filter(m => m.status === 'Pending' || m.status === 'Pending Approval' || !m.is_verified).length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Disabled / Rejected', val: unitSquads.filter(m => m.status === 'Disabled' || m.status === 'Rejected').length, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.label} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">{st.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{st.val}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${st.bg} ${st.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── UNIT SQUAD ACCOUNTS TABLE ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <FilterBar
          search={search} onSearch={setSearch}
          searchPlaceholder="Search by unit name, convener name, email..."
          filters={[
            { key: 'status', label: 'Status', options: [
              { value: 'Active', label: 'Active' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Rejected', label: 'Rejected' },
              { value: 'Disabled', label: 'Disabled' }
            ]}
          ]}
          filterValues={filters}
          onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
          onReset={() => { setSearch(''); setFilters({ status: 'all' }); }}
        />

        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-bold text-sm">No Unit Squad Accounts Found</p>
              <p className="text-slate-400 text-xs mt-1">Click "+ Add Unit Squad" above to create your first squad account.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Unit Name</th>
                  <th className="py-4 px-6">Convener / Contact Person</th>
                  <th className="py-4 px-6">Registered Email</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((squad) => {
                  const unitTitle = squad.unit || squad.meghala || squad.fullName || squad.name || 'Unit Squad';
                  const contactPerson = squad.fullName || squad.name || 'Unit Committee';

                  return (
                    <tr key={squad._id || squad.id} className="hover:bg-red-50/20 transition">
                      {/* Unit Name */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-slate-900 text-xs font-black">{unitTitle}</p>
                            <p className="text-slate-400 text-[10px]">Role: Unit Squad</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-slate-700">
                        {contactPerson}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-600">
                        {squad.email}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <StatusBadge status={squad.status || 'Active'} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        {/* Status Toggle Button */}
                        {squad.status === 'Active' ? (
                          <button
                            onClick={() => handleStatusToggle(squad, 'Disabled')}
                            className="px-2.5 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                            title="Disable Account"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(squad, 'Active')}
                            className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                            title="Enable / Activate Account"
                          >
                            Enable
                          </button>
                        )}

                        {/* Reset Password Button */}
                        <button
                          onClick={() => setResetPasswordModal({ open: true, squad: squad, newPassword: '', showPass: false })}
                          className="px-2.5 py-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Set / Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" /> Password
                        </button>

                        {/* View Button */}
                        <button
                          onClick={() => { setSelectedSquad(squad); setShowViewModal(true); }}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl hover:bg-blue-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> View
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setConfirmModal({ open: true, item: squad })}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── VIEW SQUAD MODAL ─── */}
      <AnimatePresence>
        {showViewModal && selectedSquad && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100"
            >
              <div className="h-24 bg-gradient-to-r from-red-600 to-rose-600 p-6 flex justify-between items-start text-white">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-100 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                    Unit Squad Details
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    {selectedSquad.unit || selectedSquad.meghala || selectedSquad.fullName || 'Unit Squad'}
                  </h3>
                </div>
                <button onClick={() => setShowViewModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-bold text-slate-500">Unit Name:</span>
                    <span className="font-extrabold text-slate-900">{selectedSquad.unit || selectedSquad.meghala || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-bold text-slate-500">Registered Email:</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedSquad.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="font-bold text-slate-500">Convener Name:</span>
                    <span className="font-semibold text-slate-900">{selectedSquad.fullName || selectedSquad.name || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-slate-500">Account Status:</span>
                    <StatusBadge status={selectedSquad.status || 'Active'} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const sq = selectedSquad;
                      setShowViewModal(false);
                      setResetPasswordModal({ open: true, squad: sq, newPassword: '', showPass: false });
                    }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Reset Password
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ADD UNIT SQUAD MODAL ─── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 relative">
              <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 relative overflow-hidden shrink-0">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-black tracking-tight">Add Unit Squad</h3>
                      <p className="text-red-100 text-[10px] font-medium">Enter login credentials and set password manually</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <form onSubmit={handleAddUnitSquadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Unit Name *</label>
                    <input
                      type="text"
                      value={form.unit || ''}
                      onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-semibold transition-all"
                      placeholder="e.g. Cheemeni East Unit"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Convener / Contact Person *</label>
                    <input
                      type="text"
                      value={form.full_name || ''}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 text-sm transition-all font-semibold"
                      placeholder="e.g. Rahul V."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Registered Email *</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-mono text-sm transition-all"
                      placeholder="unitsquad@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password || ''}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-mono text-sm transition-all"
                        placeholder="Enter login password"
                        required
                        minLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 mt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 transition-all cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Unit Squad
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── RESET PASSWORD MODAL ─── */}
      <AnimatePresence>
        {resetPasswordModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 relative">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 relative flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Set New Password</h3>
                    <p className="text-amber-100 text-[10px]">Unit: {resetPasswordModal.squad?.unit || resetPasswordModal.squad?.meghala || 'Unit Squad'}</p>
                  </div>
                </div>
                <button onClick={() => setResetPasswordModal({ open: false, squad: null, newPassword: '', showPass: false })} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={resetPasswordModal.showPass ? "text" : "password"}
                      value={resetPasswordModal.newPassword}
                      onChange={e => setResetPasswordModal({ ...resetPasswordModal, newPassword: e.target.value })}
                      className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 font-mono text-sm transition-all"
                      placeholder="Enter new password"
                      required
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setResetPasswordModal({ ...resetPasswordModal, showPass: !resetPasswordModal.showPass })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {resetPasswordModal.showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setResetPasswordModal({ open: false, squad: null, newPassword: '', showPass: false })} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 transition cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CREDENTIALS POPUP MODAL ─── */}
      <AnimatePresence>
        {credentialsModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-100">
                  <Lock className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Unit Squad Credentials</h3>
                <p className="text-xs text-slate-500 mt-1">Credentials with password generated for squad</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 mb-5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email (Username)</p>
                  <p className="text-sm font-semibold text-slate-900 font-mono bg-white px-3 py-2 rounded-lg border border-slate-100">{credentialsModal.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Password</p>
                  <p className="text-sm font-bold text-red-600 font-mono bg-white px-3 py-2 rounded-lg border border-red-100 tracking-wider">{credentialsModal.password}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const text = `JeevaLink Unit Squad Credentials\nEmail: ${credentialsModal.email}\nPassword: ${credentialsModal.password}\nLogin: ${window.location.origin}/login`;
                    navigator.clipboard.writeText(text);
                    triggerToast('Credentials copied to clipboard!', 'success');
                  }}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  📋 Copy All
                </button>
                <button onClick={() => setCredentialsModal({ open: false, email: '', password: '' })} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer">
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, item: null })}
        onConfirm={() => handleDeleteSquad(confirmModal.item)}
        title="Delete Unit Squad Account"
        message={`Are you sure you want to delete "${confirmModal.item?.unit || confirmModal.item?.meghala || confirmModal.item?.fullName || 'this squad'}"? This action cannot be undone.`}
        confirmLabel="Delete Account"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
