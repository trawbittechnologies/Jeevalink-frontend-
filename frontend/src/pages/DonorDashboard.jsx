import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import api from '../store/api.js';
import {
  ClipboardList, CheckCircle2, ShieldCheck, Download, Loader2, X, Search, Phone, RefreshCw,
  Heart, Award, Siren, Droplet, FileText, AlertTriangle, Send, ShieldAlert,
  Share2, Copy, CheckSquare, Square, HeartHandshake, Sparkles, PhoneCall
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

  // Creative feature state: Readiness checklist
  const [readiness, setReadiness] = useState({
    hydrated: true,
    sleptWell: true,
    ironMeal: true,
    weightChecked: true
  });

  // Creative feature state: WhatsApp SOS copy confirmation
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

  // Complaint Against Volunteer Modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ target_id: '', reason: '' });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Ineligible warning modal
  const [showIneligibleModal, setShowIneligibleModal] = useState(false);

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
        return { eligible: false, text: `${90 - diffDays} Days Cooldown Remaining`, daysLeft: 90 - diffDays };
      }
    }
    if (user?.eligibilityStatus === 'Eligible') {
      return { eligible: true, text: 'Eligible to Donate Blood', daysLeft: 0 };
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

  // WhatsApp SOS Share Generator
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

  // Blood Group Compatibility Calculator Data
  const COMPATIBILITY_DONATE = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };

  const COMPATIBILITY_RECEIVE = {
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal recipient
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'A-': ['O-', 'A-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'B-': ['O-', 'B-'],
    'O+': ['O-', 'O+'],
    'O-': ['O-']
  };

  const canDonateTo = COMPATIBILITY_DONATE[userBg] || ['All Compatible Groups'];
  const canReceiveFrom = COMPATIBILITY_RECEIVE[userBg] || ['All Compatible Groups'];

  // Donor Rank / Level Calculation
  const totalDonations = user?.totalDonations || 0;
  const rankInfo = totalDonations >= 10
    ? { title: 'Platinum Legend 💎', progress: 100, next: 'Max Level Achieved!' }
    : totalDonations >= 5
    ? { title: 'Gold Guardian 🥇', progress: Math.min(100, ((totalDonations - 5) / 5) * 100), next: `${10 - totalDonations} more for Platinum` }
    : totalDonations >= 2
    ? { title: 'Silver Lifesaver 🥈', progress: Math.min(100, ((totalDonations - 2) / 3) * 100), next: `${5 - totalDonations} more for Gold` }
    : { title: 'Bronze Hero 🥉', progress: Math.min(100, (totalDonations / 2) * 100), next: `${2 - totalDonations} more for Silver` };

  const unread = notifications.filter((n) => !n.read).length;

  const stats = [
    { label: 'Lives Saved', value: user?.livesSaved ?? 0 },
    { label: 'Total Donations', value: user?.totalDonations ?? 0 },
    { label: 'JeevaPoints', value: user?.rewardPoints ?? 0 },
    { label: 'Urgent SOS', value: sos.length },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16 select-none">

      {/* ─── Clean Header (Matching Volunteer Dashboard) ─── */}
      <div className="bg-red-600 text-white rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Subtle accent icon in background */}
        <Droplet className="w-48 h-48 text-white/5 absolute -right-8 -bottom-10 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold tracking-tight">User Dashboard</h1>
              <span className="px-2.5 py-0.5 bg-white/20 text-white font-extrabold text-[10px] rounded-full border border-white/25">
                {rankInfo.title}
              </span>
            </div>
            <p className="text-red-100 text-sm">
              Welcome, <span className="font-semibold text-white">
                {user?.primaryName || user?.primary_name || user?.name || 'Donor'}
              </span>
              {user?.bloodGroup || user?.blood_group ? ` — Blood Group ${user.bloodGroup || user.blood_group}` : ''}
            </p>
            <div className="flex items-center gap-3 text-xs text-red-100 mt-3 pt-3 border-t border-red-500/50 flex-wrap">
              <span>District: <strong className="text-white">{user?.district || 'Kozhikode'}</strong></span>
              <span>•</span>
              <span>City: <strong className="text-white">{user?.city || 'Central'}</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-white">{user?.availableForDonation ? 'Available 🟢' : 'Unavailable ⚪'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={toggleAvailability}
              className={`px-4 py-2 font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer ${
                user?.availableForDonation
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white text-red-700 hover:bg-red-50'
              }`}
            >
              <Heart className="w-4 h-4" />
              {user?.availableForDonation ? 'Available to Donate' : 'Mark Available'}
            </button>

            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ─── CREATIVE FEATURE 1: Emergency SOS Live Radar Broadcast Alert ─── */}
      {sos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-600 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-red-950 uppercase tracking-wide">
                    🚨 Emergency SOS Broadcast Alert!
                  </h3>
                  <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold rounded-full animate-pulse">
                    {sos.length} Active SOS
                  </span>
                </div>
                <p className="text-xs text-red-800 font-medium mt-0.5">
                  Critical patient in <strong>{sos[0].hospitalName || sos[0].hospital || 'Hospital'}</strong> needs <strong>{sos[0].bloodGroup || sos[0].blood_group}</strong> blood immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${sos[0].contactNumber || sos[0].bystanderPhone || '112'}`}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <PhoneCall className="w-4 h-4 fill-white" /> Call Bystander
              </a>
              <button
                onClick={() => handleShareWhatsApp(sos[0])}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Clean Overview Stats (Matching Volunteer Dashboard) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-3xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Main Grid Layout ─── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left Column: Blood Requests Queue ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Requests Queue */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">

            {/* Queue Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Blood Requests Queue</h3>
                <p className="text-xs text-slate-500">View and respond to active blood requests in your area.</p>
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
                ['matching', 'Matching My Group', matchingRequests.length],
                ['sos', 'Urgent SOS', sos.length],
                ['all', 'All Requests', pending.length],
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

            {/* Request Cards List */}
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
              {tabRequests.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No blood requests matching this view</p>
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
                    <div key={reqId} className="border border-slate-200 rounded-xl p-4 space-y-3 hover:border-red-200 transition bg-white">
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

                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          urgency === 'Immediate' || urgency === 'SOS'
                            ? 'bg-red-50 text-red-700 border-red-200 font-extrabold animate-pulse'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {urgency}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                        {contact !== '—' && (
                          <a
                            href={`tel:${contact}`}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5 fill-white" /> Contact Bystander
                          </a>
                        )}
                        <button
                          onClick={() => handleShareWhatsApp(req)}
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                        <button
                          onClick={() => handleCopySosSummary(req)}
                          className="px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedSosId === reqId ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedSosId === reqId ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handlePoster(req)}
                          className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-red-600" /> Poster
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* ─── CREATIVE FEATURE 2: Blood Group Compatibility Matrix Widget ─── */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-100">
                  {userBg}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Blood Compatibility Radar</h3>
                  <p className="text-[11px] text-slate-500">Your lifesaving compatibility breakdown</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                Group {userBg}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {/* Can Donate To */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Droplet className="w-3.5 h-3.5 text-red-600 fill-red-600" /> You Can Donate To:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {canDonateTo.map((g) => (
                    <span key={g} className="px-2 py-0.5 bg-red-600 text-white font-extrabold text-[11px] rounded">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Can Receive From */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" /> You Can Receive From:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {canReceiveFrom.map((g) => (
                    <span key={g} className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[11px] rounded">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Column: Health Status, Quick Actions & Creative Badges ── */}
        <div className="space-y-4">

          {/* ─── CREATIVE FEATURE 3: Gamified Hero Rank & XP Progress Card ─── */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" /> Hero Milestone Rank
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                {user?.rewardPoints || 0} XP
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                <span>{rankInfo.title}</span>
                <span className="text-slate-400 text-[10px]">{totalDonations} Donations</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${rankInfo.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                🎯 {rankInfo.next}
              </p>
            </div>
          </div>

          {/* ─── CREATIVE FEATURE 4: Pre-Donation Health Readiness Checklist ─── */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-600" /> Pre-Donation Checklist
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Ready Check</span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'hydrated', label: 'Hydrated (500ml Water)', icon: '💧' },
                { key: 'sleptWell', label: '8 Hours Sleep Last Night', icon: '😴' },
                { key: 'ironMeal', label: 'Eaten Iron-Rich Meal', icon: '🥗' },
                { key: 'weightChecked', label: 'Weight > 50 kg', icon: '⚖️' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setReadiness(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                    readiness[item.key]
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{item.icon}</span> {item.label}
                  </span>
                  {readiness[item.key] ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Health Eligibility Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Donation Eligibility
            </h3>

            <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              eligibility.eligible === true
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : eligibility.eligible === false
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {eligibility.text}
              </p>
              {user?.lastDonated && (
                <p className="text-[11px] opacity-80 mt-1">
                  Last Donated: {new Date(user.lastDonated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            <Link
              to="/donor/eligibility"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition text-center block"
            >
              Take Health Questionnaire
            </Link>
          </div>

          {/* 2. Quick Actions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Quick Actions
            </h3>

            <div className="space-y-2">
              <Link
                to="/requests"
                className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-red-600 fill-red-600" /> Request Blood
                </span>
                <span>→</span>
              </Link>

              <Link
                to="/donor/search"
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-500" /> Find Donors
                </span>
                <span>→</span>
              </Link>

              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Report Tech Issue
                </span>
                <span>+</span>
              </button>

              <button
                onClick={() => setShowComplaintModal(true)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> File Complaint
                </span>
                <span>+</span>
              </button>
            </div>
          </div>

          {/* 3. Notifications */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Notifications</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {unread} unread
              </span>
            </div>

            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No notifications</p>
              ) : (
                notifications.slice(0, 4).map((n) => (
                  <div key={n._id || n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 text-xs">
                    <p className="font-bold text-slate-900 truncate">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

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
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative space-y-4"
            >
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-red-100">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Complete Your Health Log</h3>
                <p className="text-xs text-slate-500 mt-1">Provide weight & last donation date for accurate eligibility calculation.</p>
              </div>

              <form onSubmit={handleSaveHealthInfo} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 65"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Last Donated Date</label>
                  <input
                    type="date"
                    value={lastDonated}
                    onChange={(e) => setLastDonated(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 text-slate-900 cursor-pointer"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 disabled:opacity-60"
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Report Technical Issue</h3>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Report Type</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 text-slate-900"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 text-slate-900"
                    placeholder="Brief summary of the issue"
                    value={reportForm.title}
                    onChange={(e) => setReportForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Details *</label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-red-500 text-slate-900 resize-none"
                    rows={4}
                    placeholder="Describe what happened or what you need..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">File a Complaint</h3>
                <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitComplaint} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Volunteer / User ID *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 text-slate-900"
                    placeholder="Enter user ID or mobile number"
                    value={complaintForm.target_id}
                    onChange={(e) => setComplaintForm((f) => ({ ...f, target_id: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Reason for Complaint *</label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 text-slate-900 resize-none"
                    rows={4}
                    placeholder="Describe the issue in detail..."
                    value={complaintForm.reason}
                    onChange={(e) => setComplaintForm((f) => ({ ...f, reason: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
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
        <div className="space-y-4 text-left">
          <div className="w-12 h-12 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-base font-bold text-slate-900">You Are Currently Ineligible</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Your donation availability cannot be turned <strong>ON</strong> because your status is currently marked as <strong>Ineligible</strong>.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowIneligibleModal(false)}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <Link
              to="/donor/eligibility"
              onClick={() => setShowIneligibleModal(false)}
              className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition text-center shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              Health Check
            </Link>
          </div>
        </div>
      </Modal>

    </div>
  );
}
