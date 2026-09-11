import { useState } from 'react';
import { Phone, MapPin, Flag, AlertTriangle, UserCheck, ShieldCheck, Heart, MessageSquare, Droplet, Sparkles, CheckCircle2, Clock, Users } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import Modal from './Modal.jsx';
import { getStorageUrl } from '../store/api.js';
import { getDisplayJeevalinkId } from '../utils/jeevalinkId.js';

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
  const donorJeevalinkId = getDisplayJeevalinkId(donor);
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

  // Resolve assigned Meghala volunteer/coordinator contacts (Strictly NO Block Admin)
  let vol1Name = donor.volunteerName || donor.volunteer_name;
  let vol1Phone = donor.volunteerPhone || donor.volunteer_phone;
  let vol1Role = donor.volunteerRole || donor.volunteer_role;

  let vol2Name = donor.volunteerName2 || donor.volunteer_name_2;
  let vol2Phone = donor.volunteerPhone2 || donor.volunteer_phone_2;
  let vol2Role = donor.volunteerRole2 || donor.volunteer_role_2;

  // Filter out block_admin
  if (vol1Role === 'block_admin') {
    vol1Name = null;
    vol1Phone = null;
    vol1Role = null;
  }
  if (vol2Role === 'block_admin') {
    vol2Name = null;
    vol2Phone = null;
    vol2Role = null;
  }

  let rawMeghala = donor.meghalaCommitteeName || donor.meghala_committee_name || donor.meghalaName || donor.meghala_name || donor.meghala || donor.organization_name;

  if (allUsers && allUsers.length > 0) {
    const dDistrict = (district || '').toLowerCase().trim();
    const dCity = (city || '').toLowerCase().trim();
    const dOrg = (donor.organization_name || '').toLowerCase().trim();
    const dMeghala = (donor.meghala || donor.meghalaName || donor.meghala_name || '').toLowerCase().trim();

    let addedBy = '';
    if (donor.remarks && typeof donor.remarks === 'string') {
      const match = donor.remarks.match(/added by meghala:\s*([^,\n;]+)/i);
      if (match) addedBy = match[1].toLowerCase().trim();
    }

    // Look for Meghala volunteer or unit squad matching addedBy, meghala, organization, or city
    const matchedVols = allUsers.filter((u) => {
      if (!['volunteer', 'unit_squad'].includes(u.role) || (u.status && u.status !== 'Active')) return false;
      const uCity = (u.city || '').toLowerCase().trim();
      const uOrg = (u.organization_name || '').toLowerCase().trim();
      const uDist = (u.district || '').toLowerCase().trim();

      if (addedBy && (uCity === addedBy || uOrg === addedBy)) return true;
      if (dMeghala && (uCity === dMeghala || uOrg === dMeghala)) return true;
      if (dOrg && (uCity === dOrg || uOrg === dOrg)) return true;
      if (dCity && uDist === dDistrict && (uCity === dCity || uOrg === dCity)) return true;
      return false;
    });

    const fallbackVols = matchedVols.length > 0 ? matchedVols : allUsers.filter((u) => 
      ['volunteer', 'unit_squad'].includes(u.role) &&
      (u.status === 'Active' || !u.status) &&
      (u.district || '').toLowerCase().trim() === dDistrict
    );

    const pool = fallbackVols.length > 0 ? fallbackVols : allUsers.filter((u) => ['volunteer', 'unit_squad'].includes(u.role));

    if (pool[0]) {
      const primaryVol = pool[0];
      if (!vol1Phone) {
        vol1Name = primaryVol.primaryName || primaryVol.primary_name || primaryVol.name;
        vol1Phone = primaryVol.mobile || primaryVol.phone;
        vol1Role = primaryVol.role;
      }
      if (!vol2Phone) {
        const p2Name = primaryVol.secondaryName || primaryVol.secondary_name || primaryVol.person2Name;
        const p2Phone = primaryVol.secondaryContactNumber || primaryVol.secondary_contact_number || primaryVol.secondary_phone || primaryVol.person2Contact;
        if (p2Name && p2Phone) {
          vol2Name = p2Name;
          vol2Phone = p2Phone;
          vol2Role = 'volunteer';
        } else if (pool[1] && pool[1] !== pool[0]) {
          vol2Name = pool[1].primaryName || pool[1].primary_name || pool[1].name;
          vol2Phone = pool[1].mobile || pool[1].phone;
          vol2Role = pool[1].role;
        }
      }
      if (!rawMeghala || rawMeghala === 'Local Area') {
        rawMeghala = primaryVol.city || primaryVol.meghala || primaryVol.organization_name;
      }
    }
  }

  // Final fallbacks: use donor's secondary contact or general Meghala Coordinator
  if (!vol1Name) vol1Name = donor.secondaryName || donor.secondary_name || 'Meghala Coordinator';
  if (!vol1Phone) vol1Phone = donor.secondaryContactNumber || donor.secondary_phone || '9998593194';
  if (!vol1Role || vol1Role === 'block_admin') vol1Role = 'volunteer';

  if (!rawMeghala || rawMeghala === 'Local Area') {
    rawMeghala = city || district || 'Meghala';
  }

  // Compute Meghala Committee Display Name
  let meghalaDisplayName = 'Meghala Committee';
  if (rawMeghala && rawMeghala !== 'Local Area') {
    if (rawMeghala.toLowerCase().includes('meghala') && rawMeghala.toLowerCase().includes('committee')) {
      meghalaDisplayName = rawMeghala;
    } else if (rawMeghala.toLowerCase().includes('meghala')) {
      meghalaDisplayName = `${rawMeghala} Committee`;
    } else {
      meghalaDisplayName = `${rawMeghala} Meghala Committee`;
    }
  }

  // Build the list of contacts to show
  const contactsList = [
    {
      id: 1,
      label: 'Volunteer 1',
      name: vol1Name,
      phone: vol1Phone,
      role: vol1Role === 'unit_squad' ? 'Unit Squad' : 'Meghala Volunteer',
    },
  ];

  if (vol2Phone && vol2Name && (vol2Phone !== vol1Phone || vol2Name !== vol1Name)) {
    contactsList.push({
      id: 2,
      label: 'Volunteer 2',
      name: vol2Name,
      phone: vol2Phone,
      role: vol2Role === 'unit_squad' ? 'Unit Squad' : 'Volunteer 2',
    });
  }

  return (
    <div className="group bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left relative overflow-hidden">
      <div>
        {/* Top Header: Avatar, Name, Location, Blood Badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs border border-slate-100 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800">
                {pic ? (
                  <img src={getStorageUrl(pic)} alt={donorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-sm">
                    {donorName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                  isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
                title={isAvailable ? 'Available Now' : 'Busy / Unavailable'}
              />
            </div>

            {/* Name + ID + City */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 truncate">{donorName}</h4>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" title="Verified Donor" />
                {donorJeevalinkId && (
                  <span className="text-[9px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 px-1 py-0.2 rounded shrink-0">
                    {donorJeevalinkId}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{city}, {district}</span>
                {distance !== undefined && distance !== null && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 shrink-0">• {distance} km</span>
                )}
              </p>
            </div>
          </div>

          {/* Blood Badge & Report */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`px-2.5 py-1 rounded-xl bg-gradient-to-r ${bloodColors[bg] || 'from-red-600 to-rose-600 text-white'} shadow-xs flex items-center gap-1`}>
              <Droplet className="w-3.5 h-3.5 fill-white text-white opacity-90" />
              <span className="text-xs font-black tracking-wide">{bg}</span>
            </div>
            {user && String(userId) !== String(donorId) && (
              <button
                onClick={() => setShowReportModal(true)}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                title="Report Donor"
              >
                <Flag className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Minimal Badges Row (Eligibility, Age/Sex, Availability) */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
            eligibility === 'Eligible'
              ? 'text-emerald-700 bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
              : eligibility === 'Ineligible'
              ? 'text-rose-700 bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400'
              : 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            {eligibility === 'Eligible' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
            {eligibility}
          </span>

          {(sex || age) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
              {sex && <span className="capitalize">{sex}</span>}
              {sex && age && <span>•</span>}
              {age && <span>{age}y</span>}
            </span>
          )}

          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${
            isAvailable 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
              : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {isAvailable ? 'Available' : 'Busy'}
          </span>
        </div>

        {/* Minimal Stats Row */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          <div className="p-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl text-center border border-slate-100 dark:border-zinc-800">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Donations</p>
            <p className="text-sm font-black text-slate-900 dark:text-zinc-100">{donations}</p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-zinc-800/50 rounded-xl text-center border border-slate-100 dark:border-zinc-800">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Lives Saved</p>
            <p className="text-sm font-black text-red-600 dark:text-red-400 flex items-center justify-center gap-0.5">
              <Heart className="w-3 h-3 fill-red-500 text-red-500" /> {livesSaved}
            </p>
          </div>
        </div>
      </div>

      {/* Minimal Meghala Committee & Volunteer Contacts Card */}
      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
        {/* Meghala Committee Title Header */}
        <div className="flex items-center justify-between gap-1 text-[10px] px-1">
          <span className="font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider truncate flex items-center gap-1" title={meghalaDisplayName}>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {meghalaDisplayName}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 shrink-0">
            {contactsList.length > 1 ? '2 Contacts' : 'Coordinator'}
          </span>
        </div>

        {/* Minimal Contacts List */}
        <div className="space-y-1.5">
          {contactsList.map((c) => {
            const waMsg = encodeURIComponent(`Hello ${c.name} (${meghalaDisplayName}), I found blood donor ${donorName} (${bg}) on iDonate in ${city}, ${district}. Please help connect for an urgent donation.`);

            return (
              <div
                key={c.id}
                className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate" title={c.name}>
                      {c.name}
                    </p>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded capitalize shrink-0">
                      {c.role}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {c.phone}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${c.phone}`}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                    title={`Call ${c.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/91${c.phone.replace(/\D/g, '')}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                    title={`WhatsApp ${c.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
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
