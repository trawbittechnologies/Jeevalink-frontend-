import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Plus, RefreshCw, Edit3, Trash2, X, Building2,
  Users, UserCheck, Activity, BarChart3, TrendingUp, Search, Phone, Mail,
  Droplets, Flame, Heart, AlertTriangle, Clock, CheckCircle2, Award, ArrowUpRight
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

  // Combine block analytics from backend + local blockAdmins list
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
      (ba.mobile || '').toLowerCase().includes(q)
    );
  });

  // Map real blood group distribution
  const bgCountMap = new Map();
  (districtData.blood_group_distribution || []).forEach(item => {
    if (item.blood_group) {
      bgCountMap.set(item.blood_group.toUpperCase(), item.count || 0);
    }
  });

  const totalDonorsCount = districtData.total_users || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Hero Banner - Kerala Green & Emergency Red Command Portal */}
      <div className="relative rounded-3xl p-6 lg:p-8 text-white shadow-xl overflow-hidden border border-red-900/30">
        <img
          src="/kasaragod_banner.png"
          alt="District Blood Command Portal Banner"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/90 via-black/75 to-red-950/40 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/30 border border-red-400/40 rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <ShieldCheck className="w-4 h-4 text-red-300" />
              {districtData.district} District Blood Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md flex items-center gap-3">
              {districtData.district} District Emergency & Donors
            </h1>
            <p className="text-red-100/90 text-xs sm:text-sm mt-1 max-w-2xl font-medium drop-shadow-sm">
              Real-time donor directory, active emergency requests tracker, blood inventory analytics, and Block Committee command.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/super-admin/blocks" 
              className="px-4.5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-red-600/30 transition flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <Building2 className="w-4 h-4" /> Manage Block Committees
            </Link>
            <button 
              onClick={loadData} 
              className="px-4 py-3 bg-black/40 hover:bg-black/60 border border-white/25 rounded-2xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Data
            </button>
          </div>
        </div>

        {/* Live District Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/20 relative z-10">
          <div className="bg-black/40 border border-white/20 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Registered Donors</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{districtData.total_users}</p>
          </div>
          <div className="bg-black/40 border border-white/20 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Active Volunteers</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">{districtData.total_volunteers}</p>
          </div>
          <div className="bg-black/40 border border-white/20 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Blood Requests</p>
            <p className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">{districtData.total_requests}</p>
          </div>
          <div className="bg-black/40 border border-white/20 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Fulfilled Requests</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{districtData.fulfilled_requests}</p>
          </div>
        </div>
      </div>

      {/* Modern Blood Donor KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Donors */}
        <div className="bg-white border border-red-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-red-300 transition space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Donors</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
                {districtData.total_users}
                <span className="text-xs font-bold text-slate-500 font-mono">Donors</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center font-bold">
              <Droplets className="w-5 h-5 text-red-600 fill-red-100" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Verified Donors
            </span>
            <span>District Database</span>
          </div>
        </div>

        {/* KPI 2: Volunteers */}
        <div className="bg-white border border-emerald-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-300 transition space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Volunteers</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1 flex items-baseline gap-2">
                {districtData.total_volunteers}
                <span className="text-xs font-bold text-emerald-600 font-mono">Coordinators</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="text-emerald-700 font-bold">Meghala Squads</span>
            <span className="text-emerald-600 font-bold">Active Duty</span>
          </div>
        </div>

        {/* KPI 3: Blood Requests */}
        <div className="bg-white border border-amber-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-amber-300 transition space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Requests</p>
              <h3 className="text-2xl font-black text-amber-700 mt-1 flex items-baseline gap-2">
                {districtData.total_requests}
                <span className="text-xs font-bold text-amber-600 font-mono">({districtData.pending_requests} Active)</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-600 fill-amber-100" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="text-red-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> {districtData.urgency_emergency} Urgent
            </span>
            <span>Hospital Feed</span>
          </div>
        </div>

        {/* KPI 4: Fulfillment Rate */}
        <div className="bg-white border border-purple-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-purple-300 transition space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Rate</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1 flex items-baseline gap-2">
                {districtData.fulfillment_rate}%
                <span className="text-xs font-bold text-slate-500 font-mono">Success</span>
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="text-purple-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> {districtData.fulfilled_requests} Fulfilled
            </span>
            <span>Live Response</span>
          </div>
        </div>
      </div>

      {/* Creative Blood Group Availability Inventory Grid */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-red-50 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-600 fill-red-100" />
              District Blood Group Inventory & Availability Matrix
            </h2>
            <p className="text-xs text-slate-500">Real-time counts of verified donors across all 8 major blood types in {districtData.district}</p>
          </div>
          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
            8 Blood Groups Logged
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {ALL_BLOOD_GROUPS.map((bg) => {
            const count = bgCountMap.get(bg) || 0;
            const percentage = Math.min(100, Math.round((count / totalDonorsCount) * 100));

            let statusTag = 'Available';
            let tagBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (count === 0) {
              statusTag = 'Critical Shortage';
              tagBg = 'bg-red-50 text-red-700 border-red-200';
            } else if (count < 3) {
              statusTag = 'Low Stock';
              tagBg = 'bg-amber-50 text-amber-700 border-amber-200';
            }

            return (
              <div 
                key={bg} 
                className="bg-slate-50/80 border border-slate-200/80 hover:border-red-300 hover:bg-red-50/20 rounded-2xl p-3.5 text-center transition space-y-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {bg}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${tagBg}`}>
                    {statusTag}
                  </span>
                </div>

                <div>
                  <p className="text-xl font-black text-slate-900">{count}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Donors</p>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(8, percentage)}%` }} 
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{percentage}% of district</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Activity: Recent Emergency Blood Requests Feed */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-red-50 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600 fill-red-100" />
              Live District Emergency Blood Requests Feed
            </h2>
            <p className="text-xs text-slate-500">Active and recent patient requests requiring urgent donor response</p>
          </div>
          <Link
            to="/donor/emergency"
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            View All Requests <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!districtData.recent_requests || districtData.recent_requests.length === 0) ? (
          <div className="p-8 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-slate-100">
            <Heart className="w-8 h-8 text-red-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Active Emergency Requests</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All blood requests in {districtData.district} are currently fulfilled or standby. New emergency patient requests will stream live here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {districtData.recent_requests.map((req) => (
              <div 
                key={req.id} 
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 hover:border-red-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {req.blood_group}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                        {req.patient_name || 'Emergency Patient'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {req.units_required || 1} Unit(s) Required
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    req.urgency_level === 'Emergency' || req.urgency_level === 'Critical'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {req.urgency_level || 'Urgent'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2 font-medium">
                  <p className="truncate"><strong>Hospital:</strong> {req.hospital_name || 'District General Hospital'}</p>
                  <p className="flex items-center gap-1 text-slate-400 text-[10px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{req.created_at ? new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Operations Analytics Breakdown Card */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-red-50 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Block Operations & Donor Density Index</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live District Analytics</span>
        </div>

        {realBlockAnalytics.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-semibold">
            No registered block operations found. Navigate to Manage Block Committees to register new blocks.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {realBlockAnalytics.map((ba) => (
              <div key={ba.block} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 truncate max-w-[120px]">{ba.block}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
                
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Registered Donors</span>
                    <span className="text-slate-900 font-extrabold">{ba.users}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div style={{ width: `${Math.max(8, (ba.users / maxUsersInBlock) * 100)}%` }} className="h-full bg-red-600 rounded-full" />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-1">
                  <span>Volunteers: <strong className="text-slate-800">{ba.volunteers}</strong></span>
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
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-600" />
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
                placeholder="Search by block, admin name..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 pr-8 focus:outline-none focus:border-red-500"
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
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 shadow-sm text-xs space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">No Block Committees Found</p>
            <p className="text-slate-400 text-xs">No block committee matches your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-red-100 shadow-sm bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Block Committee</th>
                  <th className="py-3.5 px-4">Primary Contact (Admin 1)</th>
                  <th className="py-3.5 px-4">Secondary Contact (Admin 2)</th>
                  <th className="py-3.5 px-4">Email ID</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBlockAdmins.map((ba) => {
                  const { admin1Name, admin1Mobile, admin2Name, admin2Mobile } = parseBlockAdminContacts(ba);

                  return (
                    <tr key={ba.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">{ba.blockCommitteeName || ba.city || ba.block || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{admin1Name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{admin1Mobile}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {admin2Name || admin2Mobile ? (
                          <>
                            <div className="font-bold text-slate-900">{admin2Name || 'Admin 2'}</div>
                            {admin2Mobile && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{admin2Mobile}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-xs">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ba.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          ba.status === 'Active' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ba.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {ba.status || 'Active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(ba)} 
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition cursor-pointer flex items-center gap-1"
                            title="Edit Block Committee"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => {
                              setDeletingAdminId(ba.id);
                              setDeletingAdminName(ba.primary_name || ba.name);
                            }} 
                            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-red-100 max-h-[90vh] overflow-y-auto">
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
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
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
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
                      value={editFullName2} 
                      onChange={(e) => setEditFullName2(e.target.value)} 
                      required
                      placeholder="e.g. Anjali M"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Phone Number *</label>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={editMobile2} 
                        onChange={(e) => setEditMobile2(e.target.value)} 
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-red-500" 
                      />
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Status</label>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-red-500"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Suspended">🔴 Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingAdmin(null)} 
                    className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingEdit} 
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer disabled:opacity-50"
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
