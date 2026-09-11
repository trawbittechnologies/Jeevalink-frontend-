import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import api from '../store/api.js';
import {
  Loader2, X, Phone, RefreshCw,
  Heart, Siren, Droplet, Send, ShieldAlert, ShieldCheck,
  Share2, MapPin, Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/Modal.jsx';
import NotificationPermissionBanner from '../components/NotificationPermissionBanner.jsx';

export default function DonorDashboard() {
  const { user, setAvailability, updateProfile } = useAuthStore();
  const {
    requests, fetchRequests, fetchNotifications, triggerToast
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Health popup
  const [showPopup, setShowPopup] = useState(false);
  const [weight, setWeight] = useState('');
  const [lastDonated, setLastDonated] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Technical Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', type: 'Bug Report' });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Ineligible warning modal
  const [showIneligibleModal, setShowIneligibleModal] = useState(false);

  // Refresh handler
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchRequests(), fetchNotifications()]);
      triggerToast('Dashboard updated', 'success');
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
        triggerToast('Health info saved', 'success');
      } else {
        triggerToast('Failed to save health info', 'warning');
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
        triggerToast('Technical report submitted successfully', 'success');
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
      triggerToast(next ? 'Marked as Available for donation' : 'Marked as Unavailable', next ? 'success' : 'warning');
    }
  };

  // Eligibility calculation
  const getEligibility = () => {
    if (user?.eligibilityStatus === 'Ineligible') {
      return { eligible: false, text: 'Ineligible (Health Deferral)' };
    }
    if (user?.lastDonated) {
      const last = new Date(user.lastDonated);
      const diffTime = Math.abs(new Date() - last);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 90) {
        return { eligible: false, text: `${90 - diffDays} Days Cooldown` };
      }
    }
    if (user?.eligibilityStatus === 'Eligible') {
      return { eligible: true, text: 'Eligible to Donate' };
    }
    return { eligible: null, text: 'Health Status Active' };
  };

  const eligibility = getEligibility();

  // Requests filtering for SOS
  const currentUserId = user ? String(user._id || user.id) : null;
  const isNotOwner = (r) => currentUserId !== String(r.requested_by || r.requestedBy);
  const sos = requests.filter((r) => ['Immediate', 'Emergency SOS'].includes(r.urgencyLevel || r.urgency_level) && ['Pending', 'Waiting', 'Accepted'].includes(r.status) && isNotOwner(r));

  const userBg = (user?.bloodGroup || user?.blood_group || 'O+').toUpperCase();

  // WhatsApp SOS Share
  const handleShareWhatsApp = (req) => {
    const bg = req.bloodGroup || req.blood_group || 'O+';
    const patient = req.patientName || req.patient_name || 'Patient';
    const hospital = req.hospitalName || req.hospital_name || 'Hospital';
    const city = req.city || 'Location';
    const contact = req.contactNumber || req.contact_number || 'Emergency Desk';
    const units = req.unitsRequired || req.units_required || 1;

    const text = `*URGENT BLOOD REQUEST — iDonate Network*\n\nBlood Group: ${bg}\nPatient: ${patient}\nHospital: ${hospital}, ${city}\nUnits: ${units} Unit(s)\nContact: ${contact}\n\nPlease share and save a life.\n${window.location.origin}/requests`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 text-left pb-12 select-none px-1 sm:px-0 font-sans text-slate-900">

      {/* ─── 1. MINIMAL HERO PROFILE & AVAILABILITY CARD ─── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Blood Group Badge */}
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm shadow-red-600/20">
              {userBg}
            </div>

            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                {user?.primaryName || user?.primary_name || user?.name || 'User Dashboard'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user?.city || 'Central'}, {user?.district || 'Kozhikode'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Clean Availability Toggle Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={toggleAvailability}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-between cursor-pointer border ${user?.availableForDonation
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/80'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${user?.availableForDonation ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
              <span>{user?.availableForDonation ? 'Available to Donate Blood' : 'Marked as Unavailable'}</span>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {user?.availableForDonation ? 'Active' : 'Tap to enable'}
            </span>
          </button>
        </div>
      </div>

      <NotificationPermissionBanner 
        onPermissionGranted={() => triggerToast('Push notifications enabled successfully', 'success')} 
      />

      {/* ─── 2. EMERGENCY SOS ALERT BANNER ─── */}
      {sos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <Siren className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-red-950 uppercase tracking-wider">
                  Emergency Request ({sos.length})
                </h3>
                <p className="text-xs text-red-800 font-medium">
                  <strong>{sos[0].bloodGroup || sos[0].blood_group}</strong> required at {sos[0].hospitalName || sos[0].hospital || 'Hospital'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${sos[0].contactNumber || sos[0].bystanderPhone || '112'}`}
              className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 fill-white" /> Call Bystander
            </a>
            <button
              type="button"
              onClick={() => handleShareWhatsApp(sos[0])}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      )}

      {/* ─── 3. PRIMARY QUICK ACTIONS (2 LARGE TOUCH BUTTONS) ─── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/requests"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs transition-all flex flex-col items-start gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
            <Droplet className="w-5 h-5 fill-red-600" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
              Request Blood
            </h3>
            <p className="text-[11px] text-slate-500">Post hospital requirement</p>
          </div>
        </Link>

        <Link
          to="/donor/eligibility"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs transition-all flex flex-col items-start gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Health Eligibility
            </h3>
            <p className="text-[11px] text-slate-500">Check donation readiness</p>
          </div>
        </Link>
      </div>

      {/* ─── 4. MINIMAL STATS BAR ─── */}
      <div className="grid grid-cols-3 gap-2 text-center bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="p-1">
          <p className="text-base font-black text-slate-900">{user?.livesSaved ?? 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Lives Saved</p>
        </div>
        <div className="p-1 border-x border-slate-100">
          <p className="text-base font-black text-slate-900">{user?.totalDonations ?? 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Donations</p>
        </div>
        <div className="p-1">
          <p className="text-base font-black text-slate-900">{user?.rewardPoints ?? 0}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">JeevaPoints</p>
        </div>
      </div>

      {/* ─── 5. CLEAN ACCOUNT & SUPPORT UTILITIES ─── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900">Health Status & Support</h3>
          <span className="text-[11px] font-semibold text-emerald-600">{eligibility.text}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <Link
            to="/support"
            className="py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl text-center transition flex items-center justify-center gap-1.5"
          >
            <Headphones className="w-3.5 h-3.5" /> Support & AI Help
          </Link>
          <Link
            to="/donor/eligibility"
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-center transition flex items-center justify-center"
          >
            Health Check
          </Link>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-center transition cursor-pointer flex items-center justify-center"
          >
            Report Issue
          </button>
        </div>
      </div>

      {/* ─── MODALS ─── */}

      {/* Health Info Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl relative space-y-4 text-left"
            >
              <button
                type="button"
                onClick={handleSkip}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-red-100">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Health Log Update</h3>
                <p className="text-xs text-slate-500 mt-0.5">Please update weight & last donation date.</p>
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
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 disabled:opacity-60 cursor-pointer"
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
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl relative space-y-3 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">Report Issue</h3>
                <button type="button" onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {submittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Report
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
        title="Health Eligibility Status"
      >
        <div className="space-y-3 text-left">
          <div className="w-10 h-10 bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold text-slate-900">You Are Currently Ineligible</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Availability cannot be turned ON because your status is currently marked as Ineligible.
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
