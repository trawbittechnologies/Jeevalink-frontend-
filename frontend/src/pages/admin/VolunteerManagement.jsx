import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Eye, Edit2, Trash2, User, UserCheck, UserX, Lock,
  CheckCircle2, XCircle, Clock, X, Save, Phone, Mail,
  MapPin, Building2, Loader2, Download,
  LayoutList, GitBranch, ChevronRight, Droplets, Users
} from 'lucide-react';
import api from '../../store/api.js';
import FilterBar from '../../components/admin/FilterBar.jsx';
import ConfirmModal from '../../components/admin/ConfirmModal.jsx';
import { getDisplayJeevalinkId } from '../../utils/jeevalinkId.js';

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
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'tree'
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [backendBlocks, setBackendBlocks] = useState([]);

  const canAddVolunteer = ['admin', 'super_admin', 'block_admin'].includes(user?.role);

  useEffect(() => {
    fetchUsers();

    let active = true;
    api.get('/super-admin/blocks')
      .then(res => {
        if (active && res?.data?.success && Array.isArray(res.data.data?.blocks)) {
          setBackendBlocks(res.data.data.blocks);
        }
      })
      .catch(() => null);
    return () => { active = false; };
  }, [fetchUsers]);

  const isBlockAdmin = user?.role === 'block_admin';
  const myBlock = (user?.organization_name || user?.city || user?.blockCommitteeName || user?.block || '').trim().toLowerCase();

  const isVolunteerUser = (u) => {
    if (!u) return false;
    return String(u.role || '').toLowerCase().trim() === 'volunteer';
  };

  const volunteers = useMemo(() => {
    const seen = new Set();
    return (allUsers || []).filter(u => {
      if (!isVolunteerUser(u)) return false;
      const uid = String(u._id || u.id || u.email || u.mobile || '');
      if (seen.has(uid)) return false;
      seen.add(uid);
      if (!isBlockAdmin || !myBlock) return true;
      const vBlock = (u.blockCommitteeName || u.organization_name || u.blockName || u.block || '').trim().toLowerCase();
      return vBlock === myBlock || vBlock.includes(myBlock) || myBlock.includes(vBlock);
    });
  }, [allUsers, isBlockAdmin, myBlock]);

  const donorUsers = useMemo(() => {
    return (allUsers || []).filter(u => {
      if (!u) return false;
      const role = String(u.role || '').toLowerCase().trim();
      const isDonorRole = ['user', 'donor', 'receiver'].includes(role);
      const hasBloodGroup = u.blood_group && u.blood_group !== 'N/A' && u.blood_group !== '';
      return isDonorRole || hasBloodGroup;
    });
  }, [allUsers]);

  const getMeghalaStats = useCallback((vol) => {
    const volId = String(vol._id || vol.id || '');
    const mName = (vol.meghala || vol.city || vol.meghalaName || vol.blockCommitteeName || '').trim();
    const mLower = mName.toLowerCase();

    let localDonors = 0;
    if (mName || volId) {
      donorUsers.forEach(d => {
        const dVolId = String(d.added_by_volunteer_id || d.by_volunteer_id || '');
        const dRemarks = (d.remarks || '').toLowerCase();
        const dMeghala = (d.meghala || d.city || '').trim().toLowerCase();

        if (volId && (dVolId === volId || dRemarks.includes(`by_volunteer_id:${volId}`))) {
          localDonors++;
        } else if (mLower && (
          dRemarks.includes(`added by meghala: ${mLower}`) ||
          dRemarks.includes(`added by unit squad: ${mLower}`) ||
          dMeghala === mLower
        )) {
          localDonors++;
        }
      });
    }

    let backendDonors = 0;
    if (mLower && backendBlocks.length > 0) {
      for (const b of backendBlocks) {
        if (Array.isArray(b.meghalas)) {
          const found = b.meghalas.find(m => {
            const name = typeof m === 'string' ? m : (m.name || m.meghala || m.meghala_name || '');
            return name.trim().toLowerCase() === mLower;
          });
          if (found && typeof found === 'object') {
            backendDonors = found.donorCount ?? found.donors_count ?? found.donors ?? 0;
            break;
          }
        }
      }
    }

    const donorCount = Math.max(localDonors, backendDonors);

    let volCount = 1;
    const p2Name = vol.secondaryName || vol.secondary_name || vol.person2Name;
    const p2Contact = vol.secondaryContactNumber || vol.secondary_contact_number || vol.secondaryContact || vol.person2Contact;
    if (p2Name || p2Contact) {
      volCount++;
    }

    return { donorCount, volCount };
  }, [donorUsers, backendBlocks]);

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

  const groupedByBlock = useMemo(() => {
    const groups = {};
    filtered.forEach(vol => {
      const rawB = (vol.organization_name || vol.blockCommitteeName || vol.blockName || vol.block || 'Unassigned Block').trim();
      const cleanB = rawB.replace(/^(dyfi|block committee|committee|block)\s+|\s+(dyfi|block committee|committee|block)$/gi, '').trim() || 'Unassigned Block';
      const formattedB = cleanB.charAt(0).toUpperCase() + cleanB.slice(1);

      if (!groups[formattedB]) {
        groups[formattedB] = [];
      }
      groups[formattedB].push(vol);
    });
    return groups;
  }, [filtered]);

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
    a.download = `meghalas_${new Date().toISOString().split('T')[0]}.csv`; a.click();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-slate-200 shadow-sm p-6 rounded-3xl border /80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-red-600 uppercase text-xl sm:text-2xl font-black tracking-tight">
              Meghala Management {isBlockAdmin && (user?.organization_name || user?.city) ? `(${user?.organization_name || user?.city})` : '(Meghala Committee)'}
            </h1>
            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200">
              {volunteers.length} Total
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {isBlockAdmin 
              ? `Manage Meghala Committee primary and secondary coordinators added by ${user?.organization_name || user?.city || 'your Block'}.`
              : 'Manage Meghala Committee primary and secondary coordinators, access credentials, and account statuses.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('tree')}
              title="Tree View — shows Meghala units grouped by Block"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Tree
            </button>
          </div>

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
              <Plus className="w-4 h-4" /> Add Meghala Committee
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200">
              District Overview (Managed by Block Admins)
            </span>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border-slate-200 shadow-sm rounded-3xl border /80 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <FilterBar
          search={search} onSearch={setSearch}
          searchPlaceholder="Search by Meghala Name, Coordinator Name, Email, Phone..."
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

        {/* ─── TABLE VIEW ─── */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-slate-700 font-bold text-sm">No Meghalas Found</p>
                <p className="text-slate-400 text-xs mt-1">Try adjusting your search terms or filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-6">JL Employee ID</th>
                    <th className="py-4 px-6">Meghala / Zone</th>
                    <th className="py-4 px-6">Primary Coordinator (Person 1)</th>
                    <th className="py-4 px-6">Secondary Coordinator (Person 2)</th>
                    <th className="py-4 px-6">Login Email ID</th>
                    <th className="py-4 px-6 text-center">Donors & Members</th>
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
                    const stats = getMeghalaStats(vol);

                    return (
                      <motion.tr
                        key={vol._id || vol.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-red-50/20 transition"
                      >
                        {/* iDonate ID */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {(() => {
                            const vId = getDisplayJeevalinkId(vol);
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

                        {/* Meghala Donor Count & Volunteer Count */}
                        <td className="py-4 px-6 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={`${stats.donorCount} Donors in ${vol.meghala || vol.city || 'Meghala'}`}>
                              <Droplets className="w-3 h-3 text-rose-500" />
                              {stats.donorCount} Donor{stats.donorCount !== 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title={`${stats.volCount} Coordinators/Volunteers in ${vol.meghala || vol.city || 'Meghala'}`}>
                              <Users className="w-3 h-3 text-emerald-500" />
                              {stats.volCount} Vol
                            </span>
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
                              title={vol.status === 'Active' ? 'Deactivate Meghala' : 'Activate Meghala'}
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
                            title="Edit Meghala"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setConfirmModal({ open: true, action: 'delete', item: vol })}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                            title="Delete Meghala"
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
        )}

        {/* ─── TREE VIEW (TREE MODEL) ─── */}
        {viewMode === 'tree' && (
          <div className="p-6 space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-red-500" /> Block Committee</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-violet-500" /> Meghala Unit</span>
              <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-rose-500" /> Donors Count</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-500" /> Coordinators & Members</span>
            </div>

            {Object.keys(groupedByBlock).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                No Meghala units found matching your filters
              </div>
            ) : (
              Object.entries(groupedByBlock).map(([blockName, meghalaVolunteers]) => {
                const isExpanded = expandedBlocks[blockName] !== false; // default expanded
                const blockTotalDonors = meghalaVolunteers.reduce((acc, v) => acc + getMeghalaStats(v).donorCount, 0);
                const blockTotalVols = meghalaVolunteers.reduce((acc, v) => acc + getMeghalaStats(v).volCount, 0);

                return (
                  <div key={blockName} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                    {/* Block Header Row */}
                    <button
                      onClick={() => setExpandedBlocks(prev => ({ ...prev, [blockName]: !isExpanded }))}
                      className="w-full flex items-center gap-3 px-5 py-4 bg-slate-50/90 hover:bg-red-50/40 transition-colors cursor-pointer text-left group"
                    >
                      <span className="w-5 h-5 rounded-lg bg-slate-200/80 flex items-center justify-center shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      </span>

                      <span className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold border border-red-200">
                        <Building2 className="w-4 h-4" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900">{blockName} Block</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {meghalaVolunteers.length} Meghala{meghalaVolunteers.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 text-rose-600 font-bold">
                            <Droplets className="w-3 h-3 text-rose-500" /> {blockTotalDonors} Donors
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <Users className="w-3 h-3 text-emerald-500" /> {blockTotalVols} Coordinators & Members
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Meghala Tree Children */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-white">
                        <ul className="divide-y divide-slate-100">
                          {meghalaVolunteers.map((vol, idx) => {
                            const stats = getMeghalaStats(vol);
                            const mName = vol.meghala || vol.city || vol.blockCommitteeName || 'Unassigned Meghala';
                            const full = vol.primaryName || vol.name || vol.primary_name || '';
                            const nameParts = Array.from(new Set(full.split(/[&,]+/).map(s => s.trim()).filter(Boolean)));
                            const p1Name = vol.person1Name || nameParts[0] || '—';
                            const p1Mobile = vol.mobile || '—';
                            const p2Name = vol.secondaryName || vol.secondary_name || vol.person2Name || (nameParts.length > 1 ? nameParts[1] : '—');
                            const p2Mobile = vol.secondaryContactNumber || vol.secondary_contact_number || vol.secondaryContact || vol.person2Contact || '—';

                            return (
                              <li key={vol._id || vol.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-3.5 hover:bg-violet-50/40 transition-colors">
                                <div className="flex items-start gap-3 min-w-0">
                                  {/* Tree connector */}
                                  <span className="flex flex-col items-center self-stretch w-4 shrink-0 mt-1">
                                    <span className="w-px flex-1 bg-slate-200" />
                                    {idx === meghalaVolunteers.length - 1 && <span className="w-4 h-px bg-slate-200" />}
                                  </span>
                                  <span className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-200 mt-0.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                  </span>

                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-black text-slate-900">{mName}</span>
                                      <StatusBadge status={vol.status} />
                                      {getDisplayJeevalinkId(vol) && (
                                        <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                                          {getDisplayJeevalinkId(vol)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 flex-wrap">
                                      <span>P1: <strong className="text-slate-700">{p1Name}</strong> ({p1Mobile})</span>
                                      {p2Name !== '—' && (
                                        <span>P2: <strong className="text-slate-700">{p2Name}</strong> ({p2Mobile})</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Section: Badges & Actions */}
                                <div className="flex items-center gap-3 shrink-0 ml-10 md:ml-0">
                                  {/* Donor Count Badge */}
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                                    <Droplets className="w-3.5 h-3.5 text-rose-500" />
                                    {stats.donorCount} Donor{stats.donorCount !== 1 ? 's' : ''}
                                  </span>

                                  {/* Volunteer Count Badge */}
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                                    {stats.volCount} Vol{stats.volCount !== 1 ? 's' : ''}
                                  </span>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1.5 ml-2">
                                    <button
                                      onClick={() => { setSelectedVolunteer(vol); setShowViewModal(true); }}
                                      className="p-1.5 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                                      title="View Details"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                                    </button>
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
                                      className="p-1.5 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                      title="Edit Meghala"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmModal({ open: true, action: 'delete', item: vol })}
                                      className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                      title="Delete Meghala"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
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
                <div className="bg-white border-slate-200 shadow-sm border rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-slate-900 text-lg font-black">Meghala Committee Details</h3>
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
                      { icon: User, label: 'Primary Coordinator', val: p1Name },
                      { icon: Phone, label: 'Primary Contact', val: selectedVolunteer.mobile || '—' },
                      { icon: User, label: 'Secondary Coordinator', val: p2Name },
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

      {/* Add/Edit Meghala Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-white border-slate-200 shadow-sm rounded-2xl shadow-xl overflow-hidden border">
                <div className="bg-red-600 p-6 relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border-slate-200 shadow-sm/20 rounded-xl flex items-center justify-center text-white">
                        {showAddModal ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-black tracking-tight">{showAddModal ? 'Add New Meghala Committee' : 'Edit Meghala Details'}</h3>
                        <p className="text-red-100 text-[10px] font-medium">{showAddModal ? 'Automatically generates password & dispatches login credentials' : 'Update Meghala information in system'}</p>
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
                        email: form.email,
                        blockCommitteeName: user?.organization_name || user?.city || user?.block || '',
                        district: user?.district || 'Kasaragod'
                      });
                      if (res.success) {
                        setShowAddModal(false);
                        setForm(emptyVolunteerForm);
                        setFormError('');
                        setCredentialsModal({ open: true, email: form.email, password: res.generatedPassword, emailSent: res.emailSent });
                        fetchUsers();
                      } else {
                        setFormError(res.error || 'Failed to add Meghala. Please try again.');
                      }
                    } else {
                      const res = await updateVolunteer(selectedVolunteer._id || selectedVolunteer.id, {
                        meghalaName: form.meghalaName,
                        person1Name: form.person1Name,
                        person1Contact: form.person1Contact,
                        person2Name: form.person2Name,
                        person2Contact: form.person2Contact,
                        whatsapp: form.whatsapp,
                        email: form.email,
                        blockCommitteeName: selectedVolunteer.blockCommitteeName || selectedVolunteer.organization_name || user?.organization_name || user?.city || '',
                        district: selectedVolunteer.district || user?.district || 'Kasaragod'
                      });
                      if (res.success) {
                        triggerToast('Meghala details updated!', 'success');
                        setShowEditModal(false);
                        fetchUsers();
                      } else {
                        setFormError(res.error || 'Failed to update Meghala. Please try again.');
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
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PRIMARY COORDINATOR (PERSON 1) *</label>
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
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SECONDARY COORDINATOR (PERSON 2) *</label>
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
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">COORDINATOR EMAIL *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="coordinator@idonate.org"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-xs" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-3 mt-4 border-t border-slate-100">
                      <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                        className="flex-1 py-3 bg-white border-slate-200 shadow-sm border text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer">
                        Cancel
                      </button>
                      <button type="submit" disabled={loading}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                        {showAddModal ? 'Create Meghala Committee' : 'Save Changes'}
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
        title={confirmModal.action === 'delete' ? 'Delete Meghala' : confirmModal.action === 'block' ? 'Block Meghala Account' : confirmModal.action === 'activate' ? 'Activate Meghala' : 'Deactivate Meghala'}
        message={confirmModal.action === 'delete' ? `Are you sure you want to permanently delete Meghala "${confirmModal.item?.meghala || confirmModal.item?.city || confirmModal.item?.primaryName}"? This action cannot be undone.` : `Are you sure you want to ${confirmModal.action} Meghala "${confirmModal.item?.meghala || confirmModal.item?.city || confirmModal.item?.primaryName}"?`}
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
                  {credentialsModal.emailSent ? 'Meghala Added Successfully' : 'Meghala Login Credentials'}
                </h3>
                {credentialsModal.emailSent ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Credentials sent to Meghala email
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">The Meghala coordinator will receive login details via email.</p>
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
