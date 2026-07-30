import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, Plus, RefreshCw, ExternalLink,
  TrendingUp, Activity, ShieldCheck, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import api from '../../store/api.js';

// Custom Modern Tooltip for Charts
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-red-100 rounded-2xl p-3.5 shadow-xl text-xs space-y-1 z-50">
        <p className="text-slate-500 font-bold border-b border-slate-100 pb-1 mb-1.5">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TechnicalAdminDashboard() {
  const [metrics, setMetrics] = useState({
    total_users: 0,
    total_volunteers: 0,
    total_admins: 0,
    total_super_admins: 0,
    total_requests: 0,
    pending_tech_reports: 0,
    monthly_trend: [],
    district_performance: [],
    request_status_breakdown: []
  });

  const [superAdmins, setSuperAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  // Super Admin Edit Modal State
  const [editingSA, setEditingSA] = useState(null);
  const [editDistrict, setEditDistrict] = useState('Kozhikode');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editSecContact, setEditSecContact] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [resMetrics, resSuperAdmins] = await Promise.all([
        api.get('/technical-admin/metrics'),
        api.get('/technical-admin/super-admins')
      ]);

      if (resMetrics.data?.success) {
        setMetrics(resMetrics.data.data);
      }
      if (resSuperAdmins.data?.success) {
        setSuperAdmins(resSuperAdmins.data.data || []);
      }
    } catch {
      // error handling
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

  const openEditSA = (sa) => {
    setEditingSA(sa);
    setEditDistrict(sa.district || 'Kozhikode');
    setEditFullName(sa.full_name || sa.name || '');
    setEditEmail(sa.email || '');
    setEditMobile(sa.mobile || '');
    setEditSecContact(sa.secondaryContactName || sa.secondary_contact_name || sa.secondary_contact || '');
    setEditStatus(sa.status || 'Active');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSA) return;
    setSubmittingEdit(true);
    try {
      const res = await api.put(`/technical-admin/super-admins/${editingSA.id}`, {
        district: editDistrict,
        full_name: editFullName,
        email: editEmail,
        mobile: editMobile,
        secondary_contact: editSecContact,
        status: editStatus
      });
      if (res.data?.success) {
        setEditingSA(null);
        loadData();
      }
    } catch {
      // error handling
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Compute real dynamic success rate from backend metrics
  const totalRequestsCount = metrics.total_requests || 0;
  const fulfilledItem = (metrics.request_status_breakdown || []).find(
    s => s.name === 'Fulfilled' || s.name === 'Completed'
  );
  const fulfilledCount = fulfilledItem ? fulfilledItem.value : 0;
  const successRate = totalRequestsCount > 0
    ? ((fulfilledCount / totalRequestsCount) * 100).toFixed(1)
    : '0.0';

  const monthlyTrendData = metrics.monthly_trend || [];
  const districtPerformanceData = metrics.district_performance || [];
  const requestStatusPie = metrics.request_status_breakdown || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Modern Minimal Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-700 rounded-3xl p-6 lg:p-8 text-white shadow-lg shadow-red-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <ShieldAlert className="w-4 h-4 text-white" /> Technical Control Panel
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">System Analytics & Live Control</h1>
            <p className="text-red-100 text-sm mt-1 max-w-2xl font-medium">
              Real database metrics, dynamic blood request trends, active district coverage, and Super Admin governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/technical-admin/super-admins"
              className="px-5 py-3 bg-white text-red-600 hover:bg-red-50 rounded-2xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" /> Manage Super Admins
            </Link>
            <button
              onClick={loadData}
              className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Global Live Stat Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-white/15">
          {[
            { label: 'Total Donors', val: metrics.total_users },
            { label: 'Volunteers', val: metrics.total_volunteers },
            { label: 'Block Admins', val: metrics.total_admins },
            { label: 'Super Admins', val: metrics.total_super_admins || superAdmins.length },
            { label: 'Blood Requests', val: metrics.total_requests },
            { label: 'Tech Reports', val: metrics.pending_tech_reports }
          ].map((m, idx) => (
            <div key={idx} className="bg-white/10 border border-white/15 rounded-2xl p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[10px] font-bold text-red-100 uppercase tracking-wider">
                <span>{m.label}</span>
                <span className="text-white/80 font-mono text-[9px]">Live DB</span>
              </div>
              <p className="text-2xl font-black text-white mt-1">{m.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Dynamic Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Growth Area Chart */}
        <div className="lg:col-span-8 bg-white border border-red-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-red-50 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                Live Blood Requests & Donation Trends
              </h2>
              <p className="text-xs text-slate-500">Real monthly request volume vs fulfilled donor acceptances from database</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-xl text-xs font-semibold">
              {['7d', '30d', '6m', '1y'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg transition uppercase font-bold text-[10px] cursor-pointer ${
                    timeframe === tf
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {monthlyTrendData.length === 0 || monthlyTrendData.every(d => d.requests === 0 && d.donations === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Activity className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold">No Monthly Request Activity Logged Yet</p>
                <p className="text-[11px] text-slate-400">Activity will reflect dynamically as blood requests are created.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="requests" name="Blood Requests" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                  <Area type="monotone" dataKey="donations" name="Fulfilled Donations" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-600 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <span>Blood Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Fulfilled Donations</span>
            </div>
          </div>
        </div>

        {/* Request Status Donut Chart */}
        <div className="lg:col-span-4 bg-white border border-red-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="border-b border-red-50 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-red-600" />
              Request Status Ratio
            </h2>
            <p className="text-xs text-slate-500">Live request status breakdown</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {requestStatusPie.length === 0 || requestStatusPie.every(s => s.value === 0) ? (
              <div className="text-center text-slate-400 space-y-1">
                <PieIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No Request Data Yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={requestStatusPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {requestStatusPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-2xl font-black text-slate-900">{successRate}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fulfillment Rate</span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-50">
            {requestStatusPie.map(item => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold text-slate-900 ml-1">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District Coverage Bar Chart */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-red-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              Live District Coverage Breakdown
            </h2>
            <p className="text-xs text-slate-500">Real registered Volunteers & Donors grouped by District</p>
          </div>

          <Link
            to="/technical-admin/super-admins"
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            Manage Districts
          </Link>
        </div>

        <div className="h-72 w-full pt-2">
          {districtPerformanceData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <BarChart3 className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">No District Coverage Data Recorded Yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="donors" name="Registered Donors" fill="#dc2626" radius={[6, 6, 0, 0]} />
                <Bar dataKey="volunteers" name="Active Volunteers" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="requests" name="Blood Requests" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick District Super Admins Overview */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-red-50 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              District Super Admins Directory Quick View ({superAdmins.length})
            </h3>
            <p className="text-xs text-slate-500">District leaders and contact assignments</p>
          </div>

          <Link
            to="/technical-admin/super-admins"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Open Full Super Admin Table
          </Link>
        </div>

        {superAdmins.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <p className="text-sm font-bold text-slate-700">No Super Admins Registered Yet</p>
            <p className="text-xs">Click above to add District Super Admins.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {superAdmins.slice(0, 6).map((sa) => (
              <div key={sa.id} className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 space-y-2 hover:border-red-200 transition">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-full">
                    {sa.district || 'District'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    sa.status === 'Active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {sa.status || 'Active'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm truncate">{sa.full_name || sa.name}</h4>
                <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                  <p className="truncate">Email: {sa.email}</p>
                  <p>Mobile: {sa.mobile}</p>
                  {sa.secondary_contact && <p>Sec: {sa.secondary_contact}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Edit Super Admin</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <input type="text" value={editDistrict} onChange={e=>setEditDistrict(e.target.value)} placeholder="District" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="text" value={editFullName} onChange={e=>setEditFullName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="text" value={editMobile} onChange={e=>setEditMobile(e.target.value)} placeholder="Mobile" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="text" value={editSecContact} onChange={e=>setEditSecContact(e.target.value)} placeholder="Secondary Contact" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setEditingSA(null)} className="flex-1 py-2 border rounded-xl font-bold hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submittingEdit} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-xl shadow-md">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
