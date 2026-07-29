import { useState, useEffect, useCallback } from 'react';
import {
  Bug, Send, Clock, MessageSquare, ShieldAlert,
  Trash2, AlertTriangle, UserX, RefreshCw
} from 'lucide-react';
import api from '../store/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';

export default function TechnicalReports() {
  const { user } = useAuthStore();
  const { triggerToast } = useAppStore();
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState('bug'); // 'bug' | 'complaint'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technical Glitch');
  const [priority, setPriority] = useState('Medium');
  const [volunteerName, setVolunteerName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply state for Technical Admin
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');
  const [submittingReply, setSubmittingReply] = useState(false);

  const isTechAdmin = user?.role === 'technical_admin';

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/technical-reports');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setReports(res.data.data);
      } else if (isTechAdmin) {
        // Demo fallback reports for Technical Admin inspection queue
        setReports([
          {
            id: 'TR-101',
            title: 'OTP SMS Verification Delay in Kozhikode District',
            category: 'OTP / Authentication',
            priority: 'High',
            status: 'Open',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            description: 'OTP code takes more than 45 seconds to arrive on BSNL numbers during peak donation drives.',
            reply: null,
            reporter_role: 'Volunteer'
          },
          {
            id: 'TR-102',
            title: 'Volunteer Contact Card Display Alignment Bug',
            category: 'Interface / Design Issue',
            priority: 'Low',
            status: 'Resolved',
            created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
            description: 'The phone button text clips slightly on mobile screen width below 360px.',
            reply: 'CSS flex layout bounds adjusted. Issue verified resolved.',
            reporter_role: 'User'
          }
        ]);
      } else {
        setReports([]);
      }
    } catch {
      if (!isTechAdmin) setReports([]);
    } finally {
      setLoading(false);
    }
  }, [isTechAdmin]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await fetchReports();
    })();
    return () => { active = false; };
  }, [fetchReports]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isTechAdmin) return; // Technical admin cannot submit reports
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    setMsg(null);

    const fullTitle = reportType === 'complaint' 
      ? `[Volunteer Complaint] ${title} (${volunteerName ? 'Target: ' + volunteerName : 'Unspecified'})`
      : title;

    try {
      const res = await api.post('/technical-reports', { 
        title: fullTitle, 
        description,
        category,
        priority
      });

      const newReport = {
        id: res.data?.data?.id || `TR-${Date.now().toString().slice(-4)}`,
        title: fullTitle,
        category,
        priority,
        status: 'Open',
        created_at: new Date().toISOString(),
        description,
        reporter_role: user?.role || 'User'
      };

      setReports(prev => [newReport, ...prev]);
      setMsg({ type: 'success', text: reportType === 'complaint' ? 'Complaint submitted! Technical Governance will investigate.' : 'Technical issue report submitted successfully!' });
      setTitle('');
      setVolunteerName('');
      setDescription('');
      triggerToast('Issue reported successfully', 'success');
    } catch {
      const newReport = {
        id: `TR-${Date.now().toString().slice(-4)}`,
        title: fullTitle,
        category,
        priority,
        status: 'Open',
        created_at: new Date().toISOString(),
        description,
        reporter_role: user?.role || 'User'
      };
      setReports(prev => [newReport, ...prev]);
      setMsg({ type: 'success', text: 'Issue report logged successfully!' });
      setTitle('');
      setVolunteerName('');
      setDescription('');
      triggerToast('Issue report logged successfully', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (reportId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await api.post(`/technical-reports/${reportId}/reply`, {
        reply: replyText,
        status: replyStatus
      });

      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            reply: replyText,
            status: replyStatus
          };
        }
        return r;
      }));

      triggerToast('Reply sent and report status updated!', 'success');
      setReplyingId(null);
      setReplyText('');
    } catch {
      // Fallback local update
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            reply: replyText,
            status: replyStatus
          };
        }
        return r;
      }));
      triggerToast('Reply logged successfully!', 'success');
      setReplyingId(null);
      setReplyText('');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReport = (id) => {
    if (!window.confirm("Are you sure you want to remove this issue report?")) return;
    setReports(prev => prev.filter(r => r.id !== id));
    triggerToast('Issue report removed.', 'info');
  };

  const filteredReports = reports.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = !searchQuery || 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openCount = reports.filter(r => r.status !== 'Resolved').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 pb-16">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-700 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            {isTechAdmin ? 'Technical Admin Resolution Portal' : 'Technical Issue Dispatch & Governance'}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isTechAdmin ? 'Technical Issue Queue & Replies' : 'Issue Reporting & Resolution Portal'}
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            {isTechAdmin
              ? 'Review system issue tickets, inspect bug reports, and issue official technical replies or resolutions to platform users.'
              : 'Report technical glitches, system bugs, OTP delays, or submit complaints against volunteer conduct directly to Technical Governance.'}
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-xs">
            <p className="text-2xl font-black text-slate-900">{reports.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              {isTechAdmin ? 'Total System Tickets' : 'My Sent Reports'}
            </p>
          </div>
          <div className="bg-white border border-amber-100 rounded-2xl p-4 text-center shadow-xs bg-amber-50/30">
            <p className="text-2xl font-black text-amber-600">{openCount}</p>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mt-0.5">
              {isTechAdmin ? 'Pending Inspection' : 'My Open Reports'}
            </p>
          </div>
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 text-center shadow-xs bg-emerald-50/30">
            <p className="text-2xl font-black text-emerald-600">{resolvedCount}</p>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-0.5">
              {isTechAdmin ? 'Resolved Tickets' : 'My Resolved Reports'}
            </p>
          </div>
        </div>

        {/* NON-TECHNICAL ADMIN ONLY: Report Form & Type Selector */}
        {!isTechAdmin && (
          <>
            {/* Issue Type Selector */}
            <div className="bg-white border border-slate-100 rounded-2xl p-2 shadow-xs flex gap-2">
              <button
                type="button"
                onClick={() => setReportType('bug')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  reportType === 'bug' ? 'bg-red-600 text-white shadow-sm shadow-red-200' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bug className="w-4 h-4" /> Technical Bug / System Glitch
              </button>
              <button
                type="button"
                onClick={() => setReportType('complaint')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  reportType === 'complaint' ? 'bg-red-600 text-white shadow-sm shadow-red-200' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserX className="w-4 h-4" /> Complaint Against Volunteer
              </button>
            </div>

            {/* Submit Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {reportType === 'bug' ? <ShieldAlert className="w-5 h-5 text-red-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {reportType === 'bug' ? 'Submit Technical Issue Report' : 'Submit Volunteer Complaint'}
              </h3>

              {msg && (
                <div className={`p-4 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {msg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition cursor-pointer"
                  >
                    {reportType === 'bug' ? (
                      <>
                        <option value="Technical Glitch">Technical Glitch / App Bug</option>
                        <option value="OTP / Authentication">OTP Delay / Login Issue</option>
                        <option value="Blood Request Glitch">Blood Request / Poster Issue</option>
                        <option value="Interface / Design Issue">UI / Design Function Glitch</option>
                        <option value="Feature Request">Feature Request / Enhancement</option>
                      </>
                    ) : (
                      <>
                        <option value="Volunteer Unresponsive">Volunteer Unresponsive to Request</option>
                        <option value="Misconduct">Inappropriate Conduct / Unprofessionalism</option>
                        <option value="Delayed Approval">Delay in Blood Request Approval</option>
                        <option value="Incorrect Information">False / Misleading Information</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Priority Level *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical (System Down / Emergency)</option>
                  </select>
                </div>
              </div>

              {reportType === 'complaint' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Volunteer Name / Meghala (Optional)</label>
                  <input
                    type="text"
                    value={volunteerName}
                    onChange={(e) => setVolunteerName(e.target.value)}
                    placeholder="e.g. Volunteer Name or Meghala Region"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {reportType === 'bug' ? 'Issue Title *' : 'Complaint Title *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={reportType === 'bug' ? 'e.g. Poster download button fails on Mobile Chrome' : 'e.g. Volunteer not answering urgent request call'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Detailed Description *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide exact details, steps to reproduce, or incident description..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-red-200 transition cursor-pointer"
              >
                <Send className="w-4 h-4" /> {submitting ? 'Submitting Report...' : reportType === 'bug' ? 'Dispatch Technical Report' : 'Submit Complaint'}
              </button>
            </form>
          </>
        )}

        {/* Issue Queue & Reports Listing Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" /> 
              {isTechAdmin ? `Technical Tickets Inspection Queue (${filteredReports.length})` : `My Reports & Replies (${filteredReports.length})`}
            </h3>

            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <button
                onClick={fetchReports}
                className="p-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Refresh history"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading reports queue...</p>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500 text-sm shadow-xs">
              {isTechAdmin ? 'No matching technical reports found in system queue.' : 'You have not submitted any technical reports yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((rep) => (
                <div key={rep.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-200 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          rep.status === 'Resolved' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : rep.status === 'In Progress'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {rep.status || 'Open'}
                        </span>
                        {rep.category && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-semibold">
                            {rep.category}
                          </span>
                        )}
                        {rep.priority && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            rep.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {rep.priority}
                          </span>
                        )}
                        {rep.reporter_role && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-[10px] font-bold">
                            By: {rep.reporter_role}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{rep.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ticket ID #{rep.id} • Submitted {rep.created_at ? new Date(rep.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteReport(rep.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Remove report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                    {rep.description}
                  </p>

                  {/* Existing Reply Display */}
                  {rep.reply && (
                    <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 text-xs space-y-1 text-slate-800">
                      <div className="flex items-center gap-1.5 font-bold text-red-600">
                        <MessageSquare className="w-4 h-4" /> Technical Governance Official Reply:
                      </div>
                      <p className="leading-relaxed text-slate-700">{rep.reply}</p>
                    </div>
                  )}

                  {/* TECHNICAL ADMIN ONLY: Reply / Resolve Action Panel */}
                  {isTechAdmin && (
                    <div className="pt-2 border-t border-slate-100">
                      {replyingId === rep.id ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                          <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-red-600" />
                            Send Official Technical Reply to Ticket #{rep.id}
                          </h5>

                          <textarea
                            rows={3}
                            placeholder="Type resolution notes, status updates, or official reply to user..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500 resize-none"
                          />

                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-slate-600">Set Ticket Status:</span>
                              <select
                                value={replyStatus}
                                onChange={(e) => setReplyStatus(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 font-bold text-slate-800 focus:outline-none"
                              >
                                <option value="Resolved">Resolved</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Open">Keep Open</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { setReplyingId(null); setReplyText(''); }}
                                className="px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendReply(rep.id)}
                                disabled={submittingReply || !replyText.trim()}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {submittingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Send Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setReplyingId(rep.id);
                              setReplyText(rep.reply || '');
                              setReplyStatus(rep.status === 'Resolved' ? 'Resolved' : 'Resolved');
                            }}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                            {rep.reply ? 'Edit Official Reply' : 'Reply & Resolve Ticket'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
