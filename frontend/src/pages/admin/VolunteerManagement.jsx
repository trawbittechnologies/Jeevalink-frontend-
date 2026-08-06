import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Eye, Edit2, Trash2, User, UserCheck, UserX, Lock,
  CheckCircle2, XCircle, Clock, X, Save, Phone, Mail,
  MapPin, Building2, Loader2, Download
} from 'lucide-react';
import FilterBar from '../../components/admin/FilterBar.jsx';
import ConfirmModal from '../../components/admin/ConfirmModal.jsx';

const DISTRICTS = ['Ernakulam', 'Thrissur', 'Thiruvananthapuram', 'Kozhikode', 'Bengaluru Urban', 'Chennai', 'Mumbai', 'Delhi', 'Kottayam', 'Palakkad'];
const STATUS_OPTIONS = ['active', 'inactive', 'blocked', 'under_review'];

const StatusBadge = ({ status }) => {
  const map = {
    Active:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    active:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Inactive:      'bg-slate-100 text-slate-500 border-slate-500/20',
    inactive:      'bg-slate-100 text-slate-500 border-slate-500/20',
    Suspended:     'bg-red-500/10 text-red-400 border-red-500/20',
    blocked:       'bg-red-500/10 text-red-400 border-red-500/20',
    Blocked:       'bg-red-500/10 text-red-400 border-red-500/20',
    under_review:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Under Review':'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Pending Approval': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[status] || 'bg-slate-100 text-slate-500 border-slate-500/20'}`}>
      {status}
    </span>
  );
};

const emptyVolunteerForm = {
  meghalaName: '',
  person1Name: '',
  person1Contact: '',
  person2Name: '',
  person2Contact: '',
  whatsapp: '',
  email: ''
};

