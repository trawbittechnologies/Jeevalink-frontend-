import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import api from '../store/api.js';
import {
  ClipboardList, CheckCircle2, XCircle,
  Bell, Users, Download, Star,
  AlertCircle, Loader2, X, Search, RefreshCw,
  HeartHandshake, MapPin, Phone, Building2,
  Share2, ShieldCheck, Filter,
  Layers, ChevronRight, MessageCircle,
  Check, Calendar, Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import PosterModal from '../components/PosterModal.jsx';

// Blood Compatibility Reference
const BLOOD_COMPATIBILITY = {
  'A+': { canReceive: ['A+', 'A-', 'O+', 'O-'], canDonate: ['A+', 'AB+'] },
  'A-': { canReceive: ['A-', 'O-'], canDonate: ['A+', 'A-', 'AB+', 'AB-'] },
  'B+': { canReceive: ['B+', 'B-', 'O+', 'O-'], canDonate: ['B+', 'AB+'] },
  'B-': { canReceive: ['B-', 'O-'], canDonate: ['B+', 'B-', 'AB+', 'AB-'] },
  'AB+': { canReceive: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canDonate: ['AB+'] },
  'AB-': { canReceive: ['A-', 'B-', 'AB-', 'O-'], canDonate: ['AB+', 'AB-'] },
  'O+': { canReceive: ['O+', 'O-'], canDonate: ['A+', 'B+', 'AB+', 'O+'] },
  'O-': { canReceive: ['O-'], canDonate: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function VolunteerDashboard() {
  const {
    requests, donors, allUsers, notifications,
    fetchRequests, fetchNotifications, fetchUsers,
    markAllNotificationsRead, triggerToast
  } = useAppStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState('pending'); // 'pending' | 'verified' | 'fulfilled' | 'all'
  const [pendingFromServer, setPendingFromServer] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [fulfillingId, setFulfillingId] = useState(null);
  const [selectedMatchReq, setSelectedMatchReq] = useState(null);
  const [top5Modal, setTop5Modal] = useState(null); // { reqId, donors, reqInfo }
  const [loadingTop5, setLoadingTop5] = useState(false);
  const [posterModal, setPosterModal] = useState(null); // { data, reqId }

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodFilter, setSelectedBloodFilter] = useState('ALL');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState('ALL');
  const [selectedMatrixGroup, setSelectedMatrixGroup] = useState('O+');
  const [copiedId, setCopiedId] = useState(null);

  // ── Fetch pending requests from server (volunteer-scoped) ──────────
  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await api.get('/volunteer/requests/pending');
      if (res.data?.success) {
        setPendingFromServer(res.data.data?.requests || []);
      }
    } catch (err) {
      console.warn('Failed to fetch pending requests:', err);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const handleRefreshAll = useCallback(async () => {
    setLoadingPending(true);
    try {
      await Promise.all([
        fetchRequests(),
        fetchNotifications(),
        fetchUsers(),
        fetchPending()
      ]);
      triggerToast('Dashboard data refreshed', 'success');
    } catch (err) {
      console.error('Refresh error:', err);
      triggerToast('Failed to refresh data', 'error');
    } finally {
      setLoadingPending(false);
    }
  }, [fetchRequests, fetchNotifications, fetchUsers, fetchPending, triggerToast]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        fetchRequests();
        fetchNotifications();
        fetchUsers();
        await fetchPending();
      }
    })();
    return () => { active = false; };
  }, [fetchRequests, fetchNotifications, fetchUsers, fetchPending]);

  // ── Helper: Compatible Donors Filter ───────────────────────────────
  const getCompatibleDonors = useCallback((bloodGroup) => {
    const validGroups = BLOOD_COMPATIBILITY[bloodGroup]?.canReceive || [];
    const sourceList = (donors && donors.length > 0)
      ? donors
      : (allUsers || []).filter(u => u.role === 'user');

    return sourceList.filter((d) => {
      const isAvail = d.availableForDonation ?? d.available_for_donation ?? true;
      const dGroup = d.bloodGroup || d.blood_group;
      return isAvail && validGroups.includes(dGroup);
    });
  }, [donors, allUsers]);

  // ── Approve Blood Request ──────────────────────────────────────────
  const handleApprove = async (reqId, reqObj = null) => {
    setApprovingId(reqId);
    try {
      const res = await api.patch(`/requests/${reqId}/approve`);
      if (res.data?.success) {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch { /* ignore */ }

        triggerToast('Request approved and published', 'success');
        setPendingFromServer((prev) => prev.filter((r) => (r.id || r._id) !== reqId));
        fetchRequests();
        handleGetTop5(reqId, reqObj);
      } else {
        triggerToast(res.data?.message || 'Approval failed', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // ── Reject Blood Request ───────────────────────────────────────────
  const handleReject = async (reqId) => {
    if (!window.confirm('Are you sure you want to reject and remove this blood request?')) return;
    setRejectingId(reqId);
    try {
      const res = await api.delete(`/requests/${reqId}`);
      if (res.data?.success || res.status === 200) {
        setPendingFromServer((prev) => prev.filter((r) => (r.id || r._id) !== reqId));
        fetchRequests();
        triggerToast('Blood request rejected', 'info');
      } else {
        triggerToast('Failed to reject request', 'error');
      }
    } catch (err) {
      console.error('Reject error:', err);
      triggerToast(err.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  // ── Mark Request Fulfilled ─────────────────────────────────────────
  const handleFulfill = async (reqId) => {
    setFulfillingId(reqId);
    try {
      const res = await api.patch(`/requests/${reqId}/fulfill`);
      if (res.data?.success) {
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch { /* ignore */ }
        triggerToast('Request marked as fulfilled', 'success');
        fetchRequests();
      } else {
        triggerToast(res.data?.message || 'Failed to mark as fulfilled', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to fulfill request', 'error');
    } finally {
      setFulfillingId(null);
    }
  };

  // ── Top 5 Donors Recommendation ────────────────────────────────────
  const handleGetTop5 = async (reqId, fallbackReq = null) => {
    setLoadingTop5(true);
    const reqObj = fallbackReq || requests.find(r => (r.id || r._id) === reqId) || pendingFromServer.find(r => (r.id || r._id) === reqId);
    try {
      const res = await api.post(`/requests/${reqId}/top-donors`);
      if (res.data?.success) {
        setTop5Modal({
          reqId,
          reqInfo: reqObj,
          donors: Array.isArray(res.data.data) ? res.data.data : []
        });
      }
    } catch (err) {
      console.warn('Top-5 fetch failed:', err);
      triggerToast('Could not fetch recommended donors', 'warning');
    } finally {
      setLoadingTop5(false);
    }
  };

  // ── Poster Generator ───────────────────────────────────────────────
  const handlePoster = (reqId) => {
    const reqObj = requests.find(r => (r.id || r._id) === reqId) || pendingFromServer.find(r => (r.id || r._id) === reqId);
    if (reqObj) {
      setPosterModal({
        data: {
          ...reqObj,
          meghala_name: reqObj.meghala_name || reqObj.requester_meghala || reqObj.meghala || reqObj.city || user?.city || user?.meghala || '',
          requester_meghala: reqObj.requester_meghala || reqObj.meghala_name || reqObj.meghala || reqObj.city || user?.city || user?.meghala || '',
        },
        reqId
      });
    }
  };

  // ── WhatsApp Quick Share ───────────────────────────────────────────
  const handleShareWhatsApp = (req) => {
    const patient = req.patient_name || req.patientName || 'Patient';
    const bg = req.blood_group || req.bloodGroup || 'Blood';
    const hospital = req.hospital_name || req.hospitalName || 'Hospital';
    const city = req.city || 'Kasaragod';
    const units = req.units_required || req.unitsRequired || 1;
    const phone = req.contact_number || req.contactNumber || '';
    const urgency = req.urgency_level || req.urgencyLevel || 'Urgent';

    const text = `🚨 *URGENT BLOOD REQUIREMENT - JEEVALINK* 🚨\n\n` +
      `🩸 *Blood Group:* ${bg}\n` +
      `👤 *Patient:* ${patient}\n` +
      `🏥 *Hospital:* ${hospital}, ${city}\n` +
      `📦 *Units Needed:* ${units} Unit(s)\n` +
      `⚡ *Urgency:* ${urgency}\n` +
      `📞 *Contact:* ${phone}\n\n` +
      `_Coordinated by DYFI ${user?.meghala || user?.city || 'Meghala'} Committee_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // ── Copy Share Text ────────────────────────────────────────────────
  const handleCopyShare = (req) => {
    const reqId = req.id || req._id;
    const patient = req.patient_name || req.patientName || 'Patient';
    const bg = req.blood_group || req.bloodGroup || 'Blood';
    const hospital = req.hospital_name || req.hospitalName || 'Hospital';
    const city = req.city || 'Kasaragod';
    const units = req.units_required || req.unitsRequired || 1;
    const phone = req.contact_number || req.contactNumber || '';

    const text = `🚨 URGENT BLOOD REQUIREMENT - JEEVALINK\n🩸 Blood Group: ${bg}\n👤 Patient: ${patient}\n🏥 Hospital: ${hospital}, ${city}\n📦 Units: ${units}\n📞 Contact: ${phone}`;
    navigator.clipboard.writeText(text);
    setCopiedId(reqId);
    triggerToast('Details copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // ── Data Categorization ────────────────────────────────────────────
  const unverified = useMemo(() => {
    return requests.filter((r) =>
      (!r.verified || r.status === 'Pending Approval' || r.pending_approval) &&
      ['Pending', 'Waiting', 'Accepted', 'Pending Approval'].includes(r.status)
    );
  }, [requests]);

  const verified = useMemo(() => {
    return requests.filter((r) =>
      r.verified &&
      r.status !== 'Pending Approval' &&
      !r.pending_approval &&
      ['Pending', 'Waiting', 'Accepted'].includes(r.status)
    );
  }, [requests]);

  const fulfilled = useMemo(() => {
    return requests.filter((r) => r.status === 'Fulfilled');
  }, [requests]);

  const pendingList = pendingFromServer.length > 0 ? pendingFromServer : unverified;

  // Active Tab Requests
  const rawTabRequests = useMemo(() => {
    if (tab === 'pending') return pendingList;
    if (tab === 'verified') return verified;
    if (tab === 'fulfilled') return fulfilled;
    return [...pendingList, ...verified, ...fulfilled];
  }, [tab, pendingList, verified, fulfilled]);

  // Filtered Tab Requests
  const tabRequests = useMemo(() => {
    return rawTabRequests.filter((r) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const patient = (r.patient_name || r.patientName || '').toLowerCase();
        const hospital = (r.hospital_name || r.hospitalName || '').toLowerCase();
        const city = (r.city || '').toLowerCase();
        const bg = (r.blood_group || r.bloodGroup || '').toLowerCase();
        const phone = (r.contact_number || r.contactNumber || '').toLowerCase();
        if (!patient.includes(q) && !hospital.includes(q) && !city.includes(q) && !bg.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      // Blood Group Filter
      if (selectedBloodFilter !== 'ALL') {
        const bg = r.blood_group || r.bloodGroup;
        if (bg !== selectedBloodFilter) return false;
      }

      // Urgency Filter
      if (selectedUrgencyFilter !== 'ALL') {
        const urg = (r.urgency_level || r.urgencyLevel || '').toLowerCase();
        if (!urg.includes(selectedUrgencyFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [rawTabRequests, searchQuery, selectedBloodFilter, selectedUrgencyFilter]);

  // Clean Statistics Cards
  const stats = [
    {
      id: 'pending',
      label: 'Pending Approval',
      value: pendingList.length,
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderAccent: pendingList.length > 0 ? 'border-amber-300' : 'border-slate-200',
    },
    {
      id: 'verified',
      label: 'Verified Active',
      value: verified.length,
      icon: Droplets,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      borderAccent: 'border-slate-200',
    },
    {
      id: 'fulfilled',
      label: 'Fulfilled Requests',
      value: fulfilled.length,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderAccent: 'border-slate-200',
    },
    {
      id: 'donors',
      label: 'Registered Donors',
      value: (allUsers || []).filter(u => u.role === 'user').length || donors.length,
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      borderAccent: 'border-slate-200',
    }
  ];

  // Committee details resolver
  const committeeName = (() => {
    const rawMeghala = user?.meghalaCommitteeName || user?.meghala_committee_name || user?.meghala || user?.meghalaName || user?.meghala_name || user?.city || '';
    if (!rawMeghala || rawMeghala.toLowerCase() === 'n/a') return 'Meghala Committee';
    if (/meghala\s+committee/i.test(rawMeghala)) return rawMeghala;
    if (/committee/i.test(rawMeghala)) return rawMeghala;
    if (/meghala/i.test(rawMeghala)) return `${rawMeghala} Committee`;
    return `${rawMeghala} Meghala Committee`;
  })();

  const blockName = (() => {
    const rawBlock = user?.blockCommitteeName || user?.block_committee_name || user?.organization_name || user?.organizationName || user?.block || user?.block_name || user?.blockName || (user?.role === 'block_admin' ? user?.city : '') || '';
    if (!rawBlock || rawBlock.toLowerCase() === 'n/a' || rawBlock.toLowerCase() === 'central') {
      return user?.district ? `${user.district} Block` : 'Block Committee';
    }
    if (/block\s+committee/i.test(rawBlock) || /block/i.test(rawBlock) || /committee/i.test(rawBlock)) return rawBlock;
    return `${rawBlock} Block`;
  })();

  const districtName = user?.district || user?.district_name || 'Kasaragod';

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left pb-16 select-none">

      {/* ─── Clean Minimal Header ─── */}
      <div className="bg-red-600 text-white rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-white text-red-700 font-black text-xs uppercase tracking-wider shadow-xs">
                DYFI
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {committeeName}
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs text-red-100 mt-2.5 pt-2.5 border-t border-red-500/60 flex-wrap">
              <span>District: <strong className="text-white font-bold">{districtName}</strong></span>
              <span>•</span>
              <span>Block: <strong className="text-white font-bold">{blockName}</strong></span>
              <span>•</span>
              <span>Volunteer Desk: <strong className="text-white font-bold">{user?.primary_name || user?.name || 'Active'}</strong></span>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link
              to="/volunteer/accepted-donors"
              className="px-3.5 py-2 bg-white text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4 text-red-600" />
              <span>Accepted Donors</span>
            </Link>

            <Link
              to="/volunteer/users"
              className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-red-500/40"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </Link>

            <Link
              to="/volunteer/unit-committee"
              className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-red-500/40"
            >
              <Building2 className="w-4 h-4" />
              <span>Unit Squad</span>
            </Link>

            <button
              onClick={handleRefreshAll}
              disabled={loadingPending}
              className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 border border-red-500/40"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Minimal Overview Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const isSelected = (tab === s.id);

          return (
            <div
              key={s.id}
              onClick={() => {
                if (['pending', 'verified', 'fulfilled'].includes(s.id)) {
                  setTab(s.id);
                }
              }}
              className={`bg-white rounded-2xl p-5 border ${s.borderAccent} shadow-xs transition hover:border-red-300 cursor-pointer flex items-center justify-between ${
                isSelected ? 'ring-2 ring-red-500/30 border-red-500' : ''
              }`}
            >
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {s.value}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {s.label}
                </p>
              </div>

              <div className={`w-10 h-10 rounded-xl ${s.iconBg} ${s.iconColor} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Pending Approval Highlight Queue ─── */}
      {pendingList.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Pending Verification ({pendingList.length})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Review blood requests before publishing them to the live public feed.
              </p>
            </div>
            <button
              onClick={() => setTab('pending')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline self-start sm:self-auto cursor-pointer"
            >
              View all pending →
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3.5">
            {pendingList.slice(0, 4).map((req) => {
              const reqId = req.id || req._id;
              const bg = req.blood_group || req.bloodGroup || '—';
              const patient = req.patient_name || req.patientName || 'Patient';
              const hospital = req.hospital_name || req.hospitalName || 'Hospital';
              const city = req.city || 'Location';
              const units = req.units_required || req.unitsRequired || 1;
              const contact = req.contact_number || req.contactNumber || '—';
              const urgency = req.urgency_level || req.urgencyLevel || 'Normal';

              return (
                <div
                  key={reqId}
                  className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-red-600 text-white font-extrabold text-xs rounded-lg shadow-2xs">
                          {bg}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {patient}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {hospital}, {city}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                        {urgency}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                      <p>Units Needed: <strong className="text-slate-900">{units} Bag(s)</strong></p>
                      <p>
                        Contact: <a href={`tel:${contact}`} className="text-red-600 font-semibold hover:underline">{contact}</a>
                        {req.requester_name ? ` (By: ${req.requester_name})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(reqId, req)}
                      disabled={approvingId === reqId}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {approvingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approve
                    </button>

                    <button
                      onClick={() => handlePoster(reqId)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-red-600" /> Poster
                    </button>

                    <button
                      onClick={() => handleReject(reqId)}
                      disabled={rejectingId === reqId}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      {rejectingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Main Grid Layout ─── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left Column (2 Cols): Blood Requests Queue ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">

            {/* Queue Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-600" />
                  Blood Requests Queue
                </h3>
                <p className="text-xs text-slate-500">Manage and coordinate blood donation cases in your jurisdiction.</p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:outline-none text-slate-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Primary Tab Navigation */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
              {[
                ['pending', 'Pending Approval', pendingList.length],
                ['verified', 'Verified Active', verified.length],
                ['fulfilled', 'Fulfilled', fulfilled.length],
                ['all', 'All Records', rawTabRequests.length],
              ].map(([val, label, count]) => (
                <button
                  key={val}
                  onClick={() => setTab(val)}
                  className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === val
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tab === val ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-slate-400 text-[11px] font-bold mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Blood:
                </span>
                {['ALL', ...BLOOD_GROUPS].map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBloodFilter(bg)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      selectedBloodFilter === bg
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {['ALL', 'Urgent'].map((urg) => (
                  <button
                    key={urg}
                    onClick={() => setSelectedUrgencyFilter(urg)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      selectedUrgencyFilter === urg
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Cards Stream */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 no-scrollbar">
              {tabRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold text-slate-600">No requests in this view</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try resetting search or filter criteria.</p>
                </div>
              ) : (
                tabRequests.map((req) => {
                  const reqId = req.id || req._id;
                  const bg = req.blood_group || req.bloodGroup || '—';
                  const patient = req.patient_name || req.patientName || 'Patient';
                  const hospital = req.hospital_name || req.hospitalName || 'Hospital';
                  const city = req.city || 'Location';
                  const units = req.units_required || req.unitsRequired || 1;
                  const contact = req.contact_number || req.contactNumber || '';
                  const urgency = req.urgency_level || req.urgencyLevel || 'Normal';
                  const isPending = (!req.verified || req.status === 'Pending Approval' || req.pending_approval);
                  const isFulfilled = (req.status === 'Fulfilled');
                  const compatibleDonors = getCompatibleDonors(bg);

                  return (
                    <div
                      key={reqId}
                      className="border border-slate-200 rounded-xl p-4 space-y-3 hover:border-red-200 transition bg-white shadow-2xs"
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-red-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                            {bg}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{patient}</h4>
                              {req.requester_name && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  by {req.requester_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {hospital}, {city} • <strong>{units} Unit{units > 1 ? 's' : ''}</strong>
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 shrink-0">
                          {urgency}
                        </span>
                      </div>

                      {/* Contact row */}
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <p>
                          Contact: <a href={`tel:${contact}`} className="text-red-600 font-semibold hover:underline">{contact || '—'}</a>
                        </p>
                        {req.required_by_date && (
                          <span className="text-[11px] text-slate-400">
                            Required by: {req.required_by_date}
                          </span>
                        )}
                      </div>

                      {/* Pending actions */}
                      {isPending && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleApprove(reqId, req)}
                            disabled={approvingId === reqId}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            {approvingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handlePoster(reqId)}
                            className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-red-600" /> Poster
                          </button>
                          <button
                            onClick={() => handleReject(reqId)}
                            disabled={rejectingId === reqId}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            {rejectingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Verified active actions */}
                      {!isPending && !isFulfilled && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setSelectedMatchReq(selectedMatchReq === reqId ? null : reqId)}
                              className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition cursor-pointer border border-red-200"
                            >
                              {selectedMatchReq === reqId ? 'Hide Donors' : `🔍 Match Donors (${compatibleDonors.length})`}
                            </button>

                            <button
                              onClick={() => handleGetTop5(reqId, req)}
                              disabled={loadingTop5}
                              className="px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-100 transition cursor-pointer border border-amber-200 flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-600" /> Top 5 Donors
                            </button>

                            <button
                              onClick={() => handlePoster(reqId)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition cursor-pointer border border-slate-200 flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5 text-red-600" /> Poster
                            </button>

                            <button
                              onClick={() => handleShareWhatsApp(req)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-100 transition cursor-pointer border border-emerald-200 flex items-center gap-1"
                              title="Share on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                            </button>

                            <button
                              onClick={() => handleFulfill(reqId)}
                              disabled={fulfillingId === reqId}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer ml-auto disabled:opacity-60"
                            >
                              Mark Fulfilled
                            </button>
                          </div>

                          {/* Expandable Match Donors Drawer */}
                          {selectedMatchReq === reqId && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 max-h-52 overflow-y-auto no-scrollbar">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Compatible Donors ({bg}) — {compatibleDonors.length} Available
                              </p>
                              {compatibleDonors.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No compatible donors found in local cluster.</p>
                              ) : (
                                compatibleDonors.map((d) => {
                                  const dName = d.primary_name || d.primaryName || d.name || 'Donor';
                                  const dPhone = d.mobile || d.phone || '';
                                  return (
                                    <div key={d.id || d._id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
                                      <div>
                                        <p className="font-bold text-slate-900">{dName} ({d.blood_group || d.bloodGroup})</p>
                                        <p className="text-[11px] text-slate-500">{d.city || 'Kasaragod'} • {d.total_donations || 0} donations</p>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {dPhone && (
                                          <a href={`tel:${dPhone}`} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px]">
                                            Call
                                          </a>
                                        )}
                                        <button
                                          onClick={() => triggerToast(`Alert dispatched to ${dName}`, 'success')}
                                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded"
                                        >
                                          Alert
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fulfilled view */}
                      {isFulfilled && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Request Fulfilled
                          </span>
                          <button onClick={() => handlePoster(reqId)} className="text-red-600 font-bold hover:underline">
                            View Poster
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* ── Right Column: Minimal Scope & Matrix Tools ── */}
        <div className="space-y-4">

          {/* Committee Jurisdiction Scope */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                Jurisdiction Scope
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700">
                Level 4
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">District HQ</span>
                <span className="font-bold text-slate-900">{districtName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Block Committee</span>
                <span className="font-bold text-slate-900">{blockName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Meghala Unit</span>
                <span className="font-bold text-red-600">{committeeName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Volunteer</span>
                <span className="font-bold text-slate-900">{user?.primary_name || user?.name || 'Assigned'}</span>
              </div>
            </div>

            <Link
              to="/volunteer/unit-committee"
              className="w-full mt-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 text-center"
            >
              <span>Manage Unit Committee</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Blood Compatibility Quick Matrix */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Blood Group Compatibility
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedMatrixGroup(bg)}
                  className={`py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedMatrixGroup === bg
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-2 border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
                  Can Receive Blood From:
                </span>
                <div className="flex flex-wrap gap-1">
                  {BLOOD_COMPATIBILITY[selectedMatrixGroup]?.canReceive.map((g) => (
                    <span key={g} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-bold text-[11px]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-red-700 block mb-0.5">
                  Can Donate Blood To:
                </span>
                <div className="flex flex-wrap gap-1">
                  {BLOOD_COMPATIBILITY[selectedMatrixGroup]?.canDonate.map((g) => (
                    <span key={g} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-bold text-[11px]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-red-600" />
                Notifications
              </h3>
              {notifications.some(n => !n.read && !n.is_read) && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Mark read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No notifications yet</p>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <div
                    key={n.id || n._id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-0.5"
                  >
                    <p className="font-bold text-slate-900">{n.title || 'Notification'}</p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── Top 5 Donors Modal ─── */}
      <AnimatePresence>
        {top5Modal && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs"
            onClick={() => setTop5Modal(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="text-base font-bold text-slate-900">Recommended Donors</h3>
                </div>
                <button
                  onClick={() => setTop5Modal(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {top5Modal.donors.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No donors found in immediate area cluster.</p>
                ) : (
                  top5Modal.donors.map((d, i) => {
                    const mobile = d.mobile || d.phone || '';
                    return (
                      <div
                        key={d.id || i}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px]">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{d.primary_name || d.primaryName || d.name}</p>
                            <p className="text-[11px] text-slate-500">
                              <strong className="text-red-600">{d.blood_group || d.bloodGroup}</strong>
                              {d.priority_score ? ` • Score: ${d.priority_score}` : ''}
                            </p>
                          </div>
                        </div>

                        {mobile && (
                          <a
                            href={`tel:${mobile}`}
                            className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700 transition"
                          >
                            Call
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => {
                  handlePoster(top5Modal.reqId);
                  setTop5Modal(null);
                }}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Generate Poster
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Poster Modal ─── */}
      <PosterModal
        isOpen={!!posterModal}
        onClose={() => setPosterModal(null)}
        data={posterModal?.data}
      />

    </div>
  );
}
