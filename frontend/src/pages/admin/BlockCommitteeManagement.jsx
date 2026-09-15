import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Plus, Search, RefreshCw, Edit3, Trash2, X, Mail, Phone,
  CheckCircle2, Download, ChevronRight,
  MapPin, LayoutList, GitBranch, Users, Droplets, UserCheck
} from 'lucide-react';
import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useAppStore } from '../../store/appStore.js';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';

function parseBlockAdminContacts(ba) {
  let admin1Name = ba.primaryContactName || ba.primary_contact_name || ba.primaryName || ba.primary_name || ba.name || '';
  let admin2Name = ba.secondaryName || ba.secondary_name || '';

  let admin1Mobile = ba.mobile || '';
  let admin2Mobile = ba.secondaryContactNumber || ba.secondary_contact_number || '';
  if (admin2Mobile) {
    const numMatch = admin2Mobile.match(/[\d+\-\s]{10,}/);
    if (numMatch) {
      admin2Mobile = numMatch[0].trim();
    } else {
      admin2Mobile = admin2Mobile.replace(/Admin 2:\s*/g, '').replace(/[()]/g, '').trim();
    }
  }

  return {
    admin1Name: admin1Name || 'N/A',
    admin1Mobile: admin1Mobile || 'N/A',
    admin2Name,
    admin2Mobile,
  };
}



function normalizeBlockName(name) {
  if (!name || typeof name !== 'string') return '';
  let s = name.toLowerCase().trim();
  s = s.replace(/^(dyfi|block committee|block)\s+/i, '');
  s = s.replace(/\s+(block committee|committee|block)$/i, '');
  return s.trim();
}

function normalizeMeghalaName(name) {
  if (!name || typeof name !== 'string') return '';
  let s = name.toLowerCase().trim();
  s = s.replace(/^(meghala committee|meghala|unit squad|unit)\s+/i, '');
  s = s.replace(/\s+(meghala committee|committee|meghala|unit squad|unit)$/i, '');
  return s.trim();
}

