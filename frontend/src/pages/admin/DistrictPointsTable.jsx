import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Award, Medal, Crown, Flame, MapPin, RefreshCw, 
  Building2, Zap, Shield, Search, ArrowUpRight, Phone, X
} from 'lucide-react';
import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';

export default function DistrictPointsTable() {
  const { user } = useAuthStore();
  const userDistrict = user?.district || 'Kasaragod';

  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'meghalas' | 'donors' | 'volunteers' | 'rules'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'donors' | 'fulfilled'
  const [selectedBlockDetail, setSelectedBlockDetail] = useState(null);

  const [data, setData] = useState({
    district: userDistrict,
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
      // The points-table endpoint is authoritative for ranking/points data.
      // The blocks directory is only used to enrich block metadata.
      const [resPoints, resBlocks] = await Promise.all([
        api.get('/super-admin/points-table').catch(() => null),
        api.get('/super-admin/blocks').catch(() => null),
      ]);

      const dirBlocks =
        resBlocks?.data?.success && Array.isArray(resBlocks.data.data?.blocks)
          ? resBlocks.data.data.blocks
          : [];

      const normalizeName = (value = '') =>
        String(value)
          .toLowerCase()
          .replace(/^(dyfi|block committee|block)\s+|\s+(block committee|committee|block)$/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const toNumber = (value, fallback = 0) => {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
      };

      const getBlockName = (block = '') =>
        block.block_name ||
        block.blockCommitteeName ||
        block.city ||
        block.block ||
        '';

      const dirMap = new Map();

      dirBlocks.forEach((db) => {
        const name = db.blockName || db.blockCommitteeName || db.city || '';
        const key = normalizeName(name);

        if (key) {
          dirMap.set(key, db);
        }
      });

      if (resPoints?.data?.success && resPoints.data.data) {
        const rawData = resPoints.data.data;
        const ptsBlocks = Array.isArray(rawData.blocks) ? rawData.blocks : [];

        const isGenericOrInvalidBlockName = (name = '') => {
          const norm = normalizeName(name);
          return (
            !norm ||
            ['block committee', 'district block committee', 'committee', 'block', 'unassigned', 'n/a'].includes(norm)
          );
        };

        const mergedBlocks = ptsBlocks
          .map((pb) => {
            const pbName = getBlockName(pb);
            const key = normalizeName(pbName);

            const dir =
              dirMap.get(key) ||
              Array.from(dirMap.entries()).find(([dirKey]) => {
                if (!key || !dirKey) return false;
                return key === dirKey || key.includes(dirKey) || dirKey.includes(key);
              })?.[1];

            const resolvedName = pbName || dir?.blockName || dir?.blockCommitteeName || '';

            return {
              ...pb,
              block_name: resolvedName,

              admin_name:
                dir?.admin1Name &&
                !['Admin Not Assigned', 'N/A', '—'].includes(String(dir.admin1Name).trim())
                  ? dir.admin1Name
                  : pb.admin_name || pb.admin1Name || 'Block Coordinator',

              admin_mobile:
                dir?.admin1Mobile &&
                !['—', 'N/A', ''].includes(String(dir.admin1Mobile).trim())
                  ? dir.admin1Mobile
                  : pb.admin_mobile || pb.admin1Mobile || '',

              admin_email:
                dir?.email && !['—', 'N/A', ''].includes(String(dir.email).trim())
                  ? dir.email
                  : pb.admin_email || pb.email || '',

              admin2_name: dir?.admin2Name || pb.admin2_name || '',
              admin2_mobile: dir?.admin2Mobile || pb.admin2_mobile || '',
              status: dir?.status || pb.status || (dir?.isAssigned ? 'Active' : 'Unassigned'),
              isAssigned: dir?.isAssigned ?? pb.is_assigned ?? false,

              donors_count: toNumber(
                pb.donors_count ?? pb.donors ?? pb.donor_count ?? dir?.donors ?? dir?.donorCount
              ),
              volunteers_count: toNumber(
                pb.volunteers_count ??
                  pb.volunteers ??
                  pb.volunteer_count ??
                  dir?.volunteers ??
                  dir?.volunteerCount
              ),
              meghala_count: toNumber(
                pb.meghala_count ??
                  pb.meghalas_count ??
                  dir?.meghalaCount ??
                  (Array.isArray(dir?.meghalas) ? dir.meghalas.length : 0)
              ),
              total_points: toNumber(pb.total_points),
              fulfilled_requests: toNumber(
                pb.fulfilled_requests ?? pb.fulfilled_count ?? pb.fulfilled
              ),
              total_requests: toNumber(pb.total_requests ?? pb.request_count),
            };
          })
          .filter((b) => !isGenericOrInvalidBlockName(b.block_name));

        dirMap.forEach((db, key) => {
          const rawName = db.blockName || db.blockCommitteeName || db.city || '';
          if (isGenericOrInvalidBlockName(rawName)) return;

          const exists = mergedBlocks.some((mb) => normalizeName(mb.block_name) === key);

          if (!exists) {
            mergedBlocks.push({
              block_name: rawName,
              admin_name:
                db.admin1Name && !['Admin Not Assigned', 'N/A', '—'].includes(String(db.admin1Name).trim())
                  ? db.admin1Name
                  : 'Block Coordinator',
              admin_mobile:
                db.admin1Mobile && !['—', 'N/A', ''].includes(String(db.admin1Mobile).trim())
                  ? db.admin1Mobile
                  : '',
              admin_email:
                db.email && !['—', 'N/A', ''].includes(String(db.email).trim()) ? db.email : '',
              admin2_name: db.admin2Name || '',
              admin2_mobile: db.admin2Mobile || '',
              status: db.status || (db.isAssigned ? 'Active' : 'Unassigned'),
              isAssigned: db.isAssigned ?? false,
              total_points: 0,
              donors_count: toNumber(db.donors ?? db.donorCount),
              volunteers_count: toNumber(db.volunteers ?? db.volunteerCount),
              fulfilled_requests: 0,
              total_requests: 0,
              meghala_count: toNumber(
                db.meghalaCount ?? (Array.isArray(db.meghalas) ? db.meghalas.length : 0)
              ),
            });
          }
        });

        mergedBlocks.sort((a, b) => toNumber(b.total_points) - toNumber(a.total_points));
        mergedBlocks.forEach((block, index) => {
          block.rank = index + 1;
        });

        const rawSummary = rawData.summary || {};
        const summary = {
          ...rawSummary,
          total_district_points: toNumber(
            rawSummary.total_district_points ??
              rawSummary.total_points ??
              mergedBlocks.reduce((sum, block) => sum + toNumber(block.total_points), 0)
          ),
          total_blocks: toNumber(rawSummary.total_blocks ?? mergedBlocks.length),
          total_meghalas: toNumber(
            rawSummary.total_meghalas ??
              mergedBlocks.reduce((sum, block) => sum + toNumber(block.meghala_count), 0)
          ),
          total_donors: toNumber(
            rawSummary.total_donors ??
              mergedBlocks.reduce((sum, block) => sum + toNumber(block.donors_count), 0)
          ),
          total_volunteers: toNumber(
            rawSummary.total_volunteers ??
              mergedBlocks.reduce((sum, block) => sum + toNumber(block.volunteers_count), 0)
          ),
          top_block:
            rawSummary.top_block ||
            mergedBlocks.find((block) => toNumber(block.total_points) > 0)?.block_name ||
            mergedBlocks[0]?.block_name ||
            'N/A',
          top_donor: rawSummary.top_donor || rawData.top_donors?.[0]?.primary_name || 'N/A',
        };

        setData({
          ...rawData,
          district: rawData.district || user?.district || 'Kasaragod',
          summary,
          blocks: mergedBlocks,
          meghalas: Array.isArray(rawData.meghalas) ? rawData.meghalas : [],
          top_donors: Array.isArray(rawData.top_donors)
            ? rawData.top_donors
            : Array.isArray(rawData.highest_donors)
              ? rawData.highest_donors
              : [],
          top_volunteers: Array.isArray(rawData.top_volunteers) ? rawData.top_volunteers : [],
          point_rules: Array.isArray(rawData.point_rules) ? rawData.point_rules : [],
          badges_guide: Array.isArray(rawData.badges_guide) ? rawData.badges_guide : [],
        });
        return;
      }

      // Public leaderboard fallback.
      const resPub = await api.get('/leaderboard').catch(() => null);

      if (resPub?.data?.success && resPub.data.data) {
        const pub = resPub.data.data;
        const blocks = Array.isArray(pub.blocks) ? pub.blocks : [];
        const donors = Array.isArray(pub.top_donors)
          ? pub.top_donors
          : Array.isArray(pub.highest_donors)
            ? pub.highest_donors
            : [];
        const volunteers = Array.isArray(pub.top_volunteers) ? pub.top_volunteers : [];
        const meghalas = Array.isArray(pub.meghalas) ? pub.meghalas : [];

        const fallbackSummary = {
          total_district_points: blocks.reduce(
            (sum, block) => sum + toNumber(block.total_points),
            0
          ),
          total_blocks: blocks.length,
          total_meghalas: meghalas.length,
          total_donors: donors.length,
          total_volunteers: volunteers.length,
          top_block: blocks[0]?.block_name || 'N/A',
          top_donor: donors[0]?.primary_name || donors[0]?.name || 'N/A',
        };

        setData({
          district: pub.district || user?.district || 'Kasaragod',
          summary: { ...fallbackSummary, ...(pub.summary || {}) },
          blocks: blocks.map((block, index) => ({
            ...block,
            rank: block.rank || index + 1,
            total_points: toNumber(block.total_points),
            donors_count: toNumber(block.donors_count ?? block.donors),
            volunteers_count: toNumber(block.volunteers_count ?? block.volunteers),
            fulfilled_requests: toNumber(block.fulfilled_requests),
            meghala_count: toNumber(block.meghala_count),
          })),
          meghalas,
          top_donors: donors,
          top_volunteers: volunteers,
          point_rules: Array.isArray(pub.point_rules) ? pub.point_rules : [],
          badges_guide: Array.isArray(pub.badges_guide) ? pub.badges_guide : [],
        });
        return;
      }

      // Directory-only fallback. It intentionally does NOT manufacture points.
      const compiledBlocks = dirBlocks.map((bs) => ({
        rank: 0,
        block_name: bs.blockName || bs.blockCommitteeName || bs.city || 'Block Committee',
        admin_name: bs.admin1Name || 'Block Coordinator',
        admin_mobile:
          bs.admin1Mobile && !['—', 'N/A', ''].includes(String(bs.admin1Mobile).trim())
            ? bs.admin1Mobile
            : '',
        admin_email:
          bs.email && !['—', 'N/A', ''].includes(String(bs.email).trim()) ? bs.email : '',
        status: bs.status || 'Unassigned',
        isAssigned: bs.isAssigned ?? false,
        total_points: 0,
        donors_count: toNumber(bs.donors ?? bs.donorCount),
        volunteers_count: toNumber(bs.volunteers ?? bs.volunteerCount),
        fulfilled_requests: 0,
        total_requests: 0,
        meghala_count: toNumber(
          bs.meghalaCount ?? (Array.isArray(bs.meghalas) ? bs.meghalas.length : 0)
        ),
      }));

      compiledBlocks.sort((a, b) => b.donors_count - a.donors_count);
      compiledBlocks.forEach((block, index) => {
        block.rank = index + 1;
      });

      setData({
        district: user?.district || 'Kasaragod',
        summary: {
          total_district_points: 0,
          total_blocks: compiledBlocks.length,
          total_meghalas: compiledBlocks.reduce(
            (sum, block) => sum + toNumber(block.meghala_count),
            0
          ),
          total_donors: compiledBlocks.reduce(
            (sum, block) => sum + toNumber(block.donors_count),
            0
          ),
          total_volunteers: compiledBlocks.reduce(
            (sum, block) => sum + toNumber(block.volunteers_count),
            0
          ),
          top_block: 'N/A',
          top_donor: 'N/A',
        },
        blocks: compiledBlocks,
        meghalas: [],
        top_donors: [],
        top_volunteers: [],
        point_rules: [],
        badges_guide: [],
      });
    } catch (err) {
      console.error('Failed to load district points table:', err);
      setData((current) => ({
        ...current,
        blocks: Array.isArray(current.blocks) ? current.blocks : [],
        meghalas: Array.isArray(current.meghalas) ? current.meghalas : [],
        top_donors: Array.isArray(current.top_donors) ? current.top_donors : [],
        top_volunteers: Array.isArray(current.top_volunteers) ? current.top_volunteers : [],
      }));
    } finally {
      setLoading(false);
    }
  }, [userDistrict]);

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
    return max || 1;
  }, [filteredBlocks]);

  // Filtered Meghalas
  const filteredMeghalas = useMemo(() => {
    const invalidTerms = ['meghala unit', 'meghala', 'unit', 'unit committee', 'committee', 'block', 'unassigned', 'n/a', ''];
    let list = (data.meghalas || []).filter(m => {
      const name = String(m.meghala_name || m.meghala || m.name || '').toLowerCase().trim();
      return name && !invalidTerms.includes(name);
    });
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
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-xs shadow-sm shadow-amber-500/30 ring-2 ring-amber-300/40">
          <Crown className="w-4 h-4 fill-white" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-slate-300 to-slate-500 text-white font-black text-xs shadow-sm ring-2 ring-slate-200">
          <Medal className="w-4 h-4 fill-white" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-black text-xs shadow-sm ring-2 ring-amber-800/30">
          <Award className="w-4 h-4 fill-amber-200" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
        #{rank}
      </span>
    );
  };

  const getDonorTierStyle = (badge) => {
    switch (badge) {
      case 'Legend Donor':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      case 'Red Guardian':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'Blood Hero':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Life Saver':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 px-2 sm:px-4">

      {/* ─── Modern Glassmorphic Banner Header ─── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-900 via-red-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-red-700/40">
        {/* Decorative Background Accents */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-black uppercase tracking-wider text-amber-300">
              <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              DYFI {cleanDistrict} • Official Points League
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Points & Performance Table
            </h1>
            <p className="text-red-100/80 text-xs sm:text-sm font-medium leading-relaxed">
              Real-time database metrics, block committee rankings, and blood donor honors across {cleanDistrict}.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/super-admin/dashboard"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-2 backdrop-blur-md"
            >
              Dashboard
            </Link>
            <Link
              to="/super-admin/blocks"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-2 backdrop-blur-md"
            >
              Manage Blocks
            </Link>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Rankings
            </button>
          </div>
        </div>

        {/* 4 Dynamic Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-white/15">
          <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-200/90 block">District Points Pool</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white">
                {(data.summary?.total_district_points || 0).toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-amber-400 uppercase">pts</span>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-200/90 block">#1 Block Committee</span>
            <span className="text-sm sm:text-base font-black text-amber-300 block truncate">
              {data.summary?.top_block || (filteredBlocks.length > 0 ? (filteredBlocks[0].block_name || filteredBlocks[0].city) : 'N/A')}
            </span>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-200/90 block">#1 Top Blood Donor</span>
            <span className="text-sm sm:text-base font-black text-amber-300 block truncate">
              {data.summary?.top_donor || (filteredDonors.length > 0 ? filteredDonors[0].primary_name : 'N/A')}
            </span>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-200/90 block">Active Committees</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white">
                {Number(data.summary?.total_blocks) || 0}
              </span>
              <span className="text-xs text-red-200 font-medium">Blocks • {Number(data.summary?.total_meghalas) || 0} Units</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Segmented Navigation Controls & Search ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Segmented Pills */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center gap-1 overflow-x-auto max-w-full">
          {[
            { id: 'blocks', label: 'Block Committees', icon: Building2, count: filteredBlocks.length },
            { id: 'meghalas', label: 'Meghala Units', icon: MapPin, count: filteredMeghalas.length },
            { id: 'donors', label: 'Top Donors', icon: Flame, count: filteredDonors.length },
            { id: 'volunteers', label: 'Meghala Leaders', icon: Shield, count: filteredVolunteers.length },
            { id: 'rules', label: 'Point Rules & Badges', icon: Award, count: null },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Controls */}
        {activeTab !== 'rules' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, block..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-slate-900 font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'blocks' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700 cursor-pointer"
              >
                <option value="points">Sort: Total Points</option>
                <option value="donors">Sort: Donors Count</option>
                <option value="fulfilled">Sort: Fulfilled Units</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* ─── Main Content Panels ─── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
          <p className="text-slate-600 text-xs font-semibold">
            Fetching real-time database standings...
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ═════════ TAB 1: BLOCK COMMITTEES ═════════ */}
          {activeTab === 'blocks' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {filteredBlocks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No block committees matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                        <th className="py-3.5 px-4">Block Committee</th>
                        <th className="py-3.5 px-4">Admin Lead</th>
                        <th className="py-3.5 px-4 text-center">Donors</th>
                        <th className="py-3.5 px-4 text-center">Squads</th>
                        <th className="py-3.5 px-4 text-center">Fulfilled</th>
                        <th className="py-3.5 px-4 min-w-[140px]">District Share</th>
                        <th className="py-3.5 px-4 text-right">Total Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBlocks.map((b, idx) => {
                        const blockName = b.block_name || b.blockCommitteeName || b.city || b.block || `Block ${idx + 1}`;
                        const adminName = b.admin_name || b.admin1Name || b.primary_name || 'Block Coordinator';
                        const adminMobile = b.admin_mobile || b.admin1Mobile || '';
                        const currentPts = Number(b.total_points) || 0;
                        const percent = Math.min(100, Math.round((currentPts / maxBlockPoints) * 100));

                        return (
                          <tr
                            key={b.block_name || idx}
                            onClick={() => setSelectedBlockDetail({ ...b, block_name: blockName, admin_name: adminName, admin_mobile: adminMobile })}
                            className="hover:bg-red-50/40 transition-colors cursor-pointer group"
                          >
                            <td className="py-4 px-4 text-center">
                              {getRankBadge(idx + 1)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-extrabold text-slate-900 group-hover:text-red-700 transition-colors flex items-center gap-1.5">
                                {blockName}
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition-colors" />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {b.meghala_count ? `${b.meghala_count} Meghalas` : 'District Block Committee'}
                                </span>
                                {b.isAssigned ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Assigned
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-800 font-bold">{adminName}</div>
                              {adminMobile && adminMobile !== '—' && (
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" /> {adminMobile}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                {b.donors_count || 0}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                                {b.volunteers_count || 0}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {b.fulfilled_requests || 0}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold block text-right">{percent}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="font-black text-slate-900 text-sm">
                                {currentPts.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-red-600 font-bold uppercase ml-1">pts</span>
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

          {/* ═════════ TAB 2: MEGHALA UNITS ═════════ */}
          {activeTab === 'meghalas' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {filteredMeghalas.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No Meghala units found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMeghalas.map((m, idx) => (
                    <div
                      key={m.meghala_name || idx}
                      className="p-4 px-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {getRankBadge(idx + 1)}
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">{m.meghala_name || m.meghala || 'Meghala Unit'}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">Parent Block: <span className="text-slate-800 font-bold">{m.block_name || m.block || cleanDistrict}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-slate-600 font-bold text-xs block">{m.total_members || 0} Members</span>
                          <span className="text-[10px] text-slate-400 font-medium">{m.volunteers_count || 0} Volunteer Squads</span>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <span className="font-black text-slate-900 text-sm">{(m.total_points || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-red-600 font-bold uppercase ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ TAB 3: TOP BLOOD DONORS ═════════ */}
          {activeTab === 'donors' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {filteredDonors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No donors matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDonors.map((donor, idx) => (
                    <div
                      key={donor.id || idx}
                      className="p-4 px-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {getRankBadge(idx + 1)}
                        <span className="w-9 h-9 rounded-xl bg-red-600 text-white shadow-sm font-black text-xs flex items-center justify-center shrink-0">
                          {donor.blood_group || 'O+'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{donor.primary_name || donor.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getDonorTierStyle(donor.badge || 'First Drop')}`}>
                              {donor.badge || 'First Drop'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {donor.jeevalink_id || `JL-${donor.id}`} • {donor.block || donor.city || cleanDistrict} {donor.meghala ? `(${donor.meghala})` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-slate-700 font-bold text-xs block">{donor.total_donations || 0} Donations</span>
                          <span className="text-[10px] text-emerald-600 font-bold">{donor.lives_saved ?? '—'} Lives Saved</span>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <span className="font-black text-red-600 text-sm">{(donor.reward_points || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ TAB 4: MEGHALA LEADERS ═════════ */}
          {activeTab === 'volunteers' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {filteredVolunteers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No volunteers found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredVolunteers.map((vol, idx) => (
                    <div
                      key={vol.id || idx}
                      className="p-4 px-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {getRankBadge(idx + 1)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{vol.primary_name || vol.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                              {vol.role || 'Volunteer Coordinator'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {vol.jeevalink_id || `JL-VOL-${vol.id}`} • {vol.block || vol.city || cleanDistrict}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        {vol.mobile && vol.mobile !== 'N/A' && (
                          <span className="text-xs text-slate-600 font-semibold hidden sm:flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {vol.mobile}
                          </span>
                        )}
                        <div className="text-right min-w-[70px]">
                          <span className="font-black text-slate-900 text-sm">{(vol.reward_points || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════ TAB 5: POINT RULES & BADGES GUIDE ═════════ */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Rules Section */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Point Allocation Mechanics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Points are automatically calculated and assigned based on verified real-world blood donations and coordination events.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {(data.point_rules || []).map((rule, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900">{rule.action}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">{rule.target}</span>
                      </div>
                      <span className="text-xs font-black text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                        {rule.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone Badges Section */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-red-600" /> Milestone Badges & Honor Tiers
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Blood heroes unlock official digital badges and certificates upon crossing point milestones.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs text-center">
                  {(data.badges_guide || []).map((badge, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-black text-slate-900 block">{badge.name}</span>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full">
                          {badge.points}+ Pts Required
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">{badge.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─── Interactive Block Committee Detail Modal ─── */}
      {selectedBlockDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Rank #{selectedBlockDetail.rank} Committee
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedBlockDetail.block_name}</h3>
              </div>
              <button
                onClick={() => setSelectedBlockDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-600">Total Points Pool:</span>
                <span className="text-red-600 font-black text-base">{(selectedBlockDetail.total_points || 0).toLocaleString()} pts</span>
              </div>
              <div className="h-px bg-slate-200/60 my-1" />
              <div className="flex justify-between text-slate-600">
                <span>Registered Donors:</span>
                <span className="font-extrabold text-slate-900">{selectedBlockDetail.donors_count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Volunteer Squads:</span>
                <span className="font-extrabold text-slate-900">{selectedBlockDetail.volunteers_count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfilled Blood Units:</span>
                <span className="font-extrabold text-slate-900">{selectedBlockDetail.fulfilled_requests || 0}</span>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Committee Admin Lead</span>
              <div className="font-extrabold text-slate-900 text-sm">{selectedBlockDetail.admin_name}</div>
              {selectedBlockDetail.admin_mobile && selectedBlockDetail.admin_mobile !== '—' && (
                <div className="text-slate-600 font-medium flex items-center gap-1.5 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Primary: {selectedBlockDetail.admin_mobile}
                </div>
              )}
              {selectedBlockDetail.admin2_name && (
                <div className="mt-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 block">Secondary Admin</span>
                  <div className="font-bold text-slate-800">{selectedBlockDetail.admin2_name}</div>
                  {selectedBlockDetail.admin2_mobile && (
                    <div className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" /> {selectedBlockDetail.admin2_mobile}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBlockDetail(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-bold transition shadow-md cursor-pointer"
            >
              Close Detail
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
