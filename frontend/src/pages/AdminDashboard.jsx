import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, RefreshCw, Users, HeartPulse, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import api from '../store/api.js';
import { useAuthStore } from '../store/authStore.js';

const growthOverviewData = [
  { name: 'Jan', users: 0, vols: 0 },
  { name: 'Feb', users: 0, vols: 0 },
  { name: 'Mar', users: 0, vols: 0 },
  { name: 'Apr', users: 0, vols: 0 },
  { name: 'May', users: 0, vols: 0 },
  { name: 'Jun', users: 0, vols: 0 },
];

const weeklyActivityData = [
  { day: 'Mon', requests: 0, fulfilled: 0 },
  { day: 'Tue', requests: 0, fulfilled: 0 },
  { day: 'Wed', requests: 0, fulfilled: 0 },
  { day: 'Thu', requests: 0, fulfilled: 0 },
  { day: 'Fri', requests: 0, fulfilled: 0 },
  { day: 'Sat', requests: 0, fulfilled: 0 },
  { day: 'Sun', requests: 0, fulfilled: 0 },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
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

  const loadData = useCallback(async () => {
    try {
      const [resMetrics, resVolunteers] = await Promise.all([
        api.get('/block-admin/metrics'),
        api.get('/block-admin/volunteers')
      ]);

      const volunteerList = resVolunteers.data?.success && Array.isArray(resVolunteers.data.data) ? resVolunteers.data.data : [];
      const metricsVolunteers = Number(resMetrics.data?.data?.total_volunteers) || 0;
      const finalVolunteers = Math.max(metricsVolunteers, volunteerList.length);

      if (resMetrics.data?.success) {
        setBlockData({
          blockCommitteeName: resMetrics.data.data?.city || user?.city || user?.block || 'Block Committee',
          total_users: resMetrics.data.data?.total_users || 0,
          total_volunteers: finalVolunteers,
          volunteers: volunteerList,
          members: [],
          meghala_summary: []
        });
      }
      if (resVolunteers.data?.success) setMeghalaAdmins(volunteerList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await loadData();
    })();
    return () => { active = false; };
  }, [loadData]);

  const availableMeghalas = Array.from(new Set([
    ...(blockData.members || []).map(m => m.meghala).filter(Boolean),
    ...meghalaAdmins.map(ba => ba.meghala).filter(Boolean)
  ]));

  const rawBlock = blockData.blockCommitteeName || user?.city || user?.block || 'Block Committee';
  const cleanBlock = rawBlock.replace(/^dyfi\s*/i, '').replace(/\s*block(\s*committee)?$/i, '').trim() || rawBlock;
  const formattedBlock = cleanBlock.charAt(0).toUpperCase() + cleanBlock.slice(1);
  const displayBlock = `DYFI ${formattedBlock}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Minimal Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-red-700 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                {displayBlock} Block Admin
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-red-600 uppercase">
                {displayBlock}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                Manage Meghala Committees and Block Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-600" />
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Block Donors</span>
          <p className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">{blockData.total_users || 0}</p>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Meghala Committee</span>
          <p className="text-3xl font-black text-emerald-600 tracking-tight mt-0.5">{Math.max(Number(blockData.total_volunteers) || 0, meghalaAdmins.length)}</p>
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
              <LineChart data={growthOverviewData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="users" name="Block Donors" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="vols" name="Volunteers" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity Bar Chart */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 h-[300px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Weekly Activity
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="requests" name="Total Requests" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="fulfilled" name="Fulfilled" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
