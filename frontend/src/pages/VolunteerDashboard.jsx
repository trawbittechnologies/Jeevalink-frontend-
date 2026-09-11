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
  Share2, ShieldCheck, Flame, Sparkles, Filter,
  Layers, ChevronRight, Award, MessageCircle,
  Check, ExternalLink, Calendar, Droplets
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
      if (res.data.success) {
        setPendingFromServer(res.data.data.requests || []);
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
      triggerToast('Dashboard synchronized with live servers', 'success');
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
        // Confetti celebration
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch { /* ignore */ }

        triggerToast('Request verified & published to live broadcast network!', 'success');
        setPendingFromServer((prev) => prev.filter((r) => (r.id || r._id) !== reqId));
        fetchRequests();

        // Auto open top-5 donors modal for quick dispatch
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
        triggerToast('Blood request rejected and archived.', 'info');
      } else {
        triggerToast('Failed to reject request.', 'error');
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
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch { /* ignore */ }
        triggerToast('🎉 Lifesaver mission marked as fulfilled! Thank you!', 'success');
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
      if (res.data.success) {
        setTop5Modal({
          reqId,
          reqInfo: reqObj,
          donors: Array.isArray(res.data.data) ? res.data.data : []
        });
      }
    } catch (err) {
      console.warn('Top-5 fetch failed:', err);
      triggerToast('Could not fetch smart recommended donors', 'warning');
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
      `_Coordinated by DYFI ${user?.meghala || user?.city || 'Meghala'} Committee_\n` +
      `Together, let's save lives! Please share with potential donors.`;

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
    triggerToast('Broadcast message copied to clipboard!', 'success');
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

  // Statistics
  const stats = [
    {
      id: 'pending',
      label: 'Pending Approvals',
      value: pendingList.length,
      icon: AlertCircle,
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      border: 'border-amber-200/80 dark:border-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-950/60',
      badge: pendingList.length > 0 ? 'Requires Action' : 'All Clear',
      badgeColor: pendingList.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600',
      highlight: pendingList.length > 0
    },
    {
      id: 'verified',
      label: 'Active Blood Drives',
      value: verified.length,
      icon: Droplets,
      gradient: 'from-rose-500/10 via-red-500/5 to-transparent',
      border: 'border-rose-200/80 dark:border-rose-900/40',
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 dark:bg-rose-950/60',
      badge: 'Live Broadcast',
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'fulfilled',
      label: 'Fulfilled Missions',
      value: fulfilled.length,
      icon: Award,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      border: 'border-emerald-200/80 dark:border-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
      badge: 'Lives Saved',
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'donors',
      label: 'Registered Donors',
      value: (allUsers || []).filter(u => u.role === 'user').length || donors.length,
      icon: Users,
      gradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
      border: 'border-sky-200/80 dark:border-sky-900/40',
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100 dark:bg-sky-950/60',
      badge: 'Network Ready',
      badgeColor: 'bg-sky-600 text-white'
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
    <div className="max-w-7xl mx-auto space-y-7 text-left pb-20 select-none">

      {/* ─── Hero Command Deck ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white border border-rose-900/40 shadow-2xl p-6 sm:p-8">
        {/* Glow Spheres */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-red-800/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Badges Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black tracking-wider uppercase shadow-md shadow-red-900/30">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                DYFI JEEVALINK
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-rose-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Volunteer Command Center
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Node
              </span>
            </div>

            {/* Title & Committee */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                {committeeName}
              </h1>
              <p className="text-sm sm:text-base text-rose-100/80 mt-1 font-medium">
                Regional blood donation coordination, donor matching, and emergency relief center.
              </p>
            </div>

            {/* Jurisdiction Telemetry Pill */}
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-xs text-rose-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>District: <strong className="text-white font-bold">{districtName}</strong></span>
              </div>
              <span className="text-white/30">•</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Block: <strong className="text-white font-bold">{blockName}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/volunteer/accepted-donors"
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Accepted Donors</span>
            </Link>

            <Link
              to="/volunteer/users"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Users className="w-4 h-4 text-rose-300" />
              <span>User Registry</span>
            </Link>

            <Link
              to="/volunteer/unit-committee"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>Unit Squad</span>
            </Link>

            <button
              onClick={handleRefreshAll}
              disabled={loadingPending}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs rounded-xl backdrop-blur-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
              title="Synchronize data"
            >
              <RefreshCw className={`w-4 h-4 text-rose-200 ${loadingPending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Creative Impact KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const isCurrentTab = (tab === s.id);

          return (
            <motion.div
              key={s.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                if (['pending', 'verified', 'fulfilled'].includes(s.id)) {
                  setTab(s.id);
                }
              }}
              className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border ${s.border} shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group ${
                isCurrentTab ? 'ring-2 ring-rose-500' : ''
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} pointer-events-none opacity-80`} />

              <div className="relative z-10 flex items-start justify-between">
                <div className={`w-11 h-11 rounded-2xl ${s.iconBg} ${s.iconColor} flex items-center justify-center shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>

              <div className="relative z-10 mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {s.value}
                  </span>
                  {s.highlight && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Priority Pending Approval Action Tray ─── */}
      <AnimatePresence>
        {pendingList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-700/50 p-6 shadow-lg space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 dark:border-amber-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
                    Pending Verification Queue
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black">
                      {pendingList.length} Awaiting Review
                    </span>
                  </h3>
                  <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                    Carefully review blood requests before approving them to trigger live donor notifications and the public feed.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTab('pending')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start sm:self-auto cursor-pointer"
              >
                Focus Queue
              </button>
            </div>

            {/* Quick Cards Carousel/List */}
            <div className="grid md:grid-cols-2 gap-3.5 pt-1">
              {pendingList.slice(0, 4).map((req) => {
                const reqId = req.id || req._id;
                const bg = req.blood_group || req.bloodGroup || '—';
                const patient = req.patient_name || req.patientName || 'Patient';
                const hospital = req.hospital_name || req.hospitalName || 'Hospital';
                const city = req.city || 'Location';
                const units = req.units_required || req.unitsRequired || 1;
                const contact = req.contact_number || req.contactNumber || '';
                const urgency = req.urgency_level || req.urgencyLevel || 'Normal';

                return (
                  <div
                    key={reqId}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 hover:border-amber-400 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                            {bg}
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                              {patient}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {hospital}, {city}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {urgency}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>Units: <strong className="text-slate-900 dark:text-white">{units} Bag(s)</strong></span>
                        <span>•</span>
                        <span>Contact: <a href={`tel:${contact}`} className="text-rose-600 font-bold hover:underline">{contact || '—'}</a></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleApprove(reqId, req)}
                        disabled={approvingId === reqId}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {approvingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve & Match
                      </button>

                      <button
                        onClick={() => handlePoster(reqId)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                        title="Generate Social Poster"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-600" />
                      </button>

                      <button
                        onClick={() => handleReject(reqId)}
                        disabled={rejectingId === reqId}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-60"
                        title="Reject Request"
                      >
                        {rejectingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Operations Split Layout ─── */}
      <div className="grid lg:grid-cols-3 gap-7">

        {/* ── Left 2 Cols: Request Operations Hub ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">

            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-rose-600" />
                  Blood Operations Hub
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live dispatch, donor matching, social posters, and fulfillment tracking.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, hospital, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Primary Tab Bar */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
              {[
                ['pending', 'Pending Approval', pendingList.length, 'bg-amber-500'],
                ['verified', 'Active Verified', verified.length, 'bg-rose-600'],
                ['fulfilled', 'Fulfilled', fulfilled.length, 'bg-emerald-600'],
                ['all', 'All Records', rawTabRequests.length, 'bg-slate-700'],
              ].map(([val, label, count, activeColor]) => (
                <button
                  key={val}
                  onClick={() => setTab(val)}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    tab === val
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black text-white ${activeColor}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Secondary Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              {/* Blood Group Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-bold text-[11px] mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Group:
                </span>
                {['ALL', ...BLOOD_GROUPS].map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBloodFilter(bg)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedBloodFilter === bg
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>

              {/* Urgency Filter */}
              <div className="flex items-center gap-1">
                {['ALL', 'Urgent', 'Emergency'].map((urg) => (
                  <button
                    key={urg}
                    onClick={() => setSelectedUrgencyFilter(urg)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedUrgencyFilter === urg
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Stream */}
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1 no-scrollbar">
              {tabRequests.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No requests found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Try clearing your search query or selecting a different filter above.
                  </p>
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

                  const isUrgent = urgency.toLowerCase().includes('urgent') || urgency.toLowerCase().includes('emergency') || urgency.toLowerCase().includes('sos');

                  return (
                    <motion.div
                      key={reqId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-xs ${
                        isUrgent
                          ? 'border-rose-300 dark:border-rose-900/60 hover:border-rose-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Row: Blood Group, Patient Name, Urgency */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          {/* 3D Blood Group Avatar */}
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white font-black text-base flex flex-col items-center justify-center shadow-md shadow-red-600/20 shrink-0">
                            <span>{bg}</span>
                            <span className="text-[9px] font-semibold opacity-90 leading-none">Blood</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-slate-900 dark:text-white">
                                {patient}
                              </h3>
                              {req.requester_name && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  by {req.requester_name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {hospital}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                {city}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Urgency Badge */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isUrgent
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {urgency}
                          </span>

                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                            {units} Bag{units > 1 ? 's' : ''} Needed
                          </span>
                        </div>
                      </div>

                      {/* Contact & Meta Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl mt-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-slate-500">Contact:</span>
                          <a
                            href={`tel:${contact}`}
                            className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {contact || 'Not provided'}
                          </a>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.required_by_date && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Required by: <strong className="text-slate-700 dark:text-slate-300">{req.required_by_date}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ─── Actions Bar ─── */}
                      <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        {/* If Pending Verification */}
                        {isPending && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleApprove(reqId, req)}
                              disabled={approvingId === reqId}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                              {approvingId === reqId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Approve & Publish Request
                            </button>

                            <button
                              onClick={() => handlePoster(reqId)}
                              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-rose-600" />
                              Poster
                            </button>

                            <button
                              onClick={() => handleReject(reqId)}
                              disabled={rejectingId === reqId}
                              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                              {rejectingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Reject
                            </button>
                          </div>
                        )}

                        {/* If Verified & Active */}
                        {!isPending && !isFulfilled && (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Match Donors Drawer Toggle */}
                            <button
                              onClick={() => setSelectedMatchReq(selectedMatchReq === reqId ? null : reqId)}
                              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                                selectedMatchReq === reqId
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              }`}
                            >
                              <Search className="w-3.5 h-3.5" />
                              {selectedMatchReq === reqId ? 'Hide Matched Donors' : `Match Donors (${compatibleDonors.length})`}
                            </button>

                            {/* Top 5 Smart Donors */}
                            <button
                              onClick={() => handleGetTop5(reqId, req)}
                              disabled={loadingTop5}
                              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              Top 5 Donors
                            </button>

                            {/* Social Poster */}
                            <button
                              onClick={() => handlePoster(reqId)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-rose-600" />
                              Poster
                            </button>

                            {/* WhatsApp Share */}
                            <button
                              onClick={() => handleShareWhatsApp(req)}
                              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                              title="Share to WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Share
                            </button>

                            {/* Copy Share Text */}
                            <button
                              onClick={() => handleCopyShare(req)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer"
                              title="Copy Message Text"
                            >
                              {copiedId === reqId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                            </button>

                            {/* Mark Fulfilled */}
                            <button
                              onClick={() => handleFulfill(reqId)}
                              disabled={fulfillingId === reqId}
                              className="ml-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                            >
                              {fulfillingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                              Fulfill Request
                            </button>
                          </div>
                        )}

                        {/* If Fulfilled */}
                        {isFulfilled && (
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Mission Completed & Saved
                            </span>

                            <button
                              onClick={() => handlePoster(reqId)}
                              className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              View Poster
                            </button>
                          </div>
                        )}

                        {/* ─── Expandable Smart Matched Donors Drawer ─── */}
                        <AnimatePresence>
                          {selectedMatchReq === reqId && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 overflow-hidden"
                            >
                              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                                  Compatible Donors for {bg} ({compatibleDonors.length} Available)
                                </p>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Can accept from: {BLOOD_COMPATIBILITY[bg]?.canReceive?.join(', ')}
                                </span>
                              </div>

                              {compatibleDonors.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-3 text-center">
                                  No compatible donors registered in your local cluster currently.
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pr-1">
                                  {compatibleDonors.map((d) => {
                                    const dName = d.primary_name || d.primaryName || d.name || 'Donor';
                                    const dPhone = d.mobile || d.phone || '';
                                    const dGroup = d.blood_group || d.bloodGroup || '—';
                                    const dCity = d.city || d.meghala || 'Kasaragod';
                                    const dDonations = d.total_donations || d.donationsCount || 0;

                                    return (
                                      <div
                                        key={d.id || d._id}
                                        className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs hover:border-rose-300 transition"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center justify-center">
                                            {dGroup}
                                          </span>
                                          <div>
                                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                              {dName}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                              {dCity} • <strong className="text-rose-600">{dDonations} past donations</strong>
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {dPhone && (
                                            <a
                                              href={`tel:${dPhone}`}
                                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs transition flex items-center gap-1"
                                            >
                                              <Phone className="w-3 h-3 text-rose-600" />
                                              Call
                                            </a>
                                          )}

                                          <button
                                            onClick={() => triggerToast(`Emergency SMS & Alert pushed to ${dName}!`, 'success')}
                                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
                                          >
                                            Dispatch
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>

                    </motion.div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* ── Right Col: Intelligence & Telemetry Panels ── */}
        <div className="space-y-6">

          {/* Committee Jurisdiction Profile */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                Jurisdiction Scope
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 font-black border border-rose-900">
                LEVEL 4
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">District HQ</span>
                <span className="font-bold text-white">{districtName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Block Committee</span>
                <span className="font-bold text-amber-300">{blockName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Meghala Unit</span>
                <span className="font-bold text-rose-300">{committeeName}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Volunteer In-Charge</span>
                <span className="font-bold text-white">{user?.primary_name || user?.name || 'Assigned Volunteer'}</span>
              </div>
            </div>

            <Link
              to="/volunteer/unit-committee"
              className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-center"
            >
              <span>Manage Unit Squad Roster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Blood Compatibility Matrix Explorer */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  Blood Group Matrix
                </h3>
                <p className="text-[11px] text-slate-400">Select blood type to view donor compatibility.</p>
              </div>
            </div>

            {/* Selector Pills */}
            <div className="grid grid-cols-4 gap-1.5">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedMatrixGroup(bg)}
                  className={`py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    selectedMatrixGroup === bg
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>

            {/* Compatibility Result Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  ✓ Can Receive Blood From:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_COMPATIBILITY[selectedMatrixGroup]?.canReceive.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                  ↗ Can Donate Blood To:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BLOOD_COMPATIBILITY[selectedMatrixGroup]?.canDonate.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-xs">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Notification Center */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                Live Broadcasts & Alerts
              </h3>
              {notifications.some(n => !n.read && !n.is_read) && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-1 opacity-20" />
                  <p className="text-xs">No active notifications</p>
                </div>
              ) : (
                notifications.slice(0, 7).map((n) => (
                  <div
                    key={n.id || n._id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1 hover:border-rose-200 transition"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-white">{n.title || 'Alert'}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── Top 5 Smart Donors Modal ─── */}
      <AnimatePresence>
        {top5Modal && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setTop5Modal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                    <Star className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Recommended Donors
                    </h3>
                    <p className="text-xs text-slate-500">
                      Top local candidate matches ranked by availability & proximity.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setTop5Modal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Donors List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
                {top5Modal.donors.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No donors found in immediate area cluster.</p>
                  </div>
                ) : (
                  top5Modal.donors.map((d, i) => {
                    const mobile = d.mobile || d.phone || '';
                    const dName = d.primary_name || d.primaryName || d.name || 'Donor';
                    const dGroup = d.blood_group || d.bloodGroup || '—';

                    return (
                      <div
                        key={d.id || i}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs hover:border-amber-400 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-xl font-black flex items-center justify-center text-xs text-white shadow-xs ${
                            i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-700'
                          }`}>
                            #{i + 1}
                          </span>

                          <div>
                            <p className="font-black text-slate-900 dark:text-white">{dName}</p>
                            <p className="text-[11px] text-slate-500">
                              <strong className="text-rose-600 font-bold">{dGroup}</strong>
                              {d.priority_score ? ` • Match Score: ${d.priority_score}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {mobile && (
                            <a
                              href={`tel:${mobile}`}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-xs"
                            >
                              <Phone className="w-3 h-3" />
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    handlePoster(top5Modal.reqId);
                    setTop5Modal(null);
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl text-xs transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-rose-500" />
                  Generate Blood Poster
                </button>
              </div>
            </motion.div>
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
