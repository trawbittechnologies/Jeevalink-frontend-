import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Phone, Send, Sparkles, AlertCircle, Headphones,
  CheckCircle2, Loader2, ArrowLeft,
  ChevronDown, ChevronUp, User, Clock,
  ExternalLink, RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import api from '../store/api.js';

const QUICK_PROMPTS = [
  { label: '🩸 How to request blood?', query: 'How do I create a blood request on JeevaLink and what details are needed?' },
  { label: '🩺 Donor eligibility rules', query: 'What are the health eligibility criteria to donate blood in Kerala?' },
  { label: '📍 How to find donors near me?', query: 'How can I search and contact registered blood donors in my district?' },
  { label: '🏆 What are JeevaPoints?', query: 'How do JeevaPoints and badges work for voluntary blood donors?' },
  { label: '🚨 Emergency SOS process', query: 'What should I do in an immediate life-threatening blood emergency?' }
];

const FAQS = [
  {
    q: 'How fast can I get a blood donor during emergencies?',
    a: 'Emergency requests marked as "Immediate" or "SOS" are broadcast instantly to matching donors and regional Meghala volunteers across your district.'
  },
  {
    q: 'Who verifies donor eligibility and safety?',
    a: 'JeevaLink performs an automated health eligibility check (cooldown periods, age, weight, and general health). Hospital blood bank officers conduct the final clinical screening before blood collection.'
  },
  {
    q: 'Can I speak directly to my local area volunteer?',
    a: 'Yes! You can visit the Volunteer Directory from your dashboard or use the "Contact Real Human" tab on this page to find and call your assigned Meghala coordinator directly.'
  },
  {
    q: 'What if my issue is not resolved by the AI Assistant?',
    a: 'Switch to the "Contact Real Human" tab above to immediately call our 24/7 hotline, message our coordinator on WhatsApp, or file an urgent human callback ticket.'
  }
];

