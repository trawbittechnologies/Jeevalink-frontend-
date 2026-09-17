import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Award, Medal, Crown, Flame, MapPin, RefreshCw, 
  Building2, Zap, Shield, Search, ArrowUpRight, Phone,
  X, Droplets, ChevronRight, Share2, Filter
} from 'lucide-react';
import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { getDisplayJeevalinkId } from '../../utils/jeevalinkId.js';

const ALL_BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const processDynamicMeghalas = (rawData = {}, dirBlocks = []) => {
  const invalidTerms = ['meghala unit', 'meghala', 'unit', 'unit committee', 'committee', 'block', 'unassigned', 'n/a', ''];
  const map = new Map();

  const addOrUpdate = (item, parentBlock = '') => {
    if (!item) return;
    const rawName = typeof item === 'string' ? item : (item.meghala_name || item.meghala || item.name || item.meghalaCommitteeName || '');
    const name = String(rawName).trim();
    if (!name) return;

    const norm = name.toLowerCase();
    if (invalidTerms.includes(norm)) return;

    const blockName = (typeof item === 'object' && (item.block_name || item.block || item.blockCommitteeName || item.city)) || parentBlock || '';
    const totalPts = typeof item === 'object' ? (Number(item.total_points) || 0) : 0;
    const volCount = typeof item === 'object' ? (Number(item.volunteers_count ?? item.volunteers ?? item.volunteer_count) || 0) : 0;
    const dnrCount = typeof item === 'object' ? (Number(item.donors_count ?? item.donors ?? item.donor_count) || 0) : 0;
    const memCount = typeof item === 'object' ? (Number(item.total_members ?? item.members) || (volCount + dnrCount)) : 0;

    if (map.has(norm)) {
      const existing = map.get(norm);
      existing.total_points = Math.max(existing.total_points, totalPts);
      existing.volunteers_count = Math.max(existing.volunteers_count, volCount);
      existing.donors_count = Math.max(existing.donors_count, dnrCount);
      existing.total_members = Math.max(existing.total_members, memCount);
      if (!existing.block_name && blockName) {
        existing.block_name = blockName;
      }
    } else {
      map.set(norm, {
        meghala_name: name,
        meghala: name,
        block_name: blockName,
        total_points: totalPts,
        volunteers_count: volCount,
        donors_count: dnrCount,
        total_members: memCount,
      });
    }
  };

  if (Array.isArray(rawData?.meghalas)) rawData.meghalas.forEach((m) => addOrUpdate(m));
  if (Array.isArray(rawData?.highest_meghala_committee)) rawData.highest_meghala_committee.forEach((m) => addOrUpdate(m));
  if (Array.isArray(rawData?.highest_meghala)) rawData.highest_meghala.forEach((m) => addOrUpdate(m));
  if (Array.isArray(rawData?.meghala_summary)) rawData.meghala_summary.forEach((m) => addOrUpdate(m));

  if (rawData?.meghalas_by_block && typeof rawData.meghalas_by_block === 'object') {
    Object.entries(rawData.meghalas_by_block).forEach(([bName, mList]) => {
      if (Array.isArray(mList)) mList.forEach((m) => addOrUpdate(m, bName));
    });
  }

  const blocksList = [
    ...(Array.isArray(rawData?.blocks) ? rawData.blocks : []),
    ...(Array.isArray(dirBlocks) ? dirBlocks : []),
  ];

  blocksList.forEach((b) => {
    const bName = b.block_name || b.blockName || b.blockCommitteeName || b.city || b.block || '';
    if (Array.isArray(b.meghalas)) {
      b.meghalas.forEach((m) => addOrUpdate(m, bName));
    }
  });

  const donors = Array.isArray(rawData?.top_donors)
    ? rawData.top_donors
    : Array.isArray(rawData?.highest_donors)
      ? rawData.highest_donors
      : [];
  const volunteers = Array.isArray(rawData?.top_volunteers) ? rawData.top_volunteers : [];

  donors.forEach((d) => {
    if (d.meghala) addOrUpdate({ meghala_name: d.meghala, block_name: d.block || d.city || '', donors_count: 1, total_points: Number(d.reward_points) || 0 });
  });

  volunteers.forEach((v) => {
    if (v.meghala) addOrUpdate({ meghala_name: v.meghala, block_name: v.block || v.city || '', volunteers_count: 1, total_points: Number(v.reward_points) || 0 });
  });

  const result = Array.from(map.values());
  result.forEach((m) => {
    if (m.total_members === 0) {
      m.total_members = (m.volunteers_count || 0) + (m.donors_count || 0);
    }
    if (m.total_points === 0 && (m.donors_count > 0 || m.volunteers_count > 0)) {
      m.total_points = (m.donors_count * 100) + (m.volunteers_count * 50);
    }
  });

  result.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.total_members !== a.total_members) return b.total_members - a.total_members;
    return a.meghala_name.localeCompare(b.meghala_name);
  });

  result.forEach((m, idx) => {
    m.rank = idx + 1;
  });

  return result;
};

