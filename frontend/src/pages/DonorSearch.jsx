import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import DonorCard from '../components/DonorCard.jsx';
import Modal from '../components/Modal.jsx';
import { Search, SlidersHorizontal, MapPin, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DISTRICTS = ['All', 'Bengaluru Urban', 'Ernakulam', 'Thrissur', 'Chennai', 'Thiruvananthapuram'];

export default function DonorSearch() {
  const { donors } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroup, setBloodGroup] = useState('All');
  const [district, setDistrict] = useState('All');
  const [availOnly, setAvailOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [sortBy, setSortBy] = useState('compatibility');
  const [showGuide, setShowGuide] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  // Filter donors based on inputs
  const filtered = donors.filter((d) => {
    const matchBG = bloodGroup === 'All' || d.bloodGroup === bloodGroup;
    const matchDist = district === 'All' || d.district === district;
    const matchAvail = !availOnly || d.availableForDonation;
    const matchSearch = !searchQuery || 
      d.primaryName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDistance = d.distance <= maxDistance;
    return matchBG && matchDist && matchAvail && matchSearch && matchDistance;
  });

  // Sort donors based on chosen metric
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    }
    // Sort by compatibility score
    return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1); 
  }, [bloodGroup, district, availOnly, searchQuery, maxDistance, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Find Donors</h1>
          <p className="text-sm text-gray-500 mt-1">Search and connect with available blood donors near you</p>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="px-4 py-2 border border-red-100 text-primary bg-red-50/50 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5" /> Compatibility Guide
        </button>
      </div>

      {/* Search + Filters */}
      <div className="card p-5 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or city…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Blood group chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setBloodGroup(bg)}
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  bloodGroup === bg 
                    ? 'bg-primary text-white border-primary shadow-md shadow-red-200' 
                    : 'bg-white text-gray-600 border-slate-200 hover:border-red-250'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-5 items-center pt-3 border-t border-slate-100">
          {/* District filter */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="text-xs font-semibold text-gray-700 border border-slate-200 rounded-xl px-3 py-2 bg-white"
            >
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Distance slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Distance: {maxDistance}km</span>
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-650"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold text-gray-700 border border-slate-200 rounded-xl px-3 py-2 bg-white"
            >
              <option value="compatibility">Compatibility</option>
              <option value="distance">Distance</option>
            </select>
          </div>

          {/* Availability toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setAvailOnly(!availOnly)}
              className="w-10 h-5.5 rounded-full transition-colors p-0.5 cursor-pointer bg-slate-200"
              style={{ backgroundColor: availOnly ? '#22c55e' : '#e2e8f0' }}
            >
              <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${availOnly ? 'translate-x-4.5' : 'translate-x-0'}`} />
            </div>
            <span className="text-xs font-semibold text-gray-600">Available only</span>
          </label>

          <span className="ml-auto text-xs text-gray-400 font-semibold">{sorted.length} donors found</span>
        </div>
      </div>

      {/* Donor grid */}
      {paginated.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No donors found</p>
          <p className="text-xs text-gray-400 mt-1">Try widening your distance range or choosing another blood type.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((donor, i) => (
            <motion.div key={donor._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <DonorCard donor={donor} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:border-red-200 transition-colors cursor-pointer"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                p === page 
                  ? 'bg-primary text-white shadow-md' 
                  : 'border border-slate-200 text-gray-650 hover:border-red-200'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl disabled:opacity-40 hover:border-red-200 transition-colors cursor-pointer"
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
