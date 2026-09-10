import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Phone, Send, Headphones,
  CheckCircle2, Loader2, ArrowLeft,
  User, ExternalLink, RotateCcw,
  Wrench, Droplets, ShieldAlert,
  Building2, Mail, Copy, Check, Sparkles,
  Code2, Cpu, Award
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import api from '../store/api.js';

const KNOWLEDGE_PILLS = [
  { label: 'Blood Donation Rules', query: 'What are the key health eligibility criteria for donating blood in Kerala?' },
  { label: 'Blood Compatibility', query: 'Explain blood group compatibility: universal donors and recipients.' },
  { label: 'Emergency SOS Process', query: 'How does the emergency blood request and SOS broadcast work on JeevaLink?' },
  { label: 'Tech Stack & Architecture', query: 'What is the technical architecture, frontend, backend, and database stack of JeevaLink?' },
  { label: 'Trawbit Technologies Team', query: 'Who is Trawbit Technologies and what is their role in JeevaLink?' },
  { label: 'JeevaPoints & Rewards', query: 'How does the JeevaPoints milestone reward system and digital badges work?' },
  { label: 'Hierarchy & Roles', query: 'Explain the platform role hierarchy from User, Unit Squad, Meghala, Block to Super Admin.' },
  { label: 'Report Technical Bug', query: 'How do I report an application bug to Technical Admin Trawbit Technologies?' }
];

