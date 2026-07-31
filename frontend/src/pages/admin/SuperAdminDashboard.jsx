import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Plus, RefreshCw, Edit3, Trash2, X, Building2,
  Users, UserCheck, Activity, BarChart3, TrendingUp, Search, Phone, Mail
} from 'lucide-react';
import api from '../../store/api.js';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';

function parseBlockAdminContacts(ba) {
  let admin1Name = ba.full_name || ba.name || '';
  let admin2Name = '';
  if (admin1Name.includes(' & ')) {
    const parts = admin1Name.split(' & ');
    admin1Name = parts[0] ? parts[0].trim() : '';
    admin2Name = parts[1] ? parts[1].trim() : '';
  }

  let admin1Mobile = ba.mobile || '';
  let admin2Mobile = '';

  if (ba.secondaryContactNumber) {
    const sec = ba.secondaryContactNumber.replace(/^Admin 2:\s*/i, '').trim();
    const parenMatch = sec.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      if (!admin2Name && parenMatch[1] && parenMatch[1].trim()) {
        admin2Name = parenMatch[1].trim();
      }
      if (parenMatch[2]) {
        admin2Mobile = parenMatch[2].trim();
      }
    } else {
      const phoneDigits = sec.replace(/[^\d+]/g, '');
      if (phoneDigits.length >= 7) {
        admin2Mobile = phoneDigits;
      } else if (!admin2Name && sec) {
        admin2Name = sec;
      }
    }
  }

  return {
    admin1Name: admin1Name || 'N/A',
    admin1Mobile: admin1Mobile || 'N/A',
    admin2Name,
    admin2Mobile,
  };
}

