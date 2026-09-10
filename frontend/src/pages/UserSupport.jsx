import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Phone, Send, Headphones,
  CheckCircle2, Loader2, ArrowLeft,
  User, RotateCcw,
  Wrench, Droplets, ShieldAlert,
  Copy, Check, Sparkles,
  ClipboardList,
  ChevronRight, RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import api from '../store/api.js';

const QUICK_ACTIONS = [
  {
    id: 'blood_information',
    label: 'Blood Donation',
    icon: Droplets,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-100',
    description: 'Ask blood donation and compatibility questions',
    prompt: 'Tell me about blood donation eligibility rules and blood group compatibility.'
  },
  {
    id: 'technical_support',
    label: 'Technical Problem',
    icon: Wrench,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 border-blue-100',
    description: 'Report login, OTP, profile, request, or app bugs',
    prompt: 'I am experiencing a technical issue with the application.'
  },
  {
    id: 'report_complaint',
    label: 'Report / Complaint',
    icon: ShieldAlert,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-100',
    description: 'Report fake requests, harassment, or misconduct',
    prompt: 'I want to file a formal complaint or safety report.'
  },
  {
    id: 'my_support',
    label: 'My Support',
    icon: ClipboardList,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-100',
    description: 'View support tickets, status, and responses',
    prompt: null
  }
];

const COMPLAINT_CATEGORIES = [
  'Fake blood request',
  'Suspicious user',
  'Harassment / Abuse',
  'Misleading information',
  'Suspicious activity',
  'Donation-related issue',
  'Hospital issue',
  'Other'
];

// Clean text & markdown renderer
function renderMessageContent(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />;

    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ');
    const isHeading = line.trim().startsWith('# ') || line.trim().startsWith('## ') || line.trim().startsWith('### ');
    const cleanLine = isBullet ? line.trim().replace(/^[*•-]\s*/, '') : isHeading ? line.trim().replace(/^#+\s*/, '') : line;

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isHeading) {
      return (
        <h4 key={i} className="font-black text-slate-900 text-xs sm:text-sm mt-2 mb-1">
          {content}
        </h4>
      );
    }

    return isBullet ? (
      <div key={i} className="flex items-start gap-2 ml-1 my-0.5">
        <span className="text-red-500 font-bold shrink-0 mt-0.5 text-xs">•</span>
        <span className="text-slate-700">{content}</span>
      </div>
    ) : (
      <p key={i} className="my-0.5 text-slate-700">{content}</p>
    );
  });
}

