import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  Mail,
  Phone,
  CheckCircle2,
  Download,
  ChevronRight,
  MapPin,
  LayoutList,
  GitBranch,
  Users,
  Droplets,
} from 'lucide-react';

import api from '../../store/api.js';
import { useAuthStore } from '../../store/authStore.js';
import DeleteConfirmModal from '../../components/DeleteConfirmModal.jsx';

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| This component does NOT calculate block/user/volunteer statistics.
|
| Backend is the single source of truth.
|
| Expected API:
|
| GET /super-admin/blocks
|
| {
|   success: true,
|   data: {
|     district: "Kasaragod",
|     blocks: [
|       {
|         id: "...",
|         name: "...",
|         district: "...",
|         donorCount: 10,
|         volunteerCount: 4,
|         meghalaCount: 2,
|         meghalas: [...],
|         admin: {...},
|         status: "Active"
|       }
|     ],
|     totals: {
|       blocks: 12,
|       donors: 100,
|       volunteers: 30,
|       active: 10,
|       unassigned: 2,
|       suspended: 0
|     }
|   }
| }
|
| DO NOT calculate these values from users on the frontend.
|--------------------------------------------------------------------------
*/

function parseBlockAdminContacts(admin = {}) {
  let admin1Name =
    admin.primaryContactName ||
    admin.primary_contact_name ||
    admin.primaryName ||
    admin.primary_name ||
    admin.name ||
    '';

  let admin2Name =
    admin.secondaryName ||
    admin.secondary_name ||
    '';

  let admin1Mobile =
    admin.mobile ||
    admin.primaryContactMobile ||
    admin.primary_contact_mobile ||
    '';

  let admin2Mobile =
    admin.secondaryContactNumber ||
    admin.secondary_contact_number ||
    '';

  if (admin2Mobile) {
    const match = String(admin2Mobile).match(/[\d+\-\s]{10,}/);

    if (match) {
      admin2Mobile = match[0].trim();
    } else {
      admin2Mobile = String(admin2Mobile)
        .replace(/Admin 2:\s*/gi, '')
        .replace(/[()]/g, '')
        .trim();
    }
  }

  return {
    admin1Name: admin1Name || 'N/A',
    admin1Mobile: admin1Mobile || 'N/A',
    admin2Name,
    admin2Mobile,
  };
}

function normalizeBlock(block) {
  if (!block || typeof block !== 'object') {
    return null;
  }

  const admin = block.admin || block.blockAdmin || null;

  const contacts = parseBlockAdminContacts(admin || {});

  const meghalas = Array.isArray(block.meghalas)
    ? block.meghalas
      .map((item) => {
        if (typeof item === 'string') return item.trim();

        return (
          item?.name ||
          item?.meghala ||
          item?.meghala_name ||
          ''
        ).trim();
      })
      .filter(Boolean)
    : [];

  return {
    id: block.id ?? block.block_id,

    blockName:
      block.name ||
      block.block_name ||
      block.blockName ||
      block.block_committee_name ||
      '',

    district:
      block.district ||
      '',

    admin,

    isAssigned:
      Boolean(
        block.isAssigned ??
        block.is_assigned ??
        admin
      ),

    admin1Name:
      block.admin1Name ??
      contacts.admin1Name,

    admin1Mobile:
      block.admin1Mobile ??
      contacts.admin1Mobile,

    admin2Name:
      block.admin2Name ??
      contacts.admin2Name,

    admin2Mobile:
      block.admin2Mobile ??
      contacts.admin2Mobile,

    email:
      block.email ||
      admin?.email ||
      '—',

    status:
      block.status ||
      admin?.status ||
      'Unassigned',

    meghalas,

    /*
     * These values MUST come from backend.
     */
    meghalaCount: Number(
      block.meghalaCount ??
      block.meghala_count ??
      meghalas.length
    ),

    donors: Number(
      block.donorCount ??
      block.donor_count ??
      block.donors ??
      0
    ),

    volunteers: Number(
      block.volunteerCount ??
      block.volunteer_count ??
      block.volunteers ??
      0
    ),
  };
}

