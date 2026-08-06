import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { useAuthStore } from '../../store/authStore.js';
import {
  HeartHandshake, Users, Phone, Mail, MapPin, Search,
  Droplet, Building2, CheckCircle2,
  MessageSquare, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function AcceptedDonors() {
  const { requests, fetchRequests, allUsers, fulfillRequest, markDonorDonated } = useAppStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchRequests();

    // Polling mechanism for realtime updates of accepted donors
    const interval = setInterval(() => {
      fetchRequests();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchRequests]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const selectedUrgency = 'All';
  const [selectedRequestFilter, setSelectedRequestFilter] = useState('All');
  const [loadingDonorId, setLoadingDonorId] = useState(null);

  // Filter requests that have accepted donors
  const requestsWithAcceptedDonors = useMemo(() => {
    return requests.map((req) => {
      let donorIds = [];
      try {
        const rawDonors = req.acceptedDonors || req.accepted_donors;
        if (Array.isArray(rawDonors)) {
          donorIds = rawDonors;
        } else if (typeof rawDonors === 'string') {
          donorIds = JSON.parse(rawDonors || '[]');
        }
      } catch {
        donorIds = [];
      }

      // Fallback to accepted_by / accepted_by_user_id if donorIds is empty
      const accBy = req.acceptedBy || req.accepted_by || req.acceptedByUserId || req.accepted_by_user_id;
      if ((!donorIds || donorIds.length === 0) && accBy) {
        donorIds = [accBy];
      }

      // Parse donated donors list
      let donatedIds = [];
      try {
        const rawDonated = req.donatedDonors || req.donated_donors;
        if (Array.isArray(rawDonated)) {
          donatedIds = rawDonated;
        } else if (typeof rawDonated === 'string') {
          donatedIds = JSON.parse(rawDonated || '[]');
        }
      } catch {
        donatedIds = [];
      }

      // Map donor details from request.accepted_donor_details OR allUsers store
      let donorDetails = [];
      const rawDetails = req.acceptedDonorDetails || req.accepted_donor_details;
      if (Array.isArray(rawDetails) && rawDetails.length > 0) {
        donorDetails = rawDetails;
      } else if (typeof rawDetails === 'string') {
        try {
          donorDetails = JSON.parse(rawDetails || '[]');
        } catch {
          donorDetails = [];
        }
      }

      if (!donorDetails || donorDetails.length === 0) {
        donorDetails = donorIds.map(id => {
          const foundUser = (allUsers || []).find(u => String(u._id || u.id) === String(id));
          if (foundUser) return foundUser;
          return { id, primary_name: `Donor #${id}`, blood_group: req.bloodGroup || req.blood_group };
        }).filter(Boolean);
      }

      return {
        ...req,
        resolvedDonorIds: donorIds,
        resolvedDonatedIds: donatedIds.map(id => String(id)),
        resolvedDonorDetails: donorDetails
      };
    }).filter(req => {
      return req.resolvedDonorIds && req.resolvedDonorIds.length > 0;
    });
  }, [requests, allUsers]);

  // Unique list of districts for filter dropdown
  const districts = useMemo(() => {
    const set = new Set();
    requestsWithAcceptedDonors.forEach(r => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set).sort();
  }, [requestsWithAcceptedDonors]);

  // Apply search and dropdown filters
  const filteredRequests = useMemo(() => {
    return requestsWithAcceptedDonors.filter((req) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesQuery = !query || [
        req.patientName || req.patient_name,
        req.hospitalName || req.hospital_name,
        req.city,
        req.district,
        ...req.resolvedDonorDetails.flatMap(d => [
          d.primary_name || d.primaryName,
          d.secondary_name || d.secondaryName,
          d.mobile,
          d.email,
          d.jeevalink_id || d.jeevalinkId
        ])
      ].some(field => field && String(field).toLowerCase().includes(query));

      const matchesBloodGroup = selectedBloodGroup === 'All' || (req.bloodGroup || req.blood_group) === selectedBloodGroup;
      const matchesDistrict = selectedDistrict === 'All' || req.district === selectedDistrict;
      const matchesUrgency = selectedUrgency === 'All' || (req.urgencyLevel || req.urgency_level) === selectedUrgency;
      const matchesStatus = selectedRequestFilter === 'All' ||
        (selectedRequestFilter === 'Active' ? ['Pending', 'Waiting', 'Accepted'].includes(req.status) : req.status === selectedRequestFilter);

      return matchesQuery && matchesBloodGroup && matchesDistrict && matchesUrgency && matchesStatus;
    });
  }, [requestsWithAcceptedDonors, searchTerm, selectedBloodGroup, selectedDistrict, selectedUrgency, selectedRequestFilter]);

  // Calculate totals
  const totalAcceptedRequests = requestsWithAcceptedDonors.length;
  const totalAcceptedDonorsCount = requestsWithAcceptedDonors.reduce((acc, r) => acc + r.resolvedDonorIds.length, 0);
  const totalPendingFulfillments = requestsWithAcceptedDonors.filter(r => !['Fulfilled', 'Completed', 'Cancelled', 'Expired'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 lg:p-8 text-left space-y-6">

      {/* ─── Header Banner ─── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-red-500/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
              <HeartHandshake className="w-4 h-4" /> Volunteer Donor Desk
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              Accepted Donors Directory
            </h1>
            <p className="text-red-100 text-xs lg:text-sm font-medium leading-relaxed">
              Showing accepted donors for all active blood requests. After donation is complete, click <span className="font-extrabold underline decoration-white underline-offset-2">"Donated"</span> to credit 100 points to the donor, 20 points to the Meghala Volunteer, and 20 points to the Block Admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[110px]">
              <span className="block text-2xl font-black">{totalAcceptedDonorsCount}</span>
              <span className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Accepted Donors</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[110px]">
              <span className="block text-2xl font-black">{totalAcceptedRequests}</span>
              <span className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Total Requests</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[110px]">
              <span className="block text-2xl font-black">{totalPendingFulfillments}</span>
              <span className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Pending Fulfill</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">

          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Patient, Hospital, Donor name, phone, or JeevaLink ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Blood Group Filter */}
          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="All">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="All">All Districts</option>
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedRequestFilter}
            onChange={(e) => setSelectedRequestFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Fulfilled">Fulfilled</option>
          </select>
        </div>
      </div>

      {/* ─── Request & Accepted Donors List ─── */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900">No Accepted Donors Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {requestsWithAcceptedDonors.length === 0
                ? 'No accepted donors found for active blood requests. Accepted donors will appear here as soon as donors respond to requests.'
                : 'No accepted donors match your search criteria or filters. Try adjusting your filters.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((request) => {
            const reqId = request.id || request._id;
            const bloodGroup = request.bloodGroup || request.blood_group;
            const patientName = request.patientName || request.patient_name;
            const hospitalName = request.hospitalName || request.hospital_name;
            const unitsNeeded = request.unitsRequired || request.units_required || 1;

            return (
              <motion.div
                key={reqId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                {/* ── Top Bar: Request Summary ── */}
                <div className="p-5 lg:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">

                  <div className="flex items-start gap-4">
                    <div className={`px-4 py-2.5 rounded-2xl text-lg font-black shrink-0 shadow-sm ${bloodColors[bloodGroup] || 'bg-red-600 text-white'}`}>
                      {bloodGroup}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-slate-900 text-base">
                          Patient: {patientName}
                        </h3>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${request.status === 'Fulfilled'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                          {request.status === 'Fulfilled' ? '🟢 Fulfilled' : `🟡 ${request.status}`}
                        </span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-red-600" />
                          {request.resolvedDonorIds.length}/5 Donors Accepted
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {hospitalName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {request.city || request.district}
                        </span>
                        <span className="flex items-center gap-1 text-red-600 font-bold">
                          <Droplet className="w-3.5 h-3.5 fill-red-600" /> {unitsNeeded} units required
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for volunteer */}
                  {!['Fulfilled', 'Completed', 'Cancelled', 'Expired'].includes(request.status) && (user?.role === 'volunteer' || user?.role === 'admin' || user?.role === 'block_admin' || user?.role === 'super_admin' || user?.role === 'technical_admin') && (
                    <button
                      onClick={() => fulfillRequest(reqId)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Request Fulfilled
                    </button>
                  )}
                </div>

                {/* ── Accepted Donors Cards Grid ── */}
                <div className="p-5 lg:p-6 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                    <Users className="w-4 h-4 text-red-600" /> Accepted Donors List ({request.resolvedDonorDetails.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {request.resolvedDonorDetails.map((donor, idx) => {
                      const donorIdVal = String(donor.id || donor._id || idx + 1);
                      const donorName = donor.primary_name || donor.primaryName || donor.name || `Donor #${donorIdVal}`;
                      const donorSecName = donor.secondary_name || donor.secondaryName || '';
                      const donorMobile = donor.mobile || donor.contact_number || donor.phone || '';
                      const donorEmail = donor.email || '';
                      const donorBlood = donor.blood_group || donor.bloodGroup || bloodGroup;
                      const donorCity = donor.city || donor.district || '';
                      const donorJeevalinkId = donor.jeevalink_id || donor.jeevalinkId || '';
                      const isDonated = request.resolvedDonatedIds?.includes(donorIdVal) || request.donated_donors?.map(String).includes(donorIdVal);

                      const whatsappMsg = encodeURIComponent(
                        `Hi ${donorName}, regarding blood request for patient *${patientName}* (${bloodGroup}) at ${hospitalName}. Thank you for accepting! Please let us know your availability.`
                      );

                      return (
                        <div
                          key={donor.id || idx}
                          className="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-red-200 rounded-2xl p-4 transition-all shadow-xs hover:shadow-md space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                  {donorName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-slate-900 text-sm truncate leading-tight">
                                    {donorName}
                                  </h5>
                                  {donorSecName && (
                                    <p className="text-[11px] text-slate-500 font-semibold truncate">
                                      {donorSecName}
                                    </p>
                                  )}
                                  {donorJeevalinkId && (
                                    <span className="inline-block text-[9px] font-extrabold font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-0.5">
                                      ID: {donorJeevalinkId}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 ${bloodColors[donorBlood] || 'bg-red-600 text-white'}`}>
                                {donorBlood}
                              </span>
                            </div>

                            {/* Contact & Location details */}
                            <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                              {donorMobile && (
                                <p className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {donorMobile}
                                </p>
                              )}
                              {donorEmail && (
                                <p className="truncate text-slate-500 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {donorEmail}
                                </p>
                              )}
                              {donorCity && (
                                <p className="text-slate-500 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {donorCity}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {/* Call & WhatsApp Quick Buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                              {donorMobile ? (
                                <a
                                  href={`tel:${donorMobile}`}
                                  className="flex items-center justify-center gap-1.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                  <Phone className="w-3.5 h-3.5 fill-white" /> Call
                                </a>
                              ) : (
                                <button disabled className="py-2 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed">
                                  No Mobile
                                </button>
                              )}

                              {donorMobile ? (
                                <a
                                  href={`https://wa.me/${donorMobile.replace(/\D/g, '')}?text=${whatsappMsg}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 fill-white" /> WhatsApp
                                </a>
                              ) : (
                                <button disabled className="py-2 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed">
                                  WhatsApp
                                </button>
                              )}
                            </div>

                            {/* ─── REQUIREMENT: Donated Button with Points Credit ─── */}
                            <div className="pt-1">
                              {isDonated ? (
                                <div className="w-full py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black text-emerald-700 shadow-2xs">
                                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                                  ✓ Donated (+100 Pts Credited)
                                </div>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const targetDonorId = donor.id || donor._id;
                                    if (!targetDonorId) return;
                                    setLoadingDonorId(targetDonorId);
                                    await markDonorDonated(reqId, targetDonorId);
                                    setLoadingDonorId(null);
                                  }}
                                  disabled={loadingDonorId === (donor.id || donor._id)}
                                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {loadingDonorId === (donor.id || donor._id) ? (
                                    <span>Processing Points...</span>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4" />
                                      <span>Donated (+100 Pts)</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

