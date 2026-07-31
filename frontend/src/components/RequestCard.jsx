import { useState } from 'react';
import { Droplet, Clock, Building2, Phone, CheckCircle2, ShieldAlert, Flag, AlertTriangle, X, MapPin, Download, Edit3, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import Modal from './Modal.jsx';
import PosterModal from './PosterModal.jsx';
import EditRequestModal from './EditRequestModal.jsx';
import DeleteConfirmModal from './DeleteConfirmModal.jsx';

const urgencyConfig = {
  Immediate: { bg: 'bg-red-600',    text: 'text-white',      icon: ShieldAlert, label: 'SOS — Immediate' },
  Critical:  { bg: 'bg-orange-500', text: 'text-white',      icon: ShieldAlert, label: 'Critical' },
  Moderate:  { bg: 'bg-amber-400',  text: 'text-amber-900',  icon: Clock,       label: 'Moderate' },
};

const bloodColors = {
  'A+': 'bg-red-600 text-white',
  'A-': 'bg-rose-500 text-white',
  'B+': 'bg-orange-500 text-white',
  'B-': 'bg-amber-500 text-white',
  'AB+': 'bg-purple-600 text-white',
  'AB-': 'bg-violet-600 text-white',
  'O+': 'bg-blue-600 text-white',
  'O-': 'bg-teal-600 text-white',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Volunteer Contact Popup
function VolunteerContactModal({ open, onClose, request }) {
  if (!open) return null;

  const contacts = [
    {
      label: 'Person 1',
      name: request.volunteerName1 || request.volunteerName || request.meghalaAdmin1Name || 'Coordinator 1',
      phone: request.volunteerPhone1 || request.volunteerPhone || request.meghalaAdmin1Mobile || request.contactNumber || '—',
    },
    {
      label: 'Person 2',
      name: request.volunteerName2 || request.meghalaAdmin2Name || 'Coordinator 2',
      phone: request.volunteerPhone2 || request.meghalaAdmin2Mobile || '—',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-600 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-black text-base">Volunteer Coordinators</h3>
              <p className="text-red-100 text-xs mt-0.5">For: {request.patientName}</p>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="p-5 space-y-3">
          {contacts.map((c, i) => (
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{c.label}</p>
                <p className="text-slate-900 font-bold text-sm truncate">{c.name}</p>
                <p className="text-slate-500 text-xs font-mono mt-0.5">{c.phone}</p>
              </div>
              {c.phone !== '—' && (
                <a
                  href={`tel:${c.phone}`}
                  className="shrink-0 w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                  title={`Call ${c.name}`}
                >
                  <Phone className="w-4 h-4 fill-white" />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <p className="text-[10px] text-slate-400 text-center">
            🛡️ Direct donor numbers are hidden for privacy. Contact through coordinators only.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RequestCard({ request, showActions = true }) {
  const { user } = useAuthStore();
  const { acceptRequest, fulfillRequest, fileComplaint, allUsers, deleteRequest, updateRequestStatus } = useAppStore();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [accepting, setAccepting] = useState(false);

  const reqId = request.id || request._id;
  const isOwner = user && (String(user._id || user.id) === String(request.requested_by || request.requestedBy));
  const isPrivileged = user && ['admin', 'volunteer', 'super_admin', 'technical_admin'].includes(user.role);
  // canManage: can change status (admin, volunteer, owner)
  const canManage = isOwner || isPrivileged;
  // canEditDelete: only the owner OR admin-level roles (NOT plain volunteers managing others' requests)
  const canEditDelete = isOwner || (user && ['admin', 'super_admin', 'technical_admin'].includes(user.role));

  const acceptedList = (() => {
    try {
      return Array.isArray(request.accepted_donors) 
        ? request.accepted_donors 
        : JSON.parse(request.accepted_donors || '[]');
    } catch {
      return [];
    }
  })();
  const isAcceptedByMe = user && (
    acceptedList.includes(user._id) || 
    acceptedList.includes(user.id) || 
    String(request.accepted_by_user_id) === String(user._id || user.id)
  );

  const handleAcceptRequest = async () => {
    if (!user) {
      alert("Please login to accept blood requests.");
      return;
    }
    setAccepting(true);
    await acceptRequest(reqId);
    setAccepting(false);
  };

  const urg = urgencyConfig[request.urgencyLevel] || urgencyConfig.Moderate;
  const UrgIcon = urg.icon;

  const whatsappNumber = request.volunteerWhatsapp || request.whatsappNumber || request.volunteerPhone || request.contactNumber || '';
  const whatsappMsg = encodeURIComponent(
    `Hi, I'm responding to a blood request for patient *${request.patientName || request.patient_name}* (${request.bloodGroup || request.blood_group}) at ${request.hospitalName || request.hospital_name}, ${request.city || ''}. Please guide me on how to help.`
  );

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    const targetHospital = allUsers.find(
      (u) => u.role === 'hospital' && u.fullName?.toLowerCase() === (request.hospitalName || request.hospital_name)?.toLowerCase()
    );
    const targetId = targetHospital ? targetHospital._id : 'unknown';
    const res = await fileComplaint({
      reporterName: user?.fullName || 'Anonymous User',
      reporterId: user?._id || 'guest',
      targetName: request.hospitalName || request.hospital_name || 'Unknown Hospital',
      targetId,
      reason: `[Patient: ${request.patientName || request.patient_name}] ${reportReason}`,
    });
    if (res.success) { setShowReportModal(false); setReportReason(''); }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus && newStatus !== request.status) {
      await updateRequestStatus(reqId, newStatus);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left ${
        request.urgencyLevel === 'Immediate' ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-100'
      }`}>

        {/* Urgency top bar */}
        <div className={`px-4 py-2 flex items-center justify-between ${urg.bg}`}>
          <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${urg.text}`}>
            <UrgIcon className="w-3.5 h-3.5" />
            {urg.label}
          </span>
          <div className="flex items-center gap-2">
            {isOwner && (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                Mine
              </span>
            )}
            <span className={`text-[10px] font-semibold flex items-center gap-1 ${urg.text} opacity-80`}>
              <Clock className="w-3 h-3" />
              {timeAgo(request.createdAt || request.created_at)}
            </span>
          </div>
        </div>

        <div className="p-4">
          {/* Blood group + patient info */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {request.verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold mb-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
              <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                {request.patientName || request.patient_name}
              </h4>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{request.hospitalName || request.hospital_name}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{request.city || request.district || request.location || '—'}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className={`px-3 py-1.5 rounded-xl text-sm font-black shadow-sm ${bloodColors[request.bloodGroup || request.blood_group] || 'bg-slate-100 text-slate-700'}`}>
                {request.bloodGroup || request.blood_group}
              </div>
              {user && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  title="Report"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Units + Status chip row */}
          <div className="flex items-center justify-between mb-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span className="text-xs font-bold text-slate-700">
                {request.unitsRequired || request.units_required} units needed
              </span>
            </div>
            {canManage ? (
              <select
                value={request.status || 'Pending'}
                onChange={handleStatusChange}
                className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-400"
              >
                <option value="Pending">🟡 Pending</option>
                <option value="Fulfilled">🟢 Fulfilled</option>
                <option value="Cancelled">🔴 Cancelled</option>
              </select>
            ) : (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                request.status === 'Fulfilled'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {request.status}
              </span>
            )}
          </div>

          {/* ─── Action Buttons ─── */}
          {showActions && (
            <div className="space-y-2 pt-2.5 border-t border-slate-100">

              {/* Accept & Donate — full width, for NON-owners who are NOT privileged, on pending requests */}
              {request.status === 'Pending' && !isOwner && !isPrivileged && (
                <button
                  onClick={handleAcceptRequest}
                  disabled={accepting || isAcceptedByMe}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isAcceptedByMe
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isAcceptedByMe ? '✓ Accepted to Donate' : 'Accept & Donate'}
                </button>
              )}

              {/* 3-col contact row: Call | WhatsApp | Poster */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4 fill-white" />
                  Call
                </button>

                <a
                  href={whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${whatsappMsg}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={!whatsappNumber ? (e) => e.preventDefault() : undefined}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold rounded-xl transition-colors ${
                    whatsappNumber
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>

                <button
                  onClick={() => setShowPosterModal(true)}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Poster
                </button>
              </div>

              {/* Approve — Admin/Volunteer full width */}
              {(user?.role === 'volunteer' || user?.role === 'admin') && request.status === 'Pending' && !isOwner && (
                <button
                  onClick={() => fulfillRequest(reqId)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Request
                </button>
              )}

              {/* Edit + Delete — owner OR admin/super_admin/technical_admin only (NOT plain volunteers) */}
              {canEditDelete && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center pt-0.5">
                🛡️ Donor numbers are hidden for privacy. Contact via coordinator.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Poster Download Modal */}
      <PosterModal
        isOpen={showPosterModal}
        onClose={() => setShowPosterModal(false)}
        data={request}
        type="request"
      />

      {/* Volunteer Contact Popup */}
      <VolunteerContactModal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        request={request}
      />

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={`Report: ${request.hospitalName}`}>
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700 font-semibold flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Report any issues with this blood request or hospital. Admins will review and take action.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Reason for Report</label>
            <select
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-900"
            >
              <option value="">Select a reason</option>
              <option value="Fake or duplicate blood request">Fake or duplicate blood request</option>
              <option value="Commercial use or demanding payment for blood">Commercial use or demanding payment for blood</option>
              <option value="Incorrect patient, units, or urgency information">Incorrect patient, units, or urgency information</option>
              <option value="Inappropriate contact behavior by hospital staff">Inappropriate contact behavior by hospital staff</option>
              <option value="Other reason (specify in detail)">Other reason (specify in detail)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 border border-slate-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer">
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
      {/* Edit Request Modal */}
      <EditRequestModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        request={request}
      />
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteRequest(reqId)}
      />
    </>
  );
}
