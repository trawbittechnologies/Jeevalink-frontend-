import { useState, useEffect, useMemo } from 'react';
import {
  Search, Phone, User, MessageSquare, MapPin,
  Building2, Copy, PhoneCall,
  UserX, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../store/api.js';
import { useAppStore } from '../store/appStore.js';
import { getDisplayJeevalinkId } from '../utils/jeevalinkId.js';

// Fallback: Kerala's 14 official districts (shown only if DB returns none)
const KERALA_DISTRICTS = [
  'Kasaragod', 'Kannur', 'Wayanad', 'Kozhikode', 'Malappuram',
  'Palakkad', 'Thrissur', 'Ernakulam', 'Idukki', 'Kottayam',
  'Alappuzha', 'Pathanamthitta', 'Kollam', 'Thiruvananthapuram',
];

export default function VolunteerDirectory() {
  const { triggerToast } = useAppStore();

  // --- Database-driven hierarchy options ---
  const [dbBlocksByDistrict, setDbBlocksByDistrict] = useState({});
  const [dbMeghalasByBlock, setDbMeghalasByBlock]   = useState({});

  // --- Selection states ---
  // Initialize to first Kerala district so the select always has a valid value
  const [selectedDistrict, setSelectedDistrict] = useState(KERALA_DISTRICTS[0]);
  const [selectedBlock,    setSelectedBlock]    = useState('');
  const [selectedMeghala,  setSelectedMeghala]  = useState('All Meghalas');
  const [searchFilter,     setSearchFilter]     = useState('');

  // --- Results ---
  const [volunteers, setVolunteers] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [copiedId,   setCopiedId]   = useState(null);

  // 1. Fetch hierarchy options then atomically set the initial district + block selection.
  //    Doing it here (not in separate useEffects) eliminates all race conditions.
  const fetchDbOptions = async () => {
    try {
      const res = await api.get('/public/volunteer-options');
      if (res.data?.success && res.data?.data) {
        const { blocksByDistrict = {}, meghalasByBlock = {} } = res.data.data;
        setDbBlocksByDistrict(blocksByDistrict);
        setDbMeghalasByBlock(meghalasByBlock);

        // Pick the best district to show by default:
        // 1. If currently selected district has blocks, keep it.
        // 2. Otherwise pick the first district that has blocks.
        setSelectedDistrict((currentDistrict) => {
          const hasBlocksForCurrent =
            blocksByDistrict[currentDistrict]?.length > 0;
          if (hasBlocksForCurrent) return currentDistrict;
          const firstWithBlocks = Object.keys(blocksByDistrict)[0];
          return firstWithBlocks || currentDistrict;
        });

        // Auto-set first block for whatever district is selected
        setSelectedDistrict((currentDistrict) => {
          const blocks = blocksByDistrict[currentDistrict] || [];
          if (blocks.length > 0) {
            setSelectedBlock(blocks[0]);
          }
          return currentDistrict; // keep district unchanged
        });

      }
    } catch {
      // API unavailable — UI stays with Kerala 14 districts, no blocks
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDbOptions();
  }, []);

  // 2. Compute districts list — DB districts first, then the fixed Kerala 14 as fallback
  const districtsList = useMemo(() => {
    const dbDistricts = Object.keys(dbBlocksByDistrict);
    const merged = [...dbDistricts];
    KERALA_DISTRICTS.forEach((d) => {
      if (!merged.includes(d)) merged.push(d);
    });
    return merged;
  }, [dbBlocksByDistrict]);

  // 3. Available Block Committees for the selected district (DB only)
  const availableBlocks = useMemo(() => {
    return dbBlocksByDistrict[selectedDistrict] || [];
  }, [selectedDistrict, dbBlocksByDistrict]);

  // When district changes (user-driven), reset block to first available
  // NOTE: we do NOT reset when the component first mounts — fetchDbOptions handles that.
  const handleDistrictChange = (d) => {
    const blocks = dbBlocksByDistrict[d] || [];
    setSelectedDistrict(d);
    setSelectedBlock(blocks[0] || '');
    setSelectedMeghala('All Meghalas');
  };

  // 4. Available Meghala Units for the selected block (DB only)
  const availableMeghalas = useMemo(() => {
    if (!selectedBlock) return ['All Meghalas'];
    const dbMeghalas = dbMeghalasByBlock[selectedBlock] || [];
    return ['All Meghalas', ...dbMeghalas];
  }, [selectedBlock, dbMeghalasByBlock]);


  // Handle Block change
  const handleBlockChange = (b) => {
    setSelectedBlock(b);
    setSelectedMeghala('All Meghalas');
  };


  // Fetch volunteers from the database based on current selections
  const fetchVolunteers = async () => {
    if (!selectedDistrict) {
      setVolunteers([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('district', selectedDistrict);
      if (selectedBlock) {
        params.set('blockCommitteeName', selectedBlock);
      }
      if (selectedMeghala && selectedMeghala !== 'All Meghalas' && selectedMeghala !== 'All Meghala / Units' && selectedMeghala !== 'All Meghala Units') {
        params.set('meghala', selectedMeghala);
      }

      const res = await api.get(`/public/volunteers?${params.toString()}`);

      if (res.data?.success && Array.isArray(res.data.data)) {
        setVolunteers(res.data.data);
      } else {
        setVolunteers([]);
      }
    } catch {
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVolunteers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, selectedBlock, selectedMeghala]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (triggerToast) triggerToast(`Copied: ${text}`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Local filter: applies search term on already-fetched volunteers
  // Meghala filter is applied server-side; here we only run the text search.
  const filteredVolunteers = volunteers.filter((vol) => {
    if (!searchFilter) return true;
    const term = searchFilter.toLowerCase();
    const name    = (vol.name || vol.primary_name || '').toLowerCase();
    const meghala = (vol.meghala || vol.city || '').toLowerCase();
    const phone   = (vol.mobile || vol.phone || vol.secondary_phone || '').toLowerCase();
    return name.includes(term) || meghala.includes(term) || phone.includes(term);
  });

  const getRoleLabel = (role) => {
    switch (role) {
      case 'block_admin':
        return 'Block Committee Admin';
      case 'unit_squad':
        return 'Unit Squad';
      case 'volunteer':
      default:
        return 'Meghala Admin';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans selection:bg-red-500 selection:text-white py-8 px-4 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Minimal Header ─────────────────────────────────────────── */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>DYFI Public Volunteer Directory</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Contact Your Area <span className="text-red-600">Volunteer</span>
          </h1>

        </div>

        {/* ── 3 Step Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              1
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 1: Fixed District</p>
              <p className="text-xs font-bold text-slate-900 truncate">{selectedDistrict}</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              2
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 2: Block Committee</p>
              <p className="text-xs font-bold text-slate-900 truncate">{selectedBlock || 'Not Selected'}</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              3
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 3: Meghala</p>
              <p className="text-xs font-bold text-slate-900 truncate">{selectedMeghala}</p>
            </div>
          </div>
        </div>

        {/* ── 3 Select Boxes Panel (District -> Block -> Meghala Unit) ── */}
        <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Select Box 1: District (Fixed 14 Kerala Districts) */}
            <div className="space-y-2">
              <label htmlFor="district-select" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                1. Select District *
              </label>
              <select
                id="district-select"
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-red-400 rounded-xl px-3.5 py-3 text-slate-900 text-xs font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition cursor-pointer shadow-xs"
              >
                {districtsList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Select Box 2: Block Committee (Strictly DB Added Names Only) */}
            <div className="space-y-2">
              <label htmlFor="block-select" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-600" />
                2. Select Block Committee *
              </label>
              <select
                id="block-select"
                value={selectedBlock}
                onChange={(e) => handleBlockChange(e.target.value)}
                disabled={availableBlocks.length === 0}
                className="w-full bg-slate-50 border border-slate-200 hover:border-red-400 rounded-xl px-3.5 py-3 text-slate-900 text-xs font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition cursor-pointer shadow-xs disabled:opacity-60"
              >
                {availableBlocks.length === 0 ? (
                  <option value="">No Block Committees for {selectedDistrict}</option>
                ) : (
                  availableBlocks.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))
                )}
              </select>
            </div>

            {/* Select Box 3: Meghala (Strictly DB Added Names Only) */}
            <div className="space-y-2">
              <label htmlFor="meghala-select" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-600" />
                3. Select Meghala *
              </label>
              <select
                id="meghala-select"
                value={selectedMeghala}
                onChange={(e) => setSelectedMeghala(e.target.value)}
                disabled={availableMeghalas.length <= 1}
                className="w-full bg-slate-50 border border-slate-200 hover:border-red-400 rounded-xl px-3.5 py-3 text-slate-900 text-xs font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition cursor-pointer shadow-xs disabled:opacity-60"
              >
                {availableMeghalas.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Search Filter & Refresh */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search volunteer by name..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pl-9 text-slate-900 text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-red-600 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              onClick={() => { fetchDbOptions(); fetchVolunteers(); }}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Directory'}</span>
            </button>
          </div>
        </div>

        {/* ── Volunteer Cards List ───────────────────────────────────── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-red-600" />
              Assigned Volunteers & Coordinators ({filteredVolunteers.length})
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {selectedDistrict} {selectedBlock ? `• ${selectedBlock}` : ''}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 rounded-2xl">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading volunteer contacts...</p>
            </div>
          ) : filteredVolunteers.length === 0 ? (
            /* Clean Minimal Empty State (Zero Dummy Data) */
            <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 rounded-2xl p-8 text-center space-y-3">
              <UserX className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-800">No Registered Volunteers Found</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No registered volunteer contacts found in database for <span className="font-semibold text-slate-700">{selectedDistrict}</span>
                  {selectedBlock ? <span> &rarr; <span className="font-semibold text-slate-700">{selectedBlock}</span></span> : ''}.
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                Register new users in backend/admin dashboard under this district & block.
              </p>
            </div>
          ) : (
            /* Real Volunteer Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVolunteers.map((vol, idx) => {
                const primaryPhone = vol.mobile || vol.phone || vol.primaryPhone || '';
                const secondaryPhone = vol.secondary_phone || vol.secondaryContactNumber || vol.secondary_contact_number || vol.secondaryContact || vol.person2Contact || vol.secondaryPhone || '';
                const primaryName = vol.primary_name || vol.primaryName || vol.name || vol.person1Name || 'DYFI Volunteer';
                const secondaryName = vol.secondary_name || vol.secondaryName || vol.secondary_contact_name || vol.person2Name || '';
                const volJeevalinkId = getDisplayJeevalinkId(vol);
                const roleText = vol.roleText || vol.role_title || vol.role_name || (vol.role ? getRoleLabel(vol.role) : 'Volunteer Coordinator');

                return (
                  <motion.div
                    key={vol.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all border /80 hover:border-red-300 rounded-2xl p-5 shadow-xs transition space-y-4"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase">
                            {roleText}
                          </span>
                          {volJeevalinkId && (
                            <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-primary text-[10px] font-mono font-black rounded-md">
                              {volJeevalinkId}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 truncate">{primaryName}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {selectedDistrict} &bull; {vol.city || selectedBlock}
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center shrink-0 border border-red-100">
                        <User className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Primary & Secondary Contact Details Box */}
                    <div className="bg-slate-50 rounded-xl p-3.5 space-y-3 text-xs border border-slate-100">
                      
                      {/* Primary Contact Row */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-red-600" /> Primary Contact Name:
                          </span>
                          <span className="font-bold text-slate-900">{primaryName}</span>
                        </div>
                        <div className="flex items-center justify-between pl-5">
                          <span className="text-slate-500 font-medium">Phone Number:</span>
                          <span className="font-bold text-slate-900">{primaryPhone || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Secondary Contact Row */}
                      <div className="border-t border-slate-200/60 pt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" /> Secondary Contact Name:
                          </span>
                          <span className="font-bold text-slate-800">
                            {secondaryName || (secondaryPhone ? 'Alternate Contact' : 'N/A')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pl-5">
                          <span className="text-slate-500 font-medium">Phone Number:</span>
                          <span className="font-semibold text-slate-800">{secondaryPhone || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Meghala / Unit info */}
                      {(vol.city || vol.meghala || vol.remarks) && (
                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                          <span className="text-slate-500 font-medium">Meghala:</span>
                          <span className="font-semibold text-slate-800">{vol.meghala || vol.remarks || vol.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-1">
                      {primaryPhone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${primaryPhone.replace(/\s+/g, '')}`}
                            className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call Primary</span>
                          </a>

                          <a
                            href={`https://wa.me/${primaryPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopy(primaryPhone, `p-${vol.id || idx}`)}
                            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                            title="Copy primary phone number"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {copiedId === `p-${vol.id || idx}` ? <span className="text-emerald-600 font-bold">Copied!</span> : null}
                          </button>
                        </div>
                      )}

                      {secondaryPhone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${secondaryPhone.replace(/\s+/g, '')}`}
                            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call Secondary ({secondaryName || secondaryPhone})</span>
                          </a>

                          <a
                            href={`https://wa.me/${secondaryPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
