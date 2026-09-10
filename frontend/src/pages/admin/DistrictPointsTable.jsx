import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Award, Crown, Medal, Flame, Search, RefreshCw,
  Building2, Users, Droplets, Heart, Zap, Shield, ArrowUpRight,
  TrendingUp, CheckCircle2, ChevronRight, Share2, Sparkles,
  Phone, Mail, MapPin, Info, ArrowUpDown, Filter, Download
} from 'lucide-react';
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
    setLoading(true);
    try {
      const res = await api.get('/super-admin/points-table');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load district points table:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentDistrict = data.district || user?.district || 'Kasaragod';
  const cleanDistrict = currentDistrict.replace(/^dyfi\s*/i, '').trim();

  // Filtered and Sorted Blocks
  const filteredBlocks = useMemo(() => {
    let list = [...(data.blocks || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        (b.block_name || '').toLowerCase().includes(q) ||
        (b.admin_name || '').toLowerCase().includes(q)
      );
    }
    if (sortBy === 'donors') {
      list.sort((a, b) => b.donors_count - a.donors_count);
    } else if (sortBy === 'fulfilled') {
      list.sort((a, b) => b.fulfilled_requests - a.fulfilled_requests);
    } else {
      list.sort((a, b) => b.total_points - a.total_points);
    }
    return list;
  }, [data.blocks, searchQuery, sortBy]);

  // Filtered Meghalas
  const filteredMeghalas = useMemo(() => {
    let list = [...(data.meghalas || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        (m.meghala_name || '').toLowerCase().includes(q) ||
        (m.block_name || '').toLowerCase().includes(q)
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
        (d.primary_name || '').toLowerCase().includes(q) ||
        (d.jeevalink_id || '').toLowerCase().includes(q) ||
        (d.blood_group || '').toLowerCase().includes(q) ||
        (d.block || '').toLowerCase().includes(q)
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
        (v.primary_name || '').toLowerCase().includes(q) ||
        (v.jeevalink_id || '').toLowerCase().includes(q) ||
        (v.block || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.top_volunteers, searchQuery]);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-600 flex items-center justify-center font-black text-sm shadow-xs shrink-0" title="1st Place - Gold">
          <Crown className="w-4 h-4 fill-amber-500/20 text-amber-600" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-200/80 border border-slate-300 text-slate-700 flex items-center justify-center font-black text-sm shadow-xs shrink-0" title="2nd Place - Silver">
          <Medal className="w-4 h-4 fill-slate-300 text-slate-600" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-700/10 border border-amber-600/30 text-amber-800 flex items-center justify-center font-black text-sm shadow-xs shrink-0" title="3rd Place - Bronze">
          <Medal className="w-4 h-4 fill-amber-700/20 text-amber-800" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
        #{rank}
      </div>
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
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">

      {/* ─── Creative Minimal Header & Hero ─── */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Subtle decorative glowing corner accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-red-500/8 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-red-700 text-[11px] font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-red-600" />
                DYFI {cleanDistrict} District League
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-slate-600 text-[11px] font-medium">
                <Sparkles className="w-3 h-3 text-amber-500" /> Live Point System
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight uppercase">
              District Points Table
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
              Performance index, gamified reward rankings, and contribution tracking for all Block Committees, Meghala units, and blood heroes across {cleanDistrict}.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <Link
              to="/super-admin/dashboard"
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              Dashboard
            </Link>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Rankings
            </button>
          </div>
        </div>

        {/* 4 Minimal Metric Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">District Point Pool</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-950">{(data.summary?.total_district_points || 0).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-red-600 uppercase">Pts</span>
            </div>
          </div>

          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Block Committee</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
              <span className="text-sm font-black text-slate-900 truncate">{data.summary?.top_block || 'N/A'}</span>
            </div>
          </div>

          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Ranked Donor</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Flame className="w-4 h-4 text-red-600 fill-red-100 shrink-0" />
              <span className="text-sm font-black text-slate-900 truncate">{data.summary?.top_donor || 'N/A'}</span>
            </div>
          </div>

          <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Units</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-700">{(data.summary?.total_blocks || 0) + (data.summary?.total_meghalas || 0)}</span>
              <span className="text-[10px] font-semibold text-slate-500">Committees</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Top 3 Podium Cards (when in Block View) ─── */}
      {activeTab === 'blocks' && data.blocks && data.blocks.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 2nd Place */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between order-2 md:order-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/50 rounded-bl-full pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black text-sm">
                🥈 2nd
              </div>
              <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {data.blocks[1]?.total_points || 0} Pts
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-extrabold text-slate-900 text-base">{data.blocks[1]?.block_name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Admin: {data.blocks[1]?.admin_name}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 font-medium">
                <span>🩸 {data.blocks[1]?.donors_count || 0} Donors</span>
                <span>🛡️ {data.blocks[1]?.volunteers_count || 0} Squads</span>
              </div>
            </div>
          </div>

          {/* 1st Place - Gold Champion */}
          <div className="bg-gradient-to-b from-amber-500/10 via-white to-white border-2 border-amber-400/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between order-1 md:order-2 relative overflow-hidden md:-mt-2">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-bl-full pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm shadow-amber-500/30">
                <Crown className="w-6 h-6 fill-white" />
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-amber-500/15 border border-amber-400/30 text-amber-900 font-black text-sm rounded-full">
                  👑 {data.blocks[0]?.total_points || 0} Points
                </span>
                <span className="block text-[10px] font-bold text-amber-700 uppercase mt-0.5">Rank #1 Champion</span>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-black text-slate-950 text-xl tracking-tight">{data.blocks[0]?.block_name}</h3>
              <p className="text-xs text-amber-800 font-semibold mt-0.5">Admin: {data.blocks[0]?.admin_name}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-amber-100 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">🩸 <strong className="text-slate-950">{data.blocks[0]?.donors_count || 0}</strong> Donors</span>
                <span className="flex items-center gap-1">✅ <strong className="text-slate-950">{data.blocks[0]?.fulfilled_requests || 0}</strong> Fulfilled</span>
                <span className="flex items-center gap-1">🛡️ <strong className="text-slate-950">{data.blocks[0]?.volunteers_count || 0}</strong> Squads</span>
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between order-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-700/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-700/10 border border-amber-600/20 text-amber-800 flex items-center justify-center font-black text-sm">
                🥉 3rd
              </div>
              <span className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {data.blocks[2]?.total_points || 0} Pts
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-extrabold text-slate-900 text-base">{data.blocks[2]?.block_name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Admin: {data.blocks[2]?.admin_name}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-600 font-medium">
                <span>🩸 {data.blocks[2]?.donors_count || 0} Donors</span>
                <span>🛡️ {data.blocks[2]?.volunteers_count || 0} Squads</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Minimal Segmented Tabs & Filters ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'blocks', label: 'Block Committees', icon: Building2, count: data.blocks?.length },
            { id: 'meghalas', label: 'Meghala Units', icon: MapPin, count: data.meghalas?.length },
            { id: 'donors', label: 'Top Donors', icon: Flame, count: data.top_donors?.length },
            { id: 'volunteers', label: 'Volunteers', icon: Shield, count: data.top_volunteers?.length },
            { id: 'rules', label: 'Point Rules', icon: Info, count: null },
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-extrabold ${isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls (Hidden on Rules Tab) */}
        {activeTab !== 'rules' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
              />
            </div>

            {activeTab === 'blocks' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-slate-700 cursor-pointer"
              >
                <option value="points">Sort: Total Points</option>
                <option value="donors">Sort: Donors</option>
                <option value="fulfilled">Sort: Fulfilled Units</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* ─── Main Content Views ─── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-red-600 mb-3 animate-pulse">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>
          <p className="text-slate-900 font-bold text-sm">Computing District Rankings & Points...</p>
          <p className="text-slate-400 text-xs mt-1">Aggregating real-time stats across all block committees</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ═════════ 1. BLOCK COMMITTEES TAB ═════════ */}
          {activeTab === 'blocks' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-red-600" />
                    Block Committees Points Table
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Ranked by points generated, verified donations, and active volunteer squads</p>
                </div>
                <span className="text-xs font-bold text-slate-500">{filteredBlocks.length} Committees</span>
              </div>

              {filteredBlocks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No block committees matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 w-16">Rank</th>
                        <th className="py-3 px-4">Block Committee</th>
                        <th className="py-3 px-4">Admin Coordinator</th>
                        <th className="py-3 px-4 text-center">Donors</th>
                        <th className="py-3 px-4 text-center">Volunteers</th>
                        <th className="py-3 px-4 text-center">Fulfilled Units</th>
                        <th className="py-3 px-4">Points & Share</th>
                        <th className="py-3 px-4 text-right">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBlocks.map((b) => (
                        <tr
                          key={b.block_name}
                          className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                          onClick={() => setSelectedBlockDetail(b)}
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 font-black">
                            {getRankBadge(b.rank)}
                          </td>

                          {/* Block Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-sm group-hover:text-red-600 transition-colors">
                              {b.block_name}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {b.meghala_count > 0 ? `${b.meghala_count} Meghala Units` : 'Central District Unit'}
                            </span>
                          </td>

                          {/* Admin Details */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{b.admin_name}</div>
                            {b.admin_mobile && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                {b.admin_mobile}
                              </div>
                            )}
                          </td>

                          {/* Donors Count */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100">
                              {b.donors_count}
                            </span>
                          </td>

                          {/* Volunteers Count */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                              {b.volunteers_count}
                            </span>
                          </td>

                          {/* Fulfilled Units */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-slate-900">{b.fulfilled_requests}</span>
                            {b.total_requests > 0 && (
                              <span className="block text-[9px] text-slate-400 font-semibold">{b.fulfillment_rate}% rate</span>
                            )}
                          </td>

                          {/* Progress Bar Share */}
                          <td className="py-3.5 px-4 min-w-[140px]">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>Share</span>
                              <span>{b.percentage || 100}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(6, b.percentage || 100)}%` }}
                              />
                            </div>
                          </td>

                          {/* Total Score */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-base font-black text-red-600 block">
                              {(b.total_points || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Points</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═════════ 2. MEGHALA COMMITTEES TAB ═════════ */}
          {activeTab === 'meghalas' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    Meghala Committees Points Table
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Ward & Village-level performance ranking</p>
                </div>
                <span className="text-xs font-bold text-slate-500">{filteredMeghalas.length} Meghalas</span>
              </div>

              {filteredMeghalas.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No Meghala committees found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 sm:p-5">
                  {filteredMeghalas.map((m) => (
                    <div
                      key={m.meghala_name}
                      className="bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-red-200 hover:shadow-xs rounded-2xl p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {getRankBadge(m.rank)}
                        <span className="text-xs font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                          {m.total_points} Pts
                        </span>
                      </div>
                      <div className="mt-3">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{m.meghala_name}</h3>
                        <p className="text-xs text-slate-400 font-medium">Block: {m.block_name}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 text-xs font-bold text-slate-600">
                        <span>👥 {m.total_members} Total Members</span>
                        <span className="text-emerald-700">🛡️ {m.volunteers_count} Volunteers</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ 3. TOP DONORS TAB ═════════ */}
          {activeTab === 'donors' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    District Top Blood Donors
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Recognizing individuals with highest verified blood donations</p>
                </div>
                <span className="text-xs font-bold text-slate-500">{filteredDonors.length} Donors</span>
              </div>

              {filteredDonors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No donors found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDonors.map((donor) => (
                    <div
                      key={donor.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {getRankBadge(donor.rank)}

                        {/* Blood Group Badge */}
                        <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs shadow-red-600/20">
                          {donor.blood_group}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{donor.primary_name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDonorTierStyle(donor.badge)}`}>
                              {donor.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                            <span className="font-semibold text-slate-600">{donor.jeevalink_id}</span>
                            <span>•</span>
                            <span>{donor.block}</span>
                            {donor.meghala && <span>({donor.meghala})</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-11 sm:pl-0">
                        {donor.total_donations > 0 && (
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-700">{donor.total_donations} Donations</span>
                            <span className="block text-[10px] text-emerald-600 font-bold">{donor.lives_saved} Lives Saved</span>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-base font-black text-red-600 block">{donor.reward_points}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Points</span>
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
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Top Volunteer Squad Coordinators
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Volunteers driving field engagements, verifications, and drives</p>
                </div>
                <span className="text-xs font-bold text-slate-500">{filteredVolunteers.length} Volunteers</span>
              </div>

              {filteredVolunteers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No volunteers found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredVolunteers.map((vol) => (
                    <div
                      key={vol.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {getRankBadge(vol.rank)}

                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                          🛡️
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{vol.primary_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                              {vol.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                            <span className="font-semibold text-slate-600">{vol.jeevalink_id}</span>
                            <span>•</span>
                            <span>{vol.block}</span>
                            {vol.meghala && <span>({vol.meghala})</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pl-11 sm:pl-0">
                        {vol.mobile && vol.mobile !== 'N/A' && (
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {vol.mobile}
                          </span>
                        )}
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-700 block">{vol.reward_points}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Points</span>
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
            <div className="space-y-6">
              {/* Rules Cards */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    How Points Are Credited in JeevaLink
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Every verified life-saving action automatically credits points across the hierarchy.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {(data.point_rules || []).map((rule, idx) => (
                    <div key={idx} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-600">{rule.badge}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{rule.target}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{rule.action}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Credited instantly upon system or volunteer verification.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges Milestone Guide */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                    <Award className="w-4 h-4 text-red-600" />
                    Donor Milestone Badges & Tiers
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Donors automatically unlock digital badges and digital certificates as they accumulate JeevaPoints.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {(data.badges_guide || []).map((badge, idx) => (
                    <div key={idx} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-base shadow-xs">
                        {idx === 0 ? '🩸' : idx === 1 ? '💖' : idx === 2 ? '⚡' : idx === 3 ? '🛡️' : '👑'}
                      </div>
                      <h4 className="font-black text-slate-900 text-sm">{badge.name}</h4>
                      <span className="inline-block px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                        {badge.points}+ Pts
                      </span>
                      <p className="text-[11px] text-slate-500 leading-normal">{badge.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─── Detail Modal for Selected Block Committee ─── */}
      {selectedBlockDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                  Rank #{selectedBlockDetail.rank} • Block Committee
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-0.5">{selectedBlockDetail.block_name}</h3>
              </div>
              <button
                onClick={() => setSelectedBlockDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Total Accumulated Points:</span>
                <span className="text-red-600 font-black text-sm">{selectedBlockDetail.total_points} Pts</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Registered Donors:</span>
                <span className="font-bold text-slate-900">{selectedBlockDetail.donors_count}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Active Volunteers & Squads:</span>
                <span className="font-bold text-slate-900">{selectedBlockDetail.volunteers_count}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfilled Blood Requests:</span>
                <span className="font-bold text-slate-900">{selectedBlockDetail.fulfilled_requests}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs space-y-1">
              <p className="font-bold text-slate-900">Admin Lead:</p>
              <p className="text-slate-600">{selectedBlockDetail.admin_name}</p>
              {selectedBlockDetail.admin_mobile && (
                <p className="text-slate-500 font-medium">{selectedBlockDetail.admin_mobile}</p>
              )}
            </div>

            <button
              onClick={() => setSelectedBlockDetail(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
