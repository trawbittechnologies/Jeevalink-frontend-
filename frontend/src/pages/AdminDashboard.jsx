import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, RefreshCw, Eye, EyeOff, X, Users, HeartPulse, Activity, Plus, Key, Trash2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import api from '../store/api.js';

const mockGrowthData = [
  { name: 'Jan', users: 0, vols: 0 },
  { name: 'Feb', users: 0, vols: 0 },
  { name: 'Mar', users: 0, vols: 0 },
  { name: 'Apr', users: 0, vols: 0 },
  { name: 'May', users: 0, vols: 0 },
  { name: 'Jun', users: 0, vols: 0 },
];

const mockActivityData = [
  { day: 'Mon', requests: 0, fulfilled: 0 },
  { day: 'Tue', requests: 0, fulfilled: 0 },
  { day: 'Wed', requests: 0, fulfilled: 0 },
  { day: 'Thu', requests: 0, fulfilled: 0 },
  { day: 'Fri', requests: 0, fulfilled: 0 },
  { day: 'Sat', requests: 0, fulfilled: 0 },
  { day: 'Sun', requests: 0, fulfilled: 0 },
];

export default function AdminDashboard() {
  const [blockData, setBlockData] = useState({
    blockCommitteeName: 'Central',
    total_users: 0,
    total_volunteers: 0,
    volunteers: [],
    members: [],
    meghala_summary: []
  });

  const [meghalaAdmins, setMeghalaAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidePasswords, setHidePasswords] = useState(true);
  const [viewUser, setViewUser] = useState(null);

  // New Meghala Admin Form state
  const [meghalaName, setMeghalaName] = useState('');
  const [person1Name, setPerson1Name] = useState('');
  const [person1Contact, setPerson1Contact] = useState('');
  const [person2Name, setPerson2Name] = useState('');
  const [person2Contact, setPerson2Contact] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [createdResult, setCreatedResult] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [resMetrics, resVolunteers] = await Promise.all([
        api.get('/block-admin/metrics'),
        api.get('/block-admin/volunteers')
      ]);

      if (resMetrics.data?.success) {
        setBlockData({
          blockCommitteeName: resMetrics.data.data?.city || 'Block Committee',
          total_users: resMetrics.data.data?.total_users || 0,
          total_volunteers: resMetrics.data.data?.total_volunteers || 0,
          volunteers: resVolunteers.data?.data || [],
          members: [],
          meghala_summary: []
        });
      }
      if (resVolunteers.data?.success) setMeghalaAdmins(resVolunteers.data.data || []);
    } catch {
      // ignore
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

  const handleCreateMeghalaAdmin = async (e) => {
    e.preventDefault();
    setCreatedResult(null);
    try {
      const res = await api.post('/block-admin/volunteers', {
        primary_name: person1Name,
        email: email,
        mobile: person1Contact,
        city: meghalaName || 'Local Unit',
        district: 'Ernakulam',
      });

      if (res.data?.success) {
        setCreatedResult({
          type: 'success',
          msg: `Volunteer Committee created successfully! Login credentials sent to registered email.`
        });
        setMeghalaName(''); setPerson1Name(''); setPerson1Contact('');
        setPerson2Name(''); setPerson2Contact('');
        setWhatsapp(''); setEmail('');
        loadData();
      }
    } catch (err) {
      let errMsg = err.response?.data?.message || 'Network error while creating Committee.';
      if (err.response?.data?.errors) {
        errMsg = Object.values(err.response.data.errors).flat().join(', ');
      }
      setCreatedResult({ type: 'error', msg: errMsg });
    }
  };

  const handleTakeAction = async (userId, action, reason = null) => {
    if (!window.confirm(`Are you sure you want to mark user as ${action}?`)) return;
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: action, reason });
      if (res.data?.success) {
        alert(`User status updated to ${action}`);
        loadData();
      }
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleResetPassword = async (ba) => {
    const customPass = window.prompt(`Set new password for ${ba.primary_name || ba.name} (${ba.email}):\n(Leave empty to auto-generate)`, 'admin123');
    if (customPass === null) return;

    try {
      const res = await api.put(`/block-admin/volunteers/${ba.id}`, { password: customPass || undefined });
      if (res.data?.success) {
        alert(`Password for ${ba.email} successfully updated.`);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleDeleteMeghalaAdmin = async (baId, baName) => {
    if (!window.confirm(`Are you sure you want to delete Volunteer "${baName}"? This action cannot be undone.`)) return;
    try {
      const res = await api.delete(`/block-admin/volunteers/${baId}`);
      if (res.data?.success) loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete Volunteer');
    }
  };

  const availableMeghalas = Array.from(new Set([
    ...(blockData.members || []).map(m => m.meghala).filter(Boolean),
    ...meghalaAdmins.map(ba => ba.meghala).filter(Boolean)
  ]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-800 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-red-600" /> Block Admin Portal ({blockData.blockCommitteeName})
          </div>
          <h1 className="text-2xl font-black text-slate-900">Block Administration</h1>
          <p className="text-slate-500 text-xs mt-1">Manage Meghala Committees and Block Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setHidePasswords(!hidePasswords)} className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition">
            {hidePasswords ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-emerald-600" />}
            {hidePasswords ? 'Hide Passwords' : 'Show Passwords'}
          </button>
          <button onClick={loadData} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-600" />
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Block Users</span>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">{blockData.total_users || 0}</p>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Volunteers</span>
          <p className="text-3xl font-black text-emerald-600 tracking-tight mt-0.5">{blockData.total_volunteers || 0}</p>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Meghalas</span>
          <p className="text-3xl font-black text-blue-600 tracking-tight mt-0.5">{availableMeghalas.length || 0}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Growth Line Chart */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 h-[300px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Growth Overview
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="users" name="Total Users" stroke="#94a3b8" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="vols" name="Volunteers" stroke="#dc2626" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Bar Chart */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 h-[300px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Weekly Request Activity
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockActivityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="requests" name="Total Requests" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="fulfilled" name="Fulfilled" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Meghala Committee Form */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm h-fit">
          {/* Header Red Banner */}
          <div className="bg-red-600 p-5 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white text-base font-black tracking-tight">Add New Meghala Committee</h3>
                <p className="text-red-100 text-[10px] font-medium">Automatically generates password & dispatches credentials</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {createdResult && (
              <div className={`p-3.5 rounded-xl text-xs font-medium ${createdResult.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {createdResult.msg}
              </div>
            )}
          <form onSubmit={handleCreateMeghalaAdmin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Name of Meghala / Volunteer *</label>
              <input type="text" value={meghalaName} onChange={(e) => setMeghalaName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Name of Person 1 *</label>
                <input type="text" value={person1Name} onChange={(e) => setPerson1Name(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Contact (Person 1) *</label>
                <input type="text" value={person1Contact} onChange={(e) => setPerson1Contact(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Name of Person 2 *</label>
                <input type="text" value={person2Name} onChange={(e) => setPerson2Name(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Contact (Person 2) *</label>
                <input type="text" value={person2Contact} onChange={(e) => setPerson2Contact(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition" />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">WhatsApp Number *</label>
              <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Primary Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition" />
            </div>
            <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer mt-2 transition">
              <Key className="w-4 h-4" /> Create Committee
            </button>
          </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Meghala Committees ({meghalaAdmins.length})</h3>
           {meghalaAdmins.length === 0 ? (
             <div className="text-center py-6 bg-white border border-slate-100 rounded-2xl text-slate-500 text-sm shadow-sm">No Meghala Committees found for this block.</div>
           ) : (
             <div className="space-y-3">
               {meghalaAdmins.map(ba => (
                 <div key={ba.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-slate-200 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-full">
                          Meghala: {ba.meghala || ba.city || 'N/A'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ba.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                          {ba.status || 'Active'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{ba.primary_name || ba.name}</h4>
                      <div className="text-xs text-slate-600 space-y-1 mt-1">
                        <p className="flex items-center gap-2"><span className="font-semibold text-slate-700 w-20">Contact 1:</span> <span>{ba.mobile || 'N/A'}</span></p>
                        {ba.secondaryContactNumber && <p className="flex items-center gap-2"><span className="font-semibold text-slate-700 w-20">Contact 2:</span> <span className="truncate max-w-[200px]">{ba.secondaryContactNumber}</span></p>}
                        <p className="flex items-center gap-2"><span className="font-semibold text-slate-700 w-20">WhatsApp:</span> <span>{ba.whatsapp_number || 'N/A'}</span></p>
                        <p className="flex items-center gap-2"><span className="font-semibold text-slate-700 w-20">Email:</span> <span>{ba.email}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                       <button onClick={() => handleResetPassword(ba)} className="px-2.5 py-1.5 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl transition cursor-pointer flex items-center gap-1" title="Reset Password">
                         <Key className="w-3.5 h-3.5" />
                       </button>
                       <button onClick={() => setViewUser(ba)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition cursor-pointer" title="View Profile">
                         <Eye className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleTakeAction(ba.id, ba.status === 'Active' ? 'Suspended' : 'Active')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${ba.status === 'Active' ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}>
                         {ba.status === 'Active' ? 'Suspend' : 'Activate'}
                       </button>
                       <button onClick={() => handleDeleteMeghalaAdmin(ba.id, ba.primary_name || ba.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition cursor-pointer">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setViewUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer bg-slate-50 rounded-lg p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold mb-4 text-slate-900">User Profile</h3>
            <div className="space-y-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p><strong>Name:</strong> {viewUser.primary_name || viewUser.name}</p>
              <p><strong>Email:</strong> {viewUser.email}</p>
              <p><strong>Mobile:</strong> {viewUser.mobile || 'N/A'}</p>
              <p><strong>Role:</strong> {viewUser.role}</p>
              <p><strong>Blood Group:</strong> {viewUser.blood_group || 'N/A'}</p>
              <p><strong>District:</strong> {viewUser.district || 'N/A'}</p>
              <p><strong>Block:</strong> {viewUser.blockCommitteeName || 'N/A'}</p>
              <p><strong>Meghala:</strong> {viewUser.meghala || 'N/A'}</p>
              <p className="flex items-center">
                <strong className="mr-2">Status:</strong> 
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${viewUser.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {viewUser.status}
                </span>
              </p>
            </div>
            <button onClick={() => setViewUser(null)} className="w-full mt-4 bg-slate-100 text-slate-700 font-bold py-2 rounded-xl hover:bg-slate-200 cursor-pointer transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
