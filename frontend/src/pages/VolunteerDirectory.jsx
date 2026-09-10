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

// Fixed District: Kasaragod (DYFI Kasaragod Blood Network)
const DEFAULT_DISTRICT = 'Kasaragod';

export default function VolunteerDirectory() {
  const { triggerToast } = useAppStore();

  // --- Database-driven hierarchy options ---
  const [dbBlocksByDistrict, setDbBlocksByDistrict] = useState({});
  const [dbMeghalasByBlock, setDbMeghalasByBlock]   = useState({});

  // --- Selection states ---
  // District is locked strictly to Kasaragod by default
  const selectedDistrict = DEFAULT_DISTRICT;
  const [selectedBlock,    setSelectedBlock]    = useState('');
  const [selectedMeghala,  setSelectedMeghala]  = useState('All Meghalas');
  const [searchFilter,     setSearchFilter]     = useState('');

  // --- Results ---
  const [volunteers, setVolunteers] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [copiedId,   setCopiedId]   = useState(null);

  // 1. Fetch hierarchy options for Kasaragod
  const fetchDbOptions = async () => {
    try {
      const res = await api.get('/public/volunteer-options');
      if (res.data?.success && res.data?.data) {
        const rawData = res.data.data;
        const blocksByDistrict = rawData.blocksByDistrict || rawData.blocks_by_district || {};
        const meghalasByBlock   = rawData.meghalasByBlock || rawData.meghalas_by_block || {};
        setDbBlocksByDistrict(blocksByDistrict);
        setDbMeghalasByBlock(meghalasByBlock);

        // Find blocks specifically for Kasaragod (case-insensitive fallback)
        const kasargodKey = Object.keys(blocksByDistrict).find(
          k => k.toLowerCase() === 'kasaragod' || k.toLowerCase() === 'kasargod'
        ) || DEFAULT_DISTRICT;
        const blocks = blocksByDistrict[kasargodKey] || Object.keys(meghalasByBlock) || [];
        if (blocks.length > 0) {
          setSelectedBlock((prev) => (prev && blocks.includes(prev) ? prev : blocks[0]));
        }
      }
    } catch {
      // API unavailable
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDbOptions();
  }, []);

  // 2. Available Block Committees for Kasaragod (DB only)
  const availableBlocks = useMemo(() => {
    const key = Object.keys(dbBlocksByDistrict).find(
      k => k.toLowerCase() === 'kasaragod' || k.toLowerCase() === 'kasargod'
    );
    const districtBlocks = (key && dbBlocksByDistrict[key]) || dbBlocksByDistrict[DEFAULT_DISTRICT] || [];
    if (districtBlocks.length > 0) return districtBlocks;
    return Object.keys(dbMeghalasByBlock);
  }, [dbBlocksByDistrict, dbMeghalasByBlock]);

  // 3. Available Meghala Units for the selected block (DB only)
  const availableMeghalas = useMemo(() => {
    if (!selectedBlock) return ['All Meghalas'];
    const direct = dbMeghalasByBlock[selectedBlock];
    if (direct && Array.isArray(direct) && direct.length > 0) {
      return ['All Meghalas', ...direct];
    }
    const matchingKey = Object.keys(dbMeghalasByBlock).find(
      k => k.toLowerCase().trim() === selectedBlock.toLowerCase().trim()
    );
    const dbMeghalas = (matchingKey && dbMeghalasByBlock[matchingKey]) || [];
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
        {/* ── Steps / District Badge ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* District Status Card */}
          <div className="bg-white border-slate-200 shadow-sm border rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 font-bold flex items-center justify-center text-xs shrink-0 border border-red-100">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">District</p>
              <p className="text-xs font-black text-slate-900 truncate">{selectedDistrict}</p>
            </div>
          </div>

          {/* Step 1: Block Committee */}
          <div className="bg-white border-slate-200 shadow-sm border rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              1
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 1: Block Committee</p>
              <p className="text-xs font-bold text-slate-900 truncate">{selectedBlock || 'Not Selected'}</p>
            </div>
          </div>

          {/* Step 2: Meghala Unit */}
          <div className="bg-white border-slate-200 shadow-sm border rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              2
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 2: Meghala</p>
              <p className="text-xs font-bold text-slate-900 truncate">{selectedMeghala}</p>
            </div>
          </div>
        </div>

        {/* ── 2 Select Boxes Panel (Block -> Meghala Unit) ── */}
        <div className="bg-white border-slate-200 shadow-sm border rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Select Box 1: Block Committee */}
            <div className="space-y-2">
              <label htmlFor="block-select" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-red-600" />
                1. Select Block Committee *
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

            {/* Select Box 2: Meghala */}
            <div className="space-y-2">
              <label htmlFor="meghala-select" className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-600" />
                2. Select Meghala *
              </label>
              <select
                id="meghala-select"
                value={selectedMeghala}
                onChange={(e) => setSelectedMeghala(e.target.value)}
                disabled={!selectedBlock}
                className="w-full bg-slate-50 border border-slate-200 hover:border-red-400 rounded-xl px-3.5 py-3 text-slate-900 text-xs font-bold focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition cursor-pointer shadow-xs disabled:opacity-60"
              >
                {availableMeghalas.map((m) => (
                  <option key={m} value={m}>
                    {m === 'All Meghalas'
                      ? (availableMeghalas.length > 1 ? `All Meghalas (${availableMeghalas.length - 1} Units)` : `All Meghalas (${selectedBlock || 'Block'})`)
                      : m}
                  </option>
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
            <div className="py-12 text-center space-y-3 bg-white border-slate-200 shadow-sm border /80 rounded-2xl">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading volunteer contacts...</p>
            </div>
          ) : filteredVolunteers.length === 0 ? (
            /* Clean Minimal Empty State (Zero Dummy Data) */
            <div className="bg-white border-slate-200 shadow-sm border /80 rounded-2xl p-8 text-center space-y-3">
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
                
                // Name resolution: ensure Person 1 and Person 2 names are cleanly separated
                const rawFullName = vol.full_name || vol.name || vol.primary_name || vol.primaryName || vol.person1Name || 'DYFI Volunteer';
                let secondaryName = vol.secondary_name || vol.secondaryName || vol.secondary_contact_name || vol.person2Name || '';
                let primaryName = vol.person1Name || vol.person1_name || vol.primaryContactName || '';

                if (!primaryName) {
                  if (rawFullName.includes('&')) {
                    const parts = rawFullName.split('&').map(s => s.trim()).filter(Boolean);
                    primaryName = parts[0] || rawFullName;
                    if (!secondaryName && parts[1]) {
                      secondaryName = parts[1];
                    }
                  } else if (/\band\b/i.test(rawFullName)) {
                    const parts = rawFullName.split(/\band\b/i).map(s => s.trim()).filter(Boolean);
                    primaryName = parts[0] || rawFullName;
                    if (!secondaryName && parts[1]) {
                      secondaryName = parts[1];
                    }
                  } else {
                    primaryName = rawFullName;
                  }
                } else if (primaryName.includes('&') || /\band\b/i.test(primaryName)) {
                  const parts = primaryName.split(/[&]|(?:\band\b)/i).map(s => s.trim()).filter(Boolean);
                  primaryName = parts[0] || primaryName;
                  if (!secondaryName && parts[1]) {
                    secondaryName = parts[1];
                  }
                }

                // If secondaryName is already isolated, clean up any residual '& <name>' from primaryName
                if (secondaryName && primaryName.toLowerCase().includes(secondaryName.toLowerCase())) {
                  primaryName = primaryName.replace(new RegExp(`[&,]?\\s*${secondaryName}`, 'gi'), '').trim();
                }

                const cardHeaderTitle = (secondaryName && !rawFullName.includes('&') && !/\band\b/i.test(rawFullName))
                  ? `${primaryName} & ${secondaryName}`
                  : rawFullName;

                const volJeevalinkId = getDisplayJeevalinkId(vol);
                const roleText = vol.roleText || vol.role_title || vol.role_name || (vol.role ? getRoleLabel(vol.role) : 'Volunteer Coordinator');

                return (
                  <motion.div
                    key={vol.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border-slate-200 shadow-sm border /80 hover:border-red-300 rounded-2xl p-5 shadow-xs transition space-y-4"
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
                        <h3 className="text-base font-bold text-slate-900 truncate">{cardHeaderTitle}</h3>
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
