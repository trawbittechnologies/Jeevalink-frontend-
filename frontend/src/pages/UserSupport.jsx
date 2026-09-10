import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Phone, Send, Headphones,
  CheckCircle2, Loader2, ArrowLeft,
  User, ExternalLink, RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import api from '../store/api.js';

const QUICK_PROMPTS = [
  '🩸 How to request blood?',
  '🩺 Donor eligibility rules',
  '📍 Find donors near me',
  '🏆 What are JeevaPoints?'
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

  // AI Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `👋 Hi ${user?.primaryName || user?.name || ''}! How can I help you today? Ask me anything about blood requests, donation rules, or finding donors.`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Urgent Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'Urgent Blood Assistance',
    priority: 'Immediate',
    description: '',
    contactPhone: user?.mobile || ''
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState(null);

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
          text: `⚠️ ${err.message || 'Unable to connect to AI server. Please switch to "Contact Human" for help.'}`
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
        text: `👋 Chat reset. How can I help you?`
      }
    ]);
  };

  // Submit Urgent Human Support Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      triggerToast('Please provide a subject title and details', 'error');
      return;
    }

    setSubmittingTicket(true);
    try {
      const payload = {
        title: `[${ticketForm.priority}] ${ticketForm.title}`,
        category: ticketForm.category,
        priority: ticketForm.priority,
        description: `Contact Phone: ${ticketForm.contactPhone || 'N/A'}\nUser: ${user?.primaryName || user?.name || 'User'} (${user?.mobile || 'No Phone'})\nDistrict: ${user?.district || 'Not Set'}\n\nDetails:\n${ticketForm.description}`,
      };

      const res = await api.post('/technical-reports', payload);
      if (res.data?.success) {
        const ticketId = res.data.data?.id || 'TR-LOGGED';
        setSubmittedTicketId(ticketId);
        triggerToast('Support ticket sent to coordinators', 'success');
        setTicketForm({
          title: '',
          category: 'Urgent Blood Assistance',
          priority: 'Immediate',
          description: '',
          contactPhone: user?.mobile || ''
        });
      } else {
        triggerToast(res.data?.message || 'Failed to submit ticket', 'error');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Submission error. Please call our helpline.', 'error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleWhatsAppContact = () => {
    const text = `*URGENT HELP — JeevaLink*\nUser: ${user?.primaryName || user?.name || 'User'}\nPhone: ${user?.mobile || 'N/A'}\nDistrict: ${user?.district || 'Kerala'}\n\nHello, I need urgent assistance regarding JeevaLink.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 text-left pb-16 px-2 sm:px-0">
      
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
              <Headphones className="w-5 h-5 text-red-600" /> Support & Help
            </h1>
            <p className="text-xs text-slate-500">AI Assistant & Human Hotline</p>
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
            <Phone className="w-3.5 h-3.5" /> Contact Human
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
          {/* Top Quick Actions Bar */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Live Chat</span>
            <button
              type="button"
              onClick={handleResetChat}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear chat
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
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
          <div className="h-[360px] overflow-y-auto p-3.5 bg-slate-50/60 border border-slate-200/70 rounded-2xl space-y-3 custom-scrollbar">
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
              placeholder="Type your question..."
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

          {/* Urgent Hotline Switch Footer */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('human')}
              className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
            >
              Need urgent human help? Click here to call hotline or message coordinator →
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 2: CONTACT REAL HUMAN ─── */}
      {activeTab === 'human' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Fast Human Contact Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <a
              href="tel:1910"
              className="p-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-xs text-xs sm:text-sm"
            >
              <Phone className="w-4 h-4 fill-white" /> Call Helpline (1910)
            </a>

            <button
              type="button"
              onClick={handleWhatsAppContact}
              className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-xs text-xs sm:text-sm cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" /> WhatsApp Coordinator
            </button>

            <Link
              to="/volunteer-directory"
              className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-xs text-xs sm:text-sm"
            >
              <User className="w-4 h-4" /> Area Volunteers
            </Link>
          </div>

          {/* Simple Callback / Ticket Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Request Coordinator Callback</h3>
              <p className="text-xs text-slate-500">Leave details and a coordinator will contact you.</p>
            </div>

            {submittedTicketId && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Request sent (#{submittedTicketId})</strong>. Our coordinator will call you back shortly.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Issue Type</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                >
                  <option value="Urgent Blood Assistance">🚨 Urgent Blood Request</option>
                  <option value="Donor Eligibility Dispute">Health Check / Eligibility</option>
                  <option value="Account & Profile Error">Account / Profile Issue</option>
                  <option value="Technical App Bug">App Error / Bug</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  placeholder="e.g. Urgent blood needed in Kasaragod"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number for Callback</label>
                <input
                  type="tel"
                  value={ticketForm.contactPhone}
                  onChange={(e) => setTicketForm({ ...ticketForm, contactPhone: e.target.value })}
                  placeholder="Your mobile number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Message / Details</label>
                <textarea
                  rows={3}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Describe your issue..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-900 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingTicket}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingTicket ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Request</span>
              </button>
            </form>
          </div>
        </motion.div>
      )}

    </div>
  );
}
