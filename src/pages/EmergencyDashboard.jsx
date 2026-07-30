import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Siren, Users, Activity, CheckCircle2, Search,
  Download, Bell, Database, Wifi, WifiOff, Plus, X, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

export default function EmergencyDashboard() {
  const {
    emergencyRequests,
    fetchEmergencyRequests,
    createEmergencyRequest,
    fetchEmergencyDetails,
    emergencyDetails,
    fetchLiveDonorCount,
    liveDonorCount,
    allUsers,
    fetchUsers,
    triggerToast
  } = useAppStore();

  const { user } = useAuthStore();

  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('all');

  // Real-time updates method
  const [updateMethod, setUpdateMethod] = useState('Firebase'); // Firebase or WebSocket
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Modals and selection
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Request creation form
  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospitalName: '',
    district: 'Ernakulam',
    contactNumber: '',
    emergencyMessage: '',
    priority: 'high',
    radius: 15
  });

  // Polling for simulated live updates
  useEffect(() => {
    fetchEmergencyRequests();
    fetchLiveDonorCount();
    fetchUsers();

    // Auto-polling interval every 15s to simulate real-time updates
    const interval = setInterval(() => {
      if (isLiveConnected) {
        fetchEmergencyRequests();
        fetchLiveDonorCount();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isLiveConnected, fetchEmergencyRequests, fetchLiveDonorCount, fetchUsers]);

  // Handle new request submit
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.hospitalName || !form.contactNumber) {
      triggerToast('Please fill out all required fields.', 'error');
      return;
    }

    const res = await createEmergencyRequest(form);
    if (res.success) {
      setShowRequestModal(false);
      setForm({
        patientName: '',
        bloodGroup: 'O+',
        unitsRequired: 2,
        hospitalName: '',
        district: 'Ernakulam',
        contactNumber: '',
        emergencyMessage: '',
        priority: 'high',
        radius: 15
      });
      // Add a live simulation alert to Notification Center
      setRecentNotifications(prev => [
        {
          id: Date.now(),
          type: form.priority === 'critical' ? 'critical' : 'new',
          text: `Alert: Emergency ${form.bloodGroup} broadcasted. Targets: ${res.request.target_donors_count || 12} donors.`,
          time: 'Just now'
        },
        ...prev
      ]);
    }
  };



  // View request details
  const handleViewDetails = async (req) => {
    setSelectedRequest(req);
    await fetchEmergencyDetails(req.id);
  };

  // CSV Export helper
  const exportToCSV = () => {
    if (emergencyRequests.length === 0) {
      triggerToast('No requests available to export.', 'warning');
      return;
    }

    const headers = ['ID', 'Patient Name', 'Blood Group', 'Units Required', 'Hospital', 'District', 'Priority', 'Status', 'Expires At', 'Created At'];
    const rows = emergencyRequests.map(r => [
      r.id,
      r.patientName || r.patient_name,
      r.bloodGroup || r.blood_group,
      r.unitsRequired || r.units_required,
      r.hospitalName || r.hospital_name,
      r.district,
      r.priority,
      r.status,
      r.expiresAt || r.expires_at,
      r.createdAt || r.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `emergency_blood_alerts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Requests exported as CSV successfully!', 'success');
  };

  // Print Dashboard layout for PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // Filter logic
  const filteredRequests = emergencyRequests.filter(req => {
    const pName = (req.patientName || req.patient_name || '').toLowerCase();
    const hName = (req.hospitalName || req.hospital_name || '').toLowerCase();
    const matchesSearch = pName.includes(searchTerm.toLowerCase()) || hName.includes(searchTerm.toLowerCase());

    const statusVal = req.status || 'pending';
    const matchesStatus = statusFilter === 'all' || statusVal.toLowerCase() === statusFilter.toLowerCase();
    const matchesDistrict = districtFilter === 'all' || req.district?.toLowerCase() === districtFilter.toLowerCase();
    
    const bgVal = req.bloodGroup || req.blood_group;
    const matchesBg = bloodGroupFilter === 'all' || bgVal === bloodGroupFilter;

    return matchesSearch && matchesStatus && matchesDistrict && matchesBg;
  });

  // Calculate statistics widgets
  const totalAlerts = emergencyRequests.length;
  const activeAlerts = emergencyRequests.filter(r => (r.status || 'pending').toLowerCase() === 'pending' || (r.status || 'pending').toLowerCase() === 'accepted').length;
  const criticalAlerts = emergencyRequests.filter(r => r.priority === 'critical' && (r.status || 'pending').toLowerCase() === 'pending').length;
  const completedAlerts = emergencyRequests.filter(r => (r.status || 'pending').toLowerCase() === 'fulfilled').length;

  const totalDonorsCount = allUsers.filter(u => u.role === 'user').length;
  const availableDonorsCount = allUsers.filter(u => u.role === 'user' && u.availableForDonation).length;

  // Pie chart donor status
  const donorStatusData = [
    { name: 'Available', value: availableDonorsCount },
    { name: 'Unavailable', value: Math.max(0, totalDonorsCount - availableDonorsCount) }
  ];

  // Recharts: Requests by District
  const districtCounts = {};
  emergencyRequests.forEach(r => {
    districtCounts[r.district] = (districtCounts[r.district] || 0) + 1;
  });
  const requestsByDistrictData = Object.entries(districtCounts).map(([district, count]) => ({ district, count }));

  // Recharts: Requests by Blood Group
  const bgCounts = {};
  emergencyRequests.forEach(r => {
    const bg = r.bloodGroup || r.blood_group;
    bgCounts[bg] = (bgCounts[bg] || 0) + 1;
  });
  const requestsByBgData = Object.entries(bgCounts).map(([group, count]) => ({ group, count }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 p-4 lg:p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-red-600 via-red-700 to-rose-800 rounded-3xl p-6 text-white overflow-hidden shadow-lg shadow-red-200/40"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(255,255,255,0.05)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center">
                <Siren className="w-5 h-5 animate-heartbeat" />
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/40 border border-white/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-300 rounded-full animate-pulse" />
                <span className="text-white/90 text-[10px] font-bold uppercase tracking-wider">Live Emergency Feed</span>
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-1">Emergency Blood Alert Portal</h1>
            <p className="text-red-200 text-sm">Real-time FCM alert dispatcher & emergency response command dashboard</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user && (
              <span className="px-3 py-1.5 bg-white/15 border border-white/25 text-white text-xs font-bold rounded-xl backdrop-blur-sm">
                {user.fullName}
              </span>
            )}

            {/* New alert creation */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-red-700 font-bold rounded-2xl text-xs transition-all cursor-pointer hover:bg-red-50 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Dispatch Alert
            </button>

            {/* Export items */}
            <div className="flex bg-white/10 border border-white/20 rounded-2xl p-0.5">
              <button
                onClick={exportToCSV}
                className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white cursor-pointer transition-colors"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrintPDF}
                className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white cursor-pointer transition-colors"
                title="Print Dashboard Report"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SYSTEM CONTROLS & STATUS (Firebase vs WebSockets Toggle) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl flex items-center justify-center ${isLiveConnected ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-slate-100 text-slate-400 dark:bg-zinc-800'}`}>
            {isLiveConnected ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Data Feed Status</h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              {isLiveConnected ? `Connected via ${updateMethod}. Updates broadcast automatically.` : 'Polling updates paused.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Method selector */}
          <div className="flex bg-slate-100 dark:bg-zinc-950 rounded-2xl p-0.5 border border-slate-200/50 dark:border-zinc-850">
            <button
              onClick={() => setUpdateMethod('Firebase')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${updateMethod === 'Firebase' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-550'}`}
            >
              Firebase Client
            </button>
            <button
              onClick={() => setUpdateMethod('WebSocket')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${updateMethod === 'WebSocket' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-zinc-550'}`}
            >
              WebSocket
            </button>
          </div>

          {/* Toggle Online status */}
          <button
            onClick={() => setIsLiveConnected(!isLiveConnected)}
            className={`px-4 py-2 border font-bold text-[10px] rounded-2xl transition-all cursor-pointer ${
              isLiveConnected 
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 dark:text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
            }`}
          >
            {isLiveConnected ? 'Pause Live Sync' : 'Resume Live Sync'}
          </button>
        </div>
      </div>

      {/* DASHBOARD STATISTICS WIDGETS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        <div className="card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-600" />
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <Siren className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{activeAlerts}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Active Requests</p>
          <p className="text-[9px] text-slate-400 mt-1">Pending donor confirmation</p>
        </div>

        <div className="card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-amber-500" />
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-orange-500 tracking-tight">{criticalAlerts}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Critical Cases</p>
          <p className="text-[9px] text-slate-400 mt-1">Requiring immediate dispatch</p>
        </div>

        <div className="card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">{completedAlerts}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Saved Lives</p>
          <p className="text-[9px] text-slate-400 mt-1">Requests fully fulfilled</p>
        </div>

        <div className="card p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-blue-600 tracking-tight">{liveDonorCount}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Online Donors</p>
          <p className="text-[9px] text-slate-400 mt-1">Available: {availableDonorsCount}</p>
        </div>

        <div className="card p-4 relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-600" />
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Database className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-purple-600 tracking-tight">{totalAlerts > 0 ? `${Math.round((completedAlerts / totalAlerts) * 100)}%` : '100%'}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Completion Rate</p>
          <p className="text-[9px] text-slate-400 mt-1">Success alert percentage</p>
        </div>

      </div>

      {/* ANALYTICS CHARTS SECTION */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Requests by District */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4">Emergency Alerts by District</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestsByDistrictData.length > 0 ? requestsByDistrictData : [{ district: 'Ernakulam', count: 3 }, { district: 'Thrissur', count: 1 }]} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" className="hidden dark:block" />
                <XAxis dataKey="district" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Requests by Blood Group */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4">Blood Group Statistics</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestsByBgData.length > 0 ? requestsByBgData : [{ group: 'O+', count: 2 }, { group: 'O-', count: 1 }]} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" className="hidden dark:block" />
                <XAxis dataKey="group" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="#EA580C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Donor Availability Ratio */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-4">Live Donor Availability</h3>
          <div className="h-56 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={donorStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donorStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-650" />
                <span className="text-slate-500 dark:text-zinc-400">Available ({availableDonorsCount})</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-500 dark:text-zinc-400">Unavailable ({Math.max(0, totalDonorsCount - availableDonorsCount)})</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* DUAL DIVISION: ALERT LISTING & NOTIFICATION PANEL */}
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Main Alert List (col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Emergency Request Management</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Filter, audit, and follow up active emergency dispatches</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-550 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Patient / Hospital..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs text-slate-800 dark:text-zinc-100 w-44"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-300"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="expired">Expired</option>
              </select>

              {/* District filter */}
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-300"
              >
                <option value="all">All Districts</option>
                {['Ernakulam', 'Thrissur', 'Thiruvananthapuram', 'Chennai', 'Bengaluru Urban'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Blood group filter */}
              <select
                value={bloodGroupFilter}
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-300"
              >
                <option value="all">All Groups</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950/65 text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="px-4 py-3 rounded-l-xl">Patient Name</th>
                  <th className="px-4 py-3">Blood Group</th>
                  <th className="px-4 py-3">Hospital / Location</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expires At</th>
                  <th className="px-4 py-3 rounded-r-xl text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 dark:text-zinc-500">No emergency blood requests match filters.</td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const statusVal = req.status || 'pending';
                    return (
                      <tr 
                        key={req.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/35 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(req)}
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{req.patientName || req.patient_name}</td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-650 rounded-lg font-black text-sm">
                            {req.bloodGroup || req.blood_group}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px] truncate">
                          <div className="font-semibold text-slate-800 dark:text-zinc-200">{req.hospitalName || req.hospital_name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{req.district}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            req.priority === 'critical' 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/45 dark:text-rose-400 animate-pulse' 
                              : req.priority === 'high' 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-400' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-400'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-1 rounded-full font-bold text-[9px] uppercase border ${
                            statusVal === 'fulfilled' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400' 
                              : statusVal === 'expired' 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-500' 
                              : statusVal === 'accepted' 
                              ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-450'
                              : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-450'
                          }`}>
                            {statusVal}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                          {new Date(req.expiresAt || req.expires_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 font-bold rounded-lg text-[10px] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(req);
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Notification Center (col-span-1) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Alert Center</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            </div>

            <div className="space-y-3">
              {recentNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-2xl border text-xs relative overflow-hidden ${
                    n.type === 'critical' 
                      ? 'bg-rose-50/50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-300' 
                      : n.type === 'failed' 
                      ? 'bg-amber-50/55 border-amber-105 text-amber-700 dark:bg-amber-950/20 dark:border-amber-950/40 dark:text-amber-350' 
                      : 'bg-slate-50 dark:bg-zinc-950/40 border-slate-150 dark:border-zinc-850 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold leading-normal">{n.text}</p>
                    <span className="text-[9px] text-slate-400 whitespace-nowrap shrink-0">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl flex items-center justify-between gap-2 border border-slate-100 dark:border-zinc-900">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Total Database Donors:</span>
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-white">{totalDonorsCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: DISPATCH EMERGENCY ALERT */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-3xl p-6 max-w-md w-full shadow-2xl text-left"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3.5 mb-4">
                <div>
                  <h3 className="text-md font-black text-slate-900 dark:text-white">Broadcast Emergency Alert</h3>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">This will send an immediate FCM push notification to matching local donors.</p>
                </div>
                <button 
                  onClick={() => setShowRequestModal(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Blood Group Needed</label>
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Units Required</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.unitsRequired}
                      onChange={(e) => setForm({ ...form, unitsRequired: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Hospital / Medical Center</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Hospital Kochi"
                    value={form.hospitalName}
                    onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">District</label>
                    <select
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs"
                    >
                      {['Ernakulam', 'Thrissur', 'Thiruvananthapuram', 'Chennai', 'Bengaluru Urban'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={form.contactNumber}
                      onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Priority Level</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical (SOS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Target Radius (KM)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.radius}
                      onChange={(e) => setForm({ ...form, radius: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1">Emergency Message (Optional)</label>
                  <textarea
                    rows="2"
                    placeholder="Include surgical details, blood component, or direct landmarks..."
                    value={form.emergencyMessage}
                    onChange={(e) => setForm({ ...form, emergencyMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold rounded-2xl text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-red-200 dark:shadow-none cursor-pointer"
                  >
                    Broadcast Alert
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EMERGENCY REQUEST DETAILS & RESPONSES */}
      <AnimatePresence>
        {selectedRequest && emergencyDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-left flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-650 text-[10px] font-black rounded-lg">
                      {emergencyDetails.request.blood_group}
                    </span>
                    <h3 className="text-md font-black text-slate-900 dark:text-white">Emergency Dispatch Audit</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Audit live responses and dispatch statuses for emergency alert #{emergencyDetails.request.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal scroll area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                
                {/* Info block */}
                <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-850 rounded-2xl p-4.5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-550 block font-semibold">Patient Name</span>
                      <span className="font-bold text-slate-800 dark:text-white">{emergencyDetails.request.patient_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-550 block font-semibold">Hospital</span>
                      <span className="font-bold text-slate-800 dark:text-white">{emergencyDetails.request.hospital_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-550 block font-semibold">Units Requested</span>
                      <span className="font-bold text-slate-800 dark:text-white">{emergencyDetails.request.units_required} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-550 block font-semibold">Contact Number</span>
                      <span className="font-bold text-slate-800 dark:text-white">{emergencyDetails.request.contact_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-550 block font-semibold">District & Location</span>
                      <span className="font-bold text-slate-800 dark:text-white">{emergencyDetails.request.district}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-550 block font-semibold">Priority Level</span>
                      <span className="font-bold text-rose-650 uppercase">{emergencyDetails.request.priority}</span>
                    </div>
                  </div>
                  
                  {emergencyDetails.request.emergency_message && (
                    <div className="pt-2.5 border-t border-slate-200 dark:border-zinc-800 text-xs">
                      <span className="text-slate-400 dark:text-zinc-550 block font-semibold mb-1">Emergency Message</span>
                      <p className="text-slate-650 dark:text-zinc-400 italic">"{emergencyDetails.request.emergency_message}"</p>
                    </div>
                  )}
                </div>

                {/* Audit details / Responses */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-2.5 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-650" /> Donor Responses ({emergencyDetails.responses.length})
                  </h4>

                  {emergencyDetails.responses.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-400 dark:text-zinc-500">
                      Waiting for targeted local donors to respond to push notifications...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {emergencyDetails.responses.map((resp) => {
                        const statusVal = resp.response_status || 'accepted';
                        return (
                          <div 
                            key={resp.id} 
                            className="p-3 bg-white dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 rounded-2xl flex items-center justify-between text-xs"
                          >
                            <div className="text-left">
                              <p className="font-bold text-slate-800 dark:text-white">{resp.donor?.fullName || 'Anonymous Donor'}</p>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{resp.donor?.bloodGroup || 'O+'} • {resp.donor?.mobile || '999'}</p>
                            </div>
                            
                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase border ${
                              statusVal === 'accepted' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450' 
                                : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450'
                            }`}>
                              {statusVal === 'accepted' ? 'Accepted' : 'Rejected'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>



              </div>

              <div className="pt-4 border-t border-slate-150 dark:border-zinc-800 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
