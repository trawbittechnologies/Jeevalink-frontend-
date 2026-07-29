import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Eye, ShieldCheck, Mail, Save, X, Loader2, KeyRound, Phone, MapPin, Lock, Trash2, Upload, Droplet, Sparkles, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import AdminTable from '../../components/admin/AdminTable.jsx';
import FilterBar from '../../components/admin/FilterBar.jsx';
import ConfirmModal from '../../components/admin/ConfirmModal.jsx';
import { getStorageUrl } from '../../store/api.js';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended', 'Pending Approval'];
const ROLES = ['donor', 'member', 'user', 'patient', 'hospital'];

const getEighteenYearsAgoDate = () => {
  const today = new Date();
  const year = today.getFullYear() - 18;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StatusBadge = ({ status, isVerified }) => {
  const isPending = !isVerified && (status || '').toLowerCase() !== 'active';

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200/90 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Pending Verification
      </span>
    );
  }

  const map = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-slate-100 text-slate-600 border-slate-300',
    inactive: 'bg-slate-100 text-slate-600 border-slate-300',
    Suspended: 'bg-red-50 text-red-700 border-red-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs ${map[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {status === 'Active' || status === 'active' ? 'Active & Verified' : status}
    </span>
  );
};

export default function UserManagement() {
  const { allUsers, fetchUsers, volunteerSendOtp, volunteerVerifyOtp, volunteerUpdateUser, volunteerAddUser, volunteerVerifyUser, volunteerRejectUser, deleteUser, triggerToast } = useAppStore();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', role: 'all' });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'verified'
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });
  const [rejectingUserId, setRejectingUserId] = useState(null);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifyingUserId, setVerifyingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleVerifyUser = async (userToVerify) => {
    const userId = userToVerify._id || userToVerify.id;
    setVerifyingUserId(userId);
    const res = await volunteerVerifyUser(userId);
    if (res.success) {
      triggerToast(`User verified & accepted successfully! Password sent directly to ${userToVerify.email}`, 'success');
      if (selectedUser && (selectedUser._id === userId || selectedUser.id === userId)) {
        setSelectedUser({ ...selectedUser, status: 'Active', is_verified: true });
      }
      fetchUsers();
    }
    setVerifyingUserId(null);
  };

  const users = allUsers.filter(u => !['admin', 'volunteer', 'super_admin', 'technical_admin', 'unit_squad'].includes((u.role || '').toLowerCase()));

  const pendingUsers = users.filter(u => !u.is_verified && !u.isVerified && (u.status || '').toLowerCase() !== 'active');
  const verifiedUsers = users.filter(u => u.is_verified || u.isVerified || (u.status || '').toLowerCase() === 'active');
  const pendingCount = pendingUsers.length;
  const verifiedCount = verifiedUsers.length;

  const filtered = users.filter(v => {
    const isUserVerified = Boolean(v.is_verified || v.isVerified || (v.status || '').toLowerCase() === 'active');
    
    if (activeTab === 'pending' && isUserVerified) return false;
    if (activeTab === 'verified' && !isUserVerified) return false;

    const q = search.toLowerCase();
    const matchSearch = !q || [v.fullName, v.name, v.email, v.mobile, v.city, v.district].some(f => String(f || '').toLowerCase().includes(q));
    const matchStatus = filters.status === 'all' || (v.status || '').toLowerCase() === filters.status.toLowerCase();
    const matchRole = filters.role === 'all' || (v.role || '').toLowerCase() === filters.role.toLowerCase();
    return matchSearch && matchStatus && matchRole;
  });

  const handleSendOtp = async () => {
    if (!selectedUser) return;
    setLoading(true);
    const userId = selectedUser._id || selectedUser.id;
    const res = await volunteerSendOtp(userId);
    if (res.success) {
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      triggerToast('Please enter a valid 6-digit OTP', 'warning');
      return;
    }
    setLoading(true);
    const userId = selectedUser._id || selectedUser.id;
    const res = await volunteerVerifyOtp(userId, otpCode);
    if (res.success) {
      setOtpVerified(true);
      // Pre-fill form
      setForm({
        full_name: selectedUser.fullName || selectedUser.name || '',
        email: selectedUser.email || '',
        mobile: selectedUser.mobile || '',
        blood_group: selectedUser.bloodGroup || selectedUser.blood_group || 'N/A',
        district: selectedUser.district || '',
        city: selectedUser.city || '',
        profile_picture: selectedUser.profilePicture || selectedUser.profile_picture || null,
      });
    }
    setLoading(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const userId = selectedUser._id || selectedUser.id;
    const res = await volunteerUpdateUser(userId, form);
    if (res.success) {
      setShowEditModal(false);
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
    }
    setLoading(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.profile_picture) {
      triggerToast('Profile picture / image is required. Please upload an image file.', 'warning');
      return;
    }
    if (!form.blood_group || form.blood_group === 'N/A') {
      triggerToast('Blood group selection is required.', 'warning');
      return;
    }
    if (!form.sex) {
      triggerToast('Gender / Sex selection is required.', 'warning');
      return;
    }
    if (!form.dob) {
      triggerToast('Date of birth is required.', 'warning');
      return;
    }
    const maxDob = getEighteenYearsAgoDate();
    if (form.dob > maxDob) {
      triggerToast('User must be at least 18 years old (DOB compare to current year and month).', 'warning');
      return;
    }
    if (!form.full_name?.trim()) {
      triggerToast('Full name is required.', 'warning');
      return;
    }
    if (!form.mobile?.trim()) {
      triggerToast('Mobile number is required.', 'warning');
      return;
    }
    if (!form.email?.trim()) {
      triggerToast('Email address is required.', 'warning');
      return;
    }
    if (!form.place?.trim() && !form.city?.trim()) {
      triggerToast('Place / City is required.', 'warning');
      return;
    }
    if (!form.pincode?.trim() || form.pincode.trim().length !== 6) {
      triggerToast('Valid 6-digit PIN code is required.', 'warning');
      return;
    }

    setLoading(true);

    const autoDistrict = currentUser?.district || 'Kozhikode';
    const placeVal = form.place || form.city || '';

    const fd = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== undefined) {
        fd.append(key, form[key]);
      }
    });

    fd.set('district', autoDistrict);
    fd.set('place', placeVal);
    fd.set('city', placeVal);

    const res = await volunteerAddUser(fd);
    if (res.success) {
      setShowAddModal(false);
      setForm({});
    }
    setLoading(false);
  };

  const columns = [
    {
      key: 'fullName', label: 'Name', sortable: true, render: (val, row) => {
        const displayName = val || row.name || 'User';
        const pic = row.profilePicture || row.profile_picture;
        return (
          <div className="flex items-center gap-3">
            <img
              src={getStorageUrl(pic) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`}
              alt={displayName}
              onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`; }}
              className="w-8 h-8 rounded-full object-cover border border-slate-100"
            />
            <div>
              <p className="text-slate-900 text-xs font-semibold">{displayName}</p>
              <p className="text-slate-600 text-[10px]">{row.email}</p>
            </div>
          </div>
        );
      }
    },
    { key: 'mobile', label: 'Phone', render: (val) => <span className="text-slate-500 text-xs font-mono">{val || '—'}</span> },
    {
      key: 'role', label: 'Role', render: (val) => (
        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-full capitalize">{val || 'User'}</span>
      )
    },
    { key: 'district', label: 'Location', render: (val, row) => <span className="text-slate-500 text-[10px]">{row.city ? `${row.city}, ` : ''}{val}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (val) => <StatusBadge status={val} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-slate-900 text-xl font-black tracking-tight">User Management (Meghala Scope)</h1>
            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200">
              {users.length} Registered
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Register new members/donors, view profiles, and perform secure OTP-verified updates.
          </p>
        </div>

        <button
          onClick={() => {
            const autoDistrict = currentUser?.district || 'Kozhikode';
            setForm({
              role: 'donor',
              blood_group: 'A+',
              sex: 'male',
              dob: '',
              full_name: '',
              mobile: '',
              email: '',
              place: currentUser?.city || '',
              city: currentUser?.city || '',
              pincode: '',
              district: autoDistrict,
              profile_picture: null,
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-red-600/20"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Top Summary Cards Bar for Quick Separation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Registered Members */}
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
              Total Members
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'all' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight">{users.length}</span>
            <span className={`text-xs font-bold ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>Registered</span>
          </div>
        </button>

        {/* Pending Verification Card */}
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-500/20'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-amber-300 shadow-xs'
          }`}
        >
          {pendingCount > 0 && (
            <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          )}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider ${activeTab === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
              Pending Verification
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 border border-amber-200/60'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${activeTab === 'pending' ? 'text-white' : 'text-amber-900'}`}>
              {pendingCount}
            </span>
            <span className={`text-xs font-bold ${activeTab === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
              Awaiting Action
            </span>
          </div>
        </button>

        {/* Verified Active Users Card */}
        <button
          type="button"
          onClick={() => setActiveTab('verified')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'verified'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-600/20'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-wider ${activeTab === 'verified' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              Verified Active Users
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'verified' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${activeTab === 'verified' ? 'text-white' : 'text-emerald-900'}`}>
              {verifiedCount}
            </span>
            <span className={`text-xs font-bold ${activeTab === 'verified' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              Verified & Active
            </span>
          </div>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Categorized Filter Tabs Bar */}
        <div className="flex items-center gap-2 p-3 bg-slate-50/80 border-b border-slate-200/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            All Members ({users.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs border border-amber-500'
                : 'bg-amber-50/60 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            Pending Verification ({pendingCount})
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'verified'
                ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600'
                : 'bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified Users ({verifiedCount})
          </button>
        </div>

        {/* Pending Verification Banner Alert */}
        {activeTab === 'pending' && (
          <div className="bg-amber-50 border-b border-amber-200/90 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs font-bold animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-extrabold text-amber-900">Pending Verification Action Required</p>
                <p className="text-[11px] text-amber-700 font-medium">
                  Review member profiles below and click <span className="font-bold text-emerald-700">"Verify & Accept"</span> to activate accounts and email login passwords.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-300 shrink-0">
              {pendingCount} Pending Approval
            </span>
          </div>
        )}

        {/* Filter Toolbar */}
        <FilterBar
          search={search} onSearch={setSearch}
          searchPlaceholder="Search by name, email, phone, city..."
          filters={[
            { key: 'status', label: 'Status', options: STATUS_OPTIONS.map(s => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) })) },
            { key: 'role', label: 'Role', options: ROLES.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })) },
          ]}
          filterValues={filters}
          onFilterChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
          onReset={() => { setSearch(''); setFilters({ status: 'all', role: 'all' }); }}
        />

        {/* Minimal Modern Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-slate-700 font-bold text-sm">No Users Found</p>
              <p className="text-slate-400 text-xs mt-1">Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">User & Profile</th>
                  <th className="py-4 px-6">Blood Group</th>
                  <th className="py-4 px-6">Mobile Contact</th>
                  <th className="py-4 px-6">User Role</th>
                  <th className="py-4 px-6">District / City</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((u) => {
                  const displayName = u.fullName || u.name || 'User';
                  const pic = u.profilePicture || u.profile_picture;

                  return (
                    <motion.tr
                      key={u._id || u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-red-50/20 transition"
                    >
                      {/* Avatar & Name */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={getStorageUrl(pic) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`}
                            alt={displayName}
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`; }}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <p className="text-slate-900 text-xs font-bold">{displayName}</p>
                            <p className="text-slate-500 text-[11px] font-mono mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Creative Blood Group Pill */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200/80 shadow-2xs">
                          <Droplet className="w-3.5 h-3.5 text-red-600 fill-red-600 animate-pulse" />
                          {u.bloodGroup || u.blood_group || 'N/A'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 font-mono font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.mobile || '—'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wider">
                          {u.role || 'User'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.city ? `${u.city}, ` : ''}{u.district || '—'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <StatusBadge status={u.status || 'Active'} isVerified={u.is_verified || u.isVerified} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        {/* Verify & Accept User Button (Only for Meghala Volunteer / Admin, NOT Unit Squad) */}
                        {(currentUser?.role || '').toLowerCase() !== 'unit_squad' && (u.status !== 'Active' && u.status !== 'active') && (
                          <button
                            onClick={() => handleVerifyUser(u)}
                            disabled={verifyingUserId === (u._id || u.id)}
                            className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs shadow-2xs"
                            title="Verify & Accept User (Password sent directly to email)"
                          >
                            {verifyingUserId === (u._id || u.id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            Verify & Accept
                          </button>
                        )}

                        {/* Reject Button (Only for Meghala Volunteer / Admin, NOT Unit Squad) */}
                        {(currentUser?.role || '').toLowerCase() !== 'unit_squad' && (u.status !== 'Active' && u.status !== 'active' && u.status !== 'Rejected' && u.status !== 'rejected') && (
                          <button
                            onClick={async () => {
                              const userId = u._id || u.id;
                              setRejectingUserId(userId);
                              await volunteerRejectUser(userId, 'Registration rejected by Meghala Committee.');
                              setRejectingUserId(null);
                            }}
                            disabled={rejectingUserId === (u._id || u.id)}
                            className="px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs shadow-2xs disabled:opacity-50"
                            title="Reject User Registration"
                          >
                            {rejectingUserId === (u._id || u.id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            Reject
                          </button>
                        )}

                        {/* View Button */}
                        <button
                          onClick={() => { setSelectedUser(u); setShowViewModal(true); }}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl hover:bg-blue-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> View
                        </button>

                        {/* Secure Edit Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setOtpSent(false);
                            setOtpVerified(false);
                            setOtpCode('');
                            setShowEditModal(true);
                          }}
                          className="px-2.5 py-1.5 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Secure Edit (OTP)"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-red-600" /> Secure Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setConfirmModal({ open: true, item: u })}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Modal with Creative Blood Group Design */}
      <AnimatePresence>
        {showViewModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100"
            >
              {/* Creative Crimson Header Banner */}
              <div className="h-32 bg-gradient-to-r from-red-600 via-rose-600 to-red-800 relative overflow-hidden p-6 flex justify-between items-start">
                {/* Background Art Pattern */}
                <div className="absolute -right-8 -bottom-12 opacity-20 text-white pointer-events-none">
                  <Droplet className="w-48 h-48 fill-white" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-white mt-1.5 tracking-tight truncate max-w-[260px]">
                    {selectedUser.fullName || selectedUser.name || 'User Profile'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Floating Avatar & High-End Creative Blood Group Badge */}
              <div className="px-6 relative -mt-10 pb-2">
                <div className="flex items-end justify-between">
                  {/* User Profile Avatar */}
                  <div className="relative">
                    {selectedUser.profilePicture || selectedUser.profile_picture ? (
                      <img
                        src={getStorageUrl(selectedUser.profilePicture || selectedUser.profile_picture)}
                        alt={selectedUser.fullName}
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUser.fullName || 'User')}`; }}
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl bg-white"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-rose-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-4 border-white">
                        {(selectedUser.fullName || selectedUser.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${selectedUser.status === 'Active' || selectedUser.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </div>

                  {/* CREATIVE BLOOD GROUP BADGE */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-red-600/30 border border-red-400/40 flex items-center gap-3 relative overflow-hidden"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
                      <Droplet className="w-6 h-6 text-white fill-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-red-100/90 leading-none">
                        Blood Group
                      </p>
                      <p className="text-2xl font-black text-white tracking-tight mt-0.5 leading-none">
                        {selectedUser.bloodGroup || selectedUser.blood_group || 'N/A'}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Subtitle Role & Status */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800 capitalize bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {selectedUser.role || 'Member'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <StatusBadge status={selectedUser.status || 'Active'} />
                </div>
              </div>

              {/* User Details Grid */}
              <div className="px-6 pb-6 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl hover:bg-white hover:border-slate-200 transition-all shadow-xs">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-red-500" /> Email Address
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate" title={selectedUser.email}>
                      {selectedUser.email || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl hover:bg-white hover:border-slate-200 transition-all shadow-xs">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-red-500" /> Contact Number
                    </p>
                    {selectedUser.mobile ? (
                      <a href={`tel:${selectedUser.mobile}`} className="text-xs font-bold text-red-600 font-mono hover:underline block truncate">
                        {selectedUser.mobile}
                      </a>
                    ) : (
                      <p className="text-xs font-bold text-slate-800 font-mono">N/A</p>
                    )}
                  </div>

                  <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl hover:bg-white hover:border-slate-200 transition-all shadow-xs">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-red-500" /> District
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedUser.district || '—'}
                    </p>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl hover:bg-white hover:border-slate-200 transition-all shadow-xs">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-red-500" /> City / Location
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedUser.city || '—'}
                    </p>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 space-y-2">
                  {(currentUser?.role || '').toLowerCase() !== 'unit_squad' && (selectedUser.status !== 'Active' && selectedUser.status !== 'active') && (
                    <button
                      onClick={() => handleVerifyUser(selectedUser)}
                      disabled={verifyingUserId === (selectedUser._id || selectedUser.id)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {verifyingUserId === (selectedUser._id || selectedUser.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-white" />
                      )}
                      Verify & Accept User (Sends Password directly to User Email)
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(selectedUser);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-white" /> Secure Edit Profile (OTP Required)
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secure Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl relative">
              <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>

              <div className="mb-4 shrink-0 pr-6">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-primary" /> Secure Profile Edit
                </h3>
                <p className="text-xs text-gray-500 mt-1">Editing {selectedUser.fullName}'s profile</p>
              </div>

              <div className="overflow-y-auto pr-2 flex-1 scrollbar-thin">

                {!otpVerified ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                      <KeyRound className="w-8 h-8 text-amber-500" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Authorization Required</h4>
                    <p className="text-xs text-gray-600 mb-6 px-4">
                      To edit a user's details, you must first verify their consent via OTP sent to <b>{selectedUser.email}</b>.
                    </p>

                    {!otpSent ? (
                      <button
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-primary to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                        Send OTP Code
                      </button>
                    ) : (
                      <div className="space-y-4 animate-fade-in-up">
                        <div className="bg-green-50 text-green-700 text-xs font-bold p-3 rounded-xl border border-green-100">
                          Code sent! Please ask the user for the 6-digit OTP.
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-[0.5em] font-mono text-xl py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                        <button
                          onClick={handleVerifyOtp}
                          disabled={loading || otpCode.length !== 6}
                          className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code & Unlock'}
                        </button>
                        <button
                          onClick={handleSendOtp}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleUpdateSubmit} className="space-y-4 animate-fade-in-up">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-700">Access Granted. You may now edit the details.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 flex flex-col items-center pb-2 border-b border-slate-100">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 text-center w-full">
                          Update Profile Picture
                        </label>
                        {form.profile_picture ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={
                                form.profile_picture instanceof File
                                  ? URL.createObjectURL(form.profile_picture)
                                  : getStorageUrl(form.profile_picture)
                              }
                              alt="Profile Preview"
                              onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=User`; }}
                              className="w-20 h-20 rounded-2xl object-cover border-2 border-red-200 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, profile_picture: null })}
                              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Remove / Change Photo
                            </button>
                          </div>
                        ) : (
                          <label className="w-full flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-red-400 rounded-2xl cursor-pointer transition-colors group">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors mb-1" />
                            <span className="text-xs font-bold text-slate-700 group-hover:text-red-600 transition-colors">
                              Click to Upload New Profile Picture
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setForm({ ...form, profile_picture: e.target.files[0] });
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input type="text" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Blood Group</label>
                        <select value={form.blood_group || 'N/A'} onChange={e => setForm({ ...form, blood_group: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'N/A'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mobile</label>
                        <input type="tel" value={form.mobile || ''} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">City</label>
                        <input type="text" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">District</label>
                        <input type="text" value={form.district || ''} onChange={e => setForm({ ...form, district: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-4 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 relative">
              {/* Modal Header Red Banner */}
              <div className="bg-red-600 p-6 relative overflow-hidden shrink-0">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white text-lg font-black tracking-tight">Add New Member / User</h3>
                      <p className="text-red-100 text-[10px] font-medium">Password credentials will be generated and emailed directly to the member</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(false)} 
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex flex-col items-center pb-2 border-b border-slate-100">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 text-center w-full">
                      Profile Picture *
                    </label>
                    {form.profile_picture ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={typeof form.profile_picture === 'string' ? form.profile_picture : URL.createObjectURL(form.profile_picture)}
                          alt="Profile Preview"
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-red-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, profile_picture: null })}
                          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Remove & Change Photo
                        </button>
                      </div>
                    ) : (
                      <label className="w-full flex flex-col items-center justify-center p-5 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-red-400 rounded-2xl cursor-pointer transition-colors group">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-red-600 transition-colors mb-1.5" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-red-600 transition-colors">
                          Click to upload Profile Picture
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setForm({ ...form, profile_picture: e.target.files[0] });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Blood Group *</label>
                    <select value={form.blood_group || 'A+'} onChange={e => setForm({ ...form, blood_group: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gender / Sex *</label>
                    <select value={form.sex || 'male'} onChange={e => setForm({ ...form, sex: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="transgender">Transgender</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Date of Birth *</label>
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">18+ Years Only</span>
                    </div>
                    <input 
                      type="date" 
                      max={getEighteenYearsAgoDate()} 
                      value={form.dob || ''} 
                      onChange={e => setForm({ ...form, dob: e.target.value })} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                      required 
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Only 18+ years old allowed (Compared against current year & month)</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input type="text" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required placeholder="Enter full name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mobile *</label>
                    <input type="tel" value={form.mobile || ''} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required placeholder="10-digit mobile number" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email *</label>
                    <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" required placeholder="user@example.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Place / City *</label>
                    <input type="text" value={form.place || form.city || ''} onChange={e => setForm({ ...form, place: e.target.value, city: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Enter place / city" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">PIN Code *</label>
                    <input type="text" value={form.pincode || ''} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" maxLength={6} placeholder="6-digit pincode" required />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">District *</label>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-emerald-600" /> Auto-Fixed from Super Admin Scope
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={form.district || currentUser?.district || 'Kozhikode'} 
                      readOnly 
                      disabled 
                      className="w-full p-3 bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl text-sm outline-none cursor-not-allowed select-none" 
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3 mt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, item: null })}
        loading={loading}
        onConfirm={async () => {
          if (!confirmModal.item) return;
          setLoading(true);
          await deleteUser(confirmModal.item._id || confirmModal.item.id);
          setLoading(false);
          setConfirmModal({ open: false, item: null });
        }}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${confirmModal.item?.fullName || confirmModal.item?.name || 'this user'}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
}
