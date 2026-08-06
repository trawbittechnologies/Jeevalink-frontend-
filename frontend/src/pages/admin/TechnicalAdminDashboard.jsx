import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, Plus, RefreshCw, ExternalLink, Edit,
  TrendingUp, Activity, ShieldCheck, BarChart3, PieChart as PieIcon,
  Video, Upload, Save, Film, CheckCircle2, Image, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import api from '../../store/api.js';
import { useAppStore } from '../../store/appStore.js';
import MascotVideo from '../../components/MascotVideo.jsx';

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

  // Landing Page Awareness Video & Section Management State
  const { awarenessSettings, fetchAwarenessSettings, updateAwarenessSettings } = useAppStore();
  const [awarenessForm, setAwarenessForm] = useState({
    badgeText: '',
    quoteTitle: '',
    quoteDescription: '',
    buttonLabel: '',
    videoUrl: '',
    posterUrl: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [savingAwareness, setSavingAwareness] = useState(false);

  useEffect(() => {
    fetchAwarenessSettings();
  }, [fetchAwarenessSettings]);

  useEffect(() => {
    if (awarenessSettings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAwarenessForm({
        badgeText: awarenessSettings.badgeText || '',
        quoteTitle: awarenessSettings.quoteTitle || '',
        quoteDescription: awarenessSettings.quoteDescription || '',
        buttonLabel: awarenessSettings.buttonLabel || '',
        videoUrl: awarenessSettings.videoUrl || '',
        posterUrl: awarenessSettings.posterUrl || ''
      });
    }
  }, [awarenessSettings]);

  const handleSaveAwareness = async (e) => {
    e.preventDefault();
    setSavingAwareness(true);
    try {
      const formData = new FormData();
      formData.append('badge_text', awarenessForm.badgeText);
      formData.append('quote_title', awarenessForm.quoteTitle);
      formData.append('quote_description', awarenessForm.quoteDescription);
      formData.append('button_label', awarenessForm.buttonLabel);
      formData.append('video_url', awarenessForm.videoUrl);
      formData.append('poster_url', awarenessForm.posterUrl);

      if (videoFile) {
        formData.append('video_file', videoFile);
      }
      if (posterFile) {
        formData.append('poster_file', posterFile);
      }

      const res = await updateAwarenessSettings(formData);
      if (res?.success) {
        setVideoFile(null);
        setPosterFile(null);
      }
    } finally {
      setSavingAwareness(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetrics, resSuperAdmins] = await Promise.all([
        api.get('/technical-admin/metrics'),
        api.get('/technical-admin/super-admins')
      ]);

      if (resMetrics.data?.success) {
        setMetrics(resMetrics.data.data);
      }

      const rawSA = resSuperAdmins.data;
      let saList = [];
      if (Array.isArray(rawSA)) {
        saList = rawSA;
      } else if (Array.isArray(rawSA?.data)) {
        saList = rawSA.data;
      } else if (Array.isArray(rawSA?.data?.data)) {
        saList = rawSA.data.data;
      }
      setSuperAdmins(saList);
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
    setEditFullName(sa.primaryName || sa.primary_name || sa.name || '');
    setEditEmail(sa.email || '');
    setEditMobile(sa.mobile || '');
    setEditSecContact(sa.secondaryName || sa.secondary_name || sa.secondary_contact || '');
    setEditStatus(sa.status || 'Active');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSA) return;
    setSubmittingEdit(true);
    try {
      const res = await api.put(`/technical-admin/super-admins/${editingSA.id}`, {
        district: editDistrict,
        primary_name: editFullName,
        email: editEmail,
        mobile: editMobile,
        secondary_name: editSecContact,
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
      <div className="relative rounded-3xl p-6 lg:p-8 text-white shadow-xl overflow-hidden border border-slate-200">
        <img
          src="/kerala_green_banner.jpg"
          alt="Kerala Cover Image"
          className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 border border-white/30 rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md shadow-sm">
              <ShieldAlert className="w-4 h-4 text-emerald-300" /> Technical Control Panel
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md">System Analytics & Live Control</h1>
            <p className="text-slate-100 text-xs sm:text-sm mt-1 max-w-2xl font-medium drop-shadow-sm">
              Real database metrics, dynamic blood request trends, active district coverage, and Super Admin governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/technical-admin/super-admins"
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" /> Manage Super Admins
            </Link>
            <button
              onClick={loadData}
              className="px-4 py-2.5 sm:py-3 bg-black/30 hover:bg-black/50 border border-white/25 rounded-2xl text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Global Live Stat Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/20 relative z-10">
          {[
            { label: 'Total Donors', val: metrics.total_users },
            { label: 'Volunteers', val: metrics.total_volunteers },
            { label: 'Block Admins', val: metrics.total_admins },
            { label: 'Super Admins', val: metrics.total_super_admins || superAdmins.length },
            { label: 'Blood Requests', val: metrics.total_requests },
            { label: 'Tech Reports', val: metrics.pending_tech_reports }
          ].map((m, idx) => (
            <div key={idx} className="bg-black/35 border border-white/20 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                <span>{m.label}</span>
                <span className="text-white/80 font-mono text-[9px]">Live DB</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white mt-0.5 sm:mt-1">{m.val}</p>
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
                  className={`px-3 py-1 rounded-lg transition uppercase font-bold text-[10px] cursor-pointer ${timeframe === tf
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

      {/* Landing Page Awareness Video & Content Management Section */}
      <div className="bg-white border border-red-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
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



      {/* Edit Modal */}
      {editingSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative border border-slate-100">
            <h3 className="text-lg font-bold mb-4">Edit Super Admin</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <input type="text" value={editDistrict} onChange={e => setEditDistrict(e.target.value)} placeholder="District" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder="Primary Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="text" value={editMobile} onChange={e => setEditMobile(e.target.value)} placeholder="Mobile" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <input type="text" value={editSecContact} onChange={e => setEditSecContact(e.target.value)} placeholder="Secondary Contact" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
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
