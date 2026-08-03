import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Plus, RefreshCw, Edit3, Trash2, X, Building2,
  UserCheck, BarChart3, TrendingUp, Search, Phone,
  Droplets, Flame, CheckCircle2, Award, ArrowUpRight
} from 'lucide-react';
import api from '../../store/api.js';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function parseBlockAdminContacts(ba) {
  let admin1Name = ba.primaryContactName || ba.primary_contact_name || ba.primaryName || ba.primary_name || ba.name || '';
  let admin2Name = ba.secondary_name || ba.secondaryName || ba.secondaryContactName || '';
  
  if (!admin2Name && admin1Name.includes(' & ')) {
    const parts = admin1Name.split(' & ');
    admin1Name = parts[0] ? parts[0].trim() : '';
    admin2Name = parts[1] ? parts[1].trim() : '';
  }

  let admin1Mobile = ba.mobile || '';
  let admin2Mobile = ba.secondary_phone || ba.secondaryContactNumber || ba.secondary_contact_number || '';

  if (!admin2Mobile && ba.secondaryContactNumber) {
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
    admin2Name: admin2Name || '',
    admin2Mobile: admin2Mobile || '',
  };
}

export default function SuperAdminDashboard() {
  const [districtData, setDistrictData] = useState({
    district: 'Kasaragod',
    total_users: 0,
    total_volunteers: 0,
    total_admins: 0,
    total_requests: 0,
    fulfilled_requests: 0,
    pending_requests: 0,
    fulfillment_rate: 100,
    blood_group_distribution: [],
    urgency_emergency: 0,
    urgency_normal: 0,
    recent_requests: [],
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
    setLoading(true);
    try {
      const [resDist, resAdmins] = await Promise.all([
        api.get('/super-admin/metrics'),
        api.get('/super-admin/block-admins')
      ]);

      if (resDist.data?.success) {
        const dData = resDist.data.data || resDist.data;
        setDistrictData({
          district: dData.district || 'Kasaragod',
          total_users: dData.total_users || 0,
          total_volunteers: dData.total_volunteers || 0,
          total_admins: dData.total_block_admins || 0,
          total_requests: dData.total_requests || 0,
          fulfilled_requests: dData.fulfilled_requests || 0,
          pending_requests: dData.pending_requests || 0,
          fulfillment_rate: dData.fulfillment_rate ?? 100,
          blood_group_distribution: dData.blood_group_distribution || [],
          urgency_emergency: dData.urgency_emergency || 0,
          urgency_normal: dData.urgency_normal || 0,
          recent_requests: dData.recent_requests || [],
          block_summary: dData.block_summary || []
        });
      }

      if (resAdmins.data?.success) {
        const raw = resAdmins.data;
        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.data?.data)) list = raw.data.data;
        setBlockAdmins(list);
      }
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
    setEditBlockName(ba.blockCommitteeName || ba.block || ba.blockName || ba.city || '');
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
        block_admin_2_name: editFullName2,
        block_admin_2_mobile: editMobile2,
        primary_contact_name: editFullName1,
        primary_name: editFullName2 ? `${editFullName1} & ${editFullName2}` : editFullName1,
        email: editEmail,
        password: editPassword || undefined,
        mobile: editMobile1,
        secondary_name: editFullName2,
        secondary_phone: editMobile2,
        secondaryContactNumber: editMobile2 ? `Admin 2: ${editFullName2} (${editMobile2})` : '',
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

  // Block Summary Mapping
  const availableBlocksMap = new Map();

  (districtData.block_summary || []).forEach(b => {
    if (b.block) {
      availableBlocksMap.set(b.block, {
        block: b.block,
        users: b.users || 0,
        volunteers: b.volunteers || 0
      });
    }
  });

  blockAdmins.forEach(ba => {
    const bName = ba.blockCommitteeName || ba.city || ba.block;
    if (bName && !availableBlocksMap.has(bName)) {
      availableBlocksMap.set(bName, {
        block: bName,
        users: 0,
        volunteers: 0
      });
    }
  });

  const realBlockAnalytics = Array.from(availableBlocksMap.values());
  const maxUsersInBlock = Math.max(1, ...realBlockAnalytics.map(b => b.users));

  const filteredBlockAdmins = blockAdmins.filter(ba => {
    const q = searchQuery.toLowerCase();
    const parsed = parseBlockAdminContacts(ba);
    return (
      (ba.blockCommitteeName || ba.city || ba.block || '').toLowerCase().includes(q) ||
      (ba.primary_name || ba.name || '').toLowerCase().includes(q) ||
      parsed.admin1Name.toLowerCase().includes(q) ||
      parsed.admin2Name.toLowerCase().includes(q) ||
      (ba.email || '').toLowerCase().includes(q) ||
      (ba.mobile || '').toLowerCase().includes(q) ||
      (ba.jeevalink_id || ba.employee_id || '').toLowerCase().includes(q)
    );
  });

  // Map real blood group distribution
  const bgCountMap = new Map();
  (districtData.blood_group_distribution || []).forEach(item => {
    if (item.blood_group) {
      bgCountMap.set(item.blood_group.toUpperCase(), item.count || 0);
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Sleek Minimal Header Banner */}
      <div className="relative rounded-3xl p-6 text-white shadow-lg overflow-hidden border border-red-900/20">
        <img
          src="/kasaragod_banner.png"
          alt="District Banner"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/95 via-black/85 to-red-950/60 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/30 border border-red-400/40 rounded-full text-white text-[11px] font-bold uppercase tracking-wider mb-2 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-red-300" />
              {districtData.district} District Super Admin
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {districtData.district} Blood Command
            </h1>
            <p className="text-red-100/80 text-xs mt-0.5 font-medium">
              Real-time donor status, emergency requests & block administration
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link 
              to="/super-admin/blocks" 
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4" /> Manage Blocks
            </Link>
            <button 
              onClick={loadData} 
              className="p-2.5 bg-black/40 hover:bg-black/60 border border-white/20 rounded-xl text-xs font-bold text-white transition cursor-pointer backdrop-blur-md"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Modern 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Donors */}
        <div className="bg-white border border-red-100 p-4 rounded-2xl shadow-xs hover:border-red-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Donors</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Droplets className="w-4 h-4 fill-red-100" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{districtData.total_users}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> System Verified
          </p>
        </div>

        {/* KPI 2: Volunteers */}
        <div className="bg-white border border-emerald-100 p-4 rounded-2xl shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Volunteers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{districtData.total_volunteers}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">District Squads</p>
        </div>

        {/* KPI 3: Block Admins */}
        <div className="bg-white border border-amber-100 p-4 rounded-2xl shadow-xs hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Block Committees</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{blockAdmins.length || districtData.total_admins}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Active Hubs</p>
        </div>

        {/* KPI 4: Fulfillment */}
        <div className="bg-white border border-purple-100 p-4 rounded-2xl shadow-xs hover:border-purple-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-1">{districtData.fulfillment_rate}%</p>
          <p className="text-[10px] text-purple-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {districtData.fulfilled_requests} Fulfilled
          </p>
        </div>
      </div>

      {/* Main 2-Column Balanced Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (8 cols): Blood Group Matrix & Emergency Feed */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Minimal Blood Group Matrix */}
          <div className="bg-white border border-red-100 rounded-2xl p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-red-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-red-600 fill-red-100" />
                Blood Group Donors Availability
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Real-time Matrix</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {ALL_BLOOD_GROUPS.map((bg) => {
                const count = bgCountMap.get(bg) || 0;
                let dotColor = 'bg-emerald-500';
                if (count === 0) dotColor = 'bg-red-500';
                else if (count < 3) dotColor = 'bg-amber-500';

                return (
                  <div key={bg} className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                        {bg}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-900">{count}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">Donors</p>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} title={`Stock Status: ${count} Donors`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Emergency Blood Requests List */}
          <div className="bg-white border border-red-100 rounded-2xl p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-red-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600 fill-red-100" />
                Emergency Blood Requests Feed
              </h3>
              <Link to="/donor/emergency" className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {(!districtData.recent_requests || districtData.recent_requests.length === 0) ? (
              <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl">
                No active emergency requests reported in {districtData.district}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {districtData.recent_requests.slice(0, 4).map((req) => (
                  <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {req.blood_group}
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{req.patient_name || 'Emergency Patient'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{req.hospital_name || 'Hospital'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        req.urgency_level === 'Emergency' || req.urgency_level === 'Critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.urgency_level || 'Urgent'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                        {req.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Block Analytics Summary */}
        <div className="lg:col-span-4 bg-white border border-red-100 rounded-2xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-red-50 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              Block Operations Index
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{realBlockAnalytics.length} Blocks</span>
          </div>

          {realBlockAnalytics.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs font-semibold">
              No blocks registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {realBlockAnalytics.map((ba) => (
                <div key={ba.block} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="truncate max-w-[140px]">{ba.block}</span>
                    <span className="text-slate-500 font-normal text-[11px]">{ba.users} Donors</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-600 h-full rounded-full" 
                      style={{ width: `${Math.max(8, (ba.users / maxUsersInBlock) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Registered Block Committees Table */}
      <div className="bg-white border border-red-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-red-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-600" />
            Registered Block Committees ({filteredBlockAdmins.length})
          </h3>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or JL-ID…"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 pr-7 focus:outline-none focus:border-red-500"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            <Link
              to="/super-admin/blocks"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Block
            </Link>
          </div>
        </div>

        {filteredBlockAdmins.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No Block Committees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">JL Employee ID</th>
                  <th className="py-3 px-4">Block Committee</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Secondary Contact</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlockAdmins.map((ba) => {
                  const { admin1Name, admin1Mobile, admin2Name, admin2Mobile } = parseBlockAdminContacts(ba);

                  return (
                    <tr key={ba.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {(() => {
                          const bId = ba.jeevalink_id || ba.employee_id || ba.jeevalinkId || (ba.id || ba._id ? `JL-BA-${String(ba.id || ba._id).padStart(4, '0')}` : null);
                          return bId ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black text-primary bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg">
                              {bId}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px] italic">—</span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {ba.blockCommitteeName || ba.city || ba.block || 'N/A'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{admin1Name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" /> {admin1Mobile}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {admin2Name || admin2Mobile ? (
                          <>
                            <div className="font-bold text-slate-900">{admin2Name || 'Admin 2'}</div>
                            {admin2Mobile && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" /> {admin2Mobile}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        {ba.email}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ba.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ba.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {ba.status || 'Active'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleOpenEdit(ba)} 
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-red-600 bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              setDeletingAdminId(ba.id);
                              setDeletingAdminName(ba.primary_name || ba.name);
                            }} 
                            className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-red-100 max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 p-5 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white text-base font-black tracking-tight">Edit Block Committee</h3>
                    <p className="text-red-100 text-[10px]">Update Block Committee information</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingAdmin(null)} 
                  className="w-7 h-7 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  editMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}>
                  {editMsg.msg}
                </div>
              )}

              <form onSubmit={handleSaveEditBlockAdmin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Block Committee Name *</label>
                  <input 
                    type="text" 
                    value={editBlockName} 
                    onChange={(e) => setEditBlockName(e.target.value)} 
                    required 
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Primary Contact Name *</label>
                    <input 
                      type="text" 
                      value={editFullName1} 
                      onChange={(e) => setEditFullName1(e.target.value)} 
                      required 
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Primary Phone Number *</label>
                    <input 
                      type="tel" 
                      value={editMobile1} 
                      onChange={(e) => setEditMobile1(e.target.value)} 
                      required 
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Secondary Contact Name *</label>
                    <input 
                      type="text" 
                      value={editFullName2} 
                      onChange={(e) => setEditFullName2(e.target.value)} 
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Secondary Phone Number *</label>
                    <input 
                      type="tel" 
                      value={editMobile2} 
                      onChange={(e) => setEditMobile2(e.target.value)} 
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)} 
                      required 
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Account Status</label>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-red-500"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Suspended">🔴 Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setEditingAdmin(null)} 
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingEdit} 
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
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
