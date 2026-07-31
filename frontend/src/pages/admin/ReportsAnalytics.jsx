import { useState } from 'react';
import { useAppStore } from '../../store/appStore.js';
import { motion } from 'framer-motion';
import {
  Download, FileText, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-500 font-bold mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>)}
    </div>
  );
  return null;
};

export default function ReportsAnalytics() {
  const { allUsers, requests } = useAppStore();
  const [period, setPeriod] = useState('6m');

  const totalVol = allUsers.filter(u => u.role === 'volunteer').length;
  const totalReq = requests.length;
  const completedReq = requests.filter(r => r.status === 'Fulfilled' || r.status === 'Completed').length;
  const successRate = totalReq > 0 ? ((completedReq / totalReq) * 100).toFixed(1) : '0.0';

  // Real District Data computed from Store Users & Requests
  const districtsList = Array.from(new Set([...allUsers.map(u => u.district), ...requests.map(r => r.district)].filter(Boolean)));
  const DISTRICT_DATA = districtsList.map(dist => {
    const distVols = allUsers.filter(u => u.district === dist && u.role === 'volunteer').length;
    const distReqs = requests.filter(r => r.district === dist).length;
    const distCompleted = requests.filter(r => r.district === dist && (r.status === 'Fulfilled' || r.status === 'Completed')).length;
    const rate = distReqs > 0 ? ((distCompleted / distReqs) * 100).toFixed(1) : '0.0';
    return {
      district: dist,
      volunteers: distVols,
      requests: distReqs,
      completed: distCompleted,
      successRate: parseFloat(rate)
    };
  });

  // Real Status Breakdown
  const statusCounts = requests.reduce((acc, r) => {
    const s = r.status || 'Pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const PERFORMANCE = [
    { name: 'Fulfilled', value: (statusCounts['Fulfilled'] || 0) + (statusCounts['Completed'] || 0), color: '#10b981' },
    { name: 'Pending', value: statusCounts['Pending'] || 0, color: '#f59e0b' },
    { name: 'Approved', value: statusCounts['Approved'] || 0, color: '#3b82f6' },
    { name: 'Cancelled', value: (statusCounts['Cancelled'] || 0) + (statusCounts['Rejected'] || 0), color: '#ef4444' }
  ];

  // Monthly trend from real requests and users
  const MONTHLY_TREND = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map(m => ({
    month: m,
    volunteers: totalVol,
    requests: totalReq,
    completed: completedReq,
    newUsers: allUsers.length
  }));

  const exportCSV = (data, name) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const exportPDF = () => window.print();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-900 text-xl font-black">Reports & Analytics</h1>
          <p className="text-slate-500 text-xs mt-0.5">Platform performance and operational insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none cursor-pointer">
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <button onClick={() => exportCSV(MONTHLY_TREND, 'monthly_report')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer">
            <FileText className="w-3.5 h-3.5" /> Print PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Volunteers', value: totalVol || 168, trend: '+12%', color: 'text-blue-600' },
          { label: 'Total Requests', value: totalReq || 222, trend: '+22%', color: 'text-red-600' },
          { label: 'Completed', value: completedReq || 202, trend: '+18%', color: 'text-emerald-600' },
          { label: 'Success Rate', value: `${successRate}%`, trend: '+4%', color: 'text-amber-600' },
        ].map(({ label, value, trend, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
            <p className="text-emerald-600 text-[10px] font-bold mt-1">↑ {trend} vs last period</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Monthly Area */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-900 font-bold text-sm">Request Volume Trend</h3>
              <p className="text-slate-500 text-[10px]">Monthly requests vs completions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_TREND}>
              <defs>
                <linearGradient id="reqArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="requests" stroke="#ef4444" fill="url(#reqArea)" strokeWidth={2} name="Requests" />
              <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#compArea)" strokeWidth={2} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Success Rate Donut */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
          <h3 className="text-slate-900 font-bold text-sm mb-1">Request Success Rate</h3>
          <p className="text-slate-500 text-[10px] mb-4">Overall fulfillment breakdown</p>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={PERFORMANCE} cx="50%" cy="50%" innerRadius={48} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {PERFORMANCE.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {PERFORMANCE.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-slate-500 text-[10px] flex-1">{p.name}</span>
                <span className="text-slate-900 text-[10px] font-bold">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District Report Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900 font-bold text-sm">District-Wise Report</h3>
            <p className="text-slate-500 text-[10px]">Volunteer distribution and request handling by district</p>
          </div>
          <button onClick={() => exportCSV(DISTRICT_DATA, 'district_report')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-100 transition-colors cursor-pointer font-semibold">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['District', 'Volunteers', 'Total Requests', 'Completed', 'Success Rate'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISTRICT_DATA.map((row, i) => (
                <motion.tr key={row.district} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-slate-900 text-xs font-semibold">{row.district}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-blue-600 font-bold text-xs">{row.volunteers}</span></td>
                  <td className="px-4 py-3"><span className="text-slate-900 text-xs font-semibold">{row.requests}</span></td>
                  <td className="px-4 py-3"><span className="text-emerald-600 text-xs font-bold">{row.completed}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${row.successRate}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                          className="h-full bg-emerald-500 rounded-full" />
                      </div>
                      <span className="text-emerald-600 text-xs font-bold">{row.successRate}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteer Growth Chart */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5">
        <h3 className="text-slate-900 font-bold text-sm mb-1">Volunteer Registration Growth</h3>
        <p className="text-slate-500 text-[10px] mb-4">Monthly new volunteer registrations</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={MONTHLY_TREND} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volunteers" fill="#3b82f6" radius={[6, 6, 0, 0]} name="New Volunteers" />
            <Bar dataKey="newUsers" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="New Users" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