// Clean text & markdown renderer
function renderMessageContent(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />;

    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ');
    const isHeading = line.trim().startsWith('# ') || line.trim().startsWith('## ') || line.trim().startsWith('### ');
    const cleanLine = isBullet ? line.trim().replace(/^[\*\-•]\s*/, '') : isHeading ? line.trim().replace(/^#+\s*/, '') : line;

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

  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'human'
  const [complaintType, setComplaintType] = useState('tech'); // 'tech' | 'donation' | 'meghala_complaint'

  // AI Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hi ${user?.primaryName || user?.name || ''}! How can I help you today? Ask me about **blood donation rules, emergency requests, project technical architecture, or platform features**.`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetMeghala: user?.meghala || user?.city || '',
    contactPhone: user?.mobile || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'ai') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

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
          text: err.message || 'Unable to connect to AI server. Please switch to "Human Helpdesk" for direct assistance.'
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
        text: `Chat reset. Ask me anything about blood requests, project technical architecture, or platform features!`
      }
    ]);
  };

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    triggerToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Submit Support / Complaint Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      triggerToast('Please provide a subject title and explanation', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let category = 'Technical App Bug';
      let priority = 'Medium';
      let targetRecipient = 'Tech Admin (Trawbit Technologies)';

      if (complaintType === 'tech') {
        category = 'Technical App Bug';
        priority = 'High';
        targetRecipient = 'Tech Admin (Trawbit Technologies)';
      } else if (complaintType === 'donation') {
        category = 'Blood Donation & Receiving Issue';
        priority = 'Immediate';
        targetRecipient = 'Meghala Committee';
      } else if (complaintType === 'meghala_complaint') {
        category = 'Complaint Against Meghala Committee';
        priority = 'High';
        targetRecipient = 'Block Committee Admin';
      }

      const payload = {
        title: `[${category}] ${form.title}`,
        category,
        priority,
        description: `Target Handler: ${targetRecipient}\nUser: ${user?.primaryName || user?.name || 'User'} (${user?.mobile || 'No Phone'})\nUser Meghala/City: ${user?.meghala || user?.city || 'N/A'}\nUser District: ${user?.district || 'N/A'}\nCallback Contact: ${form.contactPhone || user?.mobile || 'N/A'}\nTarget Meghala/Unit: ${form.targetMeghala || 'N/A'}\n\nDetails:\n${form.description}`,
      };

      const res = await api.post('/technical-reports', payload);
      if (res.data?.success) {
        const ticketId = res.data.data?.id || 'TR-LOGGED';
        setSubmittedTicket({
          id: ticketId,
          type: complaintType,
          targetRecipient,
          title: form.title
        });
        triggerToast('Report submitted successfully to assigned authority', 'success');
        setForm({
          title: '',
          description: '',
          targetMeghala: user?.meghala || user?.city || '',
          contactPhone: user?.mobile || ''
        });
      } else {
        triggerToast(res.data?.message || 'Failed to submit report', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Submission error. Please contact directly.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 text-left pb-16 px-2 sm:px-0 font-sans">
      
      {/* ─── MODERN HEADER BAR ─── */}
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JeevaLink Support</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI + 3-Tier Escalation
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-red-600" /> Support & Help Center
            </h1>
          </div>
        </div>

        {/* Modern Segmented Switcher */}
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
            <Bot className="w-3.5 h-3.5" /> AI Assistant
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
            <Phone className="w-3.5 h-3.5" /> Human Helpdesk
          </button>
        </div>
      </div>

      {/* ─── TAB 1: AI ASSISTANT (BLOOD + TECHNICAL + FEATURES) ─── */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5"
        >
          {/* Quick Knowledge Topics Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Topics & Knowledge Base
              </span>
              <button
                type="button"
                onClick={handleResetChat}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset chat
              </button>
            </div>

            {/* Smart Chips Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
              {KNOWLEDGE_PILLS.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(pill.query)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Box */}
          <div className="h-[370px] overflow-y-auto p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3.5 custom-scrollbar">
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
                  <span>JeevaLink AI is preparing response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
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
              placeholder="Ask about blood donation, project tech, or platform features..."
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

          {/* Quick Escalation Banner */}
          <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-700 font-medium">
              Have an urgent issue or need direct human coordinator assistance?
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('human')}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition cursor-pointer text-[11px] shrink-0"
            >
              Human Helpdesk →
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 2: 3-TIER HUMAN HELPDESK & COMPLAINTS ─── */}
      {activeTab === 'human' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Category Selector (3 Dedicated Channels) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setComplaintType('tech');
                setSubmittedTicket(null);
              }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                complaintType === 'tech'
                  ? 'bg-white text-blue-700 shadow-xs border border-blue-200/80'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>1. Technical Support</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Tech Admin (Trawbit)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintType('donation');
                setSubmittedTicket(null);
              }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                complaintType === 'donation'
                  ? 'bg-white text-rose-700 shadow-xs border border-rose-200/80'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <Droplets className="w-4 h-4 text-rose-600" />
                <span>2. Blood Receive Issue</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Meghala Committee</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintType('meghala_complaint');
                setSubmittedTicket(null);
              }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                complaintType === 'meghala_complaint'
                  ? 'bg-white text-amber-800 shadow-xs border border-amber-200/80'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>3. Meghala Complaint</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Block Committee Admin</span>
            </button>
          </div>

          {/* Assigned Authority Contact Box */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
            
            {/* TYPE 1: TECHNICAL SUPPORT DETAILS */}
            {complaintType === 'tech' && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-200/70 text-blue-900 rounded-full">
                      Assigned Authority: Tech Admin
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      Trawbit Technologies — JeevaLink Engineering Team
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Technical support tickets are handled directly by the Trawbit Technologies technical administration team. Contact our engineering desk:
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Code2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <a
                    href="tel:+919497000000"
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-800 font-bold transition shadow-2xs"
                  >
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Tech Hotline</span>
                  </a>
                  <a
                    href="mailto:support@trawbit.com"
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-800 font-bold transition shadow-2xs"
                  >
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>support@trawbit.com</span>
                  </a>
                  <a
                    href="https://api.whatsapp.com/send?text=Hello%20Trawbit%20Tech%20Admin,%20I%20have%20a%20technical%20issue%20with%20JeevaLink."
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-2xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>WhatsApp Desk</span>
                  </a>
                </div>
              </div>
            )}

            {/* TYPE 2: BLOOD DONATION / RECEIVING ISSUE DETAILS */}
            {complaintType === 'donation' && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-200/70 text-rose-900 rounded-full">
                      Assigned Authority: Meghala Committee
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      Local Meghala Volunteer Committee ({user?.meghala || user?.city || 'Your Area'})
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Issues with donor arrival, urgent hospital blood needs, or certificate verification are handled directly by your local Meghala volunteer committee.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Droplets className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <a
                    href="tel:1910"
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-2xs"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>Emergency (1910)</span>
                  </a>
                  <Link
                    to="/volunteer-directory"
                    className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-2xs"
                  >
                    <User className="w-4 h-4" />
                    <span>Meghala Volunteers</span>
                  </Link>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`URGENT BLOOD ISSUE — JeevaLink\nUser: ${user?.primaryName || user?.name}\nMeghala: ${user?.meghala || user?.city || 'Local'}\nIssue: Need urgent blood assistance.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-2xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>WhatsApp Desk</span>
                  </a>
                </div>
              </div>
            )}

            {/* TYPE 3: COMPLAINT AGAINST MEGHALA DETAILS */}
            {complaintType === 'meghala_complaint' && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-200/80 text-amber-950 rounded-full">
                      Assigned Authority: Block Committee Admin
                    </span>
                    <h3 className="text-sm font-black text-slate-900">
                      Higher Block Committee Escalation Desk
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Complaints against a local Meghala volunteer or committee are escalated above the Meghala level to the <strong>Block Committee Admin</strong> to ensure independent review and prompt corrective action.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700">
                  <div className="font-bold flex items-center gap-1.5 text-slate-900">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Block Committee Redressal Protocol</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Your complaint will be logged securely and visible only to the Block Admin and District leadership. The real human Block Convener will review the report and contact you directly.
                  </p>
                </div>
              </div>
            )}

            {/* Submission Form for Selected Type */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {complaintType === 'tech' && 'Submit Technical Report'}
                {complaintType === 'donation' && 'Submit Blood Donation / Receive Issue'}
                {complaintType === 'meghala_complaint' && 'Submit Complaint to Block Committee'}
              </h4>

              {submittedTicket && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Report Logged Successfully (#{submittedTicket.id})</strong>. Assigned to <strong>{submittedTicket.targetRecipient}</strong>. You will be contacted at your registered phone number.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitTicket} className="space-y-3">
                {complaintType === 'meghala_complaint' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Meghala / Volunteer Unit Name *
                    </label>
                    <input
                      type="text"
                      value={form.targetMeghala}
                      onChange={(e) => setForm({ ...form, targetMeghala: e.target.value })}
                      placeholder="e.g. Kasaragod Meghala / Volunteer Name"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subject / Summary *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={
                      complaintType === 'tech'
                        ? 'e.g. App crashing on profile update'
                        : complaintType === 'donation'
                        ? 'e.g. Donor did not arrive at hospital'
                        : 'e.g. Unresponsive coordinator during emergency'
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Callback Phone Number *</label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="Your mobile number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Detailed Explanation *</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide full details, hospital name, dates, or error messages..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900 resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-2.5 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs ${
                    complaintType === 'tech'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : complaintType === 'meghala_complaint'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>
                    {complaintType === 'tech' && 'Send to Tech Admin (Trawbit)'}
                    {complaintType === 'donation' && 'Send to Meghala Committee'}
                    {complaintType === 'meghala_complaint' && 'Escalate to Block Committee'}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
