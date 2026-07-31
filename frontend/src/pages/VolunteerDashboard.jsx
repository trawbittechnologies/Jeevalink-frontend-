import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import api from '../store/api.js';
import {
  ClipboardList, CheckCircle2, XCircle,
  Bell, Users, Download, Star,
  AlertCircle, Loader2, X, Search, RefreshCw
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PosterModal from '../components/PosterModal.jsx';

export default function VolunteerDashboard() {
  const {
    requests, donors, allUsers, notifications,
    fetchRequests, fetchNotifications, fetchUsers,
    rejectRequest, fulfillRequest, markAllNotificationsRead, triggerToast
  } = useAppStore();
  const { user } = useAuthStore();

  const [tab, setTab] = useState('pending');
  const [pendingFromServer, setPendingFromServer] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [selectedMatchReq, setSelectedMatchReq] = useState(null);
  const [top5Modal, setTop5Modal] = useState(null);   // { reqId, donors }
  const [loadingTop5, setLoadingTop5] = useState(false);
  const [posterModal, setPosterModal] = useState(null); // { data, reqId }
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

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
      triggerToast('Dashboard refreshed', 'success');
    } catch (err) {
      console.error('Refresh error:', err);
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

  const COMPATIBILITY_MAP = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
  };

  const getCompatibleDonors = (bloodGroup) => {
    const groups = COMPATIBILITY_MAP[bloodGroup] || [];
    const sourceList = (donors && donors.length > 0) ? donors : (allUsers || []).filter(u => u.role === 'user');
    return sourceList.filter((d) => {
      const isAvail = d.availableForDonation ?? d.available_for_donation ?? true;
      const dGroup = d.bloodGroup || d.blood_group;
      return isAvail && groups.includes(dGroup);
    });
  };

  // ── Approve blood request (Volunteer → verified → public) ──────────
  const handleApprove = async (reqId) => {
    setApprovingId(reqId);
    try {
      const res = await api.patch(`/requests/${reqId}/approve`);
      if (res.data.success) {
        triggerToast('Blood request approved and published', 'success');
        setPendingFromServer((prev) => prev.filter((r) => (r.id || r._id) !== reqId));
        fetchRequests();
        handleGetTop5(reqId);
      } else {
        triggerToast(res.data.message || 'Approval failed', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // ── Reject blood request ───────────────────────────────────────────
  const handleReject = async (reqId) => {
    setRejectingId(reqId);
    try {
      const res = await rejectRequest(reqId);
      if (res.success || res) {
        setPendingFromServer((prev) => prev.filter((r) => (r.id || r._id) !== reqId));
        fetchRequests();
        triggerToast('Blood request rejected', 'info');
      }
    } catch (err) {
      console.error('Reject error:', err);
      triggerToast('Failed to reject request', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  // ── Top 5 donors recommendation ────────────────────────────────────
  const handleGetTop5 = async (reqId) => {
    setLoadingTop5(true);
    try {
      const res = await api.post(`/requests/${reqId}/top-donors`);
      if (res.data.success) {
        setTop5Modal({ reqId, donors: Array.isArray(res.data.data) ? res.data.data : [] });
      }
    } catch (err) {
      console.warn('Top-5 fetch failed:', err);
      triggerToast('Could not fetch recommended donors', 'warning');
    } finally {
      setLoadingTop5(false);
    }
  };

  // ── Poster download ────────────────────────────────────────────────
  const handlePoster = async (reqId) => {
    try {
      const res = await api.get(`/posters/blood-request/${reqId}`);
      if (res.data.success) {
        setPosterModal({ data: res.data.data, reqId });
      } else {
        const reqObj = requests.find(r => (r.id || r._id) === reqId) || pendingFromServer.find(r => (r.id || r._id) === reqId);
        setPosterModal({ data: reqObj, reqId });
      }
    } catch {
      const reqObj = requests.find(r => (r.id || r._id) === reqId) || pendingFromServer.find(r => (r.id || r._id) === reqId);
      setPosterModal({ data: reqObj, reqId });
    }
  };

  // Filter lists
  const unverified = requests.filter((r) => !r.verified && r.status === 'Pending');
  const verified = requests.filter((r) => r.verified && r.status === 'Pending');
  const fulfilled = requests.filter((r) => r.status === 'Fulfilled');

  const stats = [
    { label: 'Pending Approval', value: pendingFromServer.length },
    { label: 'Verified Active', value: verified.length },
    { label: 'Fulfilled Requests', value: fulfilled.length },
    { label: 'Unread Alerts', value: notifications.filter((n) => !n.read && !n.is_read).length },
  ];

  const rawTabRequests = tab === 'pending'
    ? (pendingFromServer.length > 0 ? pendingFromServer : unverified)
    : tab === 'verified'
    ? verified
    : fulfilled;

  const tabRequests = rawTabRequests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const patient = (r.patient_name || r.patientName || '').toLowerCase();
    const hospital = (r.hospital_name || r.hospitalName || '').toLowerCase();
    const city = (r.city || '').toLowerCase();
    const bg = (r.blood_group || r.bloodGroup || '').toLowerCase();
    return patient.includes(q) || hospital.includes(q) || city.includes(q) || bg.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16 select-none">

      {/* ─── Clean Header (Humanized Red & White) ─── */}
      <div className="bg-red-600 text-white rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Volunteer Dashboard</h1>
            <p className="text-red-100 text-sm mt-1">
              Welcome, <span className="font-semibold text-white">
                {(() => {
                  const raw = user?.full_name || user?.name || 'Volunteer';
                  const parts = raw.split(/[&,]+/).map(s => s.trim()).filter(Boolean);
                  return Array.from(new Set(parts)).join(' & ') || 'Volunteer';
                })()}
              </span>
              {user?.meghala ? ` — ${user.meghala} Meghala` : ''}
            </p>
            <div className="flex items-center gap-3 text-xs text-red-100 mt-3 pt-3 border-t border-red-500/50">
              <span>District: <strong className="text-white">{user?.district || 'Kasaragod'}</strong></span>
              <span>•</span>
              <span>Block: <strong className="text-white">{user?.blockCommitteeName || user?.block_committee_name || 'Central'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/volunteer/users"
              className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> Manage Users
            </Link>
            <button
              onClick={handleRefreshAll}
              disabled={loadingPending}
              className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ─── Clean Overview Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-3xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Pending Approval Queue ─── */}
      {pendingFromServer.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div>
              <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Pending Verification ({pendingFromServer.length})
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Review blood requests before publishing them to the public feed.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingFromServer.map((req) => {
              const reqId = req.id || req._id;
              const bg = req.blood_group || req.bloodGroup || '—';
              const patient = req.patient_name || req.patientName || 'Patient';
              const hospital = req.hospital_name || req.hospitalName || 'Hospital';
              const city = req.city || 'Location';
              const units = req.units_required || req.unitsRequired || 1;
              const contact = req.contact_number || req.contactNumber || '—';

              return (
                <div key={reqId} className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold text-xs rounded">
                          {bg}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{patient}</h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {hospital}, {city} • <strong>{units} Unit{units > 1 ? 's' : ''}</strong>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Contact: <a href={`tel:${contact}`} className="text-red-600 font-semibold hover:underline">{contact}</a>
                        {req.requester_name ? ` • By: ${req.requester_name}` : ''}
                      </p>
                    </div>

                    <span className="self-start text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                      {req.urgency_level || req.urgencyLevel || 'Normal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(reqId)}
                      disabled={approvingId === reqId}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {approvingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReject(reqId)}
                      disabled={rejectingId === reqId}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {rejectingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Reject
                    </button>
                    <button
                      onClick={() => handlePoster(reqId)}
                      className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-red-600" /> Poster
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

        {/* ── Left Column: All Requests ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            {/* Queue Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Blood Requests Queue</h3>
                <p className="text-xs text-slate-500">Manage verified and active requests in your area.</p>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 text-slate-900"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {[
                ['pending', 'Pending Approval', (pendingFromServer.length > 0 ? pendingFromServer.length : unverified.length)],
                ['verified', 'Verified Active', verified.length],
                ['fulfilled', 'Fulfilled', fulfilled.length],
              ].map(([val, label, count]) => (
                <button
                  key={val}
                  onClick={() => setTab(val)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === val
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === val ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Request Cards */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
              {tabRequests.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No requests in this view</p>
                </div>
              ) : (
                tabRequests.map((req) => {
                  const reqId = req.id || req._id;
                  const bg = req.blood_group || req.bloodGroup || '—';
                  const patient = req.patient_name || req.patientName || 'Patient';
                  const hospital = req.hospital_name || req.hospitalName || 'Hospital';
                  const city = req.city || 'Location';
                  const units = req.units_required || req.unitsRequired || 1;
                  const contact = req.contact_number || req.contactNumber || '—';

                  return (
                    <div key={reqId} className="border border-slate-200 rounded-xl p-4 space-y-3 hover:border-red-200 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold text-xs rounded">
                              {bg}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{patient}</h4>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {hospital}, {city} • <strong>{units} Unit{units > 1 ? 's' : ''}</strong>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Contact: <a href={`tel:${contact}`} className="text-red-600 font-semibold hover:underline">{contact}</a>
                          </p>
                        </div>

                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                          {req.urgency_level || req.urgencyLevel || 'Normal'}
                        </span>
                      </div>

                      {tab === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleApprove(reqId)}
                            disabled={approvingId === reqId}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            {approvingId === reqId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Approve
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

                      {tab === 'verified' && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setSelectedMatchReq(selectedMatchReq === reqId ? null : reqId)}
                              className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100 transition cursor-pointer border border-red-200"
                            >
                              {selectedMatchReq === reqId ? 'Hide Donors' : '🔍 Match Donors'}
                            </button>
                            <button
                              onClick={() => handleGetTop5(reqId)}
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
                              onClick={() => fulfillRequest(reqId)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-100 transition cursor-pointer border border-emerald-200 ml-auto"
                            >
                              Mark Fulfilled
                            </button>
                          </div>

                          {/* Match Donors Expanded Drawer */}
                          {selectedMatchReq === reqId && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Compatible Donors ({bg}) — {getCompatibleDonors(bg).length} Available
                              </p>
                              {getCompatibleDonors(bg).length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No compatible donors found.</p>
                              ) : (
                                getCompatibleDonors(bg).map((d) => {
                                  const dName = d.full_name || d.fullName || d.name || 'Donor';
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

                      {tab === 'fulfilled' && (
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

        {/* ── Right Column: Notifications & Scope ── */}
        <div className="space-y-4">
          
          {/* Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-600" />
                Notifications
              </h3>
              {notifications.some(n => !n.read && !n.is_read) && (
                <button onClick={markAllNotificationsRead} className="text-xs font-semibold text-red-600 hover:underline cursor-pointer">
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No notifications yet</p>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <div key={n.id || n._id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">{n.title}</p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scope Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Jurisdiction Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Meghala</span>
                <span className="font-bold">{user?.meghala || 'All Meghalas'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Block Committee</span>
                <span className="font-bold">{user?.blockCommitteeName || user?.block_committee_name || 'Central'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">District</span>
                <span className="font-bold">{user?.district || 'Kasaragod'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─── Top 5 Donors Modal ─── */}
      <AnimatePresence>
        {top5Modal && (
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={() => setTop5Modal(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Recommended Donors</h3>
                <button onClick={() => setTop5Modal(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {top5Modal.donors.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No donors found in area.</p>
                ) : (
                  top5Modal.donors.map((d, i) => {
                    const mobile = d.mobile || d.phone || '';
                    return (
                      <div key={d.id || i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[11px]">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{d.full_name || d.fullName || d.name}</p>
                            <p className="text-[11px] text-slate-500"><strong className="text-red-600">{d.blood_group || d.bloodGroup}</strong> • Score: {d.priority_score ?? '—'}</p>
                          </div>
                        </div>
                        {mobile && (
                          <a href={`tel:${mobile}`} className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700">
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