export default function SuperAdminDashboard() {

  const [districtData, setDistrictData] = useState({
    district: 'Kozhikode',
    total_users: 0,
    total_volunteers: 0,
    total_admins: 0,
    volunteers: [],
    admins: [],
    members: [],
    block_summary: []
  });

  const [blockAdmins, setBlockAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  // Edit Block Admin Modal state
  const [editingAdmin, setEditingAdmin] = useState(null);
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

  // Delete Confirmation Modal State
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [deletingAdminName, setDeletingAdminName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [resDist, resAdmins] = await Promise.all([
        api.get('/super-admin/district-data'),
        api.get('/super-admin/block-admins')
      ]);

      if (resDist.data?.success) {
        const dData = resDist.data.data || resDist.data;
        setDistrictData({
          district: dData.district || 'Kasaragod',
          total_users: dData.total_users || 0,
          total_volunteers: dData.total_volunteers || 0,
          total_admins: dData.total_admins || 0,
          volunteers: dData.volunteers || [],
          admins: dData.admins || [],
          members: dData.members || [],
          block_summary: dData.block_summary || []
        });
      }
      if (resAdmins.data?.success) setBlockAdmins(resAdmins.data.data || []);
    } catch (err) {
      console.error("Super Admin Load error:", err);
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


  const handleOpenEdit = (ba) => {
    setEditingAdmin(ba);
    setEditBlockName(ba.blockCommitteeName || ba.block || ba.blockName || '');
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
      let secondaryContactVal = '';
      if (editFullName2 && editMobile2) {
        secondaryContactVal = `Admin 2: ${editFullName2} (${editMobile2})`;
      } else if (editFullName2) {
        secondaryContactVal = `Admin 2: ${editFullName2}`;
      } else if (editMobile2) {
        secondaryContactVal = `Admin 2: (${editMobile2})`;
      }

      const res = await api.put(`/super-admin/block-admins/${editingAdmin.id}`, {
        blockCommitteeName: editBlockName,
        block_admin_1_name: editFullName1,
        block_admin_1_mobile: editMobile1,
        block_admin_2_name: editFullName2,
        block_admin_2_mobile: editMobile2,
        full_name: editFullName2 ? `${editFullName1} & ${editFullName2}` : editFullName1,
        email: editEmail,
        password: editPassword || undefined,
        mobile: editMobile1,
        secondaryContactNumber: secondaryContactVal,
        status: editStatus
      });

      if (res.data?.success) {
        setEditingAdmin(null);
        loadData();
      } else {
        setEditMsg({ type: 'error', msg: res.data?.message || 'Update failed' });
      }
    } catch (err) {
      setEditMsg({ type: 'error', msg: err.response?.data?.message || 'Failed to update Block Admin.' });
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

  const availableBlocks = Array.from(new Set([
    ...(districtData.members || []).map(m => m.blockCommitteeName).filter(Boolean),
    ...blockAdmins.map(ba => ba.blockCommitteeName).filter(Boolean)
  ]));

  const filteredBlockAdmins = blockAdmins.filter(ba => {
    const q = searchQuery.toLowerCase();
    return (
      (ba.blockCommitteeName || '').toLowerCase().includes(q) ||
      (ba.full_name || ba.name || '').toLowerCase().includes(q) ||
      (ba.email || '').toLowerCase().includes(q) ||
      (ba.mobile || '').toLowerCase().includes(q)
    );
  });

  // Real dynamic block analytics computed from actual districtData & blockAdmins
  const realBlockAnalytics = availableBlocks.map(block => {
    const blockUsers = (districtData.members || []).filter(m => (m.blockCommitteeName || m.block) === block).length;
    const blockVolunteers = (districtData.volunteers || []).filter(v => (v.blockCommitteeName || v.block) === block).length;
    return {
      block,
      users: blockUsers,
      volunteers: blockVolunteers,
    };
  });

  const maxUsersInBlock = Math.max(1, ...realBlockAnalytics.map(b => b.users));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none">
      
      {/* Header Banner with Kasaragod Banner Image (Matching Tech Admin Card Size) */}
      <div className="relative rounded-3xl p-6 lg:p-8 text-white shadow-xl overflow-hidden border border-slate-200">
        <img
          src="/kasaragod_banner.png"
          alt="Kasaragod Super Admin Banner"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 border border-white/30 rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> District Super Admin Command Portal ({districtData.district || 'Kasaragod'})
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Kasaragod District Administration & Analytics
            </h1>
            <p className="text-slate-100 text-xs sm:text-sm mt-1 max-w-2xl font-medium drop-shadow-sm">
              Manage Block Committees, Oversee District Operations, and Track Real-Time Analytics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/super-admin/blocks" 
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <Building2 className="w-4 h-4" /> Manage Block Committees
            </Link>
            <button 
              onClick={loadData} 
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </div>

        {/* District Live Stat Bar (Matching Tech Admin Banner Card Height & Grid Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/20 relative z-10">
          {[
            { label: 'Total Donors', val: districtData.total_users || 0 },
            { label: 'Volunteers', val: districtData.total_volunteers || 0 },
            { label: 'Block Admins', val: districtData.total_admins || 0 },
            { label: 'Active Blocks', val: availableBlocks.length || 0 }
          ].map((m, idx) => (
            <div key={idx} className="bg-black/35 border border-white/20 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                <span>{m.label}</span>
                <span className="text-white/80 font-mono text-[9px]">District DB</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 sm:mt-1">{m.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* District KPI Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Users */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-3xl shadow-sm hover:border-red-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total District Donors</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                {districtData.total_users || 0}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
            <span className="text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> System Verified
            </span>
            <span>Registered Donors</span>
          </div>
        </div>

        {/* KPI 2: District Volunteers */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-3xl shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Active Volunteers</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">
                {districtData.total_volunteers || 0}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
            <span className="text-slate-600 dark:text-zinc-300">Meghala Coordinators</span>
            <span className="text-emerald-600">Active Duty</span>
          </div>
        </div>

        {/* KPI 3: Block Committees */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-3xl shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Block Committees</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1">
                {blockAdmins.length || districtData.total_admins || 0}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
            <span>District Admin Hubs</span>
            <span className="text-amber-600">Active Hubs</span>
          </div>
        </div>

        {/* KPI 4: Active Blocks */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-3xl shadow-sm hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Active Blocks</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
                {availableBlocks.length} <span className="text-xs font-bold text-slate-400">Blocks</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
            <span className="text-slate-600 dark:text-zinc-300">Registered Operational Blocks</span>
            <span className="text-emerald-600">Live</span>
          </div>
        </div>

      </div>

      {/* District Operations Analytics Breakdown Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Block Operations & Member Metrics Index</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Live Data</span>
        </div>

        {realBlockAnalytics.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-zinc-500 text-xs font-semibold">
            No registered block operations found. Navigate to Manage Block Committees to register new blocks.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {realBlockAnalytics.map((ba) => (
              <div key={ba.block} className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate max-w-[110px]">{ba.block}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-full border border-emerald-200 dark:border-emerald-900/40">
                    Active
                  </span>
                </div>
                
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                    <span>Registered Donors</span>
                    <span className="text-slate-900 dark:text-zinc-100 font-extrabold">{ba.users}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div style={{ width: `${Math.max(5, (ba.users / maxUsersInBlock) * 100)}%` }} className="h-full bg-primary rounded-full" />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-1">
                  <span>Volunteers: <strong className="text-slate-800 dark:text-zinc-200">{ba.volunteers}</strong></span>
                  <span className="text-emerald-600 font-bold">Operational</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Block Committees Overview Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
              Registered Block Committees ({filteredBlockAdmins.length})
            </h3>
            <p className="text-xs text-slate-400">Overview of active district block committees. Click "Manage Block Committees" above to add or edit.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Filter */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by block, name..."
                className="w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-zinc-100 pr-8"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            <Link
              to="/super-admin/blocks"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add / Manage
            </Link>
          </div>
        </div>

          {filteredBlockAdmins.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center text-slate-400 shadow-sm text-xs">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
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
                            <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{ba.blockCommitteeName || 'N/A'}</span>
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

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            ba.status === 'Active' 
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
                                setDeletingAdminName(ba.full_name || ba.name);
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
          )}
        </div>

      {/* Edit Block Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            {/* Modal Header Red Banner */}
            <div className="bg-red-600 p-6 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-black tracking-tight">Edit Block Committee Details</h3>
                    <p className="text-red-100 text-[10px] font-medium">Update Block Committee information & credentials</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingAdmin(null)} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${
                  editMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
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
                        placeholder="kozhikode.north@jeevalink.org"
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

      {/* Custom Red & White Delete Confirmation Modal */}
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
