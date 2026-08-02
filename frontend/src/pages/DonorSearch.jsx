import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import DonorCard from '../components/DonorCard.jsx';
import Modal from '../components/Modal.jsx';
import { Search, SlidersHorizontal, MapPin, Info, Sparkles, Filter, ChevronRight, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DISTRICTS = ['All', 'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod', 'Bengaluru Urban', 'Chennai'];

export default function DonorSearch() {
  const { donors, searchDonors } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroup, setBloodGroup] = useState('All');
  const [district, setDistrict] = useState('All');
  const [availOnly, setAvailOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [sortBy, setSortBy] = useState('compatibility');
  const [showGuide, setShowGuide] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  // Fetch donors on mount and when query filters change
  useEffect(() => {
    searchDonors(bloodGroup, maxDistance, district);
  }, [bloodGroup, district, maxDistance, searchDonors]);

  // Filter donors based on inputs safely
  const filtered = donors.filter((d) => {
    const dBG = d.bloodGroup || d.blood_group || '';
    const dDist = d.district || '';
    const dAvail = d.availableForDonation !== undefined ? d.availableForDonation : (d.available_for_donation !== undefined ? d.available_for_donation : true);
    const dName = d.primaryName || d.primary_name || d.name || '';
    const dCity = d.city || '';
    const dDistance = d.distance !== undefined ? d.distance : 0;

    const matchBG = bloodGroup === 'All' || dBG === bloodGroup;
    const matchDist = district === 'All' || dDist === district;
    const matchAvail = !availOnly || dAvail;
    const matchSearch = !searchQuery || 
      dName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      dCity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDistance = dDistance <= maxDistance;

    return matchBG && matchDist && matchAvail && matchSearch && matchDistance;
  });

  // Sort donors based on chosen metric
  const sorted = [...filtered].sort((a, b) => {
    const distA = a.distance !== undefined ? a.distance : 0;
    const distB = b.distance !== undefined ? b.distance : 0;
    if (sortBy === 'distance') {
      return distA - distB;
    }
    return (b.compatibilityScore || 95) - (a.compatibilityScore || 95);
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1); 
  }, [bloodGroup, district, availOnly, searchQuery, maxDistance, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-rose-700 to-red-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-red-900/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-bold text-red-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Privacy-Preserving Voluntary Donor Network
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Find & Connect with Donors</h1>
            <p className="text-sm text-red-100/90 leading-relaxed">
              Explore active blood donors across Kerala. Calls are routed strictly through local Block Committee & Meghala Coordinators for safe emergency coordination.
            </p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="px-4 py-3 bg-white text-red-700 hover:bg-red-50 text-xs font-black rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start md:self-auto"
          >
            <Info className="w-4 h-4 text-red-600" /> Compatibility Guide
          </button>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
        {/* Top Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search donors by name, city, or area…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 rounded-2xl text-sm font-semibold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        {/* Blood Group Selectors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Blood Group
            </span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              {bloodGroup === 'All' ? 'Showing All Types' : `${bloodGroup} Selected`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setBloodGroup(bg)}
                className={`px-4 py-2 text-xs font-black rounded-2xl border transition-all cursor-pointer ${
                  bloodGroup === bg 
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-transparent shadow-md shadow-red-500/20 scale-105' 
                    : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-red-400'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Filter Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex flex-wrap gap-4 items-center">
            {/* District dropdown */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="text-xs font-extrabold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-zinc-800 focus:outline-none"
              >
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Distance slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-500 dark:text-zinc-400 whitespace-nowrap">Distance: {maxDistance} km</span>
              <input
                type="range"
                min="1"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-24 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            {/* Sort options */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-500 dark:text-zinc-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-extrabold text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-zinc-800 focus:outline-none"
              >
                <option value="compatibility">Compatibility Match</option>
                <option value="distance">Nearest Distance</option>
              </select>
            </div>

            {/* Availability Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setAvailOnly(!availOnly)}
                className="w-10 h-5.5 rounded-full transition-colors p-0.5 cursor-pointer bg-slate-200 dark:bg-zinc-700"
                style={{ backgroundColor: availOnly ? '#10b981' : undefined }}
              >
                <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${availOnly ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-extrabold text-slate-600 dark:text-zinc-300">Available only</span>
            </label>
          </div>

          <span className="text-xs font-extrabold text-slate-400 dark:text-zinc-500">
            {sorted.length} {sorted.length === 1 ? 'donor found' : 'donors found'}
          </span>
        </div>
      </div>

      {/* Grid of Modern Donor Cards */}
      {paginated.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-12 text-center text-slate-400 dark:text-zinc-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30 text-red-500" />
          <p className="text-base font-bold text-slate-700 dark:text-zinc-300">No matching donors found</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your distance slider, clearing the search query, or selecting "All" blood groups.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((donor, i) => (
            <motion.div key={donor._id || donor.id || i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <DonorCard donor={donor} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2.5 text-xs font-bold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-2xl disabled:opacity-40 hover:border-red-300 transition-colors cursor-pointer"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 text-xs font-black rounded-2xl transition-all cursor-pointer ${
                p === page 
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md' 
                  : 'border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:border-red-300'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2.5 text-xs font-bold border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-2xl disabled:opacity-40 hover:border-red-300 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Compatibility Guide Modal */}
      <Modal isOpen={showGuide} onClose={() => setShowGuide(false)} title="Blood Group Compatibility Chart">
        <div className="space-y-4 text-left">
          <p className="text-xs text-gray-500 leading-relaxed">
            Understanding who can donate to whom is critical for matching emergency requests. Below are red blood cell compatibility guidelines:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-2.5 font-bold text-gray-600">Blood Type</th>
                  <th className="p-2.5 font-bold text-gray-600">Can Give To (Recipients)</th>
                  <th className="p-2.5 font-bold text-gray-600">Can Receive From (Donors)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { type: 'A+', give: 'A+, AB+', receive: 'A+, A-, O+, O-' },
                  { type: 'A-', give: 'A+, A-, AB+, AB-', receive: 'A-, O-' },
                  { type: 'B+', give: 'B+, AB+', receive: 'B+, B-, O+, O-' },
                  { type: 'B-', give: 'B+, B-, AB+, AB-', receive: 'B-, O-' },
                  { type: 'O+', give: 'A+, B+, AB+, O+', receive: 'O+, O-' },
                  { type: 'O-', give: 'All Types (Universal Donor)', receive: 'O-' },
                  { type: 'AB+', give: 'AB+ Only (Universal Recipient)', receive: 'All Types' },
                  { type: 'AB-', give: 'AB+, AB-', receive: 'A-, B-, AB-, O-' },
                ].map((row) => (
                  <tr key={row.type} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-black text-primary">{row.type}</td>
                    <td className="p-2.5 text-gray-700 font-semibold">{row.give}</td>
                    <td className="p-2.5 text-gray-700 font-semibold">{row.receive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-red-50 text-[11px] font-semibold text-primary rounded-xl leading-relaxed border border-red-100">
            💡 <strong>O-</strong> is the universal red blood cell donor, which is used in major emergencies when a patient's exact type is undetermined.
          </div>
        </div>
      </Modal>
    </div>
  );
}