export default function UserSupport() {
  const { user } = useAuthStore();
  const { triggerToast } = useAppStore();

  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'tickets' | 'human'

  // AI Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `**Hello ${user?.primaryName || user?.name || 'there'}!** I am your **Support AI** assistant.\n\nI can help you with:\n- **Blood Donation**: Guidelines, eligibility, blood compatibility.\n- **Technical Support**: Login, OTP, GPS, profile, or app issues.\n- **Complaints & Safety**: Reporting fake requests, suspicious activity, or misconduct.\n\nHow can I help you today? (English, മലയാളം, or Manglish supported)`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Tickets State (My Support)
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Report & Complaint Wizard State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintStep, setComplaintStep] = useState('form'); // 'form' | 'review'
  const [complaintForm, setComplaintForm] = useState({
    category: 'Fake blood request',
    description: '',
    involvedParty: '',
    requestId: '',
    priority: 'HIGH',
    contactPhone: user?.mobile || ''
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'ai') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  // Fetch tickets for My Support
  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get('/technical-reports');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTickets(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchMyTickets();
    }
  }, [activeTab]);

  // Send message to AI
  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isThinking) return;

    const currentHistory = [...messages];
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await queryJeevaLinkAI(query, currentHistory);
      setMessages(prev => [...prev, { sender: 'assistant', text: response }]);
    } catch (err) {
      console.error('[UserSupport AI] Error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: err.message || 'Support AI is temporarily unavailable. You can still create a support ticket using the "My Support" or "Human Desk" tab.'
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: `Chat reset. How can I help you with blood donation, technical issues, or complaints?`
      }
    ]);
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    triggerToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleQuickAction = (action) => {
    if (action.id === 'my_support') {
      setActiveTab('tickets');
    } else if (action.id === 'report_complaint') {
      setComplaintStep('form');
      setShowComplaintModal(true);
    } else if (action.prompt) {
      setActiveTab('ai');
      handleSendMessage(action.prompt);
    }
  };

  // Submit Formal Complaint / Ticket
  const handleFinalSubmitComplaint = async () => {
    setSubmittingComplaint(true);
    try {
      const payload = {
        title: `[${complaintForm.priority}] ${complaintForm.category}`,
        category: complaintForm.category,
        priority: complaintForm.priority,
        description: `Category: ${complaintForm.category}\nInvolved Person/Entity: ${complaintForm.involvedParty || 'N/A'}\nRelated Request ID: ${complaintForm.requestId || 'N/A'}\nReporter: ${user?.primaryName || user?.name || 'User'} (${user?.mobile || 'No Phone'})\nReporter District: ${user?.district || 'N/A'}\nCallback Contact: ${complaintForm.contactPhone || user?.mobile || 'N/A'}\n\nStatement:\n${complaintForm.description}`,
      };

      const res = await api.post('/technical-reports', payload);
      if (res.data?.success) {
        triggerToast('Report submitted successfully to authorized admin team', 'success');
        setShowComplaintModal(false);
        setComplaintStep('form');
        setComplaintForm({
          category: 'Fake blood request',
          description: '',
          involvedParty: '',
          requestId: '',
          priority: 'HIGH',
          contactPhone: user?.mobile || ''
        });
        setActiveTab('tickets');
      } else {
        triggerToast(res.data?.message || 'Failed to submit report', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Submission error', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 text-left pb-16 px-2 sm:px-0 font-sans">
      
      {/* ─── 1. HEADER BAR ─── */}
      <div className="bg-white border border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">iDonate Platform</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Support AI Assistant
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-red-600" /> Support & Help AI
            </h1>
          </div>
        </div>

        {/* Top Segmented Navigation Tabs */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> Support AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> My Support
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('human')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'human'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> Human Desk
          </button>
        </div>
      </div>

      {/* ─── 2. 4 QUICK ACTION CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const IconComp = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleQuickAction(action)}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition cursor-pointer shadow-2xs space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${action.iconBg} ${action.iconColor} transition-transform group-hover:scale-105`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {action.label}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── 3. TAB 1: SUPPORT AI CHAT ─── */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5"
        >
          {/* Action Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Interactive AI Consultation
            </span>
            <button
              type="button"
              onClick={handleResetChat}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" /> Clear chat
            </button>
          </div>

          {/* Chat Messages Box */}
          <div className="h-[380px] overflow-y-auto p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3.5 custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`group relative max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-tr-xs shadow-2xs font-medium'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {renderMessageContent(msg.text)}

                  {msg.sender === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.text, index)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5 items-center text-slate-500 text-xs">
                <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-2 text-slate-600 text-xs font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  <span>Analyzing intent & finding answer...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything or describe your problem..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-red-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={isThinking || !inputQuery.trim()}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>

          {/* AI Escalation Prompt Footer */}
          <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-700 font-medium">
              Issue unresolved or need a formal investigation report?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowComplaintModal(true);
                  setComplaintStep('form');
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition cursor-pointer text-[11px]"
              >
                Create Support Ticket / Report
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── 4. TAB 2: MY SUPPORT TICKETS & STATUS ─── */}
      {activeTab === 'tickets' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">My Support Tickets & Reports</h3>
              <p className="text-xs text-slate-500">Track real-time status and responses from admins</p>
            </div>
            <button
              type="button"
              onClick={fetchMyTickets}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingTickets ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600" />
              <p className="text-xs font-medium">Loading support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
              <div>
                <p className="text-xs font-bold text-slate-700">No support tickets found</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                  When you report an issue or complaint, your ticket status and coordinator responses will appear here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowComplaintModal(true);
                  setComplaintStep('form');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Create New Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="border border-slate-200/80 rounded-2xl p-4 space-y-2.5 bg-white shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-[10px] font-bold rounded">
                          {t.id}
                        </span>
                        <span className="text-xs font-black text-slate-900">{t.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Category: <strong>{t.category || 'General'}</strong> • Priority: <strong>{t.priority || 'Medium'}</strong>
                      </p>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      t.status === 'Resolved' || t.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : t.status === 'In Progress' || t.status === 'UNDER_REVIEW'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {t.status || 'OPEN'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {t.description}
                  </p>

                  {t.reply && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Admin / Coordinator Response
                      </div>
                      <p className="text-xs text-emerald-950 whitespace-pre-wrap">{t.reply}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-medium">
                    Logged: {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── 5. TAB 3: HUMAN DESK (3-TIER ESCALATION) ─── */}
      {activeTab === 'human' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4"
        >
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-slate-900">Direct Human Escalation Channels</h3>
            <p className="text-xs text-slate-500">Reach the specific authority for your issue</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tech Admin */}
            <div className="p-4 bg-blue-50/60 border border-blue-200/70 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-blue-900">
                <Wrench className="w-4 h-4 text-blue-600" /> Technical Admin
              </div>
              <p className="text-[11px] text-slate-600">
                Trawbit Technologies team for bug fixes and app errors.
              </p>
              <a
                href="mailto:support@trawbit.com"
                className="block text-xs font-bold text-blue-700 hover:underline pt-1"
              >
                support@trawbit.com →
              </a>
            </div>

            {/* Meghala Committee */}
            <div className="p-4 bg-rose-50/60 border border-rose-200/70 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-rose-900">
                <Droplets className="w-4 h-4 text-rose-600" /> Meghala Committee
              </div>
              <p className="text-[11px] text-slate-600">
                Local volunteer team for blood request coordination.
              </p>
              <a
                href="tel:1910"
                className="block text-xs font-bold text-rose-700 hover:underline pt-1"
              >
                Call Hotline: 1910 →
              </a>
            </div>

            {/* Block Admin */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Block Committee
              </div>
              <p className="text-[11px] text-slate-600">
                Independent oversight for complaints against Meghalas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setComplaintForm(f => ({ ...f, category: 'Suspicious user' }));
                  setShowComplaintModal(true);
                  setComplaintStep('form');
                }}
                className="block text-xs font-bold text-amber-800 hover:underline pt-1 cursor-pointer"
              >
                File Report →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── 6. REPORT / COMPLAINT MODAL (WITH REVIEW STEP) ─── */}
      <AnimatePresence>
        {showComplaintModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl relative space-y-4 text-left"
            >
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    {complaintStep === 'form' ? 'Report an Issue / Complaint' : 'Review Your Report'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {complaintStep === 'form' ? 'Collect details for admin investigation' : 'Confirm information before submission'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {complaintStep === 'form' ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!complaintForm.description.trim()) {
                      triggerToast('Please provide a description', 'error');
                      return;
                    }
                    setComplaintStep('review');
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Category *</label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                    >
                      {COMPLAINT_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Involved Person or Entity</label>
                    <input
                      type="text"
                      value={complaintForm.involvedParty}
                      onChange={(e) => setComplaintForm({ ...complaintForm, involvedParty: e.target.value })}
                      placeholder="e.g. User Name / Hospital / Volunteer Unit"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Related Blood Request ID (Optional)</label>
                    <input
                      type="text"
                      value={complaintForm.requestId}
                      onChange={(e) => setComplaintForm({ ...complaintForm, requestId: e.target.value })}
                      placeholder="e.g. BR-1042"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description of Incident *</label>
                    <textarea
                      rows={3}
                      value={complaintForm.description}
                      onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                      placeholder="Describe what happened clearly..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900 resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowComplaintModal(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                    >
                      Review Report →
                    </button>
                  </div>
                </form>
              ) : (
                /* REVIEW CONFIRMATION STEP */
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block">Category</span>
                      <span className="font-bold text-slate-900">{complaintForm.category}</span>
                    </div>
                    {complaintForm.involvedParty && (
                      <div>
                        <span className="text-slate-400 font-bold block">Involved Party</span>
                        <span className="font-bold text-slate-900">{complaintForm.involvedParty}</span>
                      </div>
                    )}
                    {complaintForm.requestId && (
                      <div>
                        <span className="text-slate-400 font-bold block">Related Request ID</span>
                        <span className="font-bold text-slate-900">{complaintForm.requestId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 font-bold block">Description</span>
                      <span className="text-slate-800 whitespace-pre-wrap">{complaintForm.description}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Your report will be assigned a secure Ticket ID and reviewed by authorized administrators under confidentiality.</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setComplaintStep('form')}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={submittingComplaint}
                      onClick={handleFinalSubmitComplaint}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {submittingComplaint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Submit Report</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
