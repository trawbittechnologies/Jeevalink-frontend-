import { useState } from 'react';
import { Phone, MapPin, Flag, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import Modal from './Modal.jsx';
import { getStorageUrl } from '../store/api.js';

const bloodColors = {
  'A+': 'bg-red-100 text-red-700',
  'A-': 'bg-rose-100 text-rose-700',
  'B+': 'bg-orange-100 text-orange-700',
  'B-': 'bg-amber-100 text-amber-700',
  'AB+': 'bg-purple-100 text-purple-700',
  'AB-': 'bg-violet-100 text-violet-700',
  'O+': 'bg-blue-100 text-blue-700',
  'O-': 'bg-teal-100 text-teal-700',
};

export default function DonorCard({ donor }) {
  const { user } = useAuthStore();
  const { fileComplaint } = useAppStore();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    const res = await fileComplaint({
      reporterName: user?.primaryName || 'Anonymous User',
      reporterId: user?._id || 'guest',
      targetName: donor.primaryName,
      targetId: donor._id,
      reason: reportReason,
    });
    if (res.success) {
      setShowReportModal(false);
      setReportReason('');
    }
  };

  return (
    <div className="card p-5 flex flex-col gap-4 text-left">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shadow-md shadow-red-200 shrink-0 border border-slate-100/50 bg-slate-50">
            {donor.profilePicture || donor.photo ? (
              <img src={getStorageUrl(donor.profilePicture || donor.photo)} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-red-700 flex items-center justify-center text-white font-black text-base">
                {donor.primaryName?.[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">{donor.primaryName}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-550">{donor.city}</span>
              {donor.distance && (
                <span className="text-xs text-gray-400">• {donor.distance} km</span>
              )}
            </div>
            <div className="mt-1.5">
              <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                donor.eligibilityStatus === 'Eligible'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : donor.eligibilityStatus === 'Ineligible'
                  ? 'text-red-700 bg-red-50 border-red-100'
                  : 'text-gray-650 bg-slate-50 border-slate-200'
              }`}>
                {donor.eligibilityStatus || 'Pending Check'}
              </span>
            </div>
          </div>
        </div>

        {/* Blood group badge & Report button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`px-3 py-1.5 rounded-xl text-sm font-black ${bloodColors[donor.bloodGroup] || 'bg-gray-100 text-gray-700'}`}>
            {donor.bloodGroup}
          </div>
          {user && user._id !== donor._id && (
            <button
              onClick={() => setShowReportModal(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
              title="Report Donor"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <p className="text-base font-black text-gray-900">{donor.totalDonations}</p>
          <p className="text-[10px] text-gray-500 font-semibold">Donations</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <p className="text-base font-black text-amber-600">{donor.compatibilityScore}%</p>
          <p className="text-[10px] text-gray-500 font-semibold">Match</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <span className={`text-xs font-bold ${donor.availableForDonation ? 'text-green-600' : 'text-gray-400'}`}>
            {donor.availableForDonation ? '● Active' : '● Busy'}
          </span>
        </div>
      </div>

      {/* Contact */}
      {donor.availableForDonation && (
        <a
          href={`tel:${donor.mobile}`}
          className="flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-red-200"
        >
          <Phone className="w-4 h-4" /> Contact Donor
        </a>
      )}

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={`Report Donor: ${donor.primaryName}`}>
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-primary font-semibold flex gap-2">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <p>Please report any issues regarding this donor. The administrator will review your complaint and take action (warning or deactivation).</p>
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
              <option value="Donor did not show up for scheduled donation (No-show)">Donor did not show up for scheduled donation (No-show)</option>
              <option value="Invalid phone number or contact information">Invalid phone number or contact information</option>
              <option value="Abusive, aggressive, or inappropriate behavior">Abusive, aggressive, or inappropriate behavior</option>
              <option value="Commercial solicitation or demanding payment">Commercial solicitation or demanding payment</option>
              <option value="Other reason (specify in detail)">Other reason (specify in detail)</option>
            </select>
          </div>
          
          {reportReason?.includes('Other') && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Detailed Description</label>
              <textarea
                required
                rows={3}
                placeholder="Provide details about the issue..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-900"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="flex-1 py-2.5 border border-slate-200 text-gray-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
