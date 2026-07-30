import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Plus, Key, RefreshCw, Edit, Trash2, Search,
  Building2, UserCheck, Mail, Phone, Copy, Check, AlertCircle,
  UserPlus, X, Send, AlertTriangle, BellRing, Power, CheckCircle2
} from 'lucide-react';
import api from '../../store/api.js';

const KERALA_DISTRICTS = [
  'Kozhikode', 'Ernakulam', 'Thiruvananthapuram', 'Thrissur', 'Malappuram',
  'Kannur', 'Palakkad', 'Kollam', 'Alappuzha', 'Kottayam', 'Kasaragod',
  'Wayanad', 'Idukki', 'Pathanamthitta'
];

function parseSuperAdminContacts(sa) {
  let admin1Name = sa.superAdmin_1Name || sa.superAdmin1Name || sa.super_admin_1_name || '';
  let admin2Name = sa.secondaryContactName || sa.secondary_contact_name || '';
  let fullName = sa.fullName || sa.full_name || sa.name || '';

  if (!admin1Name && fullName.includes(' & ')) {
    const parts = fullName.split(' & ');
    admin1Name = parts[0] ? parts[0].trim() : '';
    if (!admin2Name && parts[1]) {
      admin2Name = parts[1].trim();
    }
  } else if (!admin1Name) {
    admin1Name = fullName;
  }

  let admin1Mobile = sa.mobile || '';
  let admin2Mobile = sa.secondaryContactNumber || sa.secondary_contact_number || '';

  if (!admin2Mobile && sa.secondary_contact) {
    const sec = sa.secondary_contact.replace(/^Admin 2:\s*/i, '').trim();
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
    admin2Name: admin2Name || 'N/A',
    admin2Mobile: admin2Mobile || 'N/A',
  };
}

