import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Plus, Search, RefreshCw, Edit3, Trash2, X, Mail, Phone,
  CheckCircle2, Download, ShieldCheck, ChevronRight, ChevronDown,
  MapPin, LayoutList, GitBranch, Users, Droplets, UserCheck
} from 'lucide-react';
import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useAppStore } from '../../store/appStore.js';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';

function parseBlockAdminContacts(ba) {
  let admin1Name = ba.primaryContactName || ba.primary_contact_name || ba.primaryName || ba.primary_name || ba.name || '';
  let admin2Name = ba.secondaryName || ba.secondary_name || '';

  let admin1Mobile = ba.mobile || '';
  let admin2Mobile = ba.secondaryContactNumber || ba.secondary_contact_number || '';
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
  const { allUsers, donors } = useAppStore();
  const [blockAdmins, setBlockAdmins] = useState([]);
  const [blockSummary, setBlockSummary] = useState([]);
  const [district, setDistrict] = useState(user?.district || 'Kasaragod');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'tree'
  const [meghalasByBlock, setMeghalasByBlock] = useState({});
  const [expandedBlocks, setExpandedBlocks] = useState({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [deletingAdminName, setDeletingAdminName] = useState('');
  const [credentialsModal, setCredentialsModal] = useState({ open: false, email: '', password: '', blockName: '' });

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
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resDist, resAdmins, resOptions] = await Promise.all([
        api.get('/super-admin/metrics'),
        api.get('/super-admin/block-admins'),
        api.get('/public/volunteer-options').catch(() => null)
      ]);

      if (resDist.data?.success) {
        const dData = resDist.data.data || resDist.data;
        if (dData.district) setDistrict(dData.district);
        // Capture block_summary for donor/volunteer counts
        const bs = dData.block_summary || dData.blockSummary || [];
        setBlockSummary(Array.isArray(bs) ? bs : []);
      }
      if (resAdmins.data?.success) {
        setBlockAdmins(resAdmins.data.data || []);
      }
      if (resOptions?.data?.success && resOptions.data?.data) {
        const rawData = resOptions.data.data;
        const mbMap = rawData.meghalasByBlock || rawData.meghalas_by_block || {};
        setMeghalasByBlock(mbMap);
      }
    } catch (err) {
      console.error("Block Committee Load error:", err);
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

  const handleOpenEdit = (ba) => {
    setEditingAdmin(ba);
    setEditBlockName(ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.block || ba.blockName || ba.city || '');
    setEditEmail(ba.email || '');
    setEditPassword('');
    setEditStatus(ba.status || 'Active');

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

  const filteredBlockAdmins = blockAdmins.filter(ba => {
    const q = searchQuery.toLowerCase();
    const matchQuery = (
      (ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.city || '').toLowerCase().includes(q) ||
      (ba.primary_name || ba.name || '').toLowerCase().includes(q) ||
      (ba.email || '').toLowerCase().includes(q) ||
      (ba.mobile || '').toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === 'all' || ba.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // ── Donor / Volunteer count maps ──────────────────────────────────────────
  // blockDonorMap  : { blockNameLower -> { donors, volunteers } }
  // meghalaDonorMap: { meghalaNameLower -> { donors, volunteers } }
  const { blockDonorMap, meghalaDonorMap } = useMemo(() => {
    const bMap = new Map();  // key: block name lowercase
    const mMap = new Map();  // key: meghala name lowercase

    // Seed block map from block_summary (server counts)
    blockSummary.forEach(bs => {
      const bName = (bs.block || bs.city || bs.name || '').trim();
      if (!bName) return;
      const key = bName.toLowerCase();
      bMap.set(key, {
        donors: Number(bs.users || bs.donors || 0),
        volunteers: Number(bs.volunteers || 0)
      });
    });

    // Also seed block map from registered block admins (so all blocks appear)
    blockAdmins.forEach(ba => {
      const bName = (ba.blockCommitteeName || ba.city || ba.block || ba.primary_name || '').trim();
      if (!bName || bName.toLowerCase() === 'n/a') return;
      const key = bName.toLowerCase();
      if (!bMap.has(key)) bMap.set(key, { donors: 0, volunteers: 0 });
    });

    // Build flat meghala list from meghalasByBlock
    const allMeghalaNames = [];
    Object.values(meghalasByBlock).forEach(list => {
      if (Array.isArray(list)) list.forEach(m => allMeghalaNames.push(String(m).toLowerCase().trim()));
    });
    allMeghalaNames.forEach(m => { if (!mMap.has(m)) mMap.set(m, { donors: 0, volunteers: 0 }); });

    // User pool: prefer allUsers, fallback donors
    const pool = (allUsers && allUsers.length > 0) ? allUsers : (donors || []);
    const bKeys = Array.from(bMap.keys());
    const mKeys = Array.from(mMap.keys());

    pool.forEach(u => {
      const role = String(u.role || '').toLowerCase();
      const isVolunteer = ['volunteer', 'unit_squad', 'meghala_volunteer'].includes(role);
      const isDonor = ['user', 'donor', 'receiver'].includes(role) ||
        ((u.blood_group || u.bloodGroup || '') !== '' &&
         (u.blood_group || u.bloodGroup || '') !== 'N/A');

      const uBlock = String(u.organization_name || u.organizationName || u.block || u.blockCommitteeName || '').toLowerCase().trim();
      const uMeghala = String(u.city || u.meghala || '').toLowerCase().trim();

      // ── Assign to block ──
      let bKey = bKeys.find(k => uBlock && (uBlock === k || uBlock.includes(k) || k.includes(uBlock)));
      if (!bKey && uMeghala) {
        // Try to infer block from meghala membership in meghalasByBlock
        for (const [blk, mList] of Object.entries(meghalasByBlock)) {
          if (Array.isArray(mList) && mList.some(m => String(m).toLowerCase().trim() === uMeghala)) {
            bKey = bKeys.find(k => blk.toLowerCase().trim() === k || k.includes(blk.toLowerCase().trim()) || blk.toLowerCase().trim().includes(k));
            if (bKey) break;
          }
        }
      }
      if (!bKey && uMeghala) bKey = bKeys.find(k => uMeghala === k || uMeghala.includes(k) || k.includes(uMeghala));
      if (!bKey && bKeys.length > 0) bKey = bKeys.find(k => k.includes('kasaragod') || k.includes('kasargod')) || bKeys[0];

      if (bKey && bMap.has(bKey)) {
        const item = bMap.get(bKey);
        // Only increment if server counts are absent (avoid double-counting)
        const serverTotal = Array.from(bMap.values()).reduce((s, v) => s + v.donors, 0);
        if (serverTotal === 0) {
          if (isDonor) item.donors += 1;
          if (isVolunteer) item.volunteers += 1;
        }
      }

      // ── Assign to meghala ──
      const mKey = mKeys.find(k => uMeghala && (uMeghala === k || uMeghala.includes(k) || k.includes(uMeghala)));
      if (mKey && mMap.has(mKey)) {
        const item = mMap.get(mKey);
        if (isDonor) item.donors += 1;
        if (isVolunteer) item.volunteers += 1;
      }
    });

    return { blockDonorMap: bMap, meghalaDonorMap: mMap };
  }, [blockSummary, blockAdmins, meghalasByBlock, allUsers, donors]);

  // Helper: get block donor stats by block name
  const getBlockStats = (blockLabel) => {
    const key = blockLabel.toLowerCase().trim();
    return blockDonorMap.get(key) || { donors: 0, volunteers: 0 };
  };

  // Helper: get meghala donor stats by meghala name
  const getMeghalaStats = (meghalaName) => {
    const key = String(meghalaName).toLowerCase().trim();
    return meghalaDonorMap.get(key) || { donors: 0, volunteers: 0 };
  };


  const exportCSV = () => {
    const headers = ['Block Name', 'Admin Name', 'Email', 'Primary Contact', 'Secondary Contact', 'Status'];
    const rows = filteredBlockAdmins.map(ba => [
      ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.city || '',
      ba.primary_name || ba.name || '',
      ba.email || '',
      ba.mobile || '',
      ba.secondaryContactNumber || ba.secondary_contact_number || ba.secondary_contact || '',
      ba.status || 'Active'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `block_committees_${district.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const activeCount = blockAdmins.filter(ba => ba.status === 'Active').length;
  const suspendedCount = blockAdmins.filter(ba => ba.status === 'Suspended').length;

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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('tree')}
              title="Tree View — shows Meghala units under each Block"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Tree
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-bold shadow-md shadow-red-200 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Block Committee
          </button>
          <button
            onClick={exportCSV}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" /> Export CSV
          </button>
          <button
            onClick={loadData}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 p-5 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Block Committees</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{blockAdmins.length}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 p-5 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Active Committees</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">{activeCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 p-5 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Suspended Committees</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1">{suspendedCount}</h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 rounded-3xl p-6 space-y-6">

        {/* Filters & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/60 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              All ({blockAdmins.length})
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
              onClick={() => setStatusFilter('Suspended')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'Suspended'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              Suspended ({suspendedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by block, admin, mobile..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 pr-9"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* ─── TABLE VIEW ─── */}
        {viewMode === 'table' && (
          filteredBlockAdmins.length === 0 ? (
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400 shadow-sm text-xs">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
              No Block Committees found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Block Committee</th>
                    <th className="py-3.5 px-4">Primary Contact (Admin 1)</th>
                    <th className="py-3.5 px-4">Secondary Contact (Admin 2)</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4 text-center">Donors</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                  {filteredBlockAdmins.map((ba) => {
                    const { admin1Name, admin1Mobile, admin2Name, admin2Mobile } = parseBlockAdminContacts(ba);

                    return (
                      <tr key={ba.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100 dark:border-red-900/40">
                              <Building2 className="w-4 h-4" />
                            </span>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.city || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-zinc-100">{admin1Name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{admin1Mobile}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {admin2Name || admin2Mobile ? (
                            <>
                              <div className="font-bold text-slate-900 dark:text-zinc-100">{admin2Name || 'Admin 2'}</div>
                              {admin2Mobile && (
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{admin2Mobile}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 italic">Not set</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-mono text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ba.email}</span>
                          </div>
                        </td>

                        {/* Donors column in table view */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {(() => {
                            const bLabel = ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.city || '';
                            const stats = getBlockStats(bLabel);
                            return (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs">
                                  <Droplets className="w-3 h-3" />{stats.donors}
                                </span>
                                {stats.volunteers > 0 && (
                                  <span className="flex items-center gap-1 text-violet-500 dark:text-violet-400 font-semibold text-[10px]">
                                    <UserCheck className="w-2.5 h-2.5" />{stats.volunteers} vol.
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${ba.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ba.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {ba.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(ba)}
                              className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                              title="Edit Block Committee"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingAdminId(ba.id);
                                setDeletingAdminName(ba.primary_name || ba.name);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                              title="Delete Block Committee"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ─── TREE VIEW ─── */}
        {viewMode === 'tree' && (
          <div className="space-y-3">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-red-500" /> Block Committee</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-violet-500" /> Meghala Unit</span>
            </div>

            {filteredBlockAdmins.length === 0 ? (
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400 shadow-sm text-xs">
                <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                No Block Committees found matching your search.
              </div>
            ) : (
              filteredBlockAdmins.map((ba) => {
                const blockLabel = ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.city || 'N/A';
                const { admin1Name, admin1Mobile } = parseBlockAdminContacts(ba);
                const isExpanded = !!expandedBlocks[ba.id];

                // Match meghala list: try exact then case-insensitive
                const meghalaList = (() => {
                  if (meghalasByBlock[blockLabel]) return meghalasByBlock[blockLabel];
                  const key = Object.keys(meghalasByBlock).find(
                    k => k.toLowerCase().trim() === blockLabel.toLowerCase().trim()
                  );
                  return key ? meghalasByBlock[key] : [];
                })();

                return (
                  <div
                    key={ba.id}
                    className="border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs"
                  >
                    {/* Block Row */}
                    <button
                      onClick={() =>
                        setExpandedBlocks(prev => ({ ...prev, [ba.id]: !prev[ba.id] }))
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
                          <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{blockLabel}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ba.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${ba.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {ba.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{admin1Name} · {admin1Mobile}
                          </span>
                          {/* Block-level donor count */}
                          {(() => {
                            const stats = getBlockStats(blockLabel);
                            return (
                              <>
                                <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
                                  <Droplets className="w-3 h-3" />{stats.donors} Donors
                                </span>
                                {stats.volunteers > 0 && (
                                  <span className="flex items-center gap-1 text-violet-500 dark:text-violet-400 font-bold">
                                    <UserCheck className="w-3 h-3" />{stats.volunteers} Volunteers
                                  </span>
                                )}
                              </>
                            );
                          })()}
                          {meghalaList.length > 0 && (
                            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                              <Users className="w-3 h-3" />{meghalaList.length} Meghala{meghalaList.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(ba); }}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingAdminId(ba.id); setDeletingAdminName(ba.primary_name || ba.name); }}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
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
                            {meghalaList.map((meghala, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-3 px-12 py-2 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-colors group/meghala"
                              >
                                {/* Tree connector lines */}
                                <span className="flex flex-col items-center self-stretch w-4 shrink-0">
                                  <span className="w-px flex-1 bg-slate-200 dark:bg-zinc-700" />
                                  {idx === meghalaList.length - 1 && <span className="w-4 h-px bg-slate-200 dark:bg-zinc-700" />}
                                </span>
                                <span className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-500 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-900/40">
                                  <MapPin className="w-3 h-3" />
                                </span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{meghala}</span>
                                {/* Meghala donor stats */}
                                {(() => {
                                  const mStats = getMeghalaStats(meghala);
                                  return (
                                    <div className="ml-auto flex items-center gap-2">
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 rounded-full">
                                        <Droplets className="w-2.5 h-2.5" />{mStats.donors} Donors
                                      </span>
                                      {mStats.volunteers > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/30 px-2 py-0.5 rounded-full">
                                          <UserCheck className="w-2.5 h-2.5" />{mStats.volunteers} Vol.
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </li>
                            ))}
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