export default function VolunteerManagement() {
  const { user, addVolunteer, updateVolunteer } = useAuthStore();
  const { allUsers, fetchUsers, updateUserStatus, deleteUser, triggerToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', district: 'all' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, item: null });
  const [form, setForm] = useState(emptyVolunteerForm);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState({ open: false, email: '', password: '', emailSent: false });

  const canAddVolunteer = ['admin', 'super_admin', 'block_admin'].includes(user?.role);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const volunteers = allUsers.filter(u => u.role === 'volunteer' || u.role === 'Volunteer');

  const filtered = volunteers.filter(v => {
    const q = search.toLowerCase();
    const secName = v.secondaryName || v.secondary_name || v.person2Name || '';
    const secNum = v.secondaryContactNumber || v.secondary_contact_number || v.secondaryContact || v.person2Contact || '';
    const matchSearch = !q || [v.meghala, v.city, v.blockCommitteeName, v.blockName, v.primaryName, v.name, v.email, v.mobile, secName, secNum, v.district, v.jeevalink_id, v.employee_id]
      .some(f => String(f || '').toLowerCase().includes(q));
    const matchStatus = filters.status === 'all' || (v.status || '').toLowerCase() === filters.status;
    const matchDistrict = filters.district === 'all' || v.district === filters.district;
    return matchSearch && matchStatus && matchDistrict;
  });

  const exportCSV = () => {
    const headers = ['Meghala Name', 'Primary Volunteer Name', 'Primary Phone', 'Secondary Volunteer Name', 'Secondary Volunteer Phone', 'Email', 'District', 'Status', 'Registered'];
    const rows = filtered.map(v => [
      v.meghala || v.city || v.blockCommitteeName || v.blockName || '',
      v.primaryName || v.name || '',
      v.mobile || '',
      v.secondaryName || v.secondary_name || v.person2Name || '',
      v.secondaryContactNumber || v.secondary_contact_number || v.secondaryContact || '',
      v.email || '',
      v.district || '',
      v.status || '',
      v.joinedAt || v.created_at || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `volunteers_meghala_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    triggerToast('CSV exported successfully!', 'success');
  };

  const handleStatusAction = async (item, newStatus) => {
    setLoading(true);
    await updateUserStatus(item._id || item.id, newStatus);
    setLoading(false);
    setConfirmModal({ open: false, action: null, item: null });
  };

  const handleDeleteAction = async (item) => {
    setLoading(true);
    await deleteUser(item._id || item.id);
    setLoading(false);
    setConfirmModal({ open: false, action: null, item: null });
  };



  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all p-6 rounded-3xl border /80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-slate-900 text-xl font-black tracking-tight">Volunteer Management (Meghala Committee)</h1>
            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200">
              {volunteers.length} Total
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Manage Meghala Committee primary and secondary volunteers, access credentials, and account statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          {canAddVolunteer ? (
            <button
              onClick={() => { setForm(emptyVolunteerForm); setFormError(''); setShowAddModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-red-600/20"
            >
              <Plus className="w-4 h-4" /> Add Volunteer (Meghala)
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200">
              District Overview (Managed by Block Admins)
            </span>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all rounded-3xl border /80 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <FilterBar
          search={search} onSearch={setSearch}
          searchPlaceholder="Search by Meghala Name, Volunteer Name, Email, Phone..."
          filters={[
            { key: 'status', label: 'Status', options: STATUS_OPTIONS.map(s => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) })) },
            { key: 'district', label: 'District', options: DISTRICTS.map(d => ({ value: d, label: d })) },
          ]}
          filterValues={filters}
          onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
          dateFrom={dateFrom} dateTo={dateTo}
          onDateFrom={setDateFrom} onDateTo={setDateTo}
          onReset={() => { setSearch(''); setFilters({ status: 'all', district: 'all' }); setDateFrom(''); setDateTo(''); }}
        />

        {/* Minimal Modern Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-slate-700 font-bold text-sm">No Volunteers Found</p>
              <p className="text-slate-400 text-xs mt-1">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">JL Employee ID</th>
                  <th className="py-4 px-6">Meghala / Zone</th>
                  <th className="py-4 px-6">Primary Volunteer (Person 1)</th>
                  <th className="py-4 px-6">Secondary Volunteer (Person 2)</th>
                  <th className="py-4 px-6">Login Email ID</th>
                  <th className="py-4 px-6 text-center">Status & Toggle</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((vol) => {
                  const full = vol.primaryName || vol.name || vol.primary_name || '';
                  const nameParts = Array.from(new Set(full.split(/[&,]+/).map(s => s.trim()).filter(Boolean)));
                  const p1Name = vol.person1Name || nameParts[0] || '—';
                  const p1Mobile = vol.mobile || '—';

                  const p2Name = vol.secondaryName || vol.secondary_name || vol.person2Name || (nameParts.length > 1 ? nameParts[1] : '—');
                  const p2Mobile = vol.secondaryContactNumber || vol.secondary_contact_number || vol.secondaryContact || vol.person2Contact || '—';

                  return (
                    <motion.tr
                      key={vol._id || vol.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-red-50/20 transition"
                    >
                      {/* JeevaLink Employee ID */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {(() => {
                          const vId = vol.jeevalink_id || vol.employee_id || vol.jeevalinkId || (vol.id || vol._id ? `JL-VO-${String(vol.id || vol._id).padStart(4, '0')}` : null);
                          return vId ? (
                            <span className="inline-flex items-center font-mono text-[10px] font-black text-primary bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                              {vId}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px] italic">—</span>
                          );
                        })()}
                      </td>
                      {/* Meghala Badge */}
                      <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold">
                          <Building2 className="w-3.5 h-3.5 text-red-600" />
                          {vol.meghala || vol.city || vol.blockCommitteeName || vol.blockName || 'Unassigned'}
                        </span>
                      </td>

                      {/* Primary Contact (Person 1) */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">{p1Name || '—'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p1Mobile}</span>
                        </div>
                      </td>

                      {/* Secondary Contact (Person 2) */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">{p2Name || '—'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p2Mobile}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs">{vol.email}</span>
                        </div>
                      </td>

                      {/* Status & Active/Deactive Toggle */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            vol.status === 'Active'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {vol.status || 'Active'}
                          </span>

                          <button
                            onClick={() => setConfirmModal({
                              open: true,
                              action: vol.status === 'Active' ? 'deactivate' : 'activate',
                              item: vol
                            })}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                              vol.status === 'Active'
                                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                            }`}
                            title={vol.status === 'Active' ? 'Deactivate Volunteer' : 'Activate Volunteer'}
                          >
                            {vol.status === 'Active' ? (
                              <UserX className="w-3 h-3 text-amber-600" />
                            ) : (
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                            )}
                            {vol.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        {/* View Details Button */}
                        <button
                          onClick={() => { setSelectedVolunteer(vol); setShowViewModal(true); }}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl hover:bg-blue-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> View
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => { 
                            setSelectedVolunteer(vol); 
                            setForm({
                              meghalaName: vol.meghala || vol.city || vol.blockCommitteeName || vol.blockName || '',
                              person1Name: p1Name,
                              person1Contact: p1Mobile,
                              person2Name: p2Name === '—' ? '' : p2Name,
                              person2Contact: p2Mobile === '—' ? '' : p2Mobile,
                              whatsapp: vol.whatsappNumber || vol.whatsapp_number || vol.mobile || '',
                              email: vol.email || ''
                            }); 
                            setShowEditModal(true); 
                          }}
                          className="px-2.5 py-1.5 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Edit Volunteer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setConfirmModal({ open: true, action: 'delete', item: vol })}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Delete Volunteer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      <AnimatePresence>
        {showViewModal && selectedVolunteer && (() => {
          const full = selectedVolunteer.primaryName || selectedVolunteer.primary_name || selectedVolunteer.name || '';
          const nameParts = Array.from(new Set(full.split(/[&,]+/).map(s => s.trim()).filter(Boolean)));
          const p1Name = selectedVolunteer.person1Name || nameParts[0] || '—';
          const p2Name = selectedVolunteer.secondaryName || selectedVolunteer.secondary_name || selectedVolunteer.person2Name || (nameParts.length > 1 ? nameParts[1] : '—');
          
          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowViewModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4">
                <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-slate-900 text-lg font-black">Volunteer (Meghala) Details</h3>
                    <button onClick={() => setShowViewModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 font-black text-xl">
                      <Building2 className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-black text-base">{selectedVolunteer.meghala || selectedVolunteer.city || selectedVolunteer.blockCommitteeName || p1Name}</p>
                      <StatusBadge status={selectedVolunteer.status} />
                      <p className="text-slate-500 text-[10px] mt-0.5">ID: {selectedVolunteer._id || selectedVolunteer.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Building2, label: 'Meghala Name', val: selectedVolunteer.meghala || selectedVolunteer.city || selectedVolunteer.blockCommitteeName || '—' },
                      { icon: User, label: 'Primary Volunteer', val: p1Name },
                      { icon: Phone, label: 'Primary Contact', val: selectedVolunteer.mobile || '—' },
                      { icon: User, label: 'Secondary Volunteer', val: p2Name },
                    { icon: Phone, label: 'Secondary Contact', val: selectedVolunteer.secondaryContact || selectedVolunteer.secondaryContactNumber || selectedVolunteer.secondary_phone || '—' },
                    { icon: Mail, label: 'Email', val: selectedVolunteer.email },
                    { icon: Phone, label: 'WhatsApp', val: selectedVolunteer.whatsappNumber || selectedVolunteer.whatsapp_number || '—' },
                    { icon: MapPin, label: 'District', val: selectedVolunteer.district || '—' },
                    { icon: Clock, label: 'Registered', val: new Date(selectedVolunteer.joinedAt || selectedVolunteer.createdAt || selectedVolunteer.created_at || new Date().toISOString()).toLocaleDateString('en-IN') },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-500 text-[10px] font-bold uppercase">{label}</span>
                      </div>
                      <p className="text-slate-900 text-xs font-semibold truncate">{val}</p>
                    </div>
                  ))}
                </div>

                <button onClick={() => setShowViewModal(false)} className="w-full mt-4 py-2.5 bg-slate-50 border border-slate-100 text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">Close</button>
              </div>
            </motion.div>
          </>
          );
        })()}
      </AnimatePresence>

      {/* Add/Edit Volunteer Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all rounded-2xl shadow-xl overflow-hidden border">
                <div className="bg-red-600 p-6 relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all/20 rounded-xl flex items-center justify-center text-white">
                        {showAddModal ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-black tracking-tight">{showAddModal ? 'Add New Volunteer (Meghala)' : 'Edit Volunteer Details'}</h3>
                        <p className="text-red-100 text-[10px] font-medium">{showAddModal ? 'Automatically generates password & dispatches login credentials' : 'Update Volunteer information in system'}</p>
                      </div>
                    </div>
                    <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="p-6">
                  {formError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2.5 shadow-sm">
                      <XCircle className="w-4 h-4 shrink-0 text-red-500" /> {formError}
                    </motion.div>
                  )}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!form.meghalaName || !form.email || !form.person1Name || !form.person1Contact || !form.person2Name || !form.person2Contact || !form.whatsapp) { setFormError('All fields are required.'); return; }
                    setLoading(true);
                    setFormError('');
                    
                    if (showAddModal) {
                      const res = await addVolunteer({
                        meghalaName: form.meghalaName,
                        person1Name: form.person1Name,
                        person1Contact: form.person1Contact,
                        person2Name: form.person2Name,
                        person2Contact: form.person2Contact,
                        whatsapp: form.whatsapp,
                        email: form.email
                      });
                      if (res.success) {
                        setShowAddModal(false);
                        setForm(emptyVolunteerForm);
                        setFormError('');
                        setCredentialsModal({ open: true, email: form.email, password: res.generatedPassword, emailSent: res.emailSent });
                        fetchUsers();
                      } else {
                        setFormError(res.error || 'Failed to add Volunteer. Please try again.');
                      }
                    } else {
                      const res = await updateVolunteer(selectedVolunteer._id || selectedVolunteer.id, {
                        meghalaName: form.meghalaName,
                        person1Name: form.person1Name,
                        person1Contact: form.person1Contact,
                        person2Name: form.person2Name,
                        person2Contact: form.person2Contact,
                        whatsapp: form.whatsapp,
                        email: form.email
                      });
                      if (res.success) {
                        triggerToast('Volunteer details updated!', 'success');
                        setShowEditModal(false);
                        fetchUsers();
                      } else {
                        setFormError(res.error || 'Failed to update Volunteer. Please try again.');
                      }
                    }
                    
                    setLoading(false);
                  }} className="space-y-4">
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">MEGHALA / ZONE NAME *</label>
                        <input type="text" value={form.meghalaName} onChange={e => setForm(f => ({ ...f, meghalaName: e.target.value }))} required placeholder="e.g. Kozhikode City, West Hill, Medical College..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PRIMARY VOLUNTEER (PERSON 1) *</label>
                          <input type="text" value={form.person1Name} onChange={e => setForm(f => ({ ...f, person1Name: e.target.value }))} required placeholder="Primary Name"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CONTACT NUMBER (PERSON 1) *</label>
                          <input type="text" value={form.person1Contact} onChange={e => setForm(f => ({ ...f, person1Contact: e.target.value }))} required placeholder="Phone Number"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SECONDARY VOLUNTEER (PERSON 2) *</label>
                          <input type="text" value={form.person2Name} onChange={e => setForm(f => ({ ...f, person2Name: e.target.value }))} required placeholder="Primary Name"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CONTACT NUMBER (PERSON 2) *</label>
                          <input type="text" value={form.person2Contact} onChange={e => setForm(f => ({ ...f, person2Contact: e.target.value }))} required placeholder="Phone Number"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">WHATSAPP NUMBER *</label>
                        <input type="text" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} required placeholder="WhatsApp Number"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PRIMARY VOLUNTEER EMAIL *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="volunteer@jeevalink.org"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-3 mt-4 border-t border-slate-100">
                      <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                        className="flex-1 py-3 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer">
                        Cancel
                      </button>
                      <button type="submit" disabled={loading}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                        {showAddModal ? 'Create Volunteer' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: null, item: null })}
        loading={loading}
        onConfirm={() => {
          if (confirmModal.action === 'delete') {
            handleDeleteAction(confirmModal.item);
          } else {
            const statusMap = { activate: 'Active', deactivate: 'Inactive', block: 'Suspended' };
            handleStatusAction(confirmModal.item, statusMap[confirmModal.action]);
          }
        }}
        title={confirmModal.action === 'delete' ? 'Delete Volunteer' : confirmModal.action === 'block' ? 'Block Volunteer Account' : confirmModal.action === 'activate' ? 'Activate Volunteer' : 'Deactivate Volunteer'}
        message={confirmModal.action === 'delete' ? `Are you sure you want to permanently delete Volunteer "${confirmModal.item?.meghala || confirmModal.item?.city || confirmModal.item?.primaryName}"? This action cannot be undone.` : `Are you sure you want to ${confirmModal.action} Volunteer "${confirmModal.item?.meghala || confirmModal.item?.city || confirmModal.item?.primaryName}"?`}
        confirmLabel={confirmModal.action === 'delete' ? 'Delete Permanently' : confirmModal.action === 'block' ? 'Block Account' : confirmModal.action === 'activate' ? 'Activate' : 'Deactivate'}
        variant={confirmModal.action === 'delete' || confirmModal.action === 'block' ? 'danger' : confirmModal.action === 'activate' ? 'info' : 'warning'}
      />

      {/* Credentials Popup Modal */}
      <AnimatePresence>
        {credentialsModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
              <div className="text-center mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border ${credentialsModal.emailSent ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                  {credentialsModal.emailSent
                    ? <Mail className="w-7 h-7 text-emerald-500" />
                    : <Lock className="w-7 h-7 text-amber-500" />}
                </div>
                <h3 className="text-lg font-black text-gray-900">
                  {credentialsModal.emailSent ? 'Volunteer Added Successfully' : 'Volunteer Login Credentials'}
                </h3>
                {credentialsModal.emailSent ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Credentials sent to Volunteer email
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">The Volunteer will receive login details via email.</p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-semibold mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">⚠️ Email delivery failed. Share credentials manually.</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setCredentialsModal({ open: false, email: '', password: '', emailSent: false })}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
