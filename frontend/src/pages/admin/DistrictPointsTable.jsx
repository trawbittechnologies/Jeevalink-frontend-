import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw } from 'lucide-react';
import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';

export default function DistrictPointsTable() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'meghalas' | 'donors' | 'volunteers' | 'rules'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'donors' | 'fulfilled'
  const [selectedBlockDetail, setSelectedBlockDetail] = useState(null);

  const [data, setData] = useState({
    district: user?.district || 'Kasaragod',
    summary: {
      total_district_points: 0,
      total_blocks: 0,
      total_meghalas: 0,
      total_donors: 0,
      total_volunteers: 0,
      top_block: 'N/A',
      top_donor: 'N/A',
    },
    blocks: [],
    meghalas: [],
    top_donors: [],
    top_volunteers: [],
    point_rules: [],
    badges_guide: []
  });

  const fetchData = useCallback(async () => {
    try {
      // 1. Try dedicated points-table endpoint
      let res = await api.get('/super-admin/points-table').catch(() => null);

      if (res?.data?.success && res.data.data?.blocks?.length > 0) {
        setData(res.data.data);
        return;
      }

      // 2. Dynamic fallback from real database metrics and block-admins
      const [resDist, resAdmins] = await Promise.all([
        api.get('/super-admin/metrics').catch(() => null),
        api.get('/super-admin/block-admins').catch(() => null)
      ]);

      const dData = resDist?.data?.data || resDist?.data || {};
      const adminsList = Array.isArray(resAdmins?.data?.data)
        ? resAdmins.data.data
        : (Array.isArray(resAdmins?.data) ? resAdmins.data : []);

      const blockSummary = Array.isArray(dData.block_summary) ? dData.block_summary : [];

      // Compile unique blocks from real database block_admins and block_summary
      const blockMap = new Map();

      adminsList.forEach((ba, idx) => {
        const bName = ba.blockCommitteeName || ba.city || ba.block || ba.blockName || ba.name;
        if (bName && String(bName).trim() && String(bName).trim() !== 'N/A') {
          const key = String(bName).toLowerCase().trim();
          blockMap.set(key, {
            rank: idx + 1,
            block_name: bName.trim(),
            admin_name: ba.primary_name || ba.primaryContactName || ba.name || 'Block Coordinator',
            admin_mobile: ba.mobile || ba.phone || '',
            admin_email: ba.email || '',
            total_points: Number(ba.reward_points) || 0,
            donors_count: 0,
            volunteers_count: 0,
            fulfilled_requests: 0,
            total_requests: 0,
            meghala_count: 0
          });
        }
      });

      blockSummary.forEach((bs) => {
        const bName = bs.block || bs.city || bs.name;
        if (bName && String(bName).trim()) {
          const key = String(bName).toLowerCase().trim();
          if (blockMap.has(key)) {
            const existing = blockMap.get(key);
            existing.donors_count = bs.users || bs.donors || existing.donors_count;
            existing.volunteers_count = bs.volunteers || existing.volunteers_count;
          } else {
            blockMap.set(key, {
              rank: blockMap.size + 1,
              block_name: bName.trim(),
              admin_name: 'Block Coordinator',
              admin_mobile: '',
              admin_email: '',
              total_points: 0,
              donors_count: bs.users || bs.donors || 0,
              volunteers_count: bs.volunteers || 0,
              fulfilled_requests: 0,
              total_requests: 0,
              meghala_count: 0
            });
          }
        }
      });

      const compiledBlocks = Array.from(blockMap.values()).map((b, idx) => ({
        ...b,
        rank: idx + 1
      }));

      const totalDistPoints = compiledBlocks.reduce((acc, b) => acc + (b.total_points || 0), 0);
      const topBlockName = compiledBlocks.length > 0 ? compiledBlocks[0].block_name : 'N/A';

      setData({
        district: dData.district || user?.district || 'Kasaragod',
        summary: {
          total_district_points: totalDistPoints,
          total_blocks: compiledBlocks.length,
          total_meghalas: 0,
          total_donors: dData.total_users || 0,
          total_volunteers: dData.total_volunteers || 0,
          top_block: topBlockName,
          top_donor: 'N/A',
        },
        blocks: compiledBlocks,
        meghalas: [],
        top_donors: [],
        top_volunteers: [],
        point_rules: [
          { action: 'Blood Donation Completed', target: 'Donor', badge: '🩸 +100 Pts' },
          { action: 'Meghala Volunteer Verification', target: 'Meghala Volunteer', badge: '🛡️ +20 Pts' },
          { action: 'Block Committee Coordination', target: 'Block Admin', badge: '🏢 +20 Pts' },
          { action: 'Emergency SOS Acceptance', target: 'Donor / Responder', badge: '⚡ +20 Pts' },
        ],
        badges_guide: [
          { name: 'First Drop', points: 100, desc: 'Completed 1st verified blood donation.' },
          { name: 'Life Saver', points: 500, desc: 'Earned 500 points rescuing lives.' },
          { name: 'Blood Hero', points: 1000, desc: 'Reached 1,000 points milestone.' },
          { name: 'Red Guardian', points: 2500, desc: 'Reached 2,500 points champion status.' },
          { name: 'Legend Donor', points: 5000, desc: 'Attained highest 5,000 points tier.' },
        ]
      });
    } catch (err) {
      console.error('Failed to load district points table:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        await fetchData();
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchData]);

  const currentDistrict = data.district || user?.district || 'Kasaragod';
  const cleanDistrict = currentDistrict.replace(/^dyfi\s*/i, '').trim();

  // Filtered and Sorted Blocks
  const filteredBlocks = useMemo(() => {
    let list = [...(data.blocks || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b => {
        const name = b.block_name || b.block || b.city || b.blockCommitteeName || '';
        const admin = b.admin_name || b.primary_name || '';
        return name.toLowerCase().includes(q) || admin.toLowerCase().includes(q);
      });
    }
    if (sortBy === 'donors') {
      list.sort((a, b) => (Number(b.donors_count) || 0) - (Number(a.donors_count) || 0));
    } else if (sortBy === 'fulfilled') {
      list.sort((a, b) => (Number(b.fulfilled_requests) || 0) - (Number(a.fulfilled_requests) || 0));
    } else {
      list.sort((a, b) => (Number(b.total_points) || 0) - (Number(a.total_points) || 0));
    }
    return list;
  }, [data.blocks, searchQuery, sortBy]);

  const maxBlockPoints = useMemo(() => {
    let max = 0;
    (filteredBlocks || []).forEach(b => {
      const pts = Number(b.total_points) || 0;
      if (pts > max) max = pts;
    });
    return max;
  }, [filteredBlocks]);

  // Filtered Meghalas
  const filteredMeghalas = useMemo(() => {
    let list = [...(data.meghalas || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        (m.meghala_name || m.meghala || '').toLowerCase().includes(q) ||
        (m.block_name || m.block || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.meghalas, searchQuery]);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    let list = [...(data.top_donors || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        (d.primary_name || d.name || '').toLowerCase().includes(q) ||
        (d.jeevalink_id || '').toLowerCase().includes(q) ||
        (d.blood_group || '').toLowerCase().includes(q) ||
        (d.block || d.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.top_donors, searchQuery]);

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    let list = [...(data.top_volunteers || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        (v.primary_name || v.name || '').toLowerCase().includes(q) ||
        (v.jeevalink_id || '').toLowerCase().includes(q) ||
        (v.block || v.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.top_volunteers, searchQuery]);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-700 text-xs font-black border border-amber-300/50">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-700/10 text-amber-800 text-xs font-bold border border-amber-600/20">
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 text-xs text-slate-400 font-semibold">
        {rank}
      </span>
    );
  };

  const getDonorTierStyle = (badge) => {
    switch (badge) {
      case 'Legend Donor':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Red Guardian':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Blood Hero':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Life Saver':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">

      {/* ─── Minimal Header ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-[11px] font-bold uppercase tracking-wider">
                DYFI {cleanDistrict}
              </span>
              <span className="text-slate-400 text-xs">• Points League</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Points & Performance Table
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Rankings and gamified milestones across all Block Committees and blood heroes in {cleanDistrict}.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/super-admin/dashboard"
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
              disabled={loading}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* 4 Minimal Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">District Pool</span>
            <span className="text-lg font-black text-slate-950 block mt-0.5">
              {(data.summary?.total_district_points || 0).toLocaleString()} <span className="text-[10px] text-red-600 font-bold uppercase">pts</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">#1 Block</span>
            <span className="text-sm font-black text-slate-900 block mt-1 truncate">
              {data.summary?.top_block || (filteredBlocks.length > 0 ? (filteredBlocks[0].block_name || filteredBlocks[0].city) : 'N/A')}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">#1 Donor</span>
            <span className="text-sm font-black text-slate-900 block mt-1 truncate">
              {data.summary?.top_donor || (filteredDonors.length > 0 ? filteredDonors[0].primary_name : 'N/A')}
            </span>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Committees</span>
            <span className="text-lg font-black text-slate-950 block mt-0.5">
              {filteredBlocks.length + (data.meghalas?.length || 0)} <span className="text-[10px] text-slate-400 font-normal">units</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Minimal Segmented Tab Filter & Search ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented Pills */}
        <div className="bg-slate-200/60 p-1 rounded-xl inline-flex items-center gap-1 overflow-x-auto max-w-full">
          {[
            { id: 'blocks', label: 'Block Committees', count: filteredBlocks.length },
            { id: 'meghalas', label: 'Meghala Units', count: filteredMeghalas.length },
            { id: 'donors', label: 'Top Donors', count: filteredDonors.length },
            { id: 'volunteers', label: 'Volunteers', count: filteredVolunteers.length },
            { id: 'rules', label: 'Point Rules', count: null },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`ml-1.5 text-[10px] font-bold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls (Hidden on Rules) */}
        {activeTab !== 'rules' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 w-48 text-slate-900"
              />
            </div>

            {activeTab === 'blocks' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 cursor-pointer"
              >
                <option value="points">Sort: Points</option>
                <option value="donors">Sort: Donors</option>
                <option value="fulfilled">Sort: Fulfilled</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* ─── Content Views ─── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs font-medium">
          Loading rankings...
        </div>
      ) : (
        <div className="space-y-4">

          {/* ═════════ 1. BLOCK COMMITTEES TAB ═════════ */}
          {activeTab === 'blocks' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              {filteredBlocks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No block committees found in {cleanDistrict}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Block Committee</th>
                        <th className="py-3 px-4">Admin Lead</th>
                        <th className="py-3 px-4 text-center">Donors</th>
                        <th className="py-3 px-4 text-center">Volunteers</th>
                        <th className="py-3 px-4 text-center">Fulfilled</th>
                        <th className="py-3 px-4">Points Share</th>
                        <th className="py-3 px-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBlocks.map((b, idx) => {
                        const blockName = b.block_name || b.blockCommitteeName || b.city || b.block || b.name || `Block ${idx + 1}`;
                        const adminName = b.admin_name || b.primary_name || b.primaryContactName || b.name || 'Block Coordinator';
                        const currentPts = Number(b.total_points) || 0;
                        const percent = maxBlockPoints > 0 && currentPts > 0
                          ? Math.min(100, Math.round((currentPts / maxBlockPoints) * 100))
                          : 0;

                        return (
                          <tr
                            key={b.block_name || idx}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                            onClick={() => setSelectedBlockDetail({ ...b, block_name: blockName, admin_name: adminName })}
                          >
                            <td className="py-3 px-4 text-center">
                              {getRankBadge(idx + 1)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{blockName}</div>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {b.meghala_count ? `${b.meghala_count} Meghalas` : 'District Committee'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-slate-700 font-medium">{adminName}</div>
                              {b.admin_mobile && (
                                <span className="text-[10px] text-slate-400">{b.admin_mobile}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-slate-700">
                              {b.donors_count || 0}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-slate-700">
                              {b.volunteers_count || 0}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-slate-700">
                              {b.fulfilled_requests || 0}
                            </td>
                            <td className="py-3 px-4 min-w-[120px]">
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-red-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-slate-900">
                                {currentPts.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">pts</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═════════ 2. MEGHALA COMMITTEES TAB ═════════ */}
          {activeTab === 'meghalas' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              {filteredMeghalas.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No Meghala units found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMeghalas.map((m, idx) => (
                    <div
                      key={m.meghala_name || idx}
                      className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getRankBadge(idx + 1)}
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">{m.meghala_name || m.meghala || 'Meghala Unit'}</h4>
                          <p className="text-[11px] text-slate-400 font-normal">Block: {m.block_name || m.block || cleanDistrict}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <span className="text-slate-500 font-medium text-[11px]">
                          {m.total_members || 0} members • {m.volunteers_count || 0} squads
                        </span>
                        <div className="text-right min-w-[60px]">
                          <span className="font-black text-slate-900">{m.total_points || 0}</span>
                          <span className="text-[10px] text-slate-400 ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ 3. TOP DONORS TAB ═════════ */}
          {activeTab === 'donors' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              {filteredDonors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No donors found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDonors.map((donor, idx) => (
                    <div
                      key={donor.id || idx}
                      className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getRankBadge(idx + 1)}
                        <span className="w-8 h-8 rounded-lg bg-red-50 text-red-700 border border-red-100 font-black text-xs flex items-center justify-center shrink-0">
                          {donor.blood_group || 'O+'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{donor.primary_name || donor.name}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${getDonorTierStyle(donor.badge || 'First Drop')}`}>
                              {donor.badge || 'First Drop'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-normal truncate">
                            {donor.jeevalink_id || `JL-${donor.id}`} • {donor.block || donor.city || cleanDistrict} {donor.meghala ? `(${donor.meghala})` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        {donor.total_donations > 0 && (
                          <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
                            {donor.total_donations} donations
                          </span>
                        )}
                        <div className="text-right min-w-[60px]">
                          <span className="font-black text-red-600">{donor.reward_points || 0}</span>
                          <span className="text-[10px] text-slate-400 ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ 4. TOP VOLUNTEERS TAB ═════════ */}
          {activeTab === 'volunteers' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              {filteredVolunteers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No volunteers found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredVolunteers.map((vol, idx) => (
                    <div
                      key={vol.id || idx}
                      className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getRankBadge(idx + 1)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{vol.primary_name || vol.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.2 bg-slate-100 text-slate-600 rounded-md">
                              {vol.role || 'Volunteer'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-normal truncate">
                            {vol.jeevalink_id || `JL-VOL-${vol.id}`} • {vol.block || vol.city || cleanDistrict}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        {vol.mobile && vol.mobile !== 'N/A' && (
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            {vol.mobile}
                          </span>
                        )}
                        <div className="text-right min-w-[60px]">
                          <span className="font-black text-slate-900">{vol.reward_points || 0}</span>
                          <span className="text-[10px] text-slate-400 ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ 5. POINT RULES & BADGES GUIDE TAB ═════════ */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Point Allocation Mechanics
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Points are credited automatically upon verification of blood donations and coordination events.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(data.point_rules || []).map((rule, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{rule.action}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{rule.target}</span>
                      </div>
                      <span className="text-xs font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                        {rule.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Milestone Badges
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Donors unlock certificates and milestone badges based on their lifetime points.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs text-center">
                  {(data.badges_guide || []).map((badge, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-slate-900 block">{badge.name}</span>
                      <span className="inline-block text-[10px] font-semibold text-slate-500">{badge.points}+ pts</span>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{badge.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─── Minimal Detail Modal ─── */}
      {selectedBlockDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-100 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Rank #{selectedBlockDetail.rank}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedBlockDetail.block_name}</h3>
              </div>
              <button
                onClick={() => setSelectedBlockDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total Points:</span>
                <span className="text-red-600 font-black">{(selectedBlockDetail.total_points || 0).toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Registered Donors:</span>
                <span className="font-semibold text-slate-900">{selectedBlockDetail.donors_count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Active Squads:</span>
                <span className="font-semibold text-slate-900">{selectedBlockDetail.volunteers_count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfilled Units:</span>
                <span className="font-semibold text-slate-900">{selectedBlockDetail.fulfilled_requests || 0}</span>
              </div>
            </div>

            <div className="text-slate-600">
              <span className="font-semibold text-slate-900 block">Admin:</span>
              <span>{selectedBlockDetail.admin_name}</span>
              {selectedBlockDetail.admin_mobile && (
                <span className="block text-slate-400">{selectedBlockDetail.admin_mobile}</span>
              )}
            </div>

            <button
              onClick={() => setSelectedBlockDetail(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
