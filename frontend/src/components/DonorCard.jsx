import { useState } from 'react';
import { Phone, MapPin, Flag, AlertTriangle, UserCheck, ShieldCheck, Heart, MessageSquare, Droplet, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import Modal from './Modal.jsx';
import { getStorageUrl } from '../store/api.js';

const bloodColors = {
  'A+': 'from-red-500 to-rose-600 text-white shadow-red-200',
  'A-': 'from-rose-600 to-pink-600 text-white shadow-rose-200',
  'B+': 'from-orange-500 to-amber-600 text-white shadow-orange-200',
  'B-': 'from-amber-600 to-yellow-600 text-white shadow-amber-200',
  'AB+': 'from-purple-600 to-indigo-600 text-white shadow-purple-200',
  'AB-': 'from-violet-600 to-purple-700 text-white shadow-violet-200',
  'O+': 'from-blue-600 to-indigo-600 text-white shadow-blue-200',
  'O-': 'from-teal-600 to-emerald-600 text-white shadow-teal-200',
};

export default function DonorCard({ donor }) {
  const { user } = useAuthStore();
  const { fileComplaint, allUsers } = useAppStore();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    const res = await fileComplaint({
      reporterName: user?.primaryName || 'Anonymous User',
      reporterId: user?._id || 'guest',
      targetName: donor.primaryName || donor.primary_name,
      targetId: donor._id || donor.id,
      reason: reportReason,
    });
    if (res.success) {
      setShowReportModal(false);
      setReportReason('');
    }
  };

  const donorName = donor.primaryName || donor.primary_name || donor.name || 'Donor';
  const bg = donor.bloodGroup || donor.blood_group || 'N/A';
  const pic = donor.profilePicture || donor.profile_picture || donor.photo;
  const city = donor.city || 'Local Area';
  const district = donor.district || 'Kerala';
  const distance = donor.distance;
  const eligibility = donor.eligibilityStatus || donor.eligibility_status || 'Eligible';
  const donations = donor.totalDonations ?? donor.total_donations ?? 0;
  const livesSaved = donor.livesSaved ?? donor.lives_saved ?? (donations * 3);
  const isAvailable = donor.availableForDonation !== undefined ? donor.availableForDonation : (donor.available_for_donation !== undefined ? donor.available_for_donation : true);
  const donorId = donor._id || donor.id;
  const donorJeevalinkId = donor.jeevalink_id || donor.employee_id || donor.jeevalinkId || donor.employeeId || (donorId ? `JL-UR-${String(donorId).padStart(4, '0')}` : null);
  const userId = user?._id || user?.id;
  const sex = donor.sex || donor.gender || '';
  const dob = donor.dob || donor.date_of_birth || '';

  // Calculate age if dob exists
  let age = null;
  if (dob) {
    const birthYear = new Date(dob).getFullYear();
    if (!isNaN(birthYear) && birthYear > 1920) {
      age = new Date().getFullYear() - birthYear;
    }
  }

  // Resolve assigned volunteer contact with fallback to store or secondary fields
  let volunteerName = donor.volunteerName || donor.volunteer_name;
  let volunteerPhone = donor.volunteerPhone || donor.volunteer_phone;
  let volunteerRole = donor.volunteerRole || donor.volunteer_role;

  if (!volunteerPhone && allUsers && allUsers.length > 0) {
    const dDistrict = (district || '').toLowerCase().trim();
    const dCity = (city || '').toLowerCase().trim();

    let matchedVol = allUsers.find((u) => 
      ['volunteer', 'unit_squad', 'block_admin'].includes(u.role) &&
      (u.status === 'Active' || !u.status) &&
      (u.district || '').toLowerCase().trim() === dDistrict &&
      (u.city || '').toLowerCase().trim() === dCity
    );

    if (!matchedVol) {
      matchedVol = allUsers.find((u) => 
        ['volunteer', 'unit_squad', 'block_admin'].includes(u.role) &&
        (u.status === 'Active' || !u.status) &&
        (u.district || '').toLowerCase().trim() === dDistrict
      );
    }

    if (!matchedVol) {
      matchedVol = allUsers.find((u) => ['volunteer', 'unit_squad', 'block_admin'].includes(u.role));
    }

    if (matchedVol) {
      volunteerName = matchedVol.primaryName || matchedVol.primary_name || matchedVol.name;
      volunteerPhone = matchedVol.mobile || matchedVol.phone;
      volunteerRole = matchedVol.role;
    }
  }

  // Final fallbacks
  if (!volunteerName) volunteerName = donor.secondaryName || donor.secondary_name || 'Meghala Coordinator';
  if (!volunteerPhone) volunteerPhone = donor.secondaryContactNumber || donor.secondary_phone || '9998593194';
  if (!volunteerRole) volunteerRole = 'volunteer';

  const whatsappMessage = encodeURIComponent(`Hello ${volunteerName}, I found blood donor ${donorName} (${bg}) on JeevaLink in ${city}, ${district}. Please help connect for an urgent donation.`);

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Ambient Glow Pill */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all pointer-events-none" />

      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          {/* Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0 border border-slate-100 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800">
                {pic ? (
                  <img src={getStorageUrl(pic)} alt={donorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-lg">
                    {donorName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {/* Online/Available Status Ring */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${isAvailable ? 'bg-emerald-500 shadow-sm' : 'bg-slate-400'}`} title={isAvailable ? 'Active & Ready to Donate' : 'Currently Busy'} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 truncate tracking-tight">{donorName}</h4>
                <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" title="Verified Donor" />
                {donorJeevalinkId && (
                  <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 px-1.5 py-0.5 rounded-md shrink-0">
                    {donorJeevalinkId}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{city}, {district}</span>
                {distance !== undefined && distance !== null && (
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">• {distance} km</span>
                )}
              </div>
            </div>
          </div>

          {/* Blood Group Badge & Report Flag */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`px-3.5 py-1.5 rounded-2xl bg-gradient-to-r ${bloodColors[bg] || 'from-red-600 to-rose-600 text-white'} shadow-md flex items-center gap-1.5`}>
              <Droplet className="w-4 h-4 fill-white text-white opacity-90" />
              <span className="text-base font-black tracking-wide">{bg}</span>
            </div>

            {user && String(userId) !== String(donorId) && (
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                title="Report Donor"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Detail Badges (Age, Sex, Eligibility) */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-xl border ${
            eligibility === 'Eligible'
              ? 'text-emerald-700 bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
              : eligibility === 'Ineligible'
              ? 'text-rose-700 bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400'
              : 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            {eligibility === 'Eligible' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {eligibility}
          </span>

          {(sex || age) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
              {sex && <span className="capitalize">{sex}</span>}
              {sex && age && <span>•</span>}
              {age && <span>{age} yrs</span>}
            </span>
          )}

          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl ${
            isAvailable 
              ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
              : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isAvailable ? 'Available Now' : 'Busy / Unavailable'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl text-center border border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[9px]">Donations</p>
            <p className="text-base font-black text-slate-900 dark:text-zinc-100 mt-0.5">{donations}</p>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl text-center border border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[9px]">Lives Saved</p>
            <p className="text-base font-black text-red-600 dark:text-red-400 mt-0.5 flex items-center justify-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" /> {livesSaved}
            </p>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl text-center border border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-[9px]">Match</p>
            <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {donor.compatibilityScore || 95}%
            </p>
          </div>
        </div>
      </div>

      {/* Volunteer Contact Card Section */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-zinc-800 space-y-3">
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl p-3 space-y-2">
          {/* Volunteer Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Meghala Volunteer</p>
                <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate max-w-[160px]">{volunteerName}</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md capitalize">
              {volunteerRole.replace('_', ' ')}
            </span>
          </div>

          {/* Explicitly Visible Phone Number */}
          {volunteerPhone && (
            <div className="flex items-center justify-between pt-1.5 border-t border-emerald-100 dark:border-emerald-900/40 text-xs">
              <span className="font-bold text-slate-600 dark:text-zinc-400">Volunteer Contact:</span>
              <span className="font-black text-emerald-700 dark:text-emerald-400 tracking-wide font-mono text-xs">
                {volunteerPhone}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons: Phone & WhatsApp */}
        {volunteerPhone ? (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${volunteerPhone}`}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" /> Call Volunteer
            </a>
            <a
              href={`https://wa.me/91${volunteerPhone.replace(/\D/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
            </a>
          </div>
        ) : (
          <div className="py-2.5 px-3 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-xs font-semibold rounded-xl text-center">
            Coordinator contact pending assignment
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title={`Report Donor: ${donorName}`}>
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-primary font-semibold flex gap-2">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <p>Please report any issues regarding this donor. The administrator will review your complaint and take action.</p>
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
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-red-200"
            >
              Submit Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