export default function UserSupport() {
  const { user } = useAuthStore();
  const { triggerToast } = useAppStore();

  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'human' | 'faq'

  // AI Chat State
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `👋 **Hello ${user?.primaryName || user?.name || 'there'}!** I am your **JeevaLink AI Assistant** (powered by Groq).\n\nI can answer questions about blood donation, eligibility guidelines, finding voluntary donors, campaigns, and platform features in real time.\n\n*If you have an urgent emergency or need direct human assistance, you can switch to the **"Contact Real Human"** tab anytime.*`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Urgent Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    title: '',
    category: 'Urgent Blood Assistance',
    priority: 'High',
    description: '',
    contactPhone: user?.mobile || ''
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'ai') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  // Send message to Groq AI
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
          text: `⚠️ **Connection Note**: ${err.message || 'Unable to connect to AI server. Please switch to the "Contact Real Human" tab for direct support.'}`
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
        text: `👋 Chat reset. How else can I assist you with JeevaLink today?`
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
        description: `Contact Phone: ${ticketForm.contactPhone || 'N/A'}\nUser: ${user?.primaryName || user?.name || 'User'} (${user?.mobile || 'No Phone'})\nDistrict: ${user?.district || 'Not Set'}\n\nIssue Details:\n${ticketForm.description}`,
      };

      const res = await api.post('/technical-reports', payload);
      if (res.data?.success) {
        const ticketId = res.data.data?.id || 'TR-LOGGED';
        setSubmittedTicketId(ticketId);
        triggerToast('Urgent support ticket submitted to coordinators', 'success');
        setTicketForm({
          title: '',
          category: 'Urgent Blood Assistance',
          priority: 'High',
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
    const text = `*URGENT SUPPORT REQUEST — JeevaLink*\n\nUser: ${user?.primaryName || user?.name || 'Member'}\nPhone: ${user?.mobile || 'N/A'}\nDistrict: ${user?.district || 'Kerala'}\n\nHello Coordinator, I need urgent human assistance regarding an issue on JeevaLink.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-left pb-16 px-2 sm:px-0">
      
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 shadow-2xs p-4 sm:p-5 rounded-3xl">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Support Center</span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-rose-600">2-Tier Helpdesk</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-rose-600" /> Support & Help Center
            </h1>
          </div>
        </div>

        {/* 24/7 Status Pill */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-xs font-black text-emerald-800">AI & Coordinators Online</span>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4 text-rose-600" />
          <span>AI Support (Groq)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('human')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'human'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-red-700 bg-red-50/70 hover:bg-red-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Contact Real Human</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>FAQ & Guides</span>
        </button>
      </div>

      {/* ─── TAB 1: AI SUPPORT (GROQ POWERED) ─── */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4"
        >
          {/* AI Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  JeevaLink AI Support Agent <span className="text-[10px] px-2 py-0.2 bg-rose-200/60 text-rose-800 rounded-full font-bold">Groq LPU Powered</span>
                </h3>
                <p className="text-[11px] text-slate-500">Ask any question for instant resolution or guidance</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetChat}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('human')}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" /> Talk to Human
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 whitespace-nowrap transition cursor-pointer shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="h-[380px] overflow-y-auto p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3.5 custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5 items-center text-slate-500 text-xs italic">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-xs shadow-2xs flex items-center gap-2 text-slate-600 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                  <span>Groq AI is analyzing your query...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
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
              placeholder="Ask anything about blood requests, donors, or app issues..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-rose-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={isThinking || !inputQuery.trim()}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>

          {/* Urgent Escalation Callout in AI tab */}
          <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-rose-950">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Need critical assistance or experiencing a live blood emergency?</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('human')}
              className="px-3 py-1 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition text-[11px] cursor-pointer shrink-0"
            >
              Contact Human Officers →
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 2: CONTACT REAL HUMAN & EMERGENCY ESCALATION ─── */}
      {activeTab === 'human' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Urgent Emergency Alert Callout */}
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 sm:p-6 rounded-3xl shadow-md space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-white/20 rounded-full">
                  24/7 Human Emergency Desk
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Urgent Human Escalation & Hotline
                </h2>
                <p className="text-xs sm:text-sm text-red-100 max-w-xl leading-relaxed">
                  For life-threatening blood needs, urgent coordinator support, or severe account disputes, connect with human coordinators directly.
                </p>
              </div>

              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-white animate-bounce" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Call Control Room */}
              <a
                href="tel:1910"
                className="p-3.5 bg-white text-red-700 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition shadow-sm cursor-pointer text-xs sm:text-sm"
              >
                <Phone className="w-4 h-4 fill-red-700" />
                <span>Call Hotline (1910)</span>
              </a>

              {/* Direct WhatsApp Coordinator */}
              <button
                type="button"
                onClick={handleWhatsAppContact}
                className="p-3.5 bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-sm cursor-pointer text-xs sm:text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>WhatsApp Coordinator</span>
              </button>

              {/* Local Area Volunteer Directory */}
              <Link
                to="/volunteer-directory"
                className="p-3.5 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-sm cursor-pointer text-xs sm:text-sm"
              >
                <User className="w-4 h-4" />
                <span>Area Volunteer List</span>
              </Link>
            </div>
          </div>

          {/* Raise Urgent Support Ticket Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-red-600" /> Submit Ticket / Request Callback
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Our support team and district administrators review and respond to logged tickets directly.
              </p>
            </div>

            {submittedTicketId && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-900 mb-0.5">
                    Ticket Successfully Logged ({submittedTicketId})
                  </span>
                  Your request has been routed to our active human support officers. We will review the details and reach out to you at <strong>{ticketForm.contactPhone || user?.mobile || 'your registered number'}</strong>.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category *</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 text-slate-900"
                  >
                    <option value="Urgent Blood Assistance">Urgent Blood Assistance</option>
                    <option value="Donor Eligibility Dispute">Donor Eligibility / Health Check Issue</option>
                    <option value="Account & Profile Error">Account / Profile Data Issue</option>
                    <option value="Donation Verification & Points">Donation Verification & JeevaPoints</option>
                    <option value="Technical App Bug">Technical App Bug / Error</option>
                    <option value="General Grievance">General Grievance & Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level *</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 text-slate-900"
                  >
                    <option value="Immediate">🚨 Immediate (Life Safety / Critical)</option>
                    <option value="High">⚠️ High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Summary *</label>
                  <input
                    type="text"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                    placeholder="Brief description of the issue"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Callback Phone Number *</label>
                  <input
                    type="tel"
                    value={ticketForm.contactPhone}
                    onChange={(e) => setTicketForm({ ...ticketForm, contactPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Explanation *</label>
                <textarea
                  rows={4}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Please describe what happened, hospital name/location (if emergency), or any details to help us assist you..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500 text-slate-900 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submittingTicket}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit Urgent Support Ticket</span>
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* ─── TAB 3: FAQ & COMMON GUIDES ─── */}
      {activeTab === 'faq' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Frequently Asked Questions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quick answers to the most common queries about JeevaLink voluntary blood donation.
            </p>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/50"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-100/60 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>

                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/50 bg-white"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">Still have an unanswered question?</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Ask Groq AI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('human')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Contact Human
              </button>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
