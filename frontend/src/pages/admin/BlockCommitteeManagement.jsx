import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Plus, Search, RefreshCw, Edit3, Trash2, X, Mail, Phone,
  CheckCircle2, Download, ChevronRight, Power, AlertTriangle, AlertCircle,
  MapPin, LayoutList, GitBranch, Users, Droplets
} from 'lucide-react';
import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';

function parseBlockAdminContacts(ba) {
  if (!ba) {
    return {
      admin1Name: 'Admin Not Assigned',
      admin1Mobile: '—',
      admin2Name: '',
      admin2Mobile: '',
    };
  }

  let admin1Name = ba.primaryContactName || ba.primary_contact_name || ba.primaryName || ba.primary_name || ba.name || '';
  let admin2Name = ba.secondaryName || ba.secondary_name || '';

  let admin1Mobile = ba.mobile || ba.primaryContactMobile || ba.primary_contact_mobile || '';
  let admin2Mobile = ba.secondaryContactNumber || ba.secondary_contact_number || ba.secondary_phone || '';
  if (admin2Mobile) {
    const numMatch = admin2Mobile.match(/[\d+\-\s]{10,}/);
    if (numMatch) {
      admin2Mobile = numMatch[0].trim();
    } else {
      admin2Mobile = admin2Mobile.replace(/Admin 2:\s*/g, '').replace(/[()]/g, '').trim();
    }
  }

  return {
    admin1Name: admin1Name || 'N/A',
    admin1Mobile: admin1Mobile || 'N/A',
    admin2Name,
    admin2Mobile,
  };
}