export default function SuperAdminManagement() {
  const [superAdmins, setSuperAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Add Super Admin Popup Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [district, setDistrict] = useState('Kozhikode');
  const [customDistrict, setCustomDistrict] = useState('');
  const [fullName1, setFullName1] = useState('');
  const [mobile1, setMobile1] = useState('');
  const [fullName2, setFullName2] = useState('');
  const [mobile2, setMobile2] = useState('');
  const [email, setEmail] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  // Edit Super Admin Modal State
  const [editingSA, setEditingSA] = useState(null);
  const [editDistrict, setEditDistrict] = useState('Kozhikode');
  const [editFullName1, setEditFullName1] = useState('');
  const [editMobile1, setEditMobile1] = useState('');
  const [editFullName2, setEditFullName2] = useState('');
  const [editMobile2, setEditMobile2] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [actionMsg, setActionMsg] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Send Message / Warning Modal State
  const [messagingSA, setMessagingSA] = useState(null);
  const [messageType, setMessageType] = useState('Official Warning');
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const resSuperAdmins = await api.get('/technical-admin/super-admins');
      if (resSuperAdmins.data?.success) {
        setSuperAdmins(resSuperAdmins.data.data || []);
      }
    } catch (err) {
      console.error("Super Admin Load error:", err);
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

  const openAddModal = () => {
    setCreatedResult(null);
    setDistrict('Kozhikode');
    setCustomDistrict('');
    setFullName1('');
    setMobile1('');
    setFullName2('');
    setMobile2('');
    setEmail('');
    setIsAddModalOpen(true);
  };

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    setCreatedResult(null);
    setSubmittingCreate(true);
    const targetDistrict = district === 'Other' ? customDistrict : district;

    if (!targetDistrict.trim()) {
      setCreatedResult({ type: 'error', msg: 'Please provide a valid District name.' });
      setSubmittingCreate(false);
      return;
    }

    try {
      const res = await api.post('/technical-admin/super-admins', {
        district: targetDistrict,
        full_name: fullName2.trim() ? `${fullName1} & ${fullName2}` : fullName1,
        email,
        mobile: mobile1,
        secondaryContactName: fullName2 || null,
        secondaryContactNumber: mobile2 || null,
        super_admin_1_name: fullName1,
        super_admin_1_mobile: mobile1,
        whatsapp_number: mobile1
      });

      if (res.data?.success) {
        setCreatedResult({
          type: 'success',
          msg: `Super Admin created for ${targetDistrict} District!`,
          password: res.data.data.generated_password,
          email: email,
          mailSent: res.data.mail_sent,
          mailError: res.data.mail_error,
        });
        loadData();
      } else {
        setCreatedResult({ type: 'error', msg: res.data?.message || 'Creation failed' });
      }
    } catch (err) {
      setCreatedResult({ type: 'error', msg: err.response?.data?.message || 'Error creating super admin.' });
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleToggleStatus = async (sa) => {
    const newStatus = sa.status === 'Active' ? 'Inactive' : 'Active';
    setTogglingId(sa.id);
    try {
      const res = await api.put(`/technical-admin/super-admins/${sa.id}`, {
        status: newStatus
      });
      if (res.data?.success) {
        setSuperAdmins(prev => prev.map(item => item.id === sa.id ? { ...item, status: newStatus } : item));
      } else {
        alert("Failed to toggle status: " + (res.data?.message || 'Error'));
      }
    } catch (err) {
      alert("Error toggling status: " + (err.response?.data?.message || err.message));
    } finally {
      setTogglingId(null);
    }
  };

  const openMessageModal = (sa) => {
    setMessagingSA(sa);
    setMessageType('Official Warning');
    setMessageText('');
    setSendResultMsg(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messagingSA || !messageText.trim()) return;
    setSendingMsg(true);
    setSendResultMsg(null);
    try {
      const res = await api.post(`/technical-admin/super-admins/${messagingSA.id}/message`, {
        type: messageType,
        message: messageText
      });
      if (res.data?.success) {
        setSendResultMsg({
          type: 'success',
          msg: res.data.message || `Message sent successfully to ${messagingSA.email}`
        });
        setMessageText('');
      } else {
        setSendResultMsg({ type: 'error', msg: res.data?.message || 'Failed to send message' });
      }
    } catch (err) {
      setSendResultMsg({ type: 'error', msg: err.response?.data?.message || 'Error sending message.' });
    } finally {
      setSendingMsg(false);
    }
  };

  const handleOpenEdit = (sa) => {
    setEditingSA(sa);
    setEditDistrict(sa.district || 'Kozhikode');
    setEditEmail(sa.email || '');
    setEditStatus(sa.status || 'Active');

    const parsed = parseSuperAdminContacts(sa);
    setEditFullName1(parsed.admin1Name === 'N/A' ? '' : parsed.admin1Name);
    setEditMobile1(parsed.admin1Mobile === 'N/A' ? '' : parsed.admin1Mobile);
    setEditFullName2(parsed.admin2Name === 'N/A' ? '' : parsed.admin2Name);
    setEditMobile2(parsed.admin2Mobile === 'N/A' ? '' : parsed.admin2Mobile);
    setActionMsg(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSA) return;
    setSubmittingEdit(true);
    setActionMsg(null);
    try {
      const res = await api.put(`/technical-admin/super-admins/${editingSA.id}`, {
        district: editDistrict,
        full_name: editFullName2.trim() ? `${editFullName1} & ${editFullName2}` : editFullName1,
        email: editEmail,
        mobile: editMobile1,
        secondaryContactName: editFullName2,
        secondaryContactNumber: editMobile2,
        super_admin_1_name: editFullName1,
        super_admin_1_mobile: editMobile1,
        status: editStatus
      });
      if (res.data?.success) {
        setEditingSA(null);
        loadData();
      } else {
        setActionMsg({ type: 'error', msg: res.data?.message || 'Update failed' });
      }
    } catch (err) {
      setActionMsg({ type: 'error', msg: err.response?.data?.message || 'Failed to update super admin.' });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteSuperAdmin = async (id, name, dist) => {
    if (!window.confirm(`Are you sure you want to delete Super Admin "${name}" (${dist} District)? This action cannot be undone.`)) return;
    try {
      await api.delete(`/technical-admin/super-admins/${id}`);
      loadData();
    } catch (err) {
      alert("Failed to delete super admin: " + (err.response?.data?.message || err.message));
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtering
  const filteredSuperAdmins = superAdmins.filter(sa => {
    const parsed = parseSuperAdminContacts(sa);
    const matchesSearch =
      (sa.district || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sa.fullName || sa.full_name || sa.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sa.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sa.mobile || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      parsed.admin1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parsed.admin2Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parsed.admin2Mobile.toLowerCase().includes(searchTerm.toLowerCase());
      (sa.secondary_contact || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDistrict = selectedDistrictFilter === 'ALL' || sa.district === selectedDistrictFilter;
    const matchesStatus = statusFilter === 'ALL' || sa.status === statusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const totalDistrictsCount = new Set(superAdmins.map(s => s.district).filter(Boolean)).size;
  const activeCount = superAdmins.filter(s => s.status === 'Active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner - Minimal Red & White Theme */}
      <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-700 rounded-3xl p-6 lg:p-8 text-white shadow-lg shadow-red-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <ShieldAlert className="w-4 h-4 text-white" /> Technical Admin Module
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">Super Admin Directory</h1>
            <p className="text-red-100 text-sm mt-1 max-w-2xl font-medium">
              View and manage District Super Admin accounts, toggle active status, send warnings or official notices, and generate credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAddModal}
              className="px-5 py-3 bg-white text-red-600 hover:bg-red-50 rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add Super Admin
            </button>
            <button
              onClick={loadData}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Minimal Red Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/15">
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Total Super Admins</p>
            <p className="text-2xl font-black text-white mt-0.5">{superAdmins.length}</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Active Accounts</p>
            <p className="text-2xl font-black text-white mt-0.5">{activeCount}</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Districts Covered</p>
            <p className="text-2xl font-black text-white mt-0.5">{totalDistrictsCount} / 14</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-red-100 uppercase tracking-wider">Inactive Accounts</p>
            <p className="text-2xl font-black text-white mt-0.5">{superAdmins.length - activeCount}</p>
          </div>
        </div>
      </div>

      {/* Main Full-Width Table Section */}
      <div className="space-y-4">
        
        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by District, Admin Name, Email, or Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Districts ({superAdmins.length})</option>
              {KERALA_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" /> Add Super Admin
            </button>
          </div>
        </div>

        {/* Minimal Full-Width Data Table */}
        <div className="bg-white border border-red-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-600" />
              District Super Admins Listing
              <span className="px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-full">
                {filteredSuperAdmins.length}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-600" />
              <p className="text-xs font-medium">Loading Super Admins directory...</p>
            </div>
          ) : filteredSuperAdmins.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <Building2 className="w-12 h-12 mx-auto text-red-200" />
              <p className="text-base font-bold text-slate-800">No Super Admins Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No district super admin matches your filter criteria. Click below to add a new Super Admin.
              </p>
              <button
                onClick={openAddModal}
                className="mt-2 px-5 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-red-700 transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Super Admin Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">District</th>
                    <th className="py-4 px-6">Primary Contact (Admin 1)</th>
                    <th className="py-4 px-6">Secondary Contact (Admin 2)</th>
                    <th className="py-4 px-6">Login Email ID</th>
                    <th className="py-4 px-6 text-center">Status & Toggle</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuperAdmins.map((sa) => {
                    const parsed = parseSuperAdminContacts(sa);

                    return (
                      <tr key={sa.id} className="hover:bg-red-50/30 transition">
                        {/* District Badge */}
                        <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold">
                            <Building2 className="w-3.5 h-3.5 text-red-600" />
                            {sa.district || 'Unassigned'}
                          </span>
                        </td>

                        {/* Primary Contact (Admin 1) */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-sm">{parsed.admin1Name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{parsed.admin1Mobile}</span>
                          </div>
                        </td>

                        {/* Secondary Contact (Admin 2) */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-sm">{parsed.admin2Name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{parsed.admin2Mobile}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-6 text-slate-700 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-xs">{sa.email}</span>
                          </div>
                        </td>

                      {/* Status & Active/Deactive Toggle Action */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            sa.status === 'Active'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {sa.status || 'Active'}
                          </span>

                          <button
                            onClick={() => handleToggleStatus(sa)}
                            disabled={togglingId === sa.id}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                              sa.status === 'Active'
                                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                            }`}
                            title={sa.status === 'Active' ? 'Deactivate Super Admin' : 'Activate Super Admin'}
                          >
                            {togglingId === sa.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : sa.status === 'Active' ? (
                              <Power className="w-3 h-3 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {sa.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>

                      {/* Row Actions: Send Warning/Message, Edit, Delete */}
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        {/* Send Warning or Message Button */}
                        <button
                          onClick={() => openMessageModal(sa)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Send Warning or Official Notice"
                        >
                          <Send className="w-3.5 h-3.5 text-red-600" /> Message / Warning
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(sa)}
                          className="px-2.5 py-1.5 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Edit Super Admin"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteSuperAdmin(sa.id, sa.fullName || sa.full_name || sa.name, sa.district)}
                          className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer inline-flex items-center gap-1 font-bold text-xs"
                          title="Delete Super Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* POPUP MODAL: SEND WARNING OR MESSAGE */}
      {messagingSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-lg shadow-2xl relative border border-red-100">
            <div className="flex items-center justify-between border-b border-red-50 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Send Communication</h3>
                  <p className="text-xs text-slate-500">To: {messagingSA.district} Super Admin ({messagingSA.email})</p>
                </div>
              </div>
              <button
                onClick={() => setMessagingSA(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sendResultMsg && (
              <div className={`p-4 rounded-2xl text-xs mb-4 border ${
                sendResultMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                  : 'bg-red-50 border-red-200 text-red-800 font-bold'
              }`}>
                {sendResultMsg.msg}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Communication Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Official Warning', icon: AlertTriangle, label: 'Warning' },
                    { id: 'System Notice', icon: BellRing, label: 'Notice' },
                    { id: 'General Message', icon: Mail, label: 'Message' }
                  ].map(t => {
                    const IconComp = t.icon;
                    const active = messageType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMessageType(t.id)}
                        className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                          active
                            ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${active ? 'text-red-600' : 'text-slate-400'}`} />
                        <span className="text-[11px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Message / Warning Content *</label>
                <textarea
                  rows={4}
                  placeholder={`Write your ${messageType.toLowerCase()} here. This will be logged and dispatched directly to ${messagingSA.email}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMessagingSA(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sendingMsg ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sendingMsg ? 'Sending...' : `Send ${messageType.split(' ')[0]}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD SUPER ADMIN FORM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header Red Banner */}
            <div className="bg-red-600 p-6 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-black tracking-tight">Add District Super Admin</h3>
                    <p className="text-red-100 text-[10px] font-medium">Configure District Leaders & Login Email</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">

            {/* Success Alert / Generated Password View */}
            {createdResult && (
              <div className={`p-4 rounded-2xl text-xs mb-5 border ${
                createdResult.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-start gap-3">
                  {createdResult.type === 'success' ? (
                    <UserCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1">
                    <p className="font-bold text-sm">{createdResult.msg}</p>
                    {createdResult.password && (
                      <div className="mt-2 bg-white border border-emerald-200 rounded-xl p-3.5 space-y-2 text-slate-800">
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Generated Credentials</p>
                        <p><strong>Login Email:</strong> {createdResult.email}</p>
                        <div className="flex items-center justify-between font-mono bg-emerald-50 px-3 py-2 rounded-xl text-emerald-950 font-bold text-sm border border-emerald-200">
                          <span>Password: {createdResult.password}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdResult.password, 'modal_pw')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === 'modal_pw' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedId === 'modal_pw' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                          {createdResult.mailSent
                            ? `✅ Credentials email sent to ${createdResult.email}.`
                            : `⚠️ Email delivery failed — share this password manually with ${createdResult.email}.`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Popup Form */}
            {(!createdResult || createdResult.type === 'error') && (
              <form onSubmit={handleCreateSuperAdmin} className="space-y-4 text-xs">
                {/* District Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Target District *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    {KERALA_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="Other">Other / Custom District...</option>
                  </select>

                  {district === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom district name"
                      value={customDistrict}
                      onChange={(e) => setCustomDistrict(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 mt-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>

                {/* Primary Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Primary Official Email *
                  </label>
                  <input
                    type="email"
                    placeholder="superadmin.district@jeevalink.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Admin 1 Details */}
                <div className="bg-red-50/40 border border-red-100 rounded-2xl p-4 space-y-3">
                  <p className="font-bold text-red-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-red-600" /> District Super Admin 1 (Primary)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul V."
                        value={fullName1}
                        onChange={(e) => setFullName1(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mobile Number *</label>
                      <input
                        type="text"
                        placeholder="9876543210"
                        value={mobile1}
                        onChange={(e) => setMobile1(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin 2 Details */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                  <p className="font-bold text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> District Super Admin 2 (Secondary)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Anjali Nair"
                        value={fullName2}
                        onChange={(e) => setFullName2(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mobile Number *</label>
                      <input
                        type="text"
                        placeholder="9876543211"
                        value={mobile2}
                        onChange={(e) => setMobile2(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreate}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {submittingCreate ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    {submittingCreate ? 'Generating Super Admin...' : 'Create Super Admin'}
                  </button>
                </div>
              </form>
            )}

            {/* Done button after successful creation */}
            {createdResult && createdResult.type === 'success' && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close & View Table
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Edit Super Admin Modal */}
      {editingSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative border border-red-100">
            <div className="flex items-center justify-between border-b border-red-50 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-red-600" />
                Edit Super Admin ({editingSA.district})
              </h3>
              <button
                onClick={() => setEditingSA(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionMsg && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${
                actionMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {actionMsg.msg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Admin 1 (Primary) */}
              <div className="bg-red-50/40 border border-red-100 rounded-2xl p-3.5 space-y-2">
                <p className="font-bold text-red-800 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Admin 1 (Primary Contact)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editFullName1}
                      onChange={(e) => setEditFullName1(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Primary Mobile *</label>
                    <input
                      type="text"
                      value={editMobile1}
                      onChange={(e) => setEditMobile1(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Admin 2 (Secondary) */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
                <p className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Admin 2 (Secondary Contact) *
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editFullName2}
                      onChange={(e) => setEditFullName2(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      value={editMobile2}
                      onChange={(e) => setEditMobile2(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold focus:border-red-500 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSA(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-red-600/20"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
