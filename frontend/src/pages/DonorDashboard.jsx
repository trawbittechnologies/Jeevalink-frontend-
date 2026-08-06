import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import api from '../store/api.js';
import {
  ClipboardList, CheckCircle2, ShieldCheck, Download, Loader2, X, Search, Phone, RefreshCw,
  Heart, Award, Siren, Droplet, FileText, AlertTriangle, Send, ShieldAlert,
  Share2, Copy, CheckSquare, Square, HeartHandshake, Sparkles, PhoneCall, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PosterModal from '../components/PosterModal.jsx';
import Modal from '../components/Modal.jsx';

export default function DonorDashboard() {
  const { user, setAvailability, updateProfile } = useAuthStore();
  const {
    requests, notifications, fetchRequests, fetchNotifications, triggerToast
  } = useAppStore();

  const [tab, setTab] = useState('matching'); // 'matching' | 'sos' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posterModal, setPosterModal] = useState(null); // { data, reqId }

  // Readiness checklist state
  const [readiness, setReadiness] = useState({
    hydrated: true,
    sleptWell: true,
    ironMeal: true,
    weightChecked: true
  });

  // WhatsApp SOS copy confirmation
  const [copiedSosId, setCopiedSosId] = useState(null);

  // Health popup
  const [showPopup, setShowPopup] = useState(false);
  const [weight, setWeight] = useState('');
  const [lastDonated, setLastDonated] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Technical Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', type: 'Bug Report' });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Complaint Modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ target_id: '', reason: '' });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Ineligible warning modal
  const [showIneligibleModal, setShowIneligibleModal] = useState(false);

  // Mobile expandable section state
  const [showMoreTools, setShowMoreTools] = useState(false);

  // Refresh handler
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchRequests(), fetchNotifications()]);
      triggerToast('Dashboard refreshed', 'success');
    } catch {
      triggerToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRequests, fetchNotifications, triggerToast]);

  useEffect(() => {
    fetchRequests();
    fetchNotifications();

    if (user && !user.weight && !localStorage.getItem('hide_health_info_popup')) {
      const timer = setTimeout(() => setShowPopup(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, fetchRequests, fetchNotifications]);

  const handleSaveHealthInfo = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {};
    if (weight) payload.weight = Number(weight);
    if (lastDonated) {
      payload.lastDonated = lastDonated;
      payload.last_donated_date = lastDonated;
    }

    if (Object.keys(payload).length > 0) {
      const res = await updateProfile(payload);
      if (res.success) {
        triggerToast('Health info updated successfully!', 'success');
      } else {
        triggerToast('Failed to update health info', 'warning');
      }
    }

    localStorage.setItem('hide_health_info_popup', 'true');
    setShowPopup(false);
    setIsSaving(false);
  };

  const handleSkip = () => {
    localStorage.setItem('hide_health_info_popup', 'true');
    setShowPopup(false);
  };

  // Technical Report Submit
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.title.trim() || !reportForm.description.trim()) {
      triggerToast('Please fill in title and description', 'error');
      return;
    }
    setSubmittingReport(true);
    try {
      const res = await api.post('/technical-reports', reportForm);
      if (res.data.success) {
        triggerToast('Technical report submitted successfully!', 'success');
        setReportForm({ title: '', description: '', type: 'Bug Report' });
        setShowReportModal(false);
      } else {
        triggerToast(res.data.message || 'Failed to submit report', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Complaint Submit
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.target_id || !complaintForm.reason.trim()) {
      triggerToast('Please fill in volunteer ID and reason', 'error');
      return;
    }
    setSubmittingComplaint(true);
    try {
      const res = await api.post('/admin/complaints', complaintForm);
      if (res.data.success) {
        triggerToast('Complaint filed. Administrators will review it shortly.', 'success');
        setComplaintForm({ target_id: '', reason: '' });
        setShowComplaintModal(false);
      } else {
        triggerToast(res.data.message || 'Failed to file complaint', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const toggleAvailability = async () => {
    const next = !user?.availableForDonation;
    if (next && user?.eligibilityStatus === 'Ineligible') {
      setShowIneligibleModal(true);
      return;
    }
    const res = await setAvailability(next);
    if (res?.ineligible) {
      setShowIneligibleModal(true);
      return;
    }
    if (res?.success) {
      triggerToast(next ? 'You are now AVAILABLE for donations!' : 'Marked as Unavailable.', next ? 'success' : 'warning');
    }
  };

  // Eligibility calculation
  const getEligibility = () => {
    if (user?.eligibilityStatus === 'Ineligible') {
      return { eligible: false, text: 'Ineligible (Health Deferral)', daysLeft: 0 };
    }
    if (user?.lastDonated) {
      const last = new Date(user.lastDonated);
      const diffTime = Math.abs(new Date() - last);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 90) {
        return { eligible: false, text: `${90 - diffDays} Days Cooldown`, daysLeft: 90 - diffDays };
      }
    }
    if (user?.eligibilityStatus === 'Eligible') {
      return { eligible: true, text: 'Eligible to Donate', daysLeft: 0 };
    }
    return { eligible: null, text: 'Health Verification Pending', daysLeft: 0 };
  };

  const eligibility = getEligibility();

  // Requests filtering
  const currentUserId = user ? String(user._id || user.id) : null;
  const isNotOwner = (r) => currentUserId !== String(r.requested_by || r.requestedBy);

  const pending = requests.filter((r) => r.status === 'Pending' && isNotOwner(r));
  const sos = requests.filter((r) => (r.urgencyLevel === 'Immediate' || r.urgency_level === 'Immediate') && r.status === 'Pending' && isNotOwner(r));

  const userBg = (user?.bloodGroup || user?.blood_group || 'O+').toUpperCase();

  const matchingRequests = requests.filter(r => {
    if (r.status !== 'Pending') return false;
    if (!isNotOwner(r)) return false;
    const reqBg = (r.bloodGroup || r.blood_group || '').toUpperCase();
    if (reqBg === userBg) return true;
    if (userBg === 'O-') return true;
    if (userBg === 'O+' && reqBg.endsWith('+')) return true;
    return false;
  });

  const tabRequests = (tab === 'matching'
    ? matchingRequests
    : tab === 'sos'
      ? sos
      : pending
  ).filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.patientName || r.patient_name || '').toLowerCase().includes(q) ||
      (r.hospitalName || r.hospital_name || r.hospital || '').toLowerCase().includes(q) ||
      (r.city || '').toLowerCase().includes(q) ||
      (r.bloodGroup || r.blood_group || '').toLowerCase().includes(q)
    );
  });

  const handlePoster = (req) => {
    setPosterModal({
      reqId: req._id || req.id,
      data: {
        patientName: req.patientName || req.patient_name || 'Patient',
        bloodGroup: req.bloodGroup || req.blood_group || 'O+',
        unitsRequired: req.unitsRequired || req.units_required || 1,
        hospitalName: req.hospitalName || req.hospital_name || 'Hospital',
        city: req.city || 'City',
        district: req.district || user?.district || 'District',
        bystanderName: req.bystanderName || req.bystander_name || user?.primaryName || 'Contact',
        bystanderPhone: req.contactNumber || req.bystanderPhone || user?.mobile || '',
        urgencyLevel: req.urgencyLevel || req.urgency_level || 'Immediate',
        requiredDate: req.requiredDate || req.required_date || 'ASAP',
      }
    });
  };

  // WhatsApp SOS Share
  const handleShareWhatsApp = (req) => {
    const bg = req.bloodGroup || req.blood_group || 'O+';
    const patient = req.patientName || req.patient_name || 'Patient';
    const hospital = req.hospitalName || req.hospital_name || 'Hospital';
    const city = req.city || 'Location';
    const contact = req.contactNumber || req.contact_number || 'Emergency Desk';
    const units = req.unitsRequired || req.units_required || 1;

    const text = `🚨 *URGENT BLOOD REQUEST — JeevaLink Network* 🚨\n\n🩸 *Blood Group:* ${bg}\n👤 *Patient:* ${patient}\n🏥 *Hospital:* ${hospital}, ${city}\n📦 *Units:* ${units} Unit(s)\n📞 *Contact:* ${contact}\n\nPlease share in your WhatsApp groups & save a life! 🙏\nhttps://jeevalink.org/requests`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Copy SOS summary
  const handleCopySosSummary = (req) => {
    const reqId = req._id || req.id;
    const bg = req.bloodGroup || req.blood_group || 'O+';
    const patient = req.patientName || req.patient_name || 'Patient';
    const hospital = req.hospitalName || req.hospital_name || 'Hospital';
    const contact = req.contactNumber || req.contact_number || '—';

    const summary = `SOS [${bg}] for ${patient} at ${hospital}. Contact: ${contact}. Shared via JeevaLink.`;
    navigator.clipboard.writeText(summary);
    setCopiedSosId(reqId);
    triggerToast('SOS alert copied to clipboard!', 'success');
    setTimeout(() => setCopiedSosId(null), 3000);
  };

  // Compatibility Data
  const COMPATIBILITY_DONATE = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };

  const COMPATIBILITY_RECEIVE = {
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'A-': ['O-', 'A-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'B-': ['O-', 'B-'],
    'O+': ['O-', 'O+'],
    'O-': ['O-']
  };

  const canDonateTo = COMPATIBILITY_DONATE[userBg] || ['All Groups'];
  const canReceiveFrom = COMPATIBILITY_RECEIVE[userBg] || ['All Groups'];

  const totalDonations = user?.totalDonations || 0;
  const rankTitle = totalDonations >= 10 ? 'Platinum Legend 💎' : totalDonations >= 5 ? 'Gold Guardian 🥇' : totalDonations >= 2 ? 'Silver Lifesaver 🥈' : 'Bronze Hero 🥉';

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-left pb-16 select-none px-1 sm:px-0 font-sans">

      {/* ─── 1. MOBILE MINIMAL HERO CARD ─── */}
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 sm:p-6 shadow-md relative overflow-hidden">
        <Droplet className="w-40 h-40 text-white/5 absolute -right-6 -bottom-8 pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-200">User Dashboard</span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {user?.primaryName || user?.primary_name || user?.name || 'Donor'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 text-white font-black text-xs sm:text-sm rounded-full border border-white/30 backdrop-blur-sm">
                {userBg}
              </span>
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Location & Status info */}
          <div className="flex items-center gap-2 text-xs text-red-100 font-medium">
            <span>📍 {user?.city || 'Central'}, {user?.district || 'Kozhikode'}</span>
            <span>•</span>
            <span className="font-bold text-white">{eligibility.text}</span>
          </div>

          {/* Big Tap Toggle Button for Availability */}
          <div className="pt-2 border-t border-white/20">
            <button
              type="button"
              onClick={toggleAvailability}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 ${user?.availableForDonation
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/20'
                  : 'bg-white hover:bg-red-50 text-red-700 shadow-slate-900/10'
                }`}
            >
              <span className={`w-3 h-3 rounded-full ${user?.availableForDonation ? 'bg-white animate-pulse' : 'bg-red-600'}`} />
              <span>{user?.availableForDonation ? 'Status: AVAILABLE for Donation 🟢' : 'Status: UNAVAILABLE (Tap to Enable) ⚪'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. EMERGENCY SOS BANNER (If Active) ─── */}
      {sos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-600 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                <Siren className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-red-950 uppercase tracking-wide">
                  🚨 Urgent SOS Broadcast ({sos.length})
                </h3>
                <p className="text-[11px] text-red-800 font-semibold line-clamp-1">
                  {sos[0].bloodGroup || sos[0].blood_group} needed at {sos[0].hospitalName || sos[0].hospital || 'Hospital'}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full shrink-0">
              Immediate
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${sos[0].contactNumber || sos[0].bystanderPhone || '112'}`}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 fill-white" /> Call Bystander
            </a>
            <button
              type="button"
              onClick={() => handleShareWhatsApp(sos[0])}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── 3. PRIMARY ACTION GRID (2 Large Touch Cards) ─── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/requests"
          className="p-4 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-2xl shadow-2xs transition-all flex flex-col items-start gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Droplet className="w-5 h-5 fill-red-600" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
              Request Blood
            </h3>
            <p className="text-[11px] text-slate-500">Post hospital request</p>
          </div>
        </Link>

        <Link
          to="/donor/search"
          className="p-4 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-2xl shadow-2xs transition-all flex flex-col items-start gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
              Find Donors
            </h3>
            <p className="text-[11px] text-slate-500">Search voluntary network</p>
          </div>
        </Link>
      </div>

      {/* ─── 4. COMPACT STATS SUMMARY ─── */}
      <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="p-2 border-r border-slate-100">
          <p className="text-lg font-black text-slate-900">{user?.livesSaved ?? 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Lives Saved</p>
        </div>
        <div className="p-2 border-r border-slate-100">
          <p className="text-lg font-black text-slate-900">{user?.totalDonations ?? 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Donations</p>
        </div>
        <div className="p-2">
          <p className="text-lg font-black text-slate-900">{user?.rewardPoints ?? 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Points</p>
        </div>
      </div>

      {/* ─── 5. BLOOD REQUESTS QUEUE ─── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        {/* Section Title & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Blood Requests</h3>
            <p className="text-[11px] text-slate-500">Nearby requests matching donors in Kerala</p>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search request..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[
            ['matching', 'Matching', matchingRequests.length],
            ['sos', 'Urgent SOS', sos.length],
            ['all', 'All', pending.length],
          ].map(([val, label, count]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTab(val)}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${tab === val
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>{label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tab === val ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Request Cards List */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
          {tabRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <ClipboardList className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-medium">No blood requests in this tab</p>
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
              const urgency = req.urgency_level || req.urgencyLevel || 'Normal';

              return (
                <div key={reqId} className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 hover:border-red-200 transition bg-white shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-600 text-white font-black text-xs rounded">
                          {bg}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{patient}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        🏥 {hospital}, {city} • <strong>{units} Unit(s)</strong>
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${urgency === 'Immediate' || urgency === 'SOS'
                        ? 'bg-red-50 text-red-700 border-red-200 font-extrabold animate-pulse'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                      {urgency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                    {contact !== '—' && (
                      <a
                        href={`tel:${contact}`}
                        className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 fill-white" /> Call
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(req)}
                      className="flex-1 py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePoster(req)}
                      className="py-1.5 px-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Poster"
                    >
                      <Download className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── 6. EXPANDABLE MORE TOOLS & HEALTH CHECKLIST ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowMoreTools(!showMoreTools)}
          className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>Donation Health, Compatibility & Support</span>
          </span>
          {showMoreTools ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        <AnimatePresence>
          {showMoreTools && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 border-t border-slate-100 space-y-4 text-xs"
            >
              {/* Compatibility Summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-red-600 fill-red-600" /> Group {userBg} Compatibility
                </p>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <p><strong>Can Donate To:</strong> {canDonateTo.join(', ')}</p>
                  <p><strong>Can Receive From:</strong> {canReceiveFrom.join(', ')}</p>
                </div>
              </div>

              {/* Pre-Donation Checklist */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Pre-Donation Quick Checklist</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'hydrated', label: 'Hydrated (Water)', icon: '💧' },
                    { key: 'sleptWell', label: 'Slept Well', icon: '😴' },
                    { key: 'ironMeal', label: 'Iron Meal', icon: '🥗' },
                    { key: 'weightChecked', label: 'Weight > 50kg', icon: '⚖️' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setReadiness(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer text-[11px] ${readiness[item.key]
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                    >
                      <span>{item.icon} {item.label}</span>
                      {readiness[item.key] ? <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Links */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <Link
                  to="/donor/eligibility"
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-center transition"
                >
                  Health Questionnaire
                </Link>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-center transition cursor-pointer"
                >
                  Report Tech Issue
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── MODALS ─── */}

      {/* Poster Modal */}
      {posterModal && (
        <PosterModal
          isOpen={!!posterModal}
          onClose={() => setPosterModal(null)}
          requestData={posterModal.data}
        />
      )}

      {/* Missing Health Info Modal */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl relative space-y-4 text-left"
            >
              <button
                type="button"
                onClick={handleSkip}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-red-100">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Complete Your Health Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter weight & last donation date for eligibility calculation.</p>
              </div>

              <form onSubmit={handleSaveHealthInfo} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 65"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Last Donated Date</label>
                  <input
                    type="date"
                    value={lastDonated}
                    onChange={(e) => setLastDonated(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900 cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Log'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Technical Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl relative space-y-3 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Report Technical Issue</h3>
                <button type="button" onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Report Type</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                    value={reportForm.type}
                    onChange={(e) => setReportForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    {['Bug Report', 'Feature Request', 'Account Issue', 'Donation Issue', 'App Feedback', 'Other'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Title *</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                    placeholder="Brief summary of issue"
                    value={reportForm.title}
                    onChange={(e) => setReportForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Details *</label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900 resize-none"
                    rows={3}
                    placeholder="Describe issue..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {submittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Report
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Volunteer Complaint Modal */}
      <AnimatePresence>
        {showComplaintModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl relative space-y-3 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">File a Complaint</h3>
                <button type="button" onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitComplaint} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Target ID / Mobile *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900"
                    placeholder="User ID or mobile"
                    value={complaintForm.target_id}
                    onChange={(e) => setComplaintForm((f) => ({ ...f, target_id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Reason *</label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-900 resize-none"
                    rows={3}
                    placeholder="Describe issue..."
                    value={complaintForm.reason}
                    onChange={(e) => setComplaintForm((f) => ({ ...f, reason: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {submittingComplaint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Complaint
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ineligible Warning Modal */}
      <Modal
        isOpen={showIneligibleModal}
        onClose={() => setShowIneligibleModal(false)}
        title="Health Eligibility Deferral"
      >
        <div className="space-y-3 text-left">
          <div className="w-10 h-10 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold text-slate-900">You Are Currently Ineligible</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Donation status cannot be turned <strong>AVAILABLE</strong> because your status is currently marked as <strong>Ineligible</strong>.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowIneligibleModal(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <Link
              to="/donor/eligibility"
              onClick={() => setShowIneligibleModal(false)}
              className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition text-center shadow-2xs cursor-pointer flex items-center justify-center gap-1"
            >
              Health Check
            </Link>
          </div>
        </div>
      </Modal>

    </div>
  );
}
