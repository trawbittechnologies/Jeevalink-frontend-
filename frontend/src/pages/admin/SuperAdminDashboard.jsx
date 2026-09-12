import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Plus, RefreshCw, Edit3, Trash2, X, Building2,
  UserCheck, BarChart3, TrendingUp, Search, Phone,
  Droplets, Flame, CheckCircle2, Award, ArrowUpRight,
  Trophy, AlertCircle, Video, Film, Image, Upload, Save, Users, Sparkles
} from 'lucide-react';
import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useAppStore } from '../../store/appStore.js';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';
import MascotVideo from '../../components/MascotVideo.jsx';
import { getDisplayJeevalinkId } from '../../utils/jeevalinkId.js';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function parseBlockAdminContacts(ba) {
  let admin1Name = ba.primaryContactName || ba.primary_contact_name || ba.primaryName || ba.primary_name || ba.name || '';
  let admin2Name = ba.secondary_name || ba.secondaryName || ba.secondaryContactName || '';

  if (!admin2Name && admin1Name.includes(' & ')) {
    const parts = admin1Name.split(' & ');
    admin1Name = parts[0] ? parts[0].trim() : '';
    admin2Name = parts[1] ? parts[1].trim() : '';
  }

  let admin1Mobile = ba.mobile || '';
  let admin2Mobile = ba.secondary_phone || ba.secondaryContactNumber || ba.secondary_contact_number || '';

  if (!admin2Mobile && ba.secondaryContactNumber) {
    const sec = ba.secondaryContactNumber.replace(/^Admin 2:\s*/i, '').trim();
    const parenMatch = sec.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (parenMatch) {
      if (!admin2Name && parenMatch[1] && parenMatch[1].trim()) {
        admin2Name = parenMatch[1].trim();
      }
      if (parenMatch[2]) {
        admin2Mobile = parenMatch[2].trim();
      }
    } else {
      const phoneDigits = sec.replace(/[^\d+]/g, '');
      if (phoneDigits.length >= 7) {
        admin2Mobile = phoneDigits;
      } else if (!admin2Name && sec) {
        admin2Name = sec;
      }
    }
  }

  return {
    admin1Name: admin1Name || 'N/A',
    admin1Mobile: admin1Mobile || 'N/A',
    admin2Name: admin2Name || '',
    admin2Mobile: admin2Mobile || '',
  };
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [districtData, setDistrictData] = useState({
    district: user?.district || 'Kasaragod',
    total_users: 0,
    total_volunteers: 0,
    total_admins: 0,
    total_requests: 0,
    fulfilled_requests: 0,
    pending_requests: 0,
    fulfillment_rate: 100,
    blood_group_distribution: [],
    urgency_emergency: 0,
    urgency_normal: 0,
    recent_requests: [],
    pending_approval_requests: [],
    block_summary: []
  });

  const [pointsLeaderboard, setPointsLeaderboard] = useState({
    summary: { total_district_points: 0, top_block: 'N/A', top_donor: 'N/A' },
    blocks: [],
    top_donors: []
  });

  const [blockAdmins, setBlockAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Block Admin Modal state
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editBlockName, setEditBlockName] = useState('');
  const [editFullName1, setEditFullName1] = useState('');
  const [editMobile1, setEditMobile1] = useState('');
  const [editFullName2, setEditFullName2] = useState('');
  const [editMobile2, setEditMobile2] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  // Delete Confirmation Modal State
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [deletingAdminName, setDeletingAdminName] = useState('');

  // District Blood Request Approval States
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionType, setActionType] = useState(null);

  // Awareness Video & Content Settings State
  const { awarenessSettings, updateAwarenessSettings, fetchAwarenessSettings, allUsers, fetchUsers, donors, searchDonors } = useAppStore();
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [savingAwareness, setSavingAwareness] = useState(false);
  const [awarenessForm, setAwarenessForm] = useState({
    videoUrl: '',
    posterUrl: '',
    badgeText: '',
    quoteTitle: '',
    quoteDescription: '',
    buttonLabel: ''
  });

  useEffect(() => {
    fetchAwarenessSettings();
  }, [fetchAwarenessSettings]);

  useEffect(() => {
    if (awarenessSettings) {
      setAwarenessForm({
        videoUrl: awarenessSettings.videoUrl || '',
        posterUrl: awarenessSettings.posterUrl || '',
        badgeText: awarenessSettings.badgeText || '',
        quoteTitle: awarenessSettings.quoteTitle || '',
        quoteDescription: awarenessSettings.quoteDescription || '',
        buttonLabel: awarenessSettings.buttonLabel || ''
      });
    }
  }, [awarenessSettings]);

  const handleSaveAwareness = async (e) => {
    e.preventDefault();
    setSavingAwareness(true);

    try {
      const formData = new FormData();
      if (videoFile) {
        formData.append('video_file', videoFile);
      } else if (awarenessForm.videoUrl) {
        formData.append('video_url', awarenessForm.videoUrl);
      }

      if (posterFile) {
        formData.append('poster_file', posterFile);
      } else if (awarenessForm.posterUrl) {
        formData.append('poster_url', awarenessForm.posterUrl);
      }

      formData.append('badge_text', awarenessForm.badgeText || '');
      formData.append('quote_title', awarenessForm.quoteTitle || '');
      formData.append('quote_description', awarenessForm.quoteDescription || '');
      formData.append('button_label', awarenessForm.buttonLabel || '');

      const res = await updateAwarenessSettings(formData);
      if (res?.success) {
        setVideoFile(null);
        setPosterFile(null);
        await fetchAwarenessSettings();
      }
    } finally {
      setSavingAwareness(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (fetchUsers) fetchUsers();
      if (searchDonors) searchDonors();

      const [resDist, resAdmins, resPoints] = await Promise.all([
        api.get('/super-admin/metrics').catch((err) => {
          console.error("Super Admin metrics error:", err);
          return { data: null };
        }),
        api.get('/super-admin/block-admins').catch((err) => {
          console.error("Super Admin block-admins error:", err);
          return { data: null };
        }),
        api.get('/super-admin/points-table').catch(() => ({ data: null }))
      ]);

      if (resDist?.data?.success) {
        const dData = resDist.data.data || resDist.data;
        setDistrictData({
          district: dData.district || 'Kasaragod',
          total_users: dData.total_users ?? dData.totalUsers ?? 0,
          total_volunteers: dData.total_volunteers ?? dData.totalVolunteers ?? 0,
          total_admins: dData.total_block_admins ?? dData.totalBlockAdmins ?? 0,
          total_requests: dData.total_requests ?? dData.totalRequests ?? 0,
          fulfilled_requests: dData.fulfilled_requests ?? dData.fulfilledRequests ?? 0,
          pending_requests: dData.pending_requests ?? dData.pendingRequests ?? 0,
          fulfillment_rate: dData.fulfillment_rate ?? dData.fulfillmentRate ?? 100,
          blood_group_distribution: dData.blood_group_distribution || dData.bloodGroupDistribution || [],
          urgency_emergency: dData.urgency_emergency ?? dData.urgencyEmergency ?? 0,
          urgency_normal: dData.urgency_normal ?? dData.urgencyNormal ?? 0,
          recent_requests: dData.recent_requests || dData.recentRequests || [],
          pending_approval_requests: dData.pending_approval_requests || dData.pendingApprovalRequests || [],
          block_summary: dData.block_summary || dData.blockSummary || []
        });
      }

      if (resAdmins?.data?.success) {
        const raw = resAdmins.data;
        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (Array.isArray(raw?.data?.data)) list = raw.data.data;
        setBlockAdmins(list);
      }

      if (resPoints?.data?.success && resPoints.data.data) {
        setPointsLeaderboard(resPoints.data.data);
      }
    } catch (err) {
      console.error("Super Admin Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, searchDonors]);

  // Resilient real counts with client-store fallback
  const realDonorsCount = useMemo(() => {
    const serverCount = Number(districtData.total_users);
    if (!isNaN(serverCount) && serverCount > 0) return serverCount;

    const userDonors = (allUsers || []).filter(u => {
      const role = String(u.role || '').toLowerCase();
      const bg = String(u.blood_group || u.bloodGroup || '').toUpperCase();
      return ['user', 'donor', 'receiver'].includes(role) || (bg && bg !== 'N/A' && bg !== '');
    });
    if (userDonors.length > 0) return userDonors.length;
    if (donors && donors.length > 0) return donors.length;
    if (allUsers && allUsers.length > 0) return allUsers.length;
    return !isNaN(serverCount) ? serverCount : 0;
  }, [districtData.total_users, allUsers, donors]);

  const realVolunteersCount = useMemo(() => {
    const serverCount = Number(districtData.total_volunteers);
    if (!isNaN(serverCount) && serverCount > 0) return serverCount;

    const volUsers = (allUsers || []).filter(u => {
      const role = String(u.role || '').toLowerCase();
      return ['volunteer', 'unit_squad', 'meghala_volunteer'].includes(role);
    });
    if (volUsers.length > 0) return volUsers.length;
    return !isNaN(serverCount) ? serverCount : 0;
  }, [districtData.total_volunteers, allUsers]);

  const realBlockAdminsCount = useMemo(() => {
    if (blockAdmins && blockAdmins.length > 0) return blockAdmins.length;
    const serverCount = Number(districtData.total_admins);
    if (!isNaN(serverCount) && serverCount > 0) return serverCount;
    const baUsers = (allUsers || []).filter(u => {
      const role = String(u.role || '').toLowerCase();
      return ['block_admin', 'blockadmin', 'admin'].includes(role);
    });
    if (baUsers.length > 0) return baUsers.length;
    return 0;
  }, [blockAdmins, districtData.total_admins, allUsers]);

  const handleApproveDistrictRequest = async (reqId) => {
    setActionLoadingId(reqId);
    setActionType('approve');
    try {
      const res = await api.patch(`/requests/${reqId}/approve`);
      if (res.data?.success) {
        setDistrictData(prev => ({
          ...prev,
          pending_approval_requests: (prev.pending_approval_requests || []).filter(r => (r.id || r._id) !== reqId),
          recent_requests: (prev.recent_requests || []).map(r => ((r.id || r._id) === reqId ? { ...r, verified: true, status: 'Active' } : r))
        }));
        await loadData();
      }
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const handleRejectDistrictRequest = async (reqId) => {
    if (!window.confirm('Are you sure you want to reject and remove this blood request?')) return;
    setActionLoadingId(reqId);
    setActionType('reject');
    try {
      const res = await api.delete(`/requests/${reqId}`);
      if (res.data?.success) {
        setDistrictData(prev => ({
          ...prev,
          pending_approval_requests: (prev.pending_approval_requests || []).filter(r => (r.id || r._id) !== reqId),
          recent_requests: (prev.recent_requests || []).filter(r => (r.id || r._id) !== reqId)
        }));
        await loadData();
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadData();
    })();
    return () => { active = false; };
  }, [loadData]);

  const handleOpenEdit = (ba) => {
    setEditingAdmin(ba);
    setEditBlockName(ba.blockCommitteeName || ba.block || ba.blockName || ba.city || '');
    setEditEmail(ba.email || '');
    setEditPassword('');
    setEditStatus(ba.status || 'Active');

    const parsed = parseBlockAdminContacts(ba);
    setEditFullName1(parsed.admin1Name === 'N/A' ? '' : parsed.admin1Name);
    setEditMobile1(parsed.admin1Mobile === 'N/A' ? '' : parsed.admin1Mobile);
    setEditFullName2(parsed.admin2Name);
    setEditMobile2(parsed.admin2Mobile);
    setEditMsg(null);
  };

  const handleSaveEditBlockAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setSubmittingEdit(true);
    setEditMsg(null);
    try {
      const res = await api.put(`/super-admin/block-admins/${editingAdmin.id}`, {
        blockCommitteeName: editBlockName,
        block_admin_1_name: editFullName1,
        block_admin_1_mobile: editMobile1,
        block_admin_2_name: editFullName2,
        block_admin_2_mobile: editMobile2,
        primary_contact_name: editFullName1,
        primary_name: editFullName2 ? `${editFullName1} & ${editFullName2}` : editFullName1,
        email: editEmail,
        password: editPassword || undefined,
        mobile: editMobile1,
        secondary_name: editFullName2,
        secondary_phone: editMobile2,
        secondaryContactNumber: editMobile2 ? `Admin 2: ${editFullName2} (${editMobile2})` : '',
        status: editStatus
      });

      if (res.data?.success) {
        setEditingAdmin(null);
        loadData();
      } else {
        setEditMsg({ type: 'error', msg: res.data?.message || 'Update failed' });
      }
    } catch (err) {
      setEditMsg({ type: 'error', msg: err.response?.data?.message || 'Failed to update Block Admin.' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAdminId) return;
    try {
      const res = await api.delete(`/super-admin/block-admins/${deletingAdminId}`);
      if (res.data?.success) loadData();
    } catch (err) {
      console.error('Failed to delete block admin', err);
    } finally {
      setDeletingAdminId(null);
    }
  };

  // Known Meghala to Block dictionary for Kasaragod
  const MEGHALA_BLOCK_MAP = {
    'upper kottachery': 'kanhangad',
    'puthiyakotta': 'kanhangad',
    'ajanur': 'kanhangad',
    'ajanoor': 'kanhangad',
    'kottachery': 'kanhangad',
    'kanhangad south': 'kanhangad',
    'kanhangad north': 'kanhangad',
    'chithari': 'kanhangad',
    'chittari': 'kanhangad',
    'madikai': 'kanhangad',
    'kottappuram': 'nileshwar',
    'kinanoor': 'nileshwar',
    'karindalam': 'nileshwar',
    'nileshwaram': 'nileshwar',
    'nileshswar': 'nileshwar',
    'cheemeni': 'cheruvathur',
    'kayyur': 'cheruvathur',
    'thuruthi': 'cheruvathur',
    'pilicode': 'cheruvathur',
    'chandera': 'cheruvathur',
    'thrikarippur': 'trikaripur',
    'trikaripur': 'trikaripur',
    'olavara': 'trikaripur',
    'elambachi': 'trikaripur',
    'valiyaparamba': 'trikaripur',
    'ranipuram': 'panathady',
    'kallar': 'panathady',
    'panathur': 'panathady',
    'balal': 'panathady',
    'east eleri': 'eleri',
    'west eleri': 'eleri',
    'chittarikkal': 'eleri',
    'palavayal': 'eleri',
    'kundamkuzhy': 'bedakam',
    'kolathur': 'bedakam',
    'kuttikol': 'bedakam',
    'bedadka': 'bedakam',
    'bekal': 'udma',
    'pallikere': 'udma',
    'melparamba': 'udma',
    'chembirika': 'udma',
    'kalanad': 'udma',
    'vidyanagar': 'kasaragod',
    'nullipady': 'kasaragod',
    'mogral': 'kasaragod',
    'karanthakkad': 'kasaragod',
    'chengala': 'kasaragod',
    'madhur': 'kasaragod',
    'arikady': 'kumbala',
    'badiadka': 'kumbala',
    'badiadkka': 'kumbala',
    'seethangoli': 'kumbala',
    'puthige': 'kumbala',
    'manjeshwar': 'manjeshwaram',
    'uppala': 'manjeshwaram',
    'hosangadi': 'manjeshwaram',
    'paivalike': 'manjeshwaram',
    'meenja': 'manjeshwaram',
    'vorkady': 'manjeshwaram',
    'mulleria': 'karadukka',
    'bovikanam': 'karadukka',
    'delampady': 'karadukka',
    'bellur': 'karadukka'
  };

  // Dynamic real Block Analytics with live donor counts
  const realBlockAnalytics = useMemo(() => {
    const blockMap = new Map();

    // 1. Seed from registered block admins
    (blockAdmins || []).forEach(ba => {
      const bName = (ba.blockCommitteeName || ba.city || ba.block || ba.primary_name || '').trim();
      if (bName && bName.toLowerCase() !== 'n/a') {
        const key = bName.toLowerCase();
        if (!blockMap.has(key)) {
          blockMap.set(key, {
            block: bName,
            users: 0,
            volunteers: 0
          });
        }
      }
    });

    // 2. Incorporate server block summary if provided
    (districtData.block_summary || []).forEach(b => {
      if (b.block) {
        const key = b.block.toLowerCase().trim();
        if (!blockMap.has(key)) {
          blockMap.set(key, {
            block: b.block,
            users: Number(b.users) || 0,
            volunteers: Number(b.volunteers) || 0
          });
        } else {
          const existing = blockMap.get(key);
          existing.users = Math.max(existing.users, Number(b.users) || 0);
          existing.volunteers = Math.max(existing.volunteers, Number(b.volunteers) || 0);
        }
      }
    });

    // 3. Match from client allUsers & donors pool
    const donorsPool = (allUsers && allUsers.length > 0) ? allUsers : (donors || []);
    const blockKeys = Array.from(blockMap.keys());

    if (blockKeys.length > 0 && donorsPool.length > 0) {
      const totalServerBlockUsers = Array.from(blockMap.values()).reduce((sum, b) => sum + (b.users || 0), 0);

      // If server counts are not present or less than pool count, recalculate dynamically
      if (totalServerBlockUsers === 0 || totalServerBlockUsers < donorsPool.length) {
        blockMap.forEach(v => {
          v.users = 0;
          v.volunteers = 0;
        });

        donorsPool.forEach(u => {
          const role = String(u.role || '').toLowerCase();
          const isVolunteer = ['volunteer', 'unit_squad', 'meghala_volunteer'].includes(role);
          const isDonor = ['user', 'donor', 'receiver'].includes(role) ||
            (u.blood_group && u.blood_group !== 'N/A' && u.blood_group !== '') ||
            (u.bloodGroup && u.bloodGroup !== 'N/A' && u.bloodGroup !== '');

          const uBlock = String(u.organization_name || u.organizationName || u.block || u.blockCommitteeName || '').toLowerCase().trim();
          const uCity = String(u.city || u.meghala || '').toLowerCase().trim();
          const uRemarks = String(u.remarks || '').toLowerCase().trim();

          // A. Direct organization/block match
          let matchedKey = blockKeys.find(k =>
            (uBlock && (uBlock === k || uBlock.includes(k) || k.includes(uBlock)))
          );

          // B. Known Meghala-to-Block dictionary lookup
          if (!matchedKey && uCity) {
            const mapped = MEGHALA_BLOCK_MAP[uCity];
            if (mapped) {
              matchedKey = blockKeys.find(k => k === mapped || k.includes(mapped) || mapped.includes(k));
            }
          }
          if (!matchedKey && uRemarks) {
            for (const [mName, bName] of Object.entries(MEGHALA_BLOCK_MAP)) {
              if (uRemarks.includes(mName)) {
                matchedKey = blockKeys.find(k => k === bName || k.includes(bName) || bName.includes(k));
                if (matchedKey) break;
              }
            }
          }

          // C. City matches block name directly
          if (!matchedKey && uCity) {
            matchedKey = blockKeys.find(k => uCity === k || uCity.includes(k) || k.includes(uCity));
          }

          // D. Remarks contain block name
          if (!matchedKey && uRemarks) {
            matchedKey = blockKeys.find(k => uRemarks.includes(k));
          }

          // E. Fallback to Kasaragod / first block so no real registered donor is dropped
          if (!matchedKey && blockKeys.length > 0) {
            matchedKey = blockKeys.find(k => k.includes('kasaragod') || k.includes('kasargod')) || blockKeys[0];
          }

          if (matchedKey && blockMap.has(matchedKey)) {
            const item = blockMap.get(matchedKey);
            if (isDonor) item.users += 1;
            if (isVolunteer) item.volunteers += 1;
          }
        });
      }
    }

    return Array.from(blockMap.values());
  }, [blockAdmins, districtData.block_summary, allUsers, donors]);

  const maxUsersInBlock = Math.max(1, ...realBlockAnalytics.map(b => b.users));

  const filteredBlockAdmins = blockAdmins.filter(ba => {
    const q = searchQuery.toLowerCase();
    const parsed = parseBlockAdminContacts(ba);
    return (
      (ba.blockCommitteeName || ba.city || ba.block || '').toLowerCase().includes(q) ||
      (ba.primary_name || ba.name || '').toLowerCase().includes(q) ||
      parsed.admin1Name.toLowerCase().includes(q) ||
      parsed.admin2Name.toLowerCase().includes(q) ||
      (ba.email || '').toLowerCase().includes(q) ||
      (ba.mobile || '').toLowerCase().includes(q) ||
      (ba.jeevalink_id || ba.employee_id || '').toLowerCase().includes(q)
    );
  });

  // Helper to normalize any blood group format (e.g. "O+", "o+ve", "O_POSITIVE", "AB POS", "b-")
  const normalizeBloodGroup = (bg) => {
    if (!bg) return null;
    let clean = String(bg).trim().toUpperCase();
    clean = clean.replace(/POSITIVE|POS|\+VE|VE/g, '+');
    clean = clean.replace(/NEGATIVE|NEG|\-VE/g, '-');
    clean = clean.replace(/[\s_]/g, '');
    clean = clean.replace(/\+\+/g, '+');
    if (ALL_BLOOD_GROUPS.includes(clean)) return clean;
    const match = clean.match(/(A|B|AB|O)[\+\-]/);
    if (match && ALL_BLOOD_GROUPS.includes(match[0])) return match[0];
    return null;
  };

  // Dynamic real-time blood group matrix from backend distribution and client donor pool
  const bgCountMap = useMemo(() => {
    const map = new Map();
    ALL_BLOOD_GROUPS.forEach(bg => map.set(bg, 0));

    // 1. Fill from backend blood_group_distribution / bloodGroupDistribution
    const serverList = districtData.blood_group_distribution || districtData.bloodGroupDistribution || [];
    if (Array.isArray(serverList)) {
      serverList.forEach(item => {
        const rawBg = item.blood_group || item.bloodGroup || item.bg || item.blood_type || item.bloodType;
        const cleanBg = normalizeBloodGroup(rawBg);
        const count = Number(item.count ?? item.total ?? item.donors_count ?? item.donorsCount ?? 0);
        if (cleanBg && !isNaN(count)) {
          map.set(cleanBg, (map.get(cleanBg) || 0) + count);
        }
      });
    }

    // 2. Supplement with live client donors pool (allUsers & donors)
    const donorsPool = (allUsers && allUsers.length > 0) ? allUsers : (donors || []);
    if (donorsPool.length > 0) {
      const clientMap = new Map();
      ALL_BLOOD_GROUPS.forEach(bg => clientMap.set(bg, 0));

      donorsPool.forEach(u => {
        const rawBg = u.blood_group || u.bloodGroup || u.blood_type || u.bloodType;
        const cleanBg = normalizeBloodGroup(rawBg);
        if (cleanBg) {
          const role = String(u.role || '').toLowerCase();
          const isDonor = ['user', 'donor', 'receiver'].includes(role) ||
            (rawBg && rawBg !== 'N/A' && rawBg !== '');
          if (isDonor) {
            clientMap.set(cleanBg, (clientMap.get(cleanBg) || 0) + 1);
          }
        }
      });

      ALL_BLOOD_GROUPS.forEach(bg => {
        const serverVal = map.get(bg) || 0;
        const clientVal = clientMap.get(bg) || 0;
        map.set(bg, Math.max(serverVal, clientVal));
      });
    }

    return map;
  }, [districtData.blood_group_distribution, districtData.bloodGroupDistribution, allUsers, donors]);

  const totalMatrixDonors = useMemo(() => {
    let sum = 0;
    ALL_BLOOD_GROUPS.forEach(bg => {
      sum += bgCountMap.get(bg) || 0;
    });
    return sum;
  }, [bgCountMap]);

  const currentDistrict = districtData.district || user?.district || 'Kasaragod';
  const cleanDistrict = currentDistrict.replace(/^dyfi\s*/i, '').trim();
  const displayDistrict = `DYFI ${cleanDistrict}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">

      {/* Modern Minimal Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-red-700 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                {displayDistrict} Super Admin
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-slate-950 uppercase">
                DYFI {cleanDistrict}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                Real-time donor status, emergency requests & block administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/super-admin/points"
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trophy className="w-4 h-4 text-amber-600" /> Points Table
            </Link>
            <Link
              to="/super-admin/blocks"
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" /> Manage Blocks
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* District Pending Blood Request Approval Queue */}
      {districtData.pending_approval_requests?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                  District Blood Requests Awaiting Approval ({districtData.pending_approval_requests.length})
                </h3>
                <p className="text-xs text-amber-800 font-medium">
                  Review user-submitted blood requests in {cleanDistrict} before publishing them live to the public feed.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-bold px-3 py-1 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-full">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {districtData.pending_approval_requests.map((req) => {
              const reqId = req.id || req._id;
              const bg = req.blood_group || req.bloodGroup || '—';
              const patient = req.patient_name || req.patientName || 'Patient';
              const hospital = req.hospital_name || req.hospitalName || 'Hospital';
              const city = req.city || req.location || cleanDistrict;
              const units = req.units_required || req.unitsRequired || 1;
              const contact = req.contact_number || req.contactNumber || '—';
              const isApproving = actionLoadingId === reqId && actionType === 'approve';
              const isRejecting = actionLoadingId === reqId && actionType === 'reject';

              return (
                <div key={reqId} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-amber-300 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {bg}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{patient}</h4>
                        <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                          {hospital} • <span className="font-bold text-slate-900">{units} Unit{units > 1 ? 's' : ''}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Meghala / City: <span className="font-semibold text-slate-700">{city}</span>
                          {req.requester_name ? ` • By ${req.requester_name}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Contact: <a href={`tel:${contact}`} className="text-red-600 font-bold hover:underline">{contact}</a>
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ${
                      req.urgency_level === 'Emergency' || req.urgency_level === 'Critical'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {req.urgency_level || 'Urgent'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleApproveDistrictRequest(reqId)}
                      disabled={actionLoadingId === reqId}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isApproving ? 'animate-spin' : ''}`} />
                      {isApproving ? 'Approving...' : 'Approve & Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectDistrictRequest(reqId)}
                      disabled={actionLoadingId === reqId}
                      className="py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X className={`w-3.5 h-3.5 ${isRejecting ? 'animate-spin' : ''}`} />
                      {isRejecting ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modern 4 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">

        {/* KPI 1: Donors */}
        <div className="bg-white border border-red-100 p-4 rounded-2xl shadow-xs hover:border-red-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Donors</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Droplets className="w-4 h-4 fill-red-100" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{realDonorsCount}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> System Verified
          </p>
        </div>

        {/* KPI 2: Volunteers */}
        <div className="bg-white border border-emerald-100 p-4 rounded-2xl shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Volunteers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{realVolunteersCount}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">District Squads</p>
        </div>

        {/* KPI 3: Block Admins */}
        <div className="bg-white border border-amber-100 p-4 rounded-2xl shadow-xs hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Block Committees</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{realBlockAdminsCount}</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Active Hubs</p>
        </div>

        {/* KPI 4: Fulfillment */}
        <div className="bg-white border border-purple-100 p-4 rounded-2xl shadow-xs hover:border-purple-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fulfillment Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-1">{districtData.fulfillment_rate}%</p>
          <p className="text-[10px] text-purple-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {districtData.fulfilled_requests} Fulfilled
          </p>
        </div>
      </div>

      {/* Main 2-Column Balanced Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Column (8 cols): Blood Group Matrix & Emergency Feed */}
        <div className="lg:col-span-8 space-y-5">

          {/* Minimal Blood Group Matrix */}
          <div className="bg-white border border-red-100 rounded-2xl p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-red-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-red-600 fill-red-100" />
                Blood Group Donors Availability
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Real-time Matrix</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {ALL_BLOOD_GROUPS.map((bg) => {
                const count = bgCountMap.get(bg) || 0;
                let dotColor = 'bg-emerald-500';
                if (count === 0) dotColor = 'bg-red-500';
                else if (count < 3) dotColor = 'bg-amber-500';

                return (
                  <div key={bg} className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center">
                        {bg}
                      </span>
                      <div>
                        <p className="text-xs font-black text-slate-900">{count}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">Donors</p>
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} title={`Stock Status: ${count} Donors`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Emergency Blood Requests List */}
          <div className="bg-white border border-red-100 rounded-2xl p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-red-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600 fill-red-100" />
                Emergency Blood Requests Feed
              </h3>
              <Link to="/donor/emergency" className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {(!districtData.recent_requests || districtData.recent_requests.length === 0) ? (
              <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl">
                No active emergency requests reported in {cleanDistrict}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {districtData.recent_requests.slice(0, 4).map((req) => (
                  <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {req.blood_group}
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{req.patient_name || 'Emergency Patient'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{req.hospital_name || 'Hospital'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${req.urgency_level === 'Emergency' || req.urgency_level === 'Critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-700'
                        }`}>
                        {req.urgency_level || 'Urgent'}
                      </span>
                      {!req.verified ? (
                        <button
                          type="button"
                          onClick={() => handleApproveDistrictRequest(req.id)}
                          disabled={actionLoadingId === req.id}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-md transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                          {req.status || 'Active'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Block Analytics Summary */}
        <div className="lg:col-span-4 bg-white border border-red-100 rounded-2xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-red-50 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              Block Operations Index
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{realBlockAnalytics.length} Blocks</span>
          </div>

          {realBlockAnalytics.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs font-semibold">
              No blocks registered yet.
            </div>
          ) : (
            <div className="space-y-3">
              {realBlockAnalytics.map((ba) => (
                <div key={ba.block} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="truncate max-w-[140px]">{ba.block}</span>
                    <span className="text-slate-500 font-normal text-[11px]">{ba.users} Donors</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-600 h-full rounded-full"
                      style={{ width: `${Math.max(8, (ba.users / maxUsersInBlock) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Creative Minimal Points Table & League Widget ─── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-600 flex items-center justify-center font-black">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                District Points League
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full">
                  {(pointsLeaderboard.summary?.total_district_points || 0).toLocaleString()} Pts Pool
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Block Committee performance rankings & gamified milestones</p>
            </div>
          </div>

          <Link
            to="/super-admin/points"
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100/70 px-3 py-1.5 rounded-xl transition self-start sm:self-auto"
          >
            View Full Points Table & Meghala Rankings <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!pointsLeaderboard.blocks || pointsLeaderboard.blocks.length === 0) ? (
          <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-2xl">
            Points rankings will appear automatically as donations and block engagements are recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {pointsLeaderboard.blocks.slice(0, 4).map((b, idx) => (
              <div
                key={b.block_name || idx}
                className={`p-4 rounded-2xl border transition-all ${
                  idx === 0
                    ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                    : idx === 1
                    ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                    : 'bg-white border-slate-200/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                    idx === 0
                      ? 'bg-amber-500 text-white'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-800'
                      : idx === 2
                      ? 'bg-amber-700/20 text-amber-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx === 0 ? '👑' : `#${idx + 1}`}
                  </span>
                  <span className="text-xs font-black text-red-600">
                    {b.total_points} Pts
                  </span>
                </div>

                <div className="mt-2.5">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">{b.block_name}</h4>
                  <p className="text-[11px] text-slate-400 truncate">Admin: {b.admin_name}</p>
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full"
                    style={{ width: `${Math.max(8, b.percentage || 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-2">
                  <span>🩸 {b.donors_count} Donors</span>
                  <span>🛡️ {b.volunteers_count} Squads</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Block Committees Table */}
      <div className="bg-white border border-red-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-red-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-600" />
            Registered Block Committees ({filteredBlockAdmins.length})
          </h3>

          <div className="flex items-center gap-2.5">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone, or JL-ID…"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 pr-7 focus:outline-none focus:border-red-500"
              />
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>

            <Link
              to="/super-admin/blocks"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add Block
            </Link>
          </div>
        </div>

        {filteredBlockAdmins.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No Block Committees found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">JL Employee ID</th>
                  <th className="py-3 px-4">Block Committee</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Secondary Contact</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlockAdmins.map((ba) => {
                  const { admin1Name, admin1Mobile, admin2Name, admin2Mobile } = parseBlockAdminContacts(ba);

                  return (
                    <tr key={ba.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {(() => {
                          const bId = getDisplayJeevalinkId(ba);
                          return bId ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black text-primary bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg">
                              {bId}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px] italic">—</span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {ba.blockCommitteeName || ba.city || ba.block || 'N/A'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{admin1Name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" /> {admin1Mobile}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {admin2Name || admin2Mobile ? (
                          <>
                            <div className="font-bold text-slate-900">{admin2Name || 'Admin 2'}</div>
                            {admin2Mobile && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" /> {admin2Mobile}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        {ba.email}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${ba.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ba.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {ba.status || 'Active'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(ba)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-red-600 bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingAdminId(ba.id);
                              setDeletingAdminName(ba.primary_name || ba.name);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Landing Page Awareness Video & Content Management Section */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-50 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Landing Page Customizer
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-red-600" />
              Awareness Video & Section Management
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Upload awareness videos, customize thumbnails, and edit quotes/text rendered in the featured Landing Page section.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Control Side */}
          <form onSubmit={handleSaveAwareness} className="lg:col-span-7 space-y-4 text-xs font-semibold">
            {/* Video File / URL Input */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-slate-800 font-bold flex items-center gap-2">
                <Film className="w-4 h-4 text-red-600" />
                Awareness Video (Upload File or Enter URL)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Option A: Upload Video File</span>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-xl hover:border-red-400 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 text-[11px] font-bold truncate">
                      {videoFile ? videoFile.name : "Choose Video (.webm, .mp4)"}
                    </span>
                    <input
                      type="file"
                      accept="video/webm,video/mp4,video/*"
                      onChange={(e) => setVideoFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Option B: External Video URL</span>
                  <input
                    type="text"
                    value={awarenessForm.videoUrl}
                    onChange={(e) => setAwarenessForm({ ...awarenessForm, videoUrl: e.target.value })}
                    placeholder="https://... or /video.webm"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Poster Image File / URL Input */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-slate-800 font-bold flex items-center gap-2">
                <Image className="w-4 h-4 text-red-600" />
                Poster / Thumbnail Image (Upload File or Enter URL)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Upload Poster File</span>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-xl hover:border-red-400 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 text-[11px] font-bold truncate">
                      {posterFile ? posterFile.name : "Choose Image (.png, .jpg)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPosterFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">External Image URL</span>
                  <input
                    type="text"
                    value={awarenessForm.posterUrl}
                    onChange={(e) => setAwarenessForm({ ...awarenessForm, posterUrl: e.target.value })}
                    placeholder="/poster.png or https://..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-red-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Awareness Section Fields */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Badge Tagline</label>
                <input
                  type="text"
                  value={awarenessForm.badgeText}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, badgeText: e.target.value })}
                  placeholder="e.g. Lifesaving Dialogue"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Main Quote / Headline</label>
                <textarea
                  rows={2}
                  value={awarenessForm.quoteTitle}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, quoteTitle: e.target.value })}
                  placeholder="Enter main awareness quote..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description Subtext</label>
                <textarea
                  rows={3}
                  value={awarenessForm.quoteDescription}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, quoteDescription: e.target.value })}
                  placeholder="Enter paragraph description..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Action Button Text</label>
                <input
                  type="text"
                  value={awarenessForm.buttonLabel}
                  onChange={(e) => setAwarenessForm({ ...awarenessForm, buttonLabel: e.target.value })}
                  placeholder="e.g. Join Our Community"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingAwareness}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-lg shadow-red-600/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {savingAwareness ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Awareness Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Preview Side */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Live Preview (Landing Page)
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Realtime Preview</span>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800/80 p-5 space-y-4">
              <div className="relative h-48 bg-black rounded-2xl overflow-hidden border border-slate-800">
                <MascotVideo
                  videoUrl={videoFile ? URL.createObjectURL(videoFile) : awarenessForm.videoUrl}
                  posterUrl={posterFile ? URL.createObjectURL(posterFile) : awarenessForm.posterUrl}
                  showAudioToggle={true}
                  showPlayPause={true}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3 text-xs">
                <blockquote className="font-bold text-xs leading-snug italic text-white/95 border-l-2 border-red-500 pl-3 py-0.5">
                  {awarenessForm.quoteTitle || "“In critical emergency moments...”"}
                </blockquote>
                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                  {awarenessForm.quoteDescription || "Every second counts..."}
                </p>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl shadow-md">
                    {awarenessForm.buttonLabel || "Join Our Community"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Block Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-red-100 max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 p-5 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white text-base font-black tracking-tight">Edit Block Committee</h3>
                    <p className="text-red-100 text-[10px]">Update Block Committee information</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${editMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}>
                  {editMsg.msg}
                </div>
              )}

              <form onSubmit={handleSaveEditBlockAdmin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Block Committee Name *</label>
                  <input
                    type="text"
                    value={editBlockName}
                    onChange={(e) => setEditBlockName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Primary Contact Name *</label>
                    <input
                      type="text"
                      value={editFullName1}
                      onChange={(e) => setEditFullName1(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Primary Phone Number *</label>
                    <input
                      type="tel"
                      value={editMobile1}
                      onChange={(e) => setEditMobile1(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Secondary Contact Name *</label>
                    <input
                      type="text"
                      value={editFullName2}
                      onChange={(e) => setEditFullName2(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Secondary Phone Number *</label>
                    <input
                      type="tel"
                      value={editMobile2}
                      onChange={(e) => setEditMobile2(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Account Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-red-500"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Suspended">🔴 Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingAdminId}
        onClose={() => setDeletingAdminId(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Block Admin (${deletingAdminName})?`}
        message="Are you sure you want to delete this Block Committee Admin? They will lose access to district management."
      />

    </div>
  );
}