export default function BlockCommitteeManagement() {
  const { user } = useAuthStore();
  const [blocks, setBlocks] = useState([]);
  const [totals, setTotals] = useState({
    blocks: 0,
    donors: 0,
    volunteers: 0,
    meghalas: 0,
    active: 0,
    unassigned: 0,
    suspended: 0,
    unassigned_donors: 0,
    unassigned_volunteers: 0
  });
  const [district, setDistrict] = useState(user?.district || 'Kasaragod');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'tree'
  const [expandedBlocks, setExpandedBlocks] = useState({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [deletingAdminName, setDeletingAdminName] = useState('');
  const [credentialsModal, setCredentialsModal] = useState({ open: false, email: '', password: '', blockName: '' });

  // Deactivation and Reactivation Modals
  const [deactivationModal, setDeactivationModal] = useState({
    open: false,
    block: null,
    reason: '',
    submitting: false,
    error: null
  });

  const [reactivationModal, setReactivationModal] = useState({
    open: false,
    block: null,
    submitting: false,
    error: null
  });

  // Add Form State
  const [blockName, setBlockName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactMobile, setPrimaryContactMobile] = useState('');
  const [secondaryContactName, setSecondaryContactName] = useState('');
  const [secondaryContactMobile, setSecondaryContactMobile] = useState('');
  const [email, setEmail] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addMsg, setAddMsg] = useState(null);

  // Edit Form State
  const [editBlockName, setEditBlockName] = useState('');
  const [editFullName1, setEditFullName1] = useState('');
  const [editMobile1, setEditMobile1] = useState('');
  const [editFullName2, setEditFullName2] = useState('');
  const [editMobile2, setEditMobile2] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editDeactivationReason, setEditDeactivationReason] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/super-admin/blocks');
      if (res?.data?.success) {
        const dData = res.data.data || {};
        if (dData.district) setDistrict(dData.district);
        const bList = Array.isArray(dData.blocks) ? dData.blocks : [];
        setBlocks(bList);

        if (dData.totals) {
          setTotals(dData.totals);
        } else {
          setTotals({
            blocks: bList.length,
            donors: bList.reduce((acc, b) => acc + (b.donorCount ?? b.donors ?? 0), 0),
            volunteers: bList.reduce((acc, b) => acc + (b.volunteerCount ?? b.volunteers ?? 0), 0),
            meghalas: bList.reduce((acc, b) => acc + (b.meghalaCount ?? b.meghalas?.length ?? 0), 0),
            active: bList.filter(b => b.isAssigned && b.status === 'Active').length,
            unassigned: bList.filter(b => !b.isAssigned).length,
            suspended: bList.filter(b => b.isAssigned && b.status === 'Suspended').length,
            unassigned_donors: 0,
            unassigned_volunteers: 0
          });
        }
      } else {
        setError(res?.data?.message || 'Failed to fetch block data from database.');
      }
    } catch (err) {
      console.error("Block Committee Load error:", err);
      setError(err.response?.data?.message || 'Failed to load block data from database. Please check server connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadData();
    })();
    return () => { active = false; };
  }, [loadData]);

  const handleCreateBlockAdmin = async (e) => {
    e.preventDefault();
    setSubmittingAdd(true);
    setAddMsg(null);
    try {
      const res = await api.post('/super-admin/block-admins', {
        blockCommitteeName: blockName,
        block_admin_1_name: primaryContactName,
        block_admin_1_mobile: primaryContactMobile,
        secondaryName: secondaryContactName,
        secondaryContactNumber: secondaryContactMobile,
        primary_name: primaryContactName,
        mobile: primaryContactMobile,
        whatsapp_number: primaryContactMobile,
        email,
        district,
        city: blockName,
      });

      if (res.data?.success) {
        const genPassword = res.data.data?.generated_password || 'Auto-generated';
        setCredentialsModal({
          open: true,
          email,
          password: genPassword,
          blockName
        });
        setBlockName('');
        setPrimaryContactName('');
        setPrimaryContactMobile('');
        setSecondaryContactName('');
        setSecondaryContactMobile('');
        setEmail('');
        setShowAddModal(false);
        loadData();
      } else {
        setAddMsg({ type: 'error', msg: res.data?.message || 'Creation failed' });
      }
    } catch (err) {
      setAddMsg({ type: 'error', msg: err.response?.data?.message || 'Network error while creating Block Committee.' });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenDeactivateBlock = (block) => {
    const adminObj = block.rawAdmin || block;
    setDeactivationModal({
      open: true,
      block,
      admin: adminObj,
      reason: '',
      submitting: false,
      error: null
    });
  };

  const handleConfirmDeactivateBlock = async (e) => {
    e?.preventDefault();
    if (!deactivationModal.block) return;
    const adminId = deactivationModal.admin?.id || deactivationModal.block?.id;
    if (!adminId) return;

    if (!deactivationModal.reason.trim()) {
      setDeactivationModal(prev => ({ ...prev, error: 'Please specify the reason for deactivating this Block Committee.' }));
      return;
    }

    setDeactivationModal(prev => ({ ...prev, submitting: true, error: null }));
    try {
      const res = await api.put(`/super-admin/block-admins/${adminId}`, {
        status: 'Suspended',
        deactivation_reason: deactivationModal.reason.trim()
      });
      if (res.data?.success) {
        setDeactivationModal({ open: false, block: null, admin: null, reason: '', submitting: false, error: null });
        loadData();
      } else {
        setDeactivationModal(prev => ({ ...prev, submitting: false, error: res.data?.message || 'Failed to deactivate' }));
      }
    } catch (err) {
      setDeactivationModal(prev => ({ ...prev, submitting: false, error: err.response?.data?.message || err.message || 'Error deactivating block committee' }));
    }
  };

  const handleOpenReactivateBlock = (block) => {
    const adminObj = block.rawAdmin || block;
    setReactivationModal({
      open: true,
      block,
      admin: adminObj,
      submitting: false,
      error: null
    });
  };

  const handleConfirmReactivateBlock = async () => {
    if (!reactivationModal.block) return;
    const adminId = reactivationModal.admin?.id || reactivationModal.block?.id;
    if (!adminId) return;

    setReactivationModal(prev => ({ ...prev, submitting: true, error: null }));
    try {
      const res = await api.put(`/super-admin/block-admins/${adminId}`, {
        status: 'Active',
        deactivation_reason: null
      });
      if (res.data?.success) {
        setReactivationModal({ open: false, block: null, admin: null, submitting: false, error: null });
        loadData();
      } else {
        setReactivationModal(prev => ({ ...prev, submitting: false, error: res.data?.message || 'Failed to activate' }));
      }
    } catch (err) {
      setReactivationModal(prev => ({ ...prev, submitting: false, error: err.response?.data?.message || err.message || 'Error activating block committee' }));
    }
  };

  const handleOpenEdit = (ba) => {
    if (!ba) return;
    setEditingAdmin(ba);
    setEditBlockName(ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.block || ba.city || '');
    setEditEmail(ba.email || '');
    setEditPassword('');
    setEditStatus(ba.status || 'Active');
    setEditDeactivationReason(ba.deactivation_reason || '');

    const parsed = parseBlockAdminContacts(ba);
    setEditFullName1(parsed.admin1Name === 'N/A' ? '' : parsed.admin1Name);
    setEditMobile1(parsed.admin1Mobile === 'N/A' ? '' : parsed.admin1Mobile);
    setEditFullName2(parsed.admin2Name);
    setEditMobile2(parsed.admin2Mobile);
    setEditMsg(null);
  };

  const handleSaveEditBlockAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setSubmittingEdit(true);
    setEditMsg(null);
    try {
      const res = await api.put(`/super-admin/block-admins/${editingAdmin.id}`, {
        blockCommitteeName: editBlockName,
        block_admin_1_name: editFullName1,
        block_admin_1_mobile: editMobile1,
        secondaryName: editFullName2,
        secondaryContactNumber: editMobile2,
        primary_name: editFullName1,
        email: editEmail,
        password: editPassword || undefined,
        mobile: editMobile1,
        status: editStatus,
        deactivation_reason: editStatus === 'Active' ? null : editDeactivationReason,
        district,
        city: editBlockName,
      });

      if (res.data?.success) {
        setEditingAdmin(null);
        loadData();
      } else {
        setEditMsg({ type: 'error', msg: res.data?.message || 'Update failed' });
      }
    } catch (err) {
      setEditMsg({ type: 'error', msg: err.response?.data?.message || 'Failed to update Block Committee Admin.' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAdminId) return;
    try {
      const res = await api.delete(`/super-admin/block-admins/${deletingAdminId}`);
      if (res.data?.success) loadData();
    } catch (err) {
      console.error('Failed to delete block admin', err);
    } finally {
      setDeletingAdminId(null);
    }
  };

  const filteredCommittees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return blocks.filter(c => {
      const bName = String(c.blockName || c.blockCommitteeName || c.block || '');
      const admin1Name = String(c.admin1Name || c.primary_contact_name || c.primaryName || '');
      const admin1Mobile = String(c.admin1Mobile || c.mobile || '');
      const emailStr = String(c.email || '');
      const meghalaList = c.meghalas || [];

      const matchQuery = !q || (
        bName.toLowerCase().includes(q) ||
        admin1Name.toLowerCase().includes(q) ||
        admin1Mobile.includes(q) ||
        emailStr.toLowerCase().includes(q) ||
        meghalaList.some(m => String(m).toLowerCase().includes(q))
      );
      const isAssigned = c.isAssigned !== undefined ? c.isAssigned : (c.status !== 'Unassigned' && c.admin1Name !== 'Admin Not Assigned');
      const matchStatus = statusFilter === 'all' || (
        statusFilter === 'Unassigned' ? !isAssigned : c.status === statusFilter
      );
      return matchQuery && matchStatus;
    });
  }, [blocks, searchQuery, statusFilter]);

  const totalBlocks = totals.blocks || blocks.length;
  const totalBlockDonors = totals.donors || 0;
  const totalBlockVolunteers = totals.volunteers || 0;
  const activeCount = totals.active || 0;
  const unassignedCount = totals.unassigned || 0;
  const suspendedCount = totals.suspended || 0;

  const exportCSV = () => {
    const headers = ['Block Name', 'Meghalas Count', 'Admin Name', 'Email', 'Primary Contact', 'Secondary Contact', 'Donors', 'Volunteers', 'Status'];
    const rows = filteredCommittees.map(c => {
      const parsed = parseBlockAdminContacts(c.rawAdmin || c);
      return [
        c.blockName || c.name || 'N/A',
        c.meghalaCount ?? c.meghalas?.length ?? 0,
        c.admin1Name || parsed.admin1Name,
        c.email || '—',
        c.admin1Mobile || parsed.admin1Mobile,
        c.admin2Mobile || parsed.admin2Mobile,
        c.donorCount ?? c.donors ?? 0,
        c.volunteerCount ?? c.volunteers ?? 0,
        c.status || 'Active'
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(col => `"${String(col || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `block_committees_${district.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const rawDistrict = district || user?.district || 'Kasaragod';
  const cleanDistrict = rawDistrict.replace(/^dyfi\s*/i, '').trim();
  const displayDistrict = `DYFI ${cleanDistrict}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-full text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4 text-red-600" /> {displayDistrict} Block Committees
          </div>
          <h1 className="text-2xl font-black text-red-600 uppercase tracking-tight">Block Committee Management</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Register, configure, and oversee Block Committees across {displayDistrict} District</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('tree')}
              title="Tree View — shows Meghala units under each Block"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'tree'
                  ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Tree
            </button>
          </div>

          <button
            onClick={() => { setBlockName(''); setShowAddModal(true); }}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-bold shadow-md shadow-red-200 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> <span className="truncate">Add Block Committee</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" /> <span className="truncate">Export CSV</span>
          </button>
          <button
            onClick={loadData}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Error state banner with Retry button */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-3xl p-4 sm:p-6 text-center space-y-3">
          <p className="text-red-700 dark:text-red-400 text-sm font-bold">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-3.5 sm:p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Block Committees</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{totalBlocks}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{activeCount} Assigned</p>
        </div>

        {/* Dynamic Total Meghala Committees */}
        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-3.5 sm:p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Meghala Committees</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{totalBlockVolunteers}</h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 truncate">Across {totalBlocks} Blocks</p>
        </div>

        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-3.5 sm:p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Block Donors</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalBlockDonors}</h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Database registered</p>
        </div>

        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-3.5 sm:p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">Admin Status</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">{activeCount} Active</h3>
          <p className="text-[10px] text-amber-500 mt-0.5">{unassignedCount} Unassigned</p>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* Filters & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 dark:border-zinc-800/60 pb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              All ({totalBlocks})
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'Active'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('Unassigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'Unassigned'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              Unassigned ({unassignedCount})
            </button>
            {suspendedCount > 0 && (
              <button
                onClick={() => setStatusFilter('Suspended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'Suspended'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                  }`}
              >
                Suspended ({suspendedCount})
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by block, meghala, admin..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 pr-9"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* ─── TABLE VIEW ─── */}
        {viewMode === 'table' && (
          filteredCommittees.length === 0 ? (
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400 shadow-sm text-xs">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
              No Block Committees found
            </div>
          ) : (
            <>
              {/* Mobile Cards View (< md) */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs">
                {filteredCommittees.map((c) => {
                  const parsed = parseBlockAdminContacts(c.rawAdmin || c);
                  const bName = c.blockName || c.blockCommitteeName || c.name || 'N/A';
                  const isAssigned = c.isAssigned !== undefined ? c.isAssigned : (c.status !== 'Unassigned' && parsed.admin1Name !== 'Admin Not Assigned');
                  const meghalaList = c.meghalas || [];
                  const meghalaCount = c.meghalaCount ?? c.meghala_count ?? meghalaList.length;
                  const donorCount = c.donorCount ?? c.donors_count ?? c.donors ?? 0;
                  const volunteerCount = c.volunteerCount ?? c.volunteers_count ?? c.volunteers ?? 0;

                  return (
                    <div key={c.id} className="p-3.5 space-y-3 bg-white dark:bg-zinc-900">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100 dark:border-red-900/40">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 truncate">{bName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-normal truncate">{cleanDistrict} District</span>
                              <span className="text-slate-300 dark:text-zinc-700">•</span>
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                <MapPin className="w-2.5 h-2.5" /> {meghalaCount} Meghalas
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${c.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                          : c.status === 'Suspended' || c.status === 'Inactive'
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-500' : (c.status === 'Suspended' || c.status === 'Inactive') ? 'bg-red-500' : 'bg-amber-500'}`} />
                          {c.status || 'Active'}
                        </span>
                      </div>

                      {/* Stats Pill */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 text-xs">
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{donorCount} Donors</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Users className="w-3.5 h-3.5" />
                          <span>{volunteerCount} Volunteers</span>
                        </div>
                      </div>

                      {/* Admin Contact row */}
                      <div className="flex items-center justify-between gap-2 text-xs bg-slate-50/60 dark:bg-zinc-950/60 p-2 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Coordinator</span>
                          <span className={`font-semibold truncate block ${isAssigned ? 'text-slate-800 dark:text-zinc-200' : 'text-slate-400 italic'}`}>
                            {parsed.admin1Name}
                          </span>
                        </div>
                        {parsed.admin1Mobile !== '—' && parsed.admin1Mobile !== 'N/A' && (
                          <a
                            href={`tel:${parsed.admin1Mobile}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-emerald-600 text-[11px] font-bold rounded-lg shadow-2xs shrink-0"
                          >
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {isAssigned && (c.rawAdmin || c.id) ? (
                          <>
                            {c.status === 'Active' ? (
                              <button
                                onClick={() => handleOpenDeactivateBlock(c)}
                                className="flex-1 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Power className="w-3 h-3" /> Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenReactivateBlock(c)}
                                className="flex-1 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(c.rawAdmin || c)}
                              className="flex-1 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => {
                                const targetId = c.rawAdmin?.id || c.id;
                                const targetName = c.rawAdmin?.primary_name || c.rawAdmin?.name || c.admin1Name || bName;
                                setDeletingAdminId(targetId);
                                setDeletingAdminName(targetName);
                              }}
                              className="p-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center justify-center cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setBlockName(bName);
                              setShowAddModal(true);
                            }}
                            className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Assign Admin
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Block Committee</th>
                      <th className="py-3.5 px-4">Meghala Units</th>
                      <th className="py-3.5 px-4">Primary Contact (Admin 1)</th>
                      <th className="py-3.5 px-4">Secondary Contact (Admin 2)</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4 text-center">Donors</th>
                      <th className="py-3.5 px-4 text-center">Volunteers</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                    {filteredCommittees.map((c) => {
                      const parsed = parseBlockAdminContacts(c.rawAdmin || c);
                      const bName = c.blockName || c.blockCommitteeName || c.name || 'N/A';
                      const isAssigned = c.isAssigned !== undefined ? c.isAssigned : (c.status !== 'Unassigned' && parsed.admin1Name !== 'Admin Not Assigned');
                      const meghalaList = c.meghalas || [];
                      const meghalaCount = c.meghalaCount ?? c.meghala_count ?? meghalaList.length;
                      const donorCount = c.donorCount ?? c.donors_count ?? c.donors ?? 0;
                      const volunteerCount = c.volunteerCount ?? c.volunteers_count ?? c.volunteers ?? 0;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100 dark:border-red-900/40">
                                <Building2 className="w-4 h-4" />
                              </span>
                              <div>
                                <div className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{bName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{cleanDistrict} District</div>
                              </div>
                            </div>
                          </td>

                          {/* Meghalas Column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900/40">
                                <MapPin className="w-3 h-3 text-violet-500" />
                                {meghalaCount} Meghala{meghalaCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {meghalaList.length > 0 && (
                              <div className="text-[10px] text-slate-400 max-w-[180px] truncate mt-0.5" title={meghalaList.join(', ')}>
                                {meghalaList.slice(0, 3).join(', ')}{meghalaList.length > 3 ? ` +${meghalaList.length - 3}` : ''}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className={`font-bold ${isAssigned ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 italic'}`}>{parsed.admin1Name}</div>
                            {parsed.admin1Mobile !== '—' && parsed.admin1Mobile !== 'N/A' && (
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{parsed.admin1Mobile}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {parsed.admin2Name || parsed.admin2Mobile ? (
                              <>
                                <div className="font-bold text-slate-900 dark:text-zinc-100">{parsed.admin2Name || 'Admin 2'}</div>
                                {parsed.admin2Mobile && (
                                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{parsed.admin2Mobile}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-600 italic">Not set</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {c.email && c.email !== '—' ? (
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-mono text-xs">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{c.email}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-600 italic">—</span>
                            )}
                          </td>

                          {/* Donors column */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 px-2.5 py-1 rounded-full">
                              <Droplets className="w-3 h-3" />{donorCount} Donors
                            </span>
                          </td>

                          {/* Volunteers column */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 rounded-full">
                              <Users className="w-3 h-3" />{volunteerCount} Volunteers
                            </span>
                          </td>

                          {/* Status column */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${c.status === 'Active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                : c.status === 'Suspended' || c.status === 'Inactive'
                                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
                                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-500' : (c.status === 'Suspended' || c.status === 'Inactive') ? 'bg-red-500' : 'bg-amber-500'
                                  }`} />
                                {c.status || 'Active'}
                              </span>
                              {(c.deactivation_reason || c.rawAdmin?.deactivation_reason) && (
                                <div className="text-[10px] text-red-600 dark:text-red-400 font-medium bg-red-50/80 dark:bg-red-950/30 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30 max-w-[170px] truncate" title={c.deactivation_reason || c.rawAdmin?.deactivation_reason}>
                                  Why: {c.deactivation_reason || c.rawAdmin?.deactivation_reason}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions column */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isAssigned && (c.rawAdmin || c.id) ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {c.status === 'Active' ? (
                                  <button
                                    onClick={() => handleOpenDeactivateBlock(c)}
                                    className="px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                                    title="Deactivate Block Admin (blocks login)"
                                  >
                                    <Power className="w-3.5 h-3.5" /> Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenReactivateBlock(c)}
                                    className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                                    title="Reactivate Block Admin (allows login)"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEdit(c.rawAdmin || c)}
                                  className="px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                                  title="Edit Block Committee"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    const targetId = c.rawAdmin?.id || c.id;
                                    const targetName = c.rawAdmin?.primary_name || c.rawAdmin?.name || c.admin1Name || bName;
                                    setDeletingAdminId(targetId);
                                    setDeletingAdminName(targetName);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                                  title="Delete Block Committee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setBlockName(bName);
                                  setShowAddModal(true);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition cursor-pointer flex items-center gap-1 ml-auto"
                                title="Assign Admin to this Block"
                              >
                                <Plus className="w-3.5 h-3.5" /> Assign Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )
        )}

        {/* ─── TREE VIEW ─── */}
        {viewMode === 'tree' && (
          <div className="space-y-3">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-red-500" /> Block Committee</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-violet-500" /> Meghala Unit</span>
              <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-emerald-500" /> Volunteers</span>
            </div>

            {filteredCommittees.length === 0 ? (
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400 shadow-sm text-xs">
                <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                No Block Committees found
              </div>
            ) : (
              filteredCommittees.map((c) => {
                const isExpanded = !!expandedBlocks[c.id];
                const meghalaList = c.meghalas || [];
                const parsed = parseBlockAdminContacts(c.rawAdmin || c);
                const bName = c.blockName || c.blockCommitteeName || c.name || 'N/A';
                const isAssigned = c.isAssigned !== undefined ? c.isAssigned : (c.status !== 'Unassigned' && parsed.admin1Name !== 'Admin Not Assigned');
                const donorCount = c.donorCount ?? c.donors_count ?? c.donors ?? 0;
                const volunteerCount = c.volunteerCount ?? c.volunteers_count ?? c.volunteers ?? 0;

                return (
                  <div
                    key={c.id}
                    className="border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs"
                  >
                    {/* Block Row */}
                    <button
                      onClick={() =>
                        setExpandedBlocks(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                      }
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-zinc-900 hover:bg-red-50/40 dark:hover:bg-red-950/10 transition-colors cursor-pointer text-left group"
                    >
                      {/* Expand chevron */}
                      <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        <ChevronRight className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                      </span>

                      {/* Block icon */}
                      <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/40">
                        <Building2 className="w-4 h-4" />
                      </span>

                      {/* Block name + admin info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{bName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : c.status === 'Suspended' || c.status === 'Inactive'
                                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
                                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                            }`}>
                            <span className={`w-1 h-1 rounded-full ${c.status === 'Active' ? 'bg-emerald-500' : (c.status === 'Suspended' || c.status === 'Inactive') ? 'bg-red-500' : 'bg-amber-500'
                              }`} />
                            {c.status || 'Active'}
                          </span>
                          {(c.deactivation_reason || c.rawAdmin?.deactivation_reason) && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                              Why: {c.deactivation_reason || c.rawAdmin?.deactivation_reason}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{parsed.admin1Name}{parsed.admin1Mobile !== '—' && parsed.admin1Mobile !== 'N/A' ? ` · ${parsed.admin1Mobile}` : ''}
                          </span>
                          {/* Block-level donor count */}
                          <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
                            <Droplets className="w-3 h-3" />{donorCount} Donors
                          </span>
                          {/* Block-level volunteer count */}
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Users className="w-3 h-3" />{volunteerCount} Volunteers
                          </span>
                          {meghalaList.length > 0 && (
                            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                              <MapPin className="w-3 h-3" />{meghalaList.length} Meghala{meghalaList.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAssigned && (c.rawAdmin || c.id) ? (
                          <>
                            {c.status === 'Active' ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenDeactivateBlock(c); }}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                                title="Deactivate Block"
                              >
                                <Power className="w-3 h-3" /> Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenReactivateBlock(c); }}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                                title="Reactivate Block"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Activate
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(c.rawAdmin || c); }}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetId = c.rawAdmin?.id || c.id;
                                const targetName = c.rawAdmin?.primary_name || c.rawAdmin?.name || c.admin1Name || bName;
                                setDeletingAdminId(targetId);
                                setDeletingAdminName(targetName);
                              }}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBlockName(bName);
                              setShowAddModal(true);
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Assign Admin
                          </button>
                        )}
                      </div>
                    </button>

                    {/* Meghala Children (expanded) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-950/60">
                        {meghalaList.length === 0 ? (
                          <div className="flex items-center gap-2 px-12 py-3 text-[11px] text-slate-400 dark:text-zinc-600 italic">
                            <MapPin className="w-3 h-3" /> No Meghala units registered under this block yet.
                          </div>
                        ) : (
                          <ul className="py-2">
                            {meghalaList.map((meghala, idx) => {
                              const mName = typeof meghala === 'string' ? meghala : (meghala.name || meghala.meghala || meghala.meghala_name || 'N/A');
                              const mDonorCount = typeof meghala === 'object' ? (meghala.donorCount ?? meghala.donors_count ?? meghala.donors ?? 0) : 0;
                              const mVolunteerCount = typeof meghala === 'object' ? (meghala.volunteerCount ?? meghala.volunteers_count ?? meghala.volunteers ?? 0) : 0;

                              return (
                                <li
                                  key={idx}
                                  className="flex items-center justify-between gap-3 px-12 py-2 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-colors group/meghala"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Tree connector lines */}
                                    <span className="flex flex-col items-center self-stretch w-4 shrink-0">
                                      <span className="w-px flex-1 bg-slate-200 dark:bg-zinc-700" />
                                      {idx === meghalaList.length - 1 && <span className="w-4 h-px bg-slate-200 dark:bg-zinc-700" />}
                                    </span>
                                    <span className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-500 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-900/40">
                                      <MapPin className="w-3 h-3" />
                                    </span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate">{mName}</span>
                                  </div>

                                  {/* Meghala-wise Donor & Volunteer counts */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40" title={`${mDonorCount} Donors in ${mName}`}>
                                      <Droplets className="w-3 h-3" />
                                      {mDonorCount} Donor{mDonorCount !== 1 ? 's' : ''}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40" title={`${mVolunteerCount} Volunteers in ${mName}`}>
                                      <Users className="w-3 h-3" />
                                      {mVolunteerCount} Vol{mVolunteerCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Add Block Committee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 p-6 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border-slate-200 shadow-sm/20 rounded-xl flex items-center justify-center text-white font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-black tracking-tight">Add New Block Committee</h3>
                    <p className="text-red-100 text-[10px] font-medium">Register Block Admin account for {district} District</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {addMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${addMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}>
                  {addMsg.msg}
                </div>
              )}

              <form onSubmit={handleCreateBlockAdmin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Block Committee Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                      required
                      placeholder="e.g. Kozhikode North"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                    <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Contact Name *</label>
                    <input
                      type="text"
                      value={primaryContactName}
                      onChange={(e) => setPrimaryContactName(e.target.value)}
                      required
                      placeholder="e.g. Rahul V"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={primaryContactMobile}
                        onChange={(e) => setPrimaryContactMobile(e.target.value)}
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Contact Name *</label>
                    <input
                      type="text"
                      value={secondaryContactName}
                      onChange={(e) => setSecondaryContactName(e.target.value)}
                      required
                      placeholder="e.g. Anjali M"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={secondaryContactMobile}
                        onChange={(e) => setSecondaryContactMobile(e.target.value)}
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="kozhikode.north@idonate.org"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/60 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-2xl text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submittingAdd ? 'Creating...' : 'Create Committee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Committee Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 p-6 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border-slate-200 shadow-sm/20 rounded-xl flex items-center justify-center text-white">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-black tracking-tight">Edit Block Committee Details</h3>
                    <p className="text-red-100 text-[10px] font-medium">Update Block Committee information & credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${editMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}>
                  {editMsg.msg}
                </div>
              )}

              <form onSubmit={handleSaveEditBlockAdmin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Block Committee Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editBlockName}
                      onChange={(e) => setEditBlockName(e.target.value)}
                      required
                      placeholder="e.g. Kozhikode North"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                    <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Contact Name *</label>
                    <input
                      type="text"
                      value={editFullName1}
                      onChange={(e) => setEditFullName1(e.target.value)}
                      required
                      placeholder="e.g. Rahul V"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={editMobile1}
                        onChange={(e) => setEditMobile1(e.target.value)}
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Contact Name</label>
                    <input
                      type="text"
                      value={editFullName2}
                      onChange={(e) => setEditFullName2(e.target.value)}
                      placeholder="e.g. Anjali M"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={editMobile2}
                        onChange={(e) => setEditMobile2(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                        placeholder="kozhikode.north@idonate.org"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 font-bold cursor-pointer"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Suspended">🔴 Suspended</option>
                    </select>
                  </div>
                </div>

                {editStatus !== 'Active' && (
                  <div className="p-3.5 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-1.5 animate-fade-in">
                    <label className="block text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
                      Reason for Deactivation / Status Change *
                    </label>
                    <textarea
                      value={editDeactivationReason}
                      onChange={(e) => setEditDeactivationReason(e.target.value)}
                      rows={2}
                      placeholder="e.g. Block reorganization, inactive contact person, temporary suspension..."
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800/80 rounded-xl text-slate-900 dark:text-zinc-100 text-xs font-normal focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                      This reason will be visible across admin panels and displayed to the user if they try to log in.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/60 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-2xl text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Block Confirmation Modal */}
      {deactivationModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border dark:border-zinc-800">
            <div className="bg-red-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Deactivate Block Committee</h3>
                  <p className="text-[11px] text-red-100">Disable login & operational access</p>
                </div>
              </div>
              <button
                onClick={() => setDeactivationModal({ open: false, block: null, admin: null, reason: '', submitting: false, error: null })}
                className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeactivateBlock} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80">
                <div className="text-xs text-slate-500 dark:text-zinc-400">Target Committee</div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                  {deactivationModal.block?.blockName || deactivationModal.block?.blockCommitteeName || deactivationModal.block?.name || 'Block Committee'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Primary Admin: <span className="font-semibold text-slate-700 dark:text-zinc-300">{deactivationModal.block?.admin1Name || deactivationModal.admin?.primary_name || deactivationModal.admin?.name || 'N/A'}</span>
                </div>
              </div>

              {deactivationModal.error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs font-semibold text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deactivationModal.error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  Why is this account being deactivated? *
                </label>
                <textarea
                  value={deactivationModal.reason}
                  onChange={(e) => setDeactivationModal(prev => ({ ...prev, reason: e.target.value, error: null }))}
                  required
                  rows={3}
                  placeholder="Specify clear reason (e.g. Block election pending, inactive committee, compliance issue)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  This explanation will be logged and shown to the admin when they attempt to log in.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeactivationModal({ open: false, block: null, admin: null, reason: '', submitting: false, error: null })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deactivationModal.submitting || !deactivationModal.reason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  {deactivationModal.submitting ? 'Deactivating...' : 'Confirm Deactivate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reactivate Block Confirmation Modal */}
      {reactivationModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border dark:border-zinc-800">
            <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Reactivate Block Committee</h3>
                  <p className="text-[11px] text-emerald-100">Restore full access & login permissions</p>
                </div>
              </div>
              <button
                onClick={() => setReactivationModal({ open: false, block: null, admin: null, submitting: false, error: null })}
                className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80">
                <div className="text-xs text-slate-500 dark:text-zinc-400">Target Committee</div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                  {reactivationModal.block?.blockName || reactivationModal.block?.blockCommitteeName || reactivationModal.block?.name || 'Block Committee'}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Primary Admin: <span className="font-semibold text-slate-700 dark:text-zinc-300">{reactivationModal.block?.admin1Name || reactivationModal.admin?.primary_name || reactivationModal.admin?.name || 'N/A'}</span>
                </div>
                {(reactivationModal.block?.deactivation_reason || reactivationModal.block?.rawAdmin?.deactivation_reason) && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium bg-red-50 dark:bg-red-950/40 p-2 rounded-lg">
                    Previous Deactivation Reason: {reactivationModal.block?.deactivation_reason || reactivationModal.block?.rawAdmin?.deactivation_reason}
                  </div>
                )}
              </div>

              {reactivationModal.error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs font-semibold text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{reactivationModal.error}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Are you sure you want to reactivate this Block Committee? The admin will immediately be allowed to log in and manage donors, volunteers, and Meghala units.
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReactivationModal({ open: false, block: null, admin: null, submitting: false, error: null })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReactivateBlock}
                  disabled={reactivationModal.submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  {reactivationModal.submitting ? 'Activating...' : 'Confirm Reactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Created Confirmation Modal */}
      {credentialsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-xl overflow-hidden border dark:border-zinc-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">Block Committee Created!</h3>
              <p className="text-xs text-slate-500 mt-1">Credentials generated for Block: <strong>{credentialsModal.blockName}</strong></p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl space-y-2 text-xs font-mono border border-slate-200 dark:border-zinc-800">
              <div><span className="text-slate-400">Email:</span> <strong>{credentialsModal.email}</strong></div>
              <div><span className="text-slate-400">Password:</span> <strong>{credentialsModal.password}</strong></div>
            </div>

            <button
              onClick={() => setCredentialsModal({ open: false, email: '', password: '', blockName: '' })}
              className="w-full py-3 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded-2xl text-xs cursor-pointer hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingAdminId}
        onClose={() => setDeletingAdminId(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Block Admin (${deletingAdminName})?`}
        message="Are you sure you want to delete this Block Committee Admin? They will lose access to district management."
      />

    </div>
  );
}
