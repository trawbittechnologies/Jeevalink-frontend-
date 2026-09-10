import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Search,
  Droplets,
  Send,
  RefreshCw,
  RotateCcw,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import CommunityChoiceModal from './CommunityChoiceModal.jsx';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import MascotVideo from './MascotVideo.jsx';

export default function BloodHeroAssistant() {
  const { user } = useAuthStore();
  const location = useLocation();



  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "👋 **Hello!** I am **Hemo**, your assistant for iDonate blood donation platform.\n\nI am here to help you with donor eligibility, blood group matching, emergency requests, and platform services.\n\nHow can I help you today?"
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [languageSelected, setLanguageSelected] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Quick suggestion chips
  const SUGGESTED_PROMPTS = [
    { label: "🩸 Am I eligible to donate?", query: "Am I eligible to donate blood? What are the key requirements?" },
    { label: "🧪 O- Blood compatibility", query: "Which blood groups can receive O- negative blood?" },
    { label: "🚑 How emergency requests work", query: "How do emergency blood requests work on iDonate?" },
    { label: "📍 Find donors in Kerala", query: "How can I find registered voluntary donors across Kerala?" }
  ];

  // Scroll chat messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        if (window.innerWidth < 640) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('resize', handleResize);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Hide initial greeting tooltip after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isThinking) return;

    const currentHistory = [...messages];
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await queryJeevaLinkAI(query, currentHistory);
      setMessages((prev) => [...prev, { sender: 'assistant', text: response }]);
    } catch (err) {
      console.error('[BloodHeroAssistant] Error getting Gemini response:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ **Connection Error**: ${err.message || 'Unable to connect to server. Please try again.'}`,
          isError: true,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLanguageSelect = async (lang) => {
    setLanguageSelected(true);
    const query = `I prefer to communicate in ${lang}. Please reply in ${lang} from now on and greet me.`;
    const currentHistory = [...messages];

    setMessages((prev) => [...prev, { sender: 'user', text: `Selected Language: ${lang}` }]);
    setIsThinking(true);

    try {
      const response = await queryJeevaLinkAI(query, currentHistory);
      setMessages((prev) => [...prev, { sender: 'assistant', text: response }]);
    } catch (err) {
      console.error('[BloodHeroAssistant] Error setting language:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ **Connection Error**: Unable to set language. Please try again.`,
          isError: true,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: "👋 **Chat Reset!** I am **Hemo**. Ask me anything about voluntary blood donation, donor eligibility, or emergency sourcing across Kerala."
      }
    ]);
    setLanguageSelected(false);
  };

  const handleAction = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  // Helper to render bold and bullet formatted text cleanly
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
      const cleanLine = isBullet ? trimmed.replace(/^[*|-]\s+/, '') : line;
      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-extrabold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lIdx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-red-500 font-bold shrink-0">•</span>
            <span className="leading-snug">{formattedLine}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className={lIdx > 0 ? 'mt-1.5 leading-relaxed' : 'leading-relaxed'}>
          {formattedLine}
        </p>
      );
    });
  };

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <>
      <CommunityChoiceModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />

      {/* ── Fixed Assistant Chatbox Dialog (Cleanly Anchored at bottom-right) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-[9999] w-full h-[100dvh] sm:w-[390px] sm:h-[580px] sm:max-h-[min(88vh,620px)] sm:rounded-3xl bg-white shadow-2xl sm:shadow-slate-900/25 border-0 sm:border sm:border-slate-200/90 overflow-hidden flex flex-col select-text"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-3.5 sm:py-3 text-white flex items-center justify-between shrink-0 shadow-md pt-[max(0.875rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white/60 shadow-md flex items-center justify-center bg-white">
                    <img src="/hemo_avatar.png" alt="Hemo Avatar" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-tight leading-none">Hemo</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full leading-none">
                      AI Companion
                    </span>
                  </div>
                  <p className="text-[11px] text-red-100 font-medium mt-0.5">iDonate Blood Network</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Reset Chat"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chatbox Messages Body */}
            <div className="p-4 space-y-3.5 overflow-y-auto overscroll-contain flex-1 text-xs bg-slate-50/70 scrollbar-thin">
              {/* Quick Topic Prompts if few messages */}
              {messages.length <= 2 && (
                <div className="space-y-1.5 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Suggested Topics
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSendMessage(prompt.query)}
                        className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-red-50/60 active:bg-red-100/60 border border-slate-200/80 hover:border-red-200 text-slate-700 hover:text-red-700 font-semibold text-[11.5px] transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                      >
                        <span className="truncate">{prompt.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages List */}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <img
                      src="/hemo_avatar.png"
                      alt="Hemo"
                      className="w-6 h-6 rounded-full object-cover border border-red-200 shrink-0 mb-1"
                    />
                  )}
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-br-xs'
                        : msg.isError
                          ? 'bg-rose-50 text-rose-900 border border-rose-200 font-medium rounded-bl-xs'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <div className="text-[12.5px] whitespace-pre-wrap leading-relaxed">
                      {msg.sender === 'assistant' ? renderFormattedText(msg.text) : msg.text}
                    </div>

                    {/* Language buttons */}
                    {msg.sender === 'assistant' && idx === 2 && !languageSelected && (
                      <div className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleLanguageSelect('Malayalam')}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                        >
                          മലയാളം
                        </button>
                        <button
                          onClick={() => handleLanguageSelect('English')}
                          className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                        >
                          English
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator with 3 bouncing dots */}
              {isThinking && (
                <div className="flex items-end gap-2">
                  <img
                    src="/hemo_avatar.png"
                    alt="Hemo"
                    className="w-6 h-6 rounded-full object-cover border border-red-200 shrink-0 mb-1"
                  />
                  <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                    <span className="text-[11px] font-medium text-slate-500 ml-1">Hemo is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Shortcuts Bar */}
            <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200/70 flex items-center justify-between gap-2 shrink-0">
              {user?.role === 'user' ? (
                <button
                  type="button"
                  onClick={() => handleAction('/donor/eligibility')}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200/80 text-slate-700 hover:text-emerald-700 text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Eligibility</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAction('/donor/search')}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-red-50 active:bg-red-100 border border-slate-200/80 text-slate-700 hover:text-red-700 text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5 text-red-600" />
                  <span>Find Donors</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleAction('/requests')}
                className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-red-50 active:bg-red-100 border border-slate-200/80 text-slate-700 hover:text-red-700 text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
              >
                <Droplets className="w-3.5 h-3.5 text-red-600" />
                <span>Blood Requests</span>
              </button>
            </div>

            {/* Chat Input Form */}
            <div className="p-3 border-t border-slate-200/80 bg-white shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask Hemo about blood donation..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:bg-white transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isThinking}
                  className="p-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl transition-all disabled:opacity-40 shadow-md shadow-red-600/20 active:scale-95 cursor-pointer shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Mascot Trigger Button (Visible only when chat is closed) ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-1 right-1 sm:bottom-3 sm:right-3 z-[9990] flex items-end select-none"
          >
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 whitespace-nowrap mb-8 mr-[-10px] z-10"
              >
                <span>Chat with Hemo</span>
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            <motion.button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setShowTooltip(false);
              }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.04 }}
              className="relative flex items-center justify-center p-0 bg-transparent border-0 outline-none cursor-pointer drop-shadow-xl w-[150px] h-[130px] sm:w-[175px] sm:h-[150px] transition-transform"
              aria-label="Open AI Blood Assistant"
            >
              <MascotVideo showBubble={true} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