export default function BlockCommitteeManagement() {
  const { user } = useAuthStore();

  const [blocks, setBlocks] = useState([]);
  const [totals, setTotals] = useState({
    blocks: 0,
    donors: 0,
    volunteers: 0,
    active: 0,
    unassigned: 0,
    suspended: 0,
  });

  const [district, setDistrict] = useState(
    user?.district || ''
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [viewMode, setViewMode] = useState('table');
  const [expandedBlocks, setExpandedBlocks] = useState({});

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);

  const [blockName, setBlockName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactMobile, setPrimaryContactMobile] = useState('');
  const [secondaryContactName, setSecondaryContactName] = useState('');
  const [secondaryContactMobile, setSecondaryContactMobile] = useState('');
  const [email, setEmail] = useState('');

  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addMsg, setAddMsg] = useState(null);

  // Edit modal
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

  // Delete
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [deletingAdminName, setDeletingAdminName] = useState('');

  // Credentials
  const [credentialsModal, setCredentialsModal] = useState({
    open: false,
    email: '',
    password: '',
    blockName: '',
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD REAL BLOCK DATA
  |--------------------------------------------------------------------------
  */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/super-admin/blocks', {
        params: {
          district: user?.district || undefined,
        },
      });

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message ||
          'Failed to load block data'
        );
      }

      const payload =
        response.data.data ||
        response.data;

      const rawBlocks =
        Array.isArray(payload.blocks)
          ? payload.blocks
          : [];

      const normalizedBlocks =
        rawBlocks
          .map(normalizeBlock)
          .filter(Boolean);

      setBlocks(normalizedBlocks);

      /*
       * IMPORTANT:
       * Totals come from backend.
       * Do not calculate totals from frontend records.
       */

      const serverTotals =
        payload.totals || {};

      setTotals({
        blocks: Number(
          serverTotals.blocks ??
          payload.total_blocks ??
          normalizedBlocks.length
        ),

        donors: Number(
          serverTotals.donors ??
          payload.total_donors ??
          0
        ),

        volunteers: Number(
          serverTotals.volunteers ??
          payload.total_volunteers ??
          0
        ),

        active: Number(
          serverTotals.active ??
          payload.active ??
          0
        ),

        unassigned: Number(
          serverTotals.unassigned ??
          payload.unassigned ??
          0
        ),

        suspended: Number(
          serverTotals.suspended ??
          payload.suspended ??
          0
        ),
      });

      if (payload.district) {
        setDistrict(payload.district);
      }
    } catch (err) {
      console.error(
        'Failed to load Super Admin blocks:',
        err
      );

      setBlocks([]);

      setTotals({
        blocks: 0,
        donors: 0,
        volunteers: 0,
        active: 0,
        unassigned: 0,
        suspended: 0,
      });

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load block data from server.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.district]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /*
  |--------------------------------------------------------------------------
  | CREATE BLOCK ADMIN
  |--------------------------------------------------------------------------
  */

  const handleCreateBlockAdmin = async (e) => {
    e.preventDefault();

    setSubmittingAdd(true);
    setAddMsg(null);

    try {
      const response = await api.post(
        '/super-admin/block-admins',
        {
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
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Block Committee creation failed'
        );
      }

      const generatedPassword =
        response.data?.data?.generated_password ||
        'Auto-generated';

      setCredentialsModal({
        open: true,
        email,
        password: generatedPassword,
        blockName,
      });

      setBlockName('');
      setPrimaryContactName('');
      setPrimaryContactMobile('');
      setSecondaryContactName('');
      setSecondaryContactMobile('');
      setEmail('');

      setShowAddModal(false);

      /*
       * Refetch real database state.
       */
      await loadData();
    } catch (err) {
      console.error(
        'Create block admin failed:',
        err
      );

      setAddMsg({
        type: 'error',
        msg:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to create Block Committee.',
      });
    } finally {
      setSubmittingAdd(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleOpenEdit = (block) => {
    if (!block?.admin) return;

    const admin = block.admin;

    const contacts =
      parseBlockAdminContacts(admin);

    setEditingAdmin(admin);

    setEditBlockName(
      block.blockName ||
      admin.blockCommitteeName ||
      admin.block_name ||
      ''
    );

    setEditEmail(
      admin.email ||
      block.email ||
      ''
    );

    setEditPassword('');

    setEditStatus(
      admin.status ||
      block.status ||
      'Active'
    );

    setEditFullName1(
      contacts.admin1Name === 'N/A'
        ? ''
        : contacts.admin1Name
    );

    setEditMobile1(
      contacts.admin1Mobile === 'N/A'
        ? ''
        : contacts.admin1Mobile
    );

    setEditFullName2(
      contacts.admin2Name || ''
    );

    setEditMobile2(
      contacts.admin2Mobile || ''
    );

    setEditMsg(null);
  };

  const handleSaveEditBlockAdmin = async (e) => {
    e.preventDefault();

    if (!editingAdmin) return;

    setSubmittingEdit(true);
    setEditMsg(null);

    try {
      const response = await api.put(
        `/super-admin/block-admins/${editingAdmin.id}`,
        {
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
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Update failed'
        );
      }

      setEditingAdmin(null);

      /*
       * Never manually update statistics.
       * Fetch fresh DB values.
       */
      await loadData();
    } catch (err) {
      console.error(
        'Update block admin failed:',
        err
      );

      setEditMsg({
        type: 'error',
        msg:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to update Block Committee.',
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleConfirmDelete = async () => {
    if (!deletingAdminId) return;

    try {
      const response = await api.delete(
        `/super-admin/block-admins/${deletingAdminId}`
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          'Delete failed'
        );
      }

      setDeletingAdminId(null);
      setDeletingAdminName('');

      /*
       * Fresh backend state.
       */
      await loadData();
    } catch (err) {
      console.error(
        'Delete block admin failed:',
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete Block Committee.'
      );

      setDeletingAdminId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH / FILTER
  |--------------------------------------------------------------------------
  */

  const filteredCommittees = useMemo(() => {
    const query =
      searchQuery
        .toLowerCase()
        .trim();

    return blocks.filter((block) => {
      const matchesSearch =
        !query ||
        block.blockName
          .toLowerCase()
          .includes(query) ||

        block.admin1Name
          .toLowerCase()
          .includes(query) ||

        String(block.admin1Mobile)
          .toLowerCase()
          .includes(query) ||

        block.email
          .toLowerCase()
          .includes(query) ||

        block.meghalas.some((m) =>
          String(m)
            .toLowerCase()
            .includes(query)
        );

      const matchesStatus =
        statusFilter === 'all' ||
        (
          statusFilter === 'Unassigned'
            ? !block.isAssigned
            : block.status === statusFilter
        );

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    blocks,
    searchQuery,
    statusFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CSV
  |--------------------------------------------------------------------------
  */

  const exportCSV = () => {
    const headers = [
      'Block Name',
      'Meghalas Count',
      'Admin Name',
      'Email',
      'Primary Contact',
      'Secondary Contact',
      'Donors',
      'Volunteers',
      'Status',
    ];

    const rows =
      filteredCommittees.map((block) => [
        block.blockName,
        block.meghalaCount,
        block.admin1Name,
        block.email,
        block.admin1Mobile,
        block.admin2Mobile,
        block.donors,
        block.volunteers,
        block.status,
      ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? '')
                .replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n');

    const blob =
      new Blob(
        [csv],
        { type: 'text/csv;charset=utf-8;' }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download =
      `block_committees_${new Date()
        .toISOString()
        .split('T')[0]}.csv`;

    document.body.appendChild(anchor);

    anchor.click();

    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  /*
  |--------------------------------------------------------------------------
  | UI COUNTS
  |--------------------------------------------------------------------------
  |
  | These values are backend totals.
  |
  */

  const totalBlocks =
    totals.blocks;

  const totalDonors =
    totals.donors;

  const totalVolunteers =
    totals.volunteers;

  const activeCount =
    totals.active;

  const unassignedCount =
    totals.unassigned;

  const suspendedCount =
    totals.suspended;

  const cleanDistrict =
    String(
      district || user?.district || ''
    )
      .replace(/^dyfi\s*/i, '')
      .trim();

  const displayDistrict =
    cleanDistrict
      ? `DYFI ${cleanDistrict}`
      : 'DYFI';

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 select-none">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border dark:border-zinc-800/80 p-6 rounded-3xl">

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-full text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">

            <Building2 className="w-4 h-4" />

            {displayDistrict}
            {' '}
            Block Committees

          </div>

          <h1 className="text-2xl font-black text-red-600 uppercase tracking-tight">
            Block Committee Management
          </h1>

          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Register, configure, and oversee Block Committees across{' '}
            {displayDistrict} District
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* VIEW */}

          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">

            <button
              onClick={() =>
                setViewMode('table')
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400'
                }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Table
            </button>

            <button
              onClick={() =>
                setViewMode('tree')
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'tree'
                  ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400'
                }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Tree
            </button>

          </div>

          <button
            onClick={() => {
              setBlockName('');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Block Committee
          </button>

          <button
            onClick={exportCSV}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading
                  ? 'animate-spin'
                  : ''
                }`}
            />
            Refresh
          </button>

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-center justify-between gap-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-2xl px-4 py-3 text-xs font-bold">

          <span>{error}</span>

          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-red-600 text-white rounded-xl"
          >
            Retry
          </button>

        </div>
      )}

      {/* KPI */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <KpiCard
          title="Block Committees"
          value={totalBlocks}
          icon={
            <Building2 className="w-4 h-4" />
          }
          subtitle={`${activeCount} Active`}
        />

        <KpiCard
          title="Total Volunteers"
          value={totalVolunteers}
          icon={
            <Users className="w-4 h-4" />
          }
          subtitle={`Across ${totalBlocks} Blocks`}
        />

        <KpiCard
          title="Block Donors"
          value={totalDonors}
          icon={
            <Droplets className="w-4 h-4" />
          }
          subtitle="Database total"
        />

        <KpiCard
          title="Admin Status"
          value={`${activeCount} Active`}
          icon={
            <CheckCircle2 className="w-4 h-4" />
          }
          subtitle={`${unassignedCount} Unassigned`}
        />

      </div>

      {/* MAIN */}

      <div className="bg-white border-slate-200 shadow-sm dark:bg-zinc-900 border dark:border-zinc-800/80 rounded-3xl p-6 space-y-6">

        {/* FILTER */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/60 pb-4">

          <div className="flex items-center gap-2 flex-wrap">

            <FilterButton
              active={statusFilter === 'all'}
              onClick={() =>
                setStatusFilter('all')
              }
              label={`All (${totalBlocks})`}
            />

            <FilterButton
              active={statusFilter === 'Active'}
              onClick={() =>
                setStatusFilter('Active')
              }
              label={`Active (${activeCount})`}
            />

            <FilterButton
              active={statusFilter === 'Unassigned'}
              onClick={() =>
                setStatusFilter('Unassigned')
              }
              label={`Unassigned (${unassignedCount})`}
            />

            {suspendedCount > 0 && (
              <FilterButton
                active={
                  statusFilter === 'Suspended'
                }
                onClick={() =>
                  setStatusFilter('Suspended')
                }
                label={`Suspended (${suspendedCount})`}
              />
            )}

          </div>

          <div className="relative w-full sm:w-72">

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search by block, meghala, admin..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-900 dark:text-zinc-100 pr-9"
            />

            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <LoadingState />
        ) : viewMode === 'table' ? (

          <BlockTable
            blocks={filteredCommittees}
            district={cleanDistrict}
            onEdit={handleOpenEdit}
            onDelete={(block) => {
              setDeletingAdminId(
                block.admin?.id
              );

              setDeletingAdminName(
                block.admin?.primary_name ||
                block.admin?.name ||
                block.admin1Name
              );
            }}
            onAssign={(block) => {
              setBlockName(block.blockName);
              setShowAddModal(true);
            }}
          />

        ) : (

          <BlockTree
            blocks={filteredCommittees}
            expandedBlocks={expandedBlocks}
            setExpandedBlocks={setExpandedBlocks}
            onEdit={handleOpenEdit}
            onDelete={(block) => {
              setDeletingAdminId(
                block.admin?.id
              );

              setDeletingAdminName(
                block.admin?.primary_name ||
                block.admin?.name ||
                block.admin1Name
              );
            }}
            onAssign={(block) => {
              setBlockName(block.blockName);
              setShowAddModal(true);
            }}
          />

        )}

      </div>

      {/* ADD MODAL */}

      {showAddModal && (
        <AddBlockModal
          district={district}
          blockName={blockName}
          setBlockName={setBlockName}
          primaryContactName={primaryContactName}
          setPrimaryContactName={setPrimaryContactName}
          primaryContactMobile={primaryContactMobile}
          setPrimaryContactMobile={setPrimaryContactMobile}
          secondaryContactName={secondaryContactName}
          setSecondaryContactName={setSecondaryContactName}
          secondaryContactMobile={secondaryContactMobile}
          setSecondaryContactMobile={setSecondaryContactMobile}
          email={email}
          setEmail={setEmail}
          submitting={submittingAdd}
          message={addMsg}
          onClose={() =>
            setShowAddModal(false)
          }
          onSubmit={handleCreateBlockAdmin}
        />
      )}

      {/* EDIT MODAL */}

      {editingAdmin && (
        <EditBlockModal
          blockName={editBlockName}
          setBlockName={setEditBlockName}
          name1={editFullName1}
          setName1={setEditFullName1}
          mobile1={editMobile1}
          setMobile1={setEditMobile1}
          name2={editFullName2}
          setName2={setEditFullName2}
          mobile2={editMobile2}
          setMobile2={setEditMobile2}
          email={editEmail}
          setEmail={setEditEmail}
          password={editPassword}
          setPassword={setEditPassword}
          status={editStatus}
          setStatus={setEditStatus}
          submitting={submittingEdit}
          message={editMsg}
          onClose={() =>
            setEditingAdmin(null)
          }
          onSubmit={handleSaveEditBlockAdmin}
        />
      )}

      {/* CREDENTIALS */}

      {credentialsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 space-y-4">

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">

              <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                Block Committee Created!
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Credentials generated for Block:{' '}
                <strong>
                  {credentialsModal.blockName}
                </strong>
              </p>

            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl space-y-2 text-xs font-mono border border-slate-200 dark:border-zinc-800">

              <div>
                <span className="text-slate-400">
                  Email:
                </span>{' '}
                <strong>
                  {credentialsModal.email}
                </strong>
              </div>

              <div>
                <span className="text-slate-400">
                  Password:
                </span>{' '}
                <strong>
                  {credentialsModal.password}
                </strong>
              </div>

            </div>

            <button
              onClick={() =>
                setCredentialsModal({
                  open: false,
                  email: '',
                  password: '',
                  blockName: '',
                })
              }
              className="w-full py-3 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded-2xl text-xs"
            >
              Done
            </button>

          </div>

        </div>
      )}

      {/* DELETE */}

      <DeleteConfirmModal
        isOpen={!!deletingAdminId}
        onClose={() =>
          setDeletingAdminId(null)
        }
        onConfirm={handleConfirmDelete}
        title={`Delete Block Admin (${deletingAdminName})?`}
        message="Are you sure you want to delete this Block Committee Admin? They will lose access to district management."
      />

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| KPI CARD
|--------------------------------------------------------------------------
*/

function KpiCard({
  title,
  value,
  icon,
  subtitle,
}) {
  return (
    <div className="bg-white border-slate-200 shadow-xs dark:bg-zinc-900 border p-4 rounded-2xl">

      <div className="flex items-center justify-between">

        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          {title}
        </span>

        <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center">
          {icon}
        </div>

      </div>

      <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">
        {value}
      </h3>

      <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
        {subtitle}
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| FILTER BUTTON
|--------------------------------------------------------------------------
*/

function FilterButton({
  active,
  onClick,
  label,
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${active
          ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
        }`}
    >
      {label}
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| LOADING
|--------------------------------------------------------------------------
*/

function LoadingState() {
  return (
    <div className="space-y-3">

      {[1, 2, 3, 4, 5].map(
        (item) => (
          <div
            key={item}
            className="h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse"
          />
        )
      )}

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TABLE
|--------------------------------------------------------------------------
*/

function BlockTable({
  blocks,
  district,
  onEdit,
  onDelete,
  onAssign,
}) {
  if (!blocks.length) {
    return (
      <EmptyState />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800/80">

      <table className="w-full text-left text-xs border-collapse">

        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[11px]">

            <th className="py-3.5 px-4">
              Block Committee
            </th>

            <th className="py-3.5 px-4">
              Meghala Units
            </th>

            <th className="py-3.5 px-4">
              Primary Contact
            </th>

            <th className="py-3.5 px-4">
              Secondary Contact
            </th>

            <th className="py-3.5 px-4">
              Email
            </th>

            <th className="py-3.5 px-4 text-center">
              Donors
            </th>

            <th className="py-3.5 px-4 text-center">
              Volunteers
            </th>

            <th className="py-3.5 px-4 text-center">
              Status
            </th>

            <th className="py-3.5 px-4 text-right">
              Actions
            </th>

          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">

          {blocks.map((block) => (
            <tr
              key={block.id}
              className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50"
            >

              <td className="py-3.5 px-4">

                <div className="flex items-center gap-2.5">

                  <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </span>

                  <div>

                    <div className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">
                      {block.blockName}
                    </div>

                    <div className="text-[10px] text-slate-400">
                      {district} District
                    </div>

                  </div>

                </div>

              </td>

              <td className="py-3.5 px-4">

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300">

                  <MapPin className="w-3 h-3" />

                  {block.meghalaCount}
                  {' '}
                  Meghala
                  {block.meghalaCount !== 1 ? 's' : ''}

                </span>

                {block.meghalas.length > 0 && (
                  <div
                    className="text-[10px] text-slate-400 max-w-[180px] truncate mt-1"
                    title={block.meghalas.join(', ')}
                  >
                    {block.meghalas.slice(0, 3).join(', ')}
                    {block.meghalas.length > 3
                      ? ` +${block.meghalas.length - 3}`
                      : ''}
                  </div>
                )}

              </td>

              <td className="py-3.5 px-4">

                <div className="font-bold text-slate-900 dark:text-zinc-100">
                  {block.admin1Name}
                </div>

                {block.admin1Mobile !== '—' && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {block.admin1Mobile}
                  </div>
                )}

              </td>

              <td className="py-3.5 px-4">

                {block.admin2Name ||
                  block.admin2Mobile ? (
                  <>
                    <div className="font-bold">
                      {block.admin2Name || 'Admin 2'}
                    </div>

                    {block.admin2Mobile && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {block.admin2Mobile}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 italic">
                    Not set
                  </span>
                )}

              </td>

              <td className="py-3.5 px-4">

                {block.email !== '—' ? (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {block.email}
                  </div>
                ) : (
                  '—'
                )}

              </td>

              <td className="py-3.5 px-4 text-center">

                <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">

                  <Droplets className="w-3 h-3" />

                  {block.donors}

                </span>

              </td>

              <td className="py-3.5 px-4 text-center">

                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">

                  <Users className="w-3 h-3" />

                  {block.volunteers}

                </span>

              </td>

              <td className="py-3.5 px-4 text-center">

                <StatusBadge
                  status={block.status}
                />

              </td>

              <td className="py-3.5 px-4 text-right">

                {block.isAssigned ? (

                  <div className="flex justify-end gap-2">

                    <button
                      onClick={() =>
                        onEdit(block)
                      }
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        onDelete(block)
                      }
                      className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-xl flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>

                  </div>

                ) : (

                  <button
                    onClick={() =>
                      onAssign(block)
                    }
                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-xl flex items-center gap-1 ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign Admin
                  </button>

                )}

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
  const styles =
    status === 'Active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'Suspended'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| EMPTY
|--------------------------------------------------------------------------
*/

function EmptyState() {
  return (
    <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-slate-400 text-xs">

      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />

      No Block Committees found.

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TREE
|--------------------------------------------------------------------------
*/

function BlockTree({
  blocks,
  expandedBlocks,
  setExpandedBlocks,
  onEdit,
  onDelete,
  onAssign,
}) {
  if (!blocks.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">

      {blocks.map((block) => {
        const expanded =
          Boolean(
            expandedBlocks[block.id]
          );

        return (
          <div
            key={block.id}
            className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
          >

            <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-zinc-900">

              <button
                onClick={() =>
                  setExpandedBlocks(
                    (previous) => ({
                      ...previous,
                      [block.id]:
                        !previous[block.id],
                    })
                  )
                }
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center"
              >
                <ChevronRight
                  className="w-3 h-3 transition-transform"
                  style={{
                    transform:
                      expanded
                        ? 'rotate(90deg)'
                        : 'rotate(0deg)',
                  }}
                />
              </button>

              <Building2 className="w-5 h-5 text-red-600" />

              <div className="flex-1">

                <div className="font-extrabold text-sm">
                  {block.blockName}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">

                  <span>
                    {block.donors} Donors
                  </span>

                  <span>
                    {block.volunteers} Volunteers
                  </span>

                  <span>
                    {block.meghalaCount} Meghalas
                  </span>

                </div>

              </div>

              <StatusBadge
                status={block.status}
              />

              {block.isAssigned ? (
                <>
                  <button
                    onClick={() =>
                      onEdit(block)
                    }
                    className="px-2.5 py-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 rounded-xl"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      onDelete(block)
                    }
                    className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 rounded-xl"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    onAssign(block)
                  }
                  className="px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 rounded-xl"
                >
                  Assign
                </button>
              )}

            </div>

            {expanded && (
              <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60">

                {block.meghalas.length === 0 ? (

                  <div className="px-12 py-4 text-xs text-slate-400 italic">
                    No Meghala units registered under this block.
                  </div>

                ) : (

                  <div className="py-2">

                    {block.meghalas.map(
                      (meghala) => (
                        <div
                          key={`${block.id}-${meghala}`}
                          className="flex items-center gap-3 px-12 py-2"
                        >

                          <MapPin className="w-3 h-3 text-violet-500" />

                          <span className="text-xs font-semibold">
                            {meghala}
                          </span>

                        </div>
                      )
                    )}

                  </div>

                )}

              </div>
            )}

          </div>
        );
      })}

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ADD MODAL
|--------------------------------------------------------------------------
*/

function AddBlockModal({
  district,
  blockName,
  setBlockName,
  primaryContactName,
  setPrimaryContactName,
  primaryContactMobile,
  setPrimaryContactMobile,
  secondaryContactName,
  setSecondaryContactName,
  secondaryContactMobile,
  setSecondaryContactMobile,
  email,
  setEmail,
  submitting,
  message,
  onClose,
  onSubmit,
}) {
  return (
    <Modal title="Add New Block Committee" onClose={onClose}>

      {message && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {message.msg}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-4 text-xs"
      >

        <Input
          label="Block Committee Name"
          value={blockName}
          onChange={setBlockName}
          required
        />

        <div className="grid grid-cols-2 gap-3">

          <Input
            label="Primary Contact Name"
            value={primaryContactName}
            onChange={setPrimaryContactName}
            required
          />

          <Input
            label="Primary Phone Number"
            value={primaryContactMobile}
            onChange={setPrimaryContactMobile}
            required
          />

        </div>

        <div className="grid grid-cols-2 gap-3">

          <Input
            label="Secondary Contact Name"
            value={secondaryContactName}
            onChange={setSecondaryContactName}
            required
          />

          <Input
            label="Secondary Phone Number"
            value={secondaryContactMobile}
            onChange={setSecondaryContactMobile}
            required
          />

        </div>

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />

        <div className="flex gap-3 pt-4">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl disabled:opacity-50"
          >
            {submitting
              ? 'Creating...'
              : 'Create Committee'}
          </button>

        </div>

      </form>

    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| EDIT MODAL
|--------------------------------------------------------------------------
*/

function EditBlockModal({
  blockName,
  setBlockName,
  name1,
  setName1,
  mobile1,
  setMobile1,
  name2,
  setName2,
  mobile2,
  setMobile2,
  email,
  setEmail,
  password,
  setPassword,
  status,
  setStatus,
  submitting,
  message,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      title="Edit Block Committee"
      onClose={onClose}
    >

      {message && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {message.msg}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-4 text-xs"
      >

        <Input
          label="Block Committee Name"
          value={blockName}
          onChange={setBlockName}
          required
        />

        <div className="grid grid-cols-2 gap-3">

          <Input
            label="Primary Contact Name"
            value={name1}
            onChange={setName1}
            required
          />

          <Input
            label="Primary Phone"
            value={mobile1}
            onChange={setMobile1}
            required
          />

        </div>

        <div className="grid grid-cols-2 gap-3">

          <Input
            label="Secondary Contact Name"
            value={name2}
            onChange={setName2}
          />

          <Input
            label="Secondary Phone"
            value={mobile2}
            onChange={setMobile2}
          />

        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />

        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={setPassword}
        />

        <div>

          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Account Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 font-bold"
          >
            <option value="Active">
              Active
            </option>

            <option value="Suspended">
              Suspended
            </option>
          </select>

        </div>

        <div className="flex gap-3 pt-4">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-2xl font-bold"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl disabled:opacity-50"
          >
            {submitting
              ? 'Saving...'
              : 'Save Changes'}
          </button>

        </div>

      </form>

    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| GENERIC MODAL
|--------------------------------------------------------------------------
*/

function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">

        <div className="bg-red-600 p-6 flex items-center justify-between">

          <h3 className="text-white text-lg font-black">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        <div className="p-6 space-y-4">
          {children}
        </div>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}) {
  return (
    <div>

      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
        {label}
        {required ? ' *' : ''}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={required}
        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-zinc-100 font-semibold"
      />

    </div>
  );
}