export default function DistrictPointsTable() {
  const { user } = useAuthStore();
  const userDistrict = user?.district || 'Kasaragod';
  const cleanDistrict = userDistrict.replace(/^dyfi\s*/i, '').trim() || 'Kasaragod';

  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'meghalas' | 'donors' | 'volunteers' | 'rules'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'donors' | 'fulfilled'
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All');
  const [blockFilter, setBlockFilter] = useState('all'); // 'all' | 'assigned' | 'top5'
  const [selectedBlockDetail, setSelectedBlockDetail] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const [data, setData] = useState({
    district: cleanDistrict,
    summary: {
      total_district_points: 0,
      total_blocks: 0,
      total_meghalas: 0,
      total_donors: 0,
      total_volunteers: 0,
      top_block: '—',
      top_donor: '—',
    },
    blocks: [],
    meghalas: [],
    top_donors: [],
    top_volunteers: [],
    point_rules: [],
    badges_guide: []
  });

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) {
      setLoading(true);
    }

    try {
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

        const processedMeghalas = processDynamicMeghalas(rawData, dirBlocks);

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
            rawSummary.total_meghalas ?? processedMeghalas.length
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
            '—',
          top_donor: rawSummary.top_donor || rawData.top_donors?.[0]?.primary_name || rawData.top_donors?.[0]?.name || '—',
        };

        setData({
          ...rawData,
          district: rawData.district || cleanDistrict,
          summary,
          blocks: mergedBlocks,
          meghalas: processedMeghalas,
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

      // Public leaderboard fallback
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
        const processedMeghalas = processDynamicMeghalas(pub, dirBlocks);

        const fallbackSummary = {
          total_district_points: blocks.reduce(
            (sum, block) => sum + toNumber(block.total_points),
            0
          ),
          total_blocks: blocks.length,
          total_meghalas: processedMeghalas.length,
          total_donors: donors.length,
          total_volunteers: volunteers.length,
          top_block: blocks[0]?.block_name || '—',
          top_donor: donors[0]?.primary_name || donors[0]?.name || '—',
        };

        setData({
          district: pub.district || cleanDistrict,
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
          meghalas: processedMeghalas,
          top_donors: donors,
          top_volunteers: volunteers,
          point_rules: Array.isArray(pub.point_rules) ? pub.point_rules : [],
          badges_guide: Array.isArray(pub.badges_guide) ? pub.badges_guide : [],
        });
        return;
      }

      // Directory-only fallback
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

      const processedMeghalas = processDynamicMeghalas({}, dirBlocks);

      setData({
        district: cleanDistrict,
        summary: {
          total_district_points: 0,
          total_blocks: compiledBlocks.length,
          total_meghalas: processedMeghalas.length,
          total_donors: compiledBlocks.reduce(
            (sum, block) => sum + toNumber(block.donors_count),
            0
          ),
          total_volunteers: compiledBlocks.reduce(
            (sum, block) => sum + toNumber(block.volunteers_count),
            0
          ),
          top_block: '—',
          top_donor: '—',
        },
        blocks: compiledBlocks,
        meghalas: processedMeghalas,
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
        meghalas: Array.isArray(current.meghalas) && current.meghalas.length > 0 ? current.meghalas : processDynamicMeghalas({}, []),
        top_donors: Array.isArray(current.top_donors) ? current.top_donors : [],
        top_volunteers: Array.isArray(current.top_volunteers) ? current.top_volunteers : [],
      }));
    } finally {
      setLoading(false);
    }
  }, [cleanDistrict]);

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

  // Filtered and Sorted Blocks
  const filteredBlocks = useMemo(() => {
    let list = [...(data.blocks || [])];
    
    if (blockFilter === 'assigned') {
      list = list.filter(b => b.isAssigned);
    }

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

    if (blockFilter === 'top5') {
      list = list.slice(0, 5);
    }

    return list;
  }, [data.blocks, searchQuery, sortBy, blockFilter]);

  const maxBlockPoints = useMemo(() => {
    let max = 0;
    (data.blocks || []).forEach(b => {
      const pts = Number(b.total_points) || 0;
      if (pts > max) max = pts;
    });
    return max || 1;
  }, [data.blocks]);

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
    if (selectedBloodGroup !== 'All') {
      list = list.filter(d => (d.blood_group || '').toUpperCase() === selectedBloodGroup.toUpperCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        (d.primary_name || d.name || '').toLowerCase().includes(q) ||
        (d.jeevalink_id || '').toLowerCase().includes(q) ||
        (d.blood_group || '').toLowerCase().includes(q) ||
        (d.block || d.city || '').toLowerCase().includes(q) ||
        (d.meghala || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.top_donors, searchQuery, selectedBloodGroup]);

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    let list = [...(data.top_volunteers || [])];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        (v.primary_name || v.name || '').toLowerCase().includes(q) ||
        (v.jeevalink_id || '').toLowerCase().includes(q) ||
        (v.block || v.city || '').toLowerCase().includes(q) ||
        (v.meghala || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.top_volunteers, searchQuery]);

  const copyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-xs" title="1st Place Champion">
          <Crown className="w-4 h-4 fill-slate-950" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-black text-xs" title="2nd Place">
          <Medal className="w-4 h-4 text-slate-700" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-black text-xs border border-amber-200" title="3rd Place">
          <Award className="w-4 h-4 text-amber-800" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">
        #{rank}
      </span>
    );
  };

  const getBadgePillStyle = (badge) => {
    switch (badge) {
      case 'Legend Donor':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      case 'Red Guardian':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'Blood Hero':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
      case 'Life Saver':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-16 px-2 sm:px-6">

      {/* ─── Breadcrumb & Top Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1 sm:pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-500 flex-wrap">
            <Link to="/super-admin/dashboard" className="hover:text-red-600 transition-colors">
              Super Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Leaderboard & Points</span>
            <span className="mx-1 text-slate-300">•</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-semibold text-[11px] border border-red-100">
              {cleanDistrict} District
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Points & Activity Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Live database rankings, committee points, and voluntary blood donation performance across {cleanDistrict}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto sm:shrink-0">
          <button
            onClick={copyShareLink}
            className="flex-1 sm:flex-none justify-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Copy Leaderboard URL"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copiedToast ? 'Copied!' : 'Share'}</span>
          </button>

          <Link
            to="/super-admin/blocks"
            className="flex-1 sm:flex-none justify-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate">Manage Blocks</span>
          </Link>

          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex-1 sm:flex-none justify-center px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ─── 4 Clean Metric Cards (Humanized, high readability) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total District Points */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">District Points</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {(data.summary?.total_district_points || 0).toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-red-600 uppercase tracking-wide">pts</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
              Verified community actions
            </p>
          </div>
        </div>

        {/* Card 2: Leading Block */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Leading Block</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 block truncate" title={data.summary?.top_block}>
              {data.summary?.top_block || '—'}
            </span>
            <p className="text-[10px] sm:text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1 truncate">
              <Crown className="w-3 h-3 text-amber-500 shrink-0" /> Rank #1 Committee
            </p>
          </div>
        </div>

        {/* Card 3: Top Blood Donor */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Top Blood Donor</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 block truncate" title={data.summary?.top_donor}>
              {data.summary?.top_donor || '—'}
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {filteredDonors[0]?.total_donations ? `${filteredDonors[0].total_donations} verified donations` : 'District leading lifesaver'}
            </p>
          </div>
        </div>

        {/* Card 4: Active Coverage */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Active Units</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {Number(data.summary?.total_blocks) || 0}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Blocks</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {Number(data.summary?.total_meghalas) || 0} registered units
            </p>
          </div>
        </div>
      </div>

      {/* ─── Segmented Navigation Controls & Search Bar ─── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Minimalist Segmented Tabs */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: 'blocks', label: 'Block Committees', icon: Building2, count: filteredBlocks.length },
              { id: 'meghalas', label: 'Meghala Units', icon: MapPin, count: filteredMeghalas.length },
              { id: 'donors', label: 'Top Blood Donors', icon: Droplets, count: filteredDonors.length },
              { id: 'volunteers', label: 'Volunteer Leaders', icon: Shield, count: filteredVolunteers.length },
              { id: 'rules', label: 'Points Guide', icon: Award, count: null },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      isActive ? 'bg-red-50 text-red-700' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Action Controls */}
          {activeTab !== 'rules' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Filter ${activeTab}...`}
                  className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {activeTab === 'blocks' && (
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700 cursor-pointer"
                  >
                    <option value="points">Points</option>
                    <option value="donors">Donors</option>
                    <option value="fulfilled">Fulfilled</option>
                  </select>

                  <select
                    value={blockFilter}
                    onChange={(e) => setBlockFilter(e.target.value)}
                    className="w-full sm:w-auto px-2.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Blocks</option>
                    <option value="assigned">Assigned</option>
                    <option value="top5">Top 5</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Blood Group Filter Chips (When Top Donors tab is active) */}
        {activeTab === 'donors' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Group:
            </span>
            {ALL_BLOOD_GROUPS.map((bg) => {
              const isSelected = selectedBloodGroup === bg;
              return (
                <button
                  key={bg}
                  onClick={() => setSelectedBloodGroup(bg)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {bg}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Main Content Panels ─── */}
      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-16 text-center space-y-3 shadow-xs">
          <RefreshCw className="w-7 h-7 text-red-600 animate-spin mx-auto" />
          <p className="text-slate-600 text-xs font-semibold">
            Loading district standings...
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* ═════════ TAB 1: BLOCK COMMITTEES ═════════ */}
          {activeTab === 'blocks' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              {filteredBlocks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No block committees found matching your filter criteria.
                </div>
              ) : (
                <>
                  {/* Mobile Cards View (< md) */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredBlocks.map((b, idx) => {
                      const blockName = b.block_name || b.blockCommitteeName || b.city || b.block || `Block ${idx + 1}`;
                      const adminName = b.admin_name || b.admin1Name || b.primary_name || 'Block Coordinator';
                      const adminMobile = b.admin_mobile || b.admin1Mobile || '';
                      const currentPts = Number(b.total_points) || 0;
                      const percent = Math.min(100, Math.round((currentPts / maxBlockPoints) * 100));

                      return (
                        <div
                          key={b.block_name || idx}
                          onClick={() => setSelectedBlockDetail({ ...b, block_name: blockName, admin_name: adminName, admin_mobile: adminMobile })}
                          className="p-3.5 hover:bg-slate-50/80 active:bg-slate-100/80 transition-colors cursor-pointer space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {getRankBadge(idx + 1)}
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1">
                                  {blockName}
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-slate-400 font-medium truncate">
                                    {b.meghala_count ? `${b.meghala_count} Units` : 'Block Committee'}
                                  </span>
                                  {b.isAssigned ? (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Assigned
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                      Unassigned
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-bold text-slate-900 text-sm">{currentPts.toLocaleString()}</span>
                              <span className="text-[10px] text-red-600 font-bold uppercase ml-1">pts</span>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-xl p-2 text-center text-xs border border-slate-100">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block">Donors</span>
                              <span className="font-bold text-slate-800">{b.donors_count || 0}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block">Volunteers</span>
                              <span className="font-bold text-slate-800">{b.volunteers_count || 0}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 block">Fulfilled</span>
                              <span className="font-bold text-emerald-700">{b.fulfilled_requests || 0}</span>
                            </div>
                          </div>

                          {/* Contribution Bar & Admin info */}
                          <div className="flex items-center justify-between gap-3 text-xs pt-0.5">
                            <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-slate-600">
                              <span className="truncate">Lead: <strong>{adminName}</strong></span>
                              {adminMobile && adminMobile !== '—' && (
                                <a
                                  href={`tel:${adminMobile}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 bg-white border border-slate-200 rounded-lg text-emerald-600 hover:bg-slate-50 shrink-0"
                                  title="Call Admin"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 w-24">
                              <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-red-600 h-full rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{percent}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View (>= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                          <th className="py-3.5 px-4">Block Committee</th>
                          <th className="py-3.5 px-4">Admin Lead</th>
                          <th className="py-3.5 px-4 text-center">Donors</th>
                          <th className="py-3.5 px-4 text-center">Volunteers</th>
                          <th className="py-3.5 px-4 text-center">Fulfilled Units</th>
                          <th className="py-3.5 px-4 min-w-[130px]">Contribution</th>
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
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                              <td className="py-3.5 px-4 text-center">
                                {getRankBadge(idx + 1)}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors flex items-center gap-1.5">
                                  {blockName}
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {b.meghala_count ? `${b.meghala_count} Meghala Units` : 'Block Committee'}
                                  </span>
                                  {b.isAssigned ? (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Assigned
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                      Unassigned
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="text-slate-800 font-semibold">{adminName}</div>
                                {adminMobile && adminMobile !== '—' && (
                                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                    <Phone className="w-2.5 h-2.5 text-slate-400" /> {adminMobile}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                                  {b.donors_count || 0}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                                  {b.volunteers_count || 0}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {b.fulfilled_requests || 0}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-red-600 h-full rounded-full transition-all duration-300"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium block text-right">{percent}%</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="font-bold text-slate-900 text-sm">
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
                </>
              )}
            </div>
          )}

          {/* ═════════ TAB 2: MEGHALA UNITS ═════════ */}
          {activeTab === 'meghalas' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              {filteredMeghalas.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No Meghala units found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredMeghalas.map((m, idx) => (
                    <div
                      key={m.meghala_name || idx}
                      className="p-3.5 sm:p-4 px-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getRankBadge(idx + 1)}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{m.meghala_name || m.meghala || 'Meghala Unit'}</h4>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            Parent Block: <span className="text-slate-800 font-semibold">{m.block_name || m.block || cleanDistrict}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-10 sm:pl-0">
                        <div className="flex items-center gap-2 text-slate-600 font-medium text-[11px]">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">{m.total_members || 0} Members</span>
                          <span className="text-slate-400">•</span>
                          <span>{m.volunteers_count || 0} Vols</span>
                        </div>
                        <div className="text-right shrink-0 min-w-[70px]">
                          <span className="font-bold text-slate-900 text-sm">{(m.total_points || 0).toLocaleString()}</span>
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
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              {filteredDonors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No donors found matching the selected filters.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDonors.map((donor, idx) => {
                    const donorId = donor.jeevalink_id || getDisplayJeevalinkId(donor);
                    const donorName = donor.primary_name || donor.name || 'Blood Donor';
                    const bloodGroup = donor.blood_group || 'O+';
                    const badgeName = donor.badge || (donor.reward_points >= 500 ? 'Life Saver' : 'First Drop');

                    return (
                      <div
                        key={donor.id || idx}
                        className="p-3.5 sm:p-4 px-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50/80 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getRankBadge(idx + 1)}
                          
                          {/* Blood Group Badge */}
                          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {bloodGroup}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm truncate">{donorName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getBadgePillStyle(badgeName)}`}>
                                {badgeName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                              {donorId} • {donor.block || donor.city || cleanDistrict} {donor.meghala ? `(${donor.meghala})` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-11 sm:pl-0">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-slate-700 font-semibold">{donor.total_donations || 0} Donations</span>
                            {donor.lives_saved !== undefined && donor.lives_saved !== null && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-emerald-600 font-medium">{donor.lives_saved} Lives Saved</span>
                              </>
                            )}
                          </div>
                          <div className="text-right shrink-0 min-w-[70px]">
                            <span className="font-bold text-slate-900 text-sm">{(donor.reward_points || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-red-600 font-bold uppercase ml-1">pts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═════════ TAB 4: VOLUNTEER LEADERS ═════════ */}
          {activeTab === 'volunteers' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              {filteredVolunteers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No volunteers found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredVolunteers.map((vol, idx) => {
                    const volId = vol.jeevalink_id || getDisplayJeevalinkId(vol);
                    const volName = vol.primary_name || vol.name || 'Volunteer Coordinator';

                    return (
                      <div
                        key={vol.id || idx}
                        className="p-3.5 sm:p-4 px-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50/80 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getRankBadge(idx + 1)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm truncate">{volName}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                {vol.role || 'Volunteer'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                              {volId} • {vol.block || vol.city || cleanDistrict} {vol.meghala ? `(${vol.meghala})` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-10 sm:pl-0">
                          {vol.mobile && vol.mobile !== 'N/A' && (
                            <a
                              href={`tel:${vol.mobile}`}
                              className="text-xs text-slate-600 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-slate-400" /> {vol.mobile}
                            </a>
                          )}
                          <div className="text-right shrink-0 min-w-[70px]">
                            <span className="font-bold text-slate-900 text-sm">{(vol.reward_points || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-red-600 font-bold uppercase ml-1">pts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═════════ TAB 5: POINT RULES & BADGES GUIDE ═════════ */}
          {activeTab === 'rules' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Rules Section */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> How Points Are Earned
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Points are automatically credited upon successful completion and verification of real-world blood donations and coordination activities.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  {(data.point_rules?.length ? data.point_rules : [
                    { action: 'Blood Donation Completed', target: 'Donor', points: 100, badge: '🩸 +100 Pts' },
                    { action: 'Meghala Volunteer Verification', target: 'Meghala Volunteer', points: 20, badge: '🛡️ +20 Pts' },
                    { action: 'Block Committee Coordination', target: 'Block Admin', points: 20, badge: '🏢 +20 Pts' },
                    { action: 'Emergency SOS Acceptance', target: 'Donor / Responder', points: 20, badge: '⚡ +20 Pts' },
                    { action: 'Block Fulfilled Request Bonus', target: 'Block Committee Score', points: 150, badge: '🏆 +150 Pts' },
                  ]).map((rule, idx) => (
                    <div key={idx} className="p-3 sm:p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 truncate">{rule.action}</h4>
                        <span className="text-[11px] text-slate-500 font-medium block truncate">Eligible: {rule.target}</span>
                      </div>
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg shrink-0">
                        {rule.badge || `+${rule.points} Pts`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone Badges Section */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-red-600" /> Recognition Tiers & Milestone Badges
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Voluntary lifesavers unlock digital recognition badges as their lifetime contributions grow.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
                  {(data.badges_guide?.length ? data.badges_guide : [
                    { name: 'First Drop', points: 100, desc: 'Awarded upon completing 1st verified blood donation.' },
                    { name: 'Life Saver', points: 500, desc: 'Reached 500 points milestone saving lives.' },
                    { name: 'Blood Hero', points: 1000, desc: 'Reached 1,000 points champion milestone.' },
                    { name: 'Red Guardian', points: 2500, desc: 'Reached 2,500 points master guardian status.' },
                    { name: 'Legend Donor', points: 5000, desc: 'Attained highest 5,000 points Hall of Fame status.' },
                  ]).map((badge, idx) => (
                    <div key={idx} className="p-3.5 sm:p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-900 block">{badge.name}</span>
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full">
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

      {/* ─── Detail Modal for Block Committee ─── */}
      {selectedBlockDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 sm:pb-4">
              <div className="space-y-1 min-w-0 flex-1 pr-2">
                <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                  Rank #{selectedBlockDetail.rank} Committee
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{selectedBlockDetail.block_name}</h3>
              </div>
              <button
                onClick={() => setSelectedBlockDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3.5 sm:p-4 space-y-2.5 border border-slate-100">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600">Total Points:</span>
                <span className="text-red-600 font-bold text-base">{(selectedBlockDetail.total_points || 0).toLocaleString()} pts</span>
              </div>
              <div className="h-px bg-slate-200/60 my-1" />
              <div className="flex justify-between text-slate-600">
                <span>Registered Donors:</span>
                <span className="font-bold text-slate-900">{selectedBlockDetail.donors_count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Active Volunteers:</span>
                <span className="font-bold text-slate-900">{selectedBlockDetail.volunteers_count || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfilled Blood Units:</span>
                <span className="font-bold text-slate-900">{selectedBlockDetail.fulfilled_requests || 0}</span>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50/60 rounded-xl p-3.5 sm:p-4 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Committee Lead</span>
              <div className="font-bold text-slate-900 text-sm">{selectedBlockDetail.admin_name}</div>
              {selectedBlockDetail.admin_mobile && selectedBlockDetail.admin_mobile !== '—' && (
                <div className="text-slate-600 font-medium flex items-center gap-2 mt-2">
                  <a
                    href={`tel:${selectedBlockDetail.admin_mobile}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" /> Call {selectedBlockDetail.admin_mobile}
                  </a>
                </div>
              )}
              {selectedBlockDetail.admin2_name && (
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 block">Secondary Admin</span>
                  <div className="font-semibold text-slate-800">{selectedBlockDetail.admin2_name}</div>
                  {selectedBlockDetail.admin2_mobile && (
                    <div className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px] mt-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {selectedBlockDetail.admin2_mobile}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBlockDetail(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-semibold transition-all shadow-xs cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
