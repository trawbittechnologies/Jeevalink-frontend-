import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Search,
  Droplets,
  Send,
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
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "👋 **Hello!** I am **Hemo**, your assistant for the JeevaLink blood donation network.\n\nI can help you with donor eligibility rules, blood compatibility, emergency requests, and platform services across Kerala.\n\nHow can I help you today?"
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
    { label: "🚑 How emergency requests work", query: "How do emergency blood requests work on JeevaLink?" },
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
      console.error('[BloodHeroAssistant] Error getting response:', err);
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

      {/* ── Fixed Assistant Chatbox Dialog ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[9998] sm:hidden"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              className="fixed inset-x-3 bottom-3 top-14 sm:inset-auto sm:bottom-6 sm:right-6 z-[9999] w-auto sm:w-[385px] sm:h-[590px] sm:max-h-[calc(100vh-48px)] rounded-3xl bg-white shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden flex flex-col select-text"
            >
              {/* Minimal Clean Header */}
              <div className="bg-red-600 px-3.5 py-2.5 text-white flex items-center justify-between shrink-0 shadow-xs select-none">
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/80 shadow-xs flex items-center justify-center bg-white">
                      <img src="/hemo_avatar.png" alt="Hemo" className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-white rounded-full" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[13px] font-bold tracking-tight text-white leading-tight">Hemo</h3>
                      <span className="w-1 h-1 rounded-full bg-emerald-300" />
                      <span className="text-[10px] text-red-100/90 font-medium leading-none">Online</span>
                    </div>
                    <p className="text-[10.5px] text-red-100/80 font-normal leading-tight mt-0.5">JeevaLink</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="Reset Chat"
                    aria-label="Reset Chat"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close"
                    aria-label="Close Chat"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
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
                          className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-red-50/50 active:bg-red-100/50 border border-slate-200/70 hover:border-red-200 text-slate-700 hover:text-red-700 font-medium text-[11.5px] transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
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
                      className={`max-w-[85%] p-3.5 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-br-xs shadow-xs'
                          : msg.isError
                            ? 'bg-rose-50 text-rose-900 border border-rose-200 font-medium rounded-bl-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs'
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
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            മലയാളം
                          </button>
                          <button
                            onClick={() => handleLanguageSelect('English')}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            English
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isThinking && (
                  <div className="flex items-end gap-2">
                    <img
                      src="/hemo_avatar.png"
                      alt="Hemo"
                      className="w-6 h-6 rounded-full object-cover border border-red-200 shrink-0 mb-1"
                    />
                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                      <span className="text-[11px] font-medium text-slate-500 ml-1">Hemo is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Minimal Action Shortcuts Bar */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                {user?.role === 'user' ? (
                  <button
                    type="button"
                    onClick={() => handleAction('/donor/eligibility')}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200/70 text-slate-700 hover:text-emerald-700 text-[10.5px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Eligibility</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAction('/donor/search')}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-red-50 active:bg-red-100 border border-slate-200/70 text-slate-700 hover:text-red-700 text-[10.5px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Search className="w-3.5 h-3.5 text-red-600" />
                    <span>Find Donors</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAction('/requests')}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-red-50 active:bg-red-100 border border-slate-200/70 text-slate-700 hover:text-red-700 text-[10.5px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Droplets className="w-3.5 h-3.5 text-red-600" />
                  <span>Blood Requests</span>
                </button>
              </div>

              {/* Chat Input Form */}
              <div className="p-3 border-t border-slate-100 bg-white shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isThinking}
                    className="p-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl transition-all disabled:opacity-35 shadow-sm active:scale-95 cursor-pointer shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating Mascot Trigger Button (Responsive Size) ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 z-[9990] flex items-end select-none pointer-events-auto"
          >
            <motion.button
              type="button"
              onClick={() => setIsOpen(true)}
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.05 }}
              className="relative flex items-center justify-center p-0 bg-transparent border-0 outline-none cursor-pointer drop-shadow-2xl w-[76px] h-[76px] sm:w-[110px] sm:h-[110px] md:w-[135px] md:h-[135px] transition-all"
              aria-label="Open Hemo Blood Assistant"
            >
              <MascotVideo showBubble={true} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
