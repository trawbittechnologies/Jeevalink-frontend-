import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Phone, Send, Headphones,
  CheckCircle2, Loader2, ArrowLeft,
  User, ExternalLink, RotateCcw,
  Wrench, Droplets, ShieldAlert,
  Building2, Mail, MapPin, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import api from '../store/api.js';

const QUICK_PROMPTS = [
  'How to request blood?',
  'Donor eligibility rules',
  'Report technical app issue',
  'Issue with blood receiving / donor',
  'File complaint against Meghala'
];

// Clean text & markdown renderer
function renderMessageContent(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />;

    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ');
    const cleanLine = isBullet ? line.trim().replace(/^[\*\-•]\s*/, '') : line;

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return isBullet ? (
      <div key={i} className="flex items-start gap-1.5 ml-1.5 my-0.5">
        <span className="text-red-500 shrink-0 font-bold">•</span>
        <span>{content}</span>
      </div>
    ) : (
      <p key={i} className="my-0.5">{content}</p>
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
      text: `Hi ${user?.primaryName || user?.name || ''}! How can I help you today? You can ask general questions, or select a help & complaint category below.`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
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

    // Detect if user is asking about specific complaint types to guide them
    const lower = query.toLowerCase();
    let guidedType = null;
    if (lower.includes('tech') || lower.includes('bug') || lower.includes('app error') || lower.includes('login') || lower.includes('crash')) {
      guidedType = 'tech';
    } else if (lower.includes('complaint') || lower.includes('meghala') || lower.includes('volunteer misconduct') || lower.includes('against volunteer')) {
      guidedType = 'meghala_complaint';
    } else if (lower.includes('blood') || lower.includes('receive') || lower.includes('donor issue') || lower.includes('certificate')) {
      guidedType = 'donation';
    }

    const currentHistory = [...messages];
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await queryJeevaLinkAI(query, currentHistory);
      let replyText = response;
      if (guidedType === 'tech') {
        replyText += `\n\n*Tip: For technical issues handled directly by Tech Admin (Trawbit Technologies), switch to the "Contact Human & Report" tab.*`;
      } else if (guidedType === 'meghala_complaint') {
        replyText += `\n\n*Tip: To file a complaint against a Meghala volunteer/committee for review by Block Committee Admin, switch to the "Contact Human & Report" tab.*`;
      } else if (guidedType === 'donation') {
        replyText += `\n\n*Tip: For blood donation/receiving issues handled by your Meghala Committee, switch to the "Contact Human & Report" tab.*`;
      }
      setMessages(prev => [...prev, { sender: 'assistant', text: replyText }]);
    } catch (err) {
      console.error('[UserSupport AI] Error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: err.message || 'Unable to connect to AI server. Please switch to "Contact Human & Report" for direct assistance.'
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
        text: `Chat reset. How can I help you today?`
      }
    ]);
  };

  const handleQuickChannel = (type) => {
    setComplaintType(type);
    setActiveTab('human');
    setSubmittedTicket(null);
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
      
      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 shadow-2xs p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-red-600" /> Support & Complaints Desk
            </h1>
            <p className="text-xs text-slate-500">AI Helpdesk & 3-Tier Escalation</p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> AI Help
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('human')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'human'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> Human & Complaints
          </button>
        </div>
      </div>

      {/* ─── TAB 1: AI SUPPORT ─── */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5"
        >
          {/* 3 Quick Help Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickChannel('tech')}
              className="p-3 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/70 rounded-2xl text-left transition cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                <Wrench className="w-3.5 h-3.5" /> 1. Technical Support
              </div>
              <p className="text-[11px] text-blue-900/80 leading-tight">Viewed by Tech Admin (Trawbit Technologies)</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickChannel('donation')}
              className="p-3 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/70 rounded-2xl text-left transition cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                <Droplets className="w-3.5 h-3.5" /> 2. Donation & Receive
              </div>
              <p className="text-[11px] text-rose-900/80 leading-tight">Viewed by Meghala Committee</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickChannel('meghala_complaint')}
              className="p-3 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/70 rounded-2xl text-left transition cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                <ShieldAlert className="w-3.5 h-3.5" /> 3. Meghala Complaint
              </div>
              <p className="text-[11px] text-amber-900/80 leading-tight">Escalated to Block Committee</p>
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar pt-1">
            {QUICK_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(promptText)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 whitespace-nowrap transition cursor-pointer shrink-0"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Chat Messages Box */}
          <div className="h-[340px] overflow-y-auto p-3.5 bg-slate-50/60 border border-slate-200/70 rounded-2xl space-y-3 custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white rounded-tr-xs shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {renderMessageContent(msg.text)}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
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
                <div className="p-2.5 bg-white border border-slate-200 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-1.5 text-slate-600 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  <span>Thinking...</span>
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
              placeholder="Ask anything or report an issue..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-red-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={isThinking || !inputQuery.trim()}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleResetChat}
              className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear chat
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('human')}
              className="text-red-600 hover:underline font-bold cursor-pointer"
            >
              View 3-Type Human Help & Complaints →
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 2: 3-TYPE HELP & COMPLAINTS (HUMAN DESK) ─── */}
      {activeTab === 'human' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Category Selector (3 Types) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setComplaintType('tech');
                setSubmittedTicket(null);
              }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                complaintType === 'tech'
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-200/60'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>1. Technical Support</span>
              </div>
              <span className="text-[10px] text-slate-500">Handled by Tech Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintType('donation');
                setSubmittedTicket(null);
              }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                complaintType === 'donation'
                  ? 'bg-white text-rose-700 shadow-sm border border-rose-200/60'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <Droplets className="w-4 h-4 text-rose-600" />
                <span>2. Blood Receive Issue</span>
              </div>
              <span className="text-[10px] text-slate-500">Handled by Meghala Comm.</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setComplaintType('meghala_complaint');
                setSubmittedTicket(null);
              }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col gap-1 cursor-pointer ${
                complaintType === 'meghala_complaint'
                  ? 'bg-white text-amber-800 shadow-sm border border-amber-200/60'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>3. Meghala Complaint</span>
              </div>
              <span className="text-[10px] text-slate-500">Escalated to Block Comm.</span>
            </button>
          </div>

          {/* Real Human Contact Card according to selected type */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            
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
                      Technical support reports are routed directly to the Technical Admin queue. For immediate technical emergencies or account issues, contact our engineering desk:
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Wrench className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <a
                    href="tel:+919497000000"
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-800 font-bold transition"
                  >
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Tech Hotline</span>
                  </a>
                  <a
                    href="mailto:support@trawbit.com"
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-800 font-bold transition"
                  >
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>support@trawbit.com</span>
                  </a>
                  <a
                    href="https://api.whatsapp.com/send?text=Hello%20Trawbit%20Tech%20Admin,%20I%20have%20a%20technical%20issue%20with%20JeevaLink."
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-bold transition"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tech WhatsApp</span>
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
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Droplets className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <a
                    href="tel:1910"
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-xs"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>Call Helpline (1910)</span>
                  </a>
                  <Link
                    to="/volunteer-directory"
                    className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-xs"
                  >
                    <User className="w-4 h-4" />
                    <span>Meghala Volunteers</span>
                  </Link>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`URGENT BLOOD ISSUE — JeevaLink\nUser: ${user?.primaryName || user?.name}\nMeghala: ${user?.meghala || user?.city || 'Local'}\nIssue: Need urgent blood assistance.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-xs"
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
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
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
                    {complaintType === 'tech' && 'Send to Tech Admin'}
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