export default function BlockCommitteeManagement() {
  const { user } = useAuthStore();
  const { allUsers, donors } = useAppStore();
  const [blockAdmins, setBlockAdmins] = useState([]);
  const [blockSummary, setBlockSummary] = useState([]);
  const [serverMeghalaSummary, setServerMeghalaSummary] = useState([]);
  const [allUsersLocal, setAllUsersLocal] = useState([]); // fetched by this page
  const [allVolunteers, setAllVolunteers] = useState([]); // registered volunteer contacts
  const [district, setDistrict] = useState(user?.district || 'Kasaragod');
  const [districtData, setDistrictData] = useState({
    total_users: 0,
    total_volunteers: 0,
    total_admins: 0,
    block_summary: [],
    meghala_summary: [],
    meghalas_by_block: {}
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'tree'
  const [meghalasByBlock, setMeghalasByBlock] = useState({});
  const [expandedBlocks, setExpandedBlocks] = useState({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [deletingAdminName, setDeletingAdminName] = useState('');
  const [credentialsModal, setCredentialsModal] = useState({ open: false, email: '', password: '', blockName: '' });

  // Add Form State
  const [blockName, setBlockName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactMobile, setPrimaryContactMobile] = useState('');
  const [secondaryContactName, setSecondaryContactName] = useState('');
  const [secondaryContactMobile, setSecondaryContactMobile] = useState('');
  const [email, setEmail] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addMsg, setAddMsg] = useState(null);

  // Edit Form State
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resDist, resAdmins, resUsers, resVols] = await Promise.all([
        api.get('/super-admin/metrics').catch(() => null),
        api.get('/super-admin/block-admins').catch(() => null),
        // Fetch all users so we can compute per-meghala donor counts
        api.get('/admin/users').catch(() =>
          api.get('/donors/search').catch(() => null)
        ),
        // Fetch public volunteers to compute actual volunteer counts
        api.get('/public/volunteers').catch(() => null)
      ]);

      if (resDist?.data?.success) {
        const dData = resDist.data.data || resDist.data;
        setDistrictData(dData);
        if (dData.district) setDistrict(dData.district);
        const bs = dData.block_summary || dData.blockSummary || [];
        setBlockSummary(Array.isArray(bs) ? bs : []);
        const ms = dData.meghala_summary || dData.meghalaSummary || [];
        setServerMeghalaSummary(Array.isArray(ms) ? ms : []);
        if (dData.meghalas_by_block || dData.meghalasByBlock) {
          const mb = dData.meghalas_by_block || dData.meghalasByBlock;
          const cleanedMb = {};
          for (const [blk, mList] of Object.entries(mb)) {
            if (/test|dummy/i.test(blk)) continue;
            if (Array.isArray(mList)) {
              cleanedMb[blk] = mList.filter(m => {
                if (/test|dummy/i.test(m)) return false;
                if (normalizeMeghalaName(m) === normalizeBlockName(blk)) return false;
                return true;
              });
            }
          }
          setMeghalasByBlock(prev => ({
            ...prev,
            ...cleanedMb
          }));
        }
      }
      if (resAdmins?.data?.success) {
        setBlockAdmins(resAdmins.data.data || []);
      }
      // Populate local user pool for donor counting
      if (resUsers?.data?.success) {
        const raw = resUsers.data.data;
        const list = raw?.users || raw?.donors || (Array.isArray(raw) ? raw : []);
        setAllUsersLocal(list);
      }
      // Populate volunteers list
      if (resVols?.data?.success && Array.isArray(resVols.data.data)) {
        const cleanVols = resVols.data.data.filter(v => {
          const b = String(v.block || v.organization_name || '').toLowerCase();
          const m = String(v.meghala || v.city || '').toLowerCase();
          const n = String(v.name || v.primary_name || '').toLowerCase();
          return !b.includes('test') && !b.includes('dummy') &&
                 !m.includes('test') && !m.includes('dummy') &&
                 !n.includes('test') && !n.includes('dummy');
        });
        setAllVolunteers(cleanVols);
      }
    } catch (err) {
      console.error("Block Committee Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadData();
    })();
    return () => { active = false; };
  }, [loadData]);

  const handleCreateBlockAdmin = async (e) => {
    e.preventDefault();
    setSubmittingAdd(true);
    setAddMsg(null);
    try {
      const res = await api.post('/super-admin/block-admins', {
        blockCommitteeName: blockName,
        block_admin_1_name: primaryContactName,
        block_admin_1_mobile: primaryContactMobile,
        secondaryName: secondaryContactName,
        secondaryContactNumber: secondaryContactMobile,
        primary_name: primaryContactName,
        mobile: primaryContactMobile,
        whatsapp_number: primaryContactMobile,
        email,
        district,
        city: blockName,
      });

      if (res.data?.success) {
        const genPassword = res.data.data?.generated_password || 'Auto-generated';
        setCredentialsModal({
          open: true,
          email,
          password: genPassword,
          blockName
        });
        setBlockName('');
        setPrimaryContactName('');
        setPrimaryContactMobile('');
        setSecondaryContactName('');
        setSecondaryContactMobile('');
        setEmail('');
        setShowAddModal(false);
        loadData();
      } else {
        setAddMsg({ type: 'error', msg: res.data?.message || 'Creation failed' });
      }
    } catch (err) {
      setAddMsg({ type: 'error', msg: err.response?.data?.message || 'Network error while creating Block Committee.' });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (ba) => {
    setEditingAdmin(ba);
    setEditBlockName(ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.block || ba.blockName || ba.city || '');
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
        secondaryName: editFullName2,
        secondaryContactNumber: editMobile2,
        primary_name: editFullName1,
        email: editEmail,
        password: editPassword || undefined,
        mobile: editMobile1,
        status: editStatus,
        district,
        city: editBlockName,
      });

      if (res.data?.success) {
        setEditingAdmin(null);
        loadData();
      } else {
        setEditMsg({ type: 'error', msg: res.data?.message || 'Update failed' });
      }
    } catch (err) {
      setEditMsg({ type: 'error', msg: err.response?.data?.message || 'Failed to update Block Committee Admin.' });
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

  // ── Dynamic Meghalas by Block (Strictly Real Registered Committees - Zero Dummy Data) ──
  const dynamicMeghalasByBlock = useMemo(() => {
    const combined = {};



    // 1. Server-returned meghalas from blockSummary (actual registered meghalas)
    (blockSummary || []).forEach(bs => {
      const bName = (bs.block || bs.city || bs.name || '').trim();
      if (!bName || /test|dummy/i.test(bName)) return;
      
      const targetBlockKey = Object.keys(combined).find(k => normalizeBlockName(k) === normalizeBlockName(bName)) || bName;
      if (!combined[targetBlockKey]) combined[targetBlockKey] = [];
      
      if (Array.isArray(bs.meghalas)) {
        bs.meghalas.forEach(m => {
          const mName = typeof m === 'string' ? m : (m.meghala || m.name || '');
          if (mName && !/test|dummy/i.test(mName)) {
            if (!combined[targetBlockKey].some(item => item.toLowerCase().trim() === mName.toLowerCase().trim())) {
              combined[targetBlockKey].push(mName.trim());
            }
          }
        });
      }
    });

    // 2. Server-returned meghalas (includes DB registered)
    Object.entries(meghalasByBlock || {}).forEach(([blk, list]) => {
      if (!combined[blk]) combined[blk] = [];
      if (Array.isArray(list)) {
        list.forEach(m => {
          if (!combined[blk].some(item => item.toLowerCase().trim() === String(m).toLowerCase().trim())) {
            combined[blk].push(String(m).trim());
          }
        });
      }
    });

    // 3. Registered blockAdmins meghalas
    (blockAdmins || []).forEach(ba => {
      const bName = (ba.blockCommitteeName || ba.city || ba.block || '').trim();
      if (!bName) return;
      if (!combined[bName]) combined[bName] = [];
      if (Array.isArray(ba.meghalas)) {
        ba.meghalas.forEach(m => {
          if (m && !combined[bName].some(item => item.toLowerCase() === m.toLowerCase())) {
            combined[bName].push(m);
          }
        });
      }
    });

    // 4. Dynamically scan users/volunteers/unit squads for any registered Meghala
    const userPool = (allVolunteers && allVolunteers.length > 0) ? allVolunteers : ((allUsersLocal && allUsersLocal.length > 0) ? allUsersLocal : (allUsers || []));
    userPool.forEach(u => {
      const role = (u.role || '').toLowerCase().trim();
      // Authoritative: a user is a volunteer ONLY when role === 'volunteer'
      const isVol = role === 'volunteer';
      const mName = (isVol ? (u.city || '') : '').trim();
      const bName = (isVol ? (u.organization_name || '') : '').trim();
      if (mName && bName && mName.toLowerCase() !== 'n/a' && bName.toLowerCase() !== 'n/a' && !/test|dummy/i.test(mName)) {
        const matchedBlockKey = Object.keys(combined).find(
          k => k.toLowerCase().trim() === bName.toLowerCase().trim() ||
               normalizeBlockName(k) === normalizeBlockName(bName)
        );
        const targetBlock = matchedBlockKey || bName;
        if (!combined[targetBlock]) combined[targetBlock] = [];
        if (!combined[targetBlock].some(item => item.toLowerCase().trim() === mName.toLowerCase().trim())) {
          combined[targetBlock].push(mName);
        }
      }
    });

    // Sort meghala names alphabetically for clean display
    Object.keys(combined).forEach(k => {
      combined[k].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    });

    return combined;
  }, [blockSummary, meghalasByBlock, blockAdmins, allVolunteers, allUsersLocal, allUsers]);

  // ── Donor / Volunteer count maps (Authoritative reference from SuperAdminDashboard.jsx) ──
  // blockDonorMap  : { blockNameLower -> { donors, volunteers } }
  // meghalaDonorMap: { meghalaNameLower -> { donors, volunteers } }
  const { blockDonorMap, meghalaDonorMap } = useMemo(() => {
    const bMap = new Map();
    const mMap = new Map();

    const activeMeghalasByBlock = dynamicMeghalasByBlock;

    // Pre-seed blocks from activeMeghalasByBlock
    Object.keys(activeMeghalasByBlock).forEach(b => {
      const key = b.toLowerCase().trim();
      bMap.set(key, { donors: 0, volunteers: 0 });
      const normKey = normalizeBlockName(b);
      if (normKey && !bMap.has(normKey)) {
        bMap.set(normKey, { donors: 0, volunteers: 0 });
      }
    });

    // Seed blocks from registered block admins
    blockAdmins.forEach(ba => {
      const bName = (ba.blockCommitteeName || ba.city || ba.block || ba.primary_name || '').trim();
      if (!bName || bName.toLowerCase() === 'n/a') return;
      const key = bName.toLowerCase();
      const normKey = normalizeBlockName(bName);
      if (!bMap.has(key)) bMap.set(key, { donors: 0, volunteers: 0 });
      if (normKey && !bMap.has(normKey)) bMap.set(normKey, { donors: 0, volunteers: 0 });
    });

    // 1. Seed block map from block_summary (authoritative server counts)
    blockSummary.forEach(bs => {
      const bName = (bs.block || bs.city || bs.name || '').trim();
      if (!bName) return;
      const key = bName.toLowerCase();
      const normKey = normalizeBlockName(bName);
      const val = {
        donors: Number(bs.donors ?? bs.users ?? 0),
        volunteers: Number(bs.volunteers ?? 0)
      };
      bMap.set(key, val);
      if (normKey) bMap.set(normKey, val);
    });

    // Pre-seed all meghalas from activeMeghalasByBlock
    Object.values(activeMeghalasByBlock).forEach(list => {
      if (Array.isArray(list)) {
        list.forEach(m => {
          const key = String(m).toLowerCase().trim();
          mMap.set(key, { donors: 0, volunteers: 0 });
          const normKey = normalizeMeghalaName(key);
          if (normKey && !mMap.has(normKey)) {
            mMap.set(normKey, { donors: 0, volunteers: 0 });
          }
        });
      }
    });

    // Seed meghalas from server meghala_summary if available
    const hasServerMeghalaCounts = serverMeghalaSummary.length > 0 &&
      serverMeghalaSummary.some(ms => Number(ms.donors || 0) > 0 || Number(ms.volunteers || 0) > 0);

    serverMeghalaSummary.forEach(ms => {
      const mName = (ms.meghala || ms.name || '').trim();
      if (!mName) return;
      const key = mName.toLowerCase();
      const normKey = normalizeMeghalaName(key);
      const val = {
        donors: Number(ms.donors ?? ms.users ?? 0),
        volunteers: Number(ms.volunteers ?? 0)
      };
      mMap.set(key, val);
      if (normKey) mMap.set(normKey, val);
    });

    // Also check if blockSummary items contain nested meghalas
    blockSummary.forEach(bs => {
      if (Array.isArray(bs.meghalas)) {
        bs.meghalas.forEach(m => {
          const mName = (m.meghala || m.name || '').trim();
          if (!mName) return;
          const key = mName.toLowerCase();
          const normKey = normalizeMeghalaName(key);
          const existing = mMap.get(key) || { donors: 0, volunteers: 0 };
          const updated = {
            donors: Math.max(existing.donors, Number(m.donors ?? m.users ?? 0)),
            volunteers: Math.max(existing.volunteers, Number(m.volunteers ?? 0))
          };
          mMap.set(key, updated);
          if (normKey) mMap.set(normKey, updated);
        });
      }
    });

    // Build reverse map: meghalaNameLower -> parentBlockLower
    const meghalaToBlock = new Map();
    for (const [blk, mList] of Object.entries(activeMeghalasByBlock)) {
      const blkKey = normalizeBlockName(blk);
      if (Array.isArray(mList)) {
        mList.forEach(m => {
          meghalaToBlock.set(String(m).toLowerCase().trim(), blkKey);
          meghalaToBlock.set(normalizeMeghalaName(m), blkKey);
        });
      }
    }

    // Dynamic Meghala to Block dictionary lookup (same as SuperAdminDashboard.jsx)
    const dynamicMeghalaBlockMap = {};
    if (districtData?.meghalas_by_block) {
      Object.entries(districtData.meghalas_by_block).forEach(([blk, list]) => {
        if (Array.isArray(list)) {
          list.forEach(m => {
            dynamicMeghalaBlockMap[String(m).toLowerCase().trim()] = String(blk).toLowerCase().trim();
          });
        }
      });
    }

    // Combined user and volunteer pool
    const pool = (allUsersLocal && allUsersLocal.length > 0)
      ? allUsersLocal
      : (allUsers && allUsers.length > 0 ? allUsers : (donors || []));
    const combinedPool = Array.from(
      new Map([...pool, ...(allVolunteers || [])].map(u => [u.id || u._id || u.phone || u.email, u])).values()
    );

    const mKeys = Array.from(mMap.keys());
    const bKeys = Array.from(bMap.keys());

    const totalServerBlockUsers = Array.from(bMap.values()).reduce((sum, b) => sum + (b.donors || 0), 0);
    const totalServerBlockVolunteers = Array.from(bMap.values()).reduce((sum, b) => sum + (b.volunteers || 0), 0);

    const needDynamicBlockDonors = totalServerBlockUsers === 0;
    const needDynamicBlockVolunteers = totalServerBlockVolunteers === 0;

    combinedPool.forEach(u => {
      const role = String(u.role || '').toLowerCase().trim();
      // Authoritative: a user is a volunteer ONLY when role === 'volunteer'
      const isVolunteer = role === 'volunteer';
      const isDonor = ['user', 'donor', 'receiver'].includes(role) ||
        ((u.blood_group || u.bloodGroup || '') !== '' &&
         (u.blood_group || u.bloodGroup || '') !== 'N/A');

      const uRemarks = String(u.remarks || '');
      const uCity = String(u.city || '');
      const uMeghala = String(u.meghala || u.meghalaName || '');
      const uOrg = String(u.organization_name || u.organizationName || u.block || u.blockCommitteeName || '');

      // Resolve candidate meghala in order of priority:
      let matchedMKey = null;

      // A. Remarks: Added by Meghala: <meghala>
      const mMatch = uRemarks.match(/added by meghala:\s*([^,[\n;]+)/i);
      if (mMatch) {
        const rawM = mMatch[1].trim().toLowerCase();
        const normM = normalizeMeghalaName(rawM);
        matchedMKey = mKeys.find(k => k === rawM || normalizeMeghalaName(k) === normM);
      }

      // B. Remarks: Added by Unit Squad: <squad>
      if (!matchedMKey) {
        const sMatch = uRemarks.match(/added by unit squad:\s*([^,[\n;]+)/i);
        if (sMatch) {
          const rawS = sMatch[1].trim().toLowerCase();
          const normS = normalizeMeghalaName(rawS);
          matchedMKey = mKeys.find(k => k === rawS || normalizeMeghalaName(k) === normS);
        }
      }

      // C. Explicit u.meghala or u.meghalaName
      if (!matchedMKey && uMeghala && uMeghala.toLowerCase() !== 'n/a') {
        const rawM = uMeghala.trim().toLowerCase();
        const normM = normalizeMeghalaName(rawM);
        matchedMKey = mKeys.find(k => k === rawM || normalizeMeghalaName(k) === normM);
      }

      // D. Volunteer's city is their Meghala
      if (!matchedMKey && isVolunteer && uCity) {
        const rawC = uCity.trim().toLowerCase();
        const normC = normalizeMeghalaName(rawC);
        matchedMKey = mKeys.find(k => k === rawC || normalizeMeghalaName(k) === normC);
      }

      // E. Direct city match against known meghalas
      if (!matchedMKey && uCity) {
        const rawC = uCity.trim().toLowerCase();
        const normC = normalizeMeghalaName(rawC);
        matchedMKey = mKeys.find(k => k === rawC || normalizeMeghalaName(k) === normC);
      }

      // F. Direct org match against known meghalas
      if (!matchedMKey && uOrg) {
        const rawO = uOrg.trim().toLowerCase();
        const normO = normalizeMeghalaName(rawO);
        matchedMKey = mKeys.find(k => k === rawO || normalizeMeghalaName(k) === normO);
      }

      // G. Check if remarks contains any known meghala name
      if (!matchedMKey && uRemarks) {
        const rLower = uRemarks.toLowerCase();
        for (const k of mKeys) {
          if (k.length > 3 && rLower.includes(k)) {
            matchedMKey = k;
            break;
          }
        }
      }

      // Increment Meghala counts
      if (matchedMKey && mMap.has(matchedMKey)) {
        const mItem = mMap.get(matchedMKey);
        if (!hasServerMeghalaCounts && isDonor) mItem.donors += 1;
        if (isVolunteer) {
          if (!hasServerMeghalaCounts || mItem.volunteers === 0) {
            mItem.volunteers += 1;
          }
        }
      }

      // ── Block assignment (authoritative reference from SuperAdminDashboard.jsx) ──
      if (needDynamicBlockDonors || needDynamicBlockVolunteers) {
        let bKey = null;
        if (matchedMKey && meghalaToBlock.has(matchedMKey)) {
          bKey = meghalaToBlock.get(matchedMKey);
        }
        if (!bKey && uOrg) {
          const normOrg = normalizeBlockName(uOrg);
          bKey = bKeys.find(k => k === normOrg || normalizeBlockName(k) === normOrg);
        }
        if (!bKey && uCity) {
          const mapped = dynamicMeghalaBlockMap[uCity.toLowerCase().trim()];
          if (mapped) {
            bKey = bKeys.find(k => k === mapped || k.includes(mapped) || mapped.includes(k));
          }
        }
        if (!bKey && uCity) {
          const normCity = normalizeBlockName(uCity);
          bKey = bKeys.find(k => k === normCity || normalizeBlockName(k) === normCity);
        }
        if (!bKey && uRemarks) {
          for (const [mName, blkName] of Object.entries(dynamicMeghalaBlockMap)) {
            if (uRemarks.includes(mName)) {
              bKey = bKeys.find(k => k === blkName || k.includes(blkName) || blkName.includes(k));
              if (bKey) break;
            }
          }
        }
        if (!bKey && bKeys.length > 0) {
          bKey = bKeys.find(k => k.includes('kasaragod') || k.includes('kasargod')) || bKeys[0];
        }

        if (bKey && bMap.has(bKey)) {
          const bItem = bMap.get(bKey);
          if (needDynamicBlockDonors && isDonor) bItem.donors += 1;
          if (needDynamicBlockVolunteers && isVolunteer) bItem.volunteers += 1;
        }
      }
    });

    return { blockDonorMap: bMap, meghalaDonorMap: mMap };
  }, [blockSummary, serverMeghalaSummary, blockAdmins, dynamicMeghalasByBlock, allUsersLocal, allUsers, donors, allVolunteers, districtData]);

  // Helper: get block donor stats by block name
  const getBlockStats = useCallback((blockLabel) => {
    if (!blockLabel) return { donors: 0, volunteers: 0 };
    const raw = String(blockLabel).toLowerCase().trim();
    if (blockDonorMap.has(raw)) return blockDonorMap.get(raw);
    const norm = normalizeBlockName(raw);
    if (blockDonorMap.has(norm)) return blockDonorMap.get(norm);
    for (const [k, v] of blockDonorMap.entries()) {
      if (normalizeBlockName(k) === norm || k.includes(norm) || norm.includes(k)) return v;
    }
    return { donors: 0, volunteers: 0 };
  }, [blockDonorMap]);

  // Helper: get meghala donor stats by meghala name
  const getMeghalaStats = useCallback((meghalaName) => {
    if (!meghalaName) return { donors: 0, volunteers: 0 };
    const raw = String(meghalaName).toLowerCase().trim();
    if (meghalaDonorMap.has(raw)) return meghalaDonorMap.get(raw);
    const norm = normalizeMeghalaName(raw);
    if (meghalaDonorMap.has(norm)) return meghalaDonorMap.get(norm);
    for (const [k, v] of meghalaDonorMap.entries()) {
      if (normalizeMeghalaName(k) === norm) return v;
    }
    return { donors: 0, volunteers: 0 };
  }, [meghalaDonorMap]);


  // Resolve real block-wise Meghala stats with zero dummy data (reference from SuperAdminDashboard.jsx)
  const getBlockMeghalaStats = useCallback((ba, blockName) => {
    const bName = (blockName || ba?.blockCommitteeName || ba?.city || ba?.block || ba?.primary_name || '').trim();
    if (!bName) return { count: 0, list: [] };

    // 1. Direct from ba if provided
    if (ba && typeof ba.meghala_count === 'number' && Array.isArray(ba.meghalas)) {
      return { count: ba.meghala_count, list: ba.meghalas };
    }

    // 2. Cross-reference from districtData.block_summary / blockSummary
    const normB = normalizeBlockName(bName);
    const summaryItem = (blockSummary || []).find(bs => normalizeBlockName(bs.block || bs.city || bs.name) === normB);
    if (summaryItem && typeof summaryItem.meghala_count === 'number' && Array.isArray(summaryItem.meghalas)) {
      const list = summaryItem.meghalas.map(m => typeof m === 'string' ? m : (m.meghala || m.name)).filter(Boolean);
      return { count: summaryItem.meghala_count, list };
    }

    // 3. Fallback dynamically from allUsers volunteer pool
    const userPool = (allVolunteers && allVolunteers.length > 0) ? allVolunteers : ((allUsersLocal && allUsersLocal.length > 0) ? allUsersLocal : (allUsers || []));
    const matchingVols = userPool.filter(u => {
      const role = String(u.role || '').toLowerCase().trim();
      // Authoritative: a user is a volunteer ONLY when role === 'volunteer'
      const isVol = role === 'volunteer';
      if (!isVol) return false;
      const uOrg = normalizeBlockName(String(u.organization_name || u.block || ''));
      const uCity = normalizeBlockName(String(u.city || ''));
      return (uOrg && (uOrg === normB || uOrg.includes(normB) || normB.includes(uOrg))) ||
             (uCity && uCity === normB);
    });

    const distinctMeghalas = Array.from(new Set(
      matchingVols.map(v => v.city || v.organization_name).filter(m => m && m.toLowerCase() !== 'n/a' && !/test|dummy/i.test(m))
    ));

    return { count: distinctMeghalas.length, list: distinctMeghalas };
  }, [blockSummary, allVolunteers, allUsersLocal, allUsers]);

  // ── Unified Block Committee List (All 12 Blocks + Dynamic Blocks + Assigned Admins) ──
  const allBlockCommittees = useMemo(() => {
    const blockNamesMap = new Map();

    // 1. All blocks from dynamicMeghalasByBlock (guaranteed to have the 12 Kasaragod blocks + server meghalas)
    Object.keys(dynamicMeghalasByBlock).forEach(bName => {
      const norm = normalizeBlockName(bName);
      if (norm && !blockNamesMap.has(norm)) {
        blockNamesMap.set(norm, bName);
      }
    });

    // 2. Any blocks from blockAdmins
    blockAdmins.forEach(ba => {
      const bName = (ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.city || '').trim();
      if (bName && bName.toLowerCase() !== 'n/a') {
        const norm = normalizeBlockName(bName);
        if (norm && !blockNamesMap.has(norm)) {
          blockNamesMap.set(norm, bName);
        }
      }
    });

    // 3. Any blocks from blockSummary
    blockSummary.forEach(bs => {
      const bName = (bs.block || bs.city || bs.name || '').trim();
      if (bName && bName.toLowerCase() !== 'n/a') {
        const norm = normalizeBlockName(bName);
        if (norm && !blockNamesMap.has(norm)) {
          blockNamesMap.set(norm, bName);
        }
      }
    });

    const list = Array.from(blockNamesMap.entries()).map(([norm, canonicalName]) => {
      // Find matching admin if registered
      const admin = blockAdmins.find(ba => {
        const b = (ba.blockCommitteeName || ba.block_committee_name || ba.block_name || ba.city || '').trim();
        return normalizeBlockName(b) === norm || b.toLowerCase() === canonicalName.toLowerCase();
      });

      const { admin1Name, admin1Mobile, admin2Name, admin2Mobile } = admin
        ? parseBlockAdminContacts(admin)
        : { admin1Name: 'Admin Not Assigned', admin1Mobile: '—', admin2Name: '', admin2Mobile: '' };

      const meghalas = (() => {
        if (dynamicMeghalasByBlock[canonicalName] && dynamicMeghalasByBlock[canonicalName].length > 0) {
          return dynamicMeghalasByBlock[canonicalName];
        }
        const key = Object.keys(dynamicMeghalasByBlock).find(k => normalizeBlockName(k) === norm);
        if (key && dynamicMeghalasByBlock[key] && dynamicMeghalasByBlock[key].length > 0) {
          return dynamicMeghalasByBlock[key];
        }
        const dynamicStats = getBlockMeghalaStats(admin, canonicalName);
        return dynamicStats.list || [];
      })();

      const stats = getBlockStats(canonicalName);

      return {
        id: admin ? admin.id : `unassigned-${norm}`,
        rawAdmin: admin || null,
        isAssigned: !!admin,
        blockName: canonicalName,
        admin1Name: admin ? admin1Name : 'Admin Not Assigned',
        admin1Mobile: admin ? admin1Mobile : '—',
        admin2Name: admin ? admin2Name : '',
        admin2Mobile: admin ? admin2Mobile : '',
        email: admin ? (admin.email || '—') : '—',
        status: admin ? (admin.status || 'Active') : 'Unassigned',
        meghalas,
        meghalaCount: meghalas.length,
        donors: stats.donors,
        volunteers: stats.volunteers,
      };
    });

    // Sort: assigned first, then alphabetical by block name
    list.sort((a, b) => {
      if (a.isAssigned !== b.isAssigned) return a.isAssigned ? -1 : 1;
      return a.blockName.localeCompare(b.blockName);
    });

    return list;
  }, [dynamicMeghalasByBlock, blockAdmins, blockSummary, getBlockStats, getBlockMeghalaStats]);

  const filteredCommittees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allBlockCommittees.filter(c => {
      const matchQuery = !q || (
        c.blockName.toLowerCase().includes(q) ||
        c.admin1Name.toLowerCase().includes(q) ||
        c.admin1Mobile.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.meghalas.some(m => m.toLowerCase().includes(q))
      );
      const matchStatus = statusFilter === 'all' || (
        statusFilter === 'Unassigned' ? !c.isAssigned : c.status === statusFilter
      );
      return matchQuery && matchStatus;
    });
  }, [allBlockCommittees, searchQuery, statusFilter]);

  // Resilient real volunteer count matching SuperAdminDashboard.jsx reference
  const realVolunteersCount = useMemo(() => {
    const serverCount = Number(districtData?.total_volunteers);
    if (!isNaN(serverCount) && serverCount >= 0) return serverCount;
    const userPool = (allVolunteers && allVolunteers.length > 0)
      ? allVolunteers
      : ((allUsersLocal && allUsersLocal.length > 0) ? allUsersLocal : (allUsers || []));
    const volUsers = userPool.filter(u => String(u.role || '').toLowerCase().trim() === 'volunteer');
    return volUsers.length;
  }, [districtData?.total_volunteers, allVolunteers, allUsersLocal, allUsers]);

  const totalBlocks = allBlockCommittees.length;
  const totalBlockDonors = allBlockCommittees.reduce((acc, c) => acc + c.donors, 0);
  const totalBlockVolunteers = allBlockCommittees.reduce((acc, c) => acc + (Number(c.volunteers) || 0), 0);
  const activeCount = allBlockCommittees.filter(c => c.isAssigned && c.status === 'Active').length;
  const unassignedCount = allBlockCommittees.filter(c => !c.isAssigned).length;
  const suspendedCount = allBlockCommittees.filter(c => c.isAssigned && c.status === 'Suspended').length;

  // Dynamic total volunteer count fetched from all block committees
  const totalVolunteersDisplay = useMemo(() => {
    if (totalBlockVolunteers > 0) return totalBlockVolunteers;
    if (realVolunteersCount > 0) return realVolunteersCount;
    return 0;
  }, [totalBlockVolunteers, realVolunteersCount]);

  const exportCSV = () => {
    const headers = ['Block Name', 'Meghalas Count', 'Admin Name', 'Email', 'Primary Contact', 'Secondary Contact', 'Donors', 'Volunteers', 'Status'];
    const rows = filteredCommittees.map(c => [
      c.blockName,
      c.meghalaCount,
      c.admin1Name,
      c.email,
      c.admin1Mobile,
      c.admin2Mobile,
      c.donors,
      c.volunteers,
      c.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(col => `"${String(col || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `block_committees_${district.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const rawDistrict = district || user?.district || 'Kasaragod';
  const cleanDistrict = rawDistrict.replace(/^dyfi\s*/i, '').trim();
  const displayDistrict = `DYFI ${cleanDistrict}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-full text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4 text-red-600" /> {displayDistrict} Block Committees
          </div>
          <h1 className="text-2xl font-black text-red-600 uppercase tracking-tight">Block Committee Management</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Register, configure, and oversee Block Committees across {displayDistrict} District</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('tree')}
              title="Tree View — shows Meghala units under each Block"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Tree
            </button>
          </div>

          <button
            onClick={() => { setBlockName(''); setShowAddModal(true); }}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-bold shadow-md shadow-red-200 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Block Committee
          </button>
          <button
            onClick={exportCSV}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" /> Export CSV
          </button>
          <button
            onClick={loadData}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* 5 KPI Cards Grid (Matching SuperAdminDashboard.jsx Active Meghalas reference) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Block Committees</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{totalBlocks}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{activeCount} Assigned</p>
        </div>

        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Meghala Units</span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{totalMeghalas}</h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Across {totalBlocks} Blocks</p>
        </div>

        {/* Dynamic Total Volunteers on Status Board */}
        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Volunteers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{totalVolunteersDisplay}</h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Across {totalBlocks} Blocks</p>
        </div>

        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Block Donors</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalBlockDonors}</h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Meghala registered</p>
        </div>

        <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-4 rounded-2xl col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Admin Status</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">{activeCount} Active</h3>
          <p className="text-[10px] text-amber-500 mt-0.5">{unassignedCount} Unassigned</p>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border /80 dark:border-zinc-800/80 rounded-3xl p-6 space-y-6">

        {/* Filters & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/60 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              All ({totalBlocks})
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'Active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('Unassigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'Unassigned'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                }`}
            >
              Unassigned ({unassignedCount})
            </button>
            {suspendedCount > 0 && (
              <button
                onClick={() => setStatusFilter('Suspended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${statusFilter === 'Suspended'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                  }`}
              >
                Suspended ({suspendedCount})
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by block, meghala, admin..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 pr-9"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* ─── TABLE VIEW ─── */}
        {viewMode === 'table' && (
          filteredCommittees.length === 0 ? (
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400 shadow-sm text-xs">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
              No Block Committees found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Block Committee</th>
                    <th className="py-3.5 px-4">Meghala Units</th>
                    <th className="py-3.5 px-4">Primary Contact (Admin 1)</th>
                    <th className="py-3.5 px-4">Secondary Contact (Admin 2)</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4 text-center">Donors</th>
                    <th className="py-3.5 px-4 text-center">Volunteers</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                  {filteredCommittees.map((c) => {
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-100 dark:border-red-900/40">
                              <Building2 className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{c.blockName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{cleanDistrict} District</div>
                            </div>
                          </div>
                        </td>

                        {/* Meghalas Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900/40">
                              <MapPin className="w-3 h-3 text-violet-500" />
                              {c.meghalaCount} Meghala{c.meghalaCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {c.meghalas.length > 0 && (
                            <div className="text-[10px] text-slate-400 max-w-[180px] truncate mt-0.5" title={c.meghalas.join(', ')}>
                              {c.meghalas.slice(0, 3).join(', ')}{c.meghalas.length > 3 ? ` +${c.meghalas.length - 3}` : ''}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className={`font-bold ${c.isAssigned ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-400 italic'}`}>{c.admin1Name}</div>
                          {c.admin1Mobile !== '—' && (
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{c.admin1Mobile}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {c.admin2Name || c.admin2Mobile ? (
                            <>
                              <div className="font-bold text-slate-900 dark:text-zinc-100">{c.admin2Name || 'Admin 2'}</div>
                              {c.admin2Mobile && (
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{c.admin2Mobile}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 italic">Not set</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {c.email !== '—' ? (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-mono text-xs">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{c.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 italic">—</span>
                          )}
                        </td>

                        {/* Donors column */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 px-2.5 py-1 rounded-full">
                            <Droplets className="w-3 h-3" />{c.donors} Donors
                          </span>
                        </td>

                        {/* Volunteers column */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 px-2.5 py-1 rounded-full">
                            <Users className="w-3 h-3" />{c.volunteers} Volunteers
                          </span>
                        </td>

                        {/* Status column */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            c.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : c.status === 'Suspended'
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'Active' ? 'bg-emerald-500' : c.status === 'Suspended' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            {c.status}
                          </span>
                        </td>

                        {/* Actions column */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {c.isAssigned ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(c.rawAdmin)}
                                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                                title="Edit Block Committee"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingAdminId(c.rawAdmin.id);
                                  setDeletingAdminName(c.rawAdmin.primary_name || c.rawAdmin.name);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition cursor-pointer flex items-center gap-1"
                                title="Delete Block Committee"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setBlockName(c.blockName);
                                setShowAddModal(true);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition cursor-pointer flex items-center gap-1 ml-auto"
                              title="Assign Admin to this Block"
                            >
                              <Plus className="w-3.5 h-3.5" /> Assign Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ─── TREE VIEW ─── */}
        {viewMode === 'tree' && (
          <div className="space-y-3">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-red-500" /> Block Committee</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-violet-500" /> Meghala Unit</span>
              <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-emerald-500" /> Volunteers</span>
            </div>

            {filteredCommittees.length === 0 ? (
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400 shadow-sm text-xs">
                <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-zinc-700" />
                No Block Committees found matching your search.
              </div>
            ) : (
              filteredCommittees.map((c) => {
                const isExpanded = !!expandedBlocks[c.id];
                const meghalaList = c.meghalas;

                return (
                  <div
                    key={c.id}
                    className="border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs"
                  >
                    {/* Block Row */}
                    <button
                      onClick={() =>
                        setExpandedBlocks(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                      }
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-zinc-900 hover:bg-red-50/40 dark:hover:bg-red-950/10 transition-colors cursor-pointer text-left group"
                    >
                      {/* Expand chevron */}
                      <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        <ChevronRight className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                      </span>

                      {/* Block icon */}
                      <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/40">
                        <Building2 className="w-4 h-4" />
                      </span>

                      {/* Block name + admin info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{c.blockName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                              : c.status === 'Suspended'
                              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              c.status === 'Active' ? 'bg-emerald-500' : c.status === 'Suspended' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            {c.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{c.admin1Name}{c.admin1Mobile !== '—' ? ` · ${c.admin1Mobile}` : ''}
                          </span>
                          {/* Block-level donor count */}
                          <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
                            <Droplets className="w-3 h-3" />{c.donors} Donors
                          </span>
                          {/* Block-level volunteer count */}
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Users className="w-3 h-3" />{c.volunteers} Volunteers
                          </span>
                          {meghalaList.length > 0 && (
                            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 font-bold">
                              <MapPin className="w-3 h-3" />{meghalaList.length} Meghala{meghalaList.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {c.isAssigned ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(c.rawAdmin); }}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingAdminId(c.rawAdmin.id);
                                setDeletingAdminName(c.rawAdmin.primary_name || c.rawAdmin.name);
                              }}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBlockName(c.blockName);
                              setShowAddModal(true);
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Assign Admin
                          </button>
                        )}
                      </div>
                    </button>

                    {/* Meghala Children (expanded) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-zinc-800/60 bg-slate-50/60 dark:bg-zinc-950/60">
                        {meghalaList.length === 0 ? (
                          <div className="flex items-center gap-2 px-12 py-3 text-[11px] text-slate-400 dark:text-zinc-600 italic">
                            <MapPin className="w-3 h-3" /> No Meghala units registered under this block yet.
                          </div>
                        ) : (
                          <ul className="py-2">
                            {meghalaList.map((meghala, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-3 px-12 py-2 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-colors group/meghala"
                              >
                                {/* Tree connector lines */}
                                <span className="flex flex-col items-center self-stretch w-4 shrink-0">
                                  <span className="w-px flex-1 bg-slate-200 dark:bg-zinc-700" />
                                  {idx === meghalaList.length - 1 && <span className="w-4 h-px bg-slate-200 dark:bg-zinc-700" />}
                                </span>
                                <span className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-500 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-900/40">
                                  <MapPin className="w-3 h-3" />
                                </span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{meghala}</span>
                                {/* Meghala donor and volunteer stats */}
                                {(() => {
                                  const mStats = getMeghalaStats(meghala);
                                  return (
                                    <div className="ml-auto flex items-center gap-2">
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 rounded-full">
                                        <Droplets className="w-2.5 h-2.5" />{mStats.donors} Donors
                                      </span>
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full">
                                        <Users className="w-2.5 h-2.5" />{mStats.volunteers} Volunteers
                                      </span>
                                    </div>
                                  );
                                })()}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* Add Block Committee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 p-6 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border-slate-200 shadow-sm/20 rounded-xl flex items-center justify-center text-white font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-black tracking-tight">Add New Block Committee</h3>
                    <p className="text-red-100 text-[10px] font-medium">Register Block Admin account for {district} District</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {addMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${addMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}>
                  {addMsg.msg}
                </div>
              )}

              <form onSubmit={handleCreateBlockAdmin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Block Committee Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                      required
                      placeholder="e.g. Kozhikode North"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                    <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Contact Name *</label>
                    <input
                      type="text"
                      value={primaryContactName}
                      onChange={(e) => setPrimaryContactName(e.target.value)}
                      required
                      placeholder="e.g. Rahul V"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={primaryContactMobile}
                        onChange={(e) => setPrimaryContactMobile(e.target.value)}
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Contact Name *</label>
                    <input
                      type="text"
                      value={secondaryContactName}
                      onChange={(e) => setSecondaryContactName(e.target.value)}
                      required
                      placeholder="e.g. Anjali M"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={secondaryContactMobile}
                        onChange={(e) => setSecondaryContactMobile(e.target.value)}
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="kozhikode.north@idonate.org"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/60 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-2xl text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submittingAdd ? 'Creating...' : 'Create Committee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Committee Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="bg-red-600 p-6 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border-slate-200 shadow-sm/20 rounded-xl flex items-center justify-center text-white">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-black tracking-tight">Edit Block Committee Details</h3>
                    <p className="text-red-100 text-[10px] font-medium">Update Block Committee information & credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAdmin(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-2xl text-xs font-bold ${editMsg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  }`}>
                  {editMsg.msg}
                </div>
              )}

              <form onSubmit={handleSaveEditBlockAdmin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Block Committee Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editBlockName}
                      onChange={(e) => setEditBlockName(e.target.value)}
                      required
                      placeholder="e.g. Kozhikode North"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                    <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Contact Name *</label>
                    <input
                      type="text"
                      value={editFullName1}
                      onChange={(e) => setEditFullName1(e.target.value)}
                      required
                      placeholder="e.g. Rahul V"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={editMobile1}
                        onChange={(e) => setEditMobile1(e.target.value)}
                        required
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Contact Name</label>
                    <input
                      type="text"
                      value={editFullName2}
                      onChange={(e) => setEditFullName2(e.target.value)}
                      placeholder="e.g. Anjali M"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={editMobile2}
                        onChange={(e) => setEditMobile2(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                        placeholder="kozhikode.north@idonate.org"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
                      />
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-slate-900 dark:text-zinc-100 font-bold cursor-pointer"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Suspended">🔴 Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/60 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-2xl text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Created Confirmation Modal */}
      {credentialsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
          <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-xl overflow-hidden border dark:border-zinc-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">Block Committee Created!</h3>
              <p className="text-xs text-slate-500 mt-1">Credentials generated for Block: <strong>{credentialsModal.blockName}</strong></p>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl space-y-2 text-xs font-mono border border-slate-200 dark:border-zinc-800">
              <div><span className="text-slate-400">Email:</span> <strong>{credentialsModal.email}</strong></div>
              <div><span className="text-slate-400">Password:</span> <strong>{credentialsModal.password}</strong></div>
            </div>

            <button
              onClick={() => setCredentialsModal({ open: false, email: '', password: '', blockName: '' })}
              className="w-full py-3 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded-2xl text-xs cursor-pointer hover:opacity-90"
            >
              Done
            </button>
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
