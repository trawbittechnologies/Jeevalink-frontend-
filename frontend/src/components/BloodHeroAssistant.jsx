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
  ChevronRight
} from 'lucide-react';
import CommunityChoiceModal from './CommunityChoiceModal.jsx';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import MascotVideo from './MascotVideo.jsx';

export default function BloodHeroAssistant() {
  const location = useLocation();
  const allowedPaths = ['/', '/login'];



  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "👋 **Hello!** I am **Hemo**, your assistant for JeevaLink blood donation platform.\n\nI am here to help you with donor eligibility, blood group matching, emergency requests, and platform services.\n\nHow can I help you today?"
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

  if (!allowedPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <>
      <CommunityChoiceModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />

      <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-[9990] flex flex-col items-end pointer-events-none select-none">
        <AnimatePresence>
          {/* Expanded Assistant Chatbox Dialog */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="pointer-events-auto mb-4 w-80 sm:w-[410px] rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col h-[540px] max-h-[85vh]"
            >
              {/* Creative Glass Header */}
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-white/40 shadow-md flex items-center justify-center bg-white">
                    <img src="/hemo_avatar.png" alt="Hemo Profile" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black tracking-tight">Hemo</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 border border-emerald-300/30 text-emerald-100 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-red-100 font-medium">JeevaLink Blood Companion</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    title="Reset Chat"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition-all cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chatbox Body */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs bg-slate-50/50 scrollbar-thin">


                {/* Quick Topic Prompts */}
                {messages.length <= 2 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Suggested Questions</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleSendMessage(prompt.query)}
                          className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-red-50/60 border border-slate-200/70 hover:border-red-200 text-slate-700 hover:text-red-700 font-semibold text-[11px] transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                        >
                          <span>{prompt.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation History */}
                <div className="space-y-3 pt-1">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] p-3.5 rounded-2xl shadow-2xs ${msg.sender === 'user'
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-tr-xs'
                          : msg.isError
                            ? 'bg-rose-50 text-rose-900 border border-rose-200 font-medium rounded-tl-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                          }`}
                      >
                        <div className="text-[12px] whitespace-pre-wrap leading-relaxed">
                          {msg.sender === 'assistant' ? renderFormattedText(msg.text) : msg.text}
                        </div>

                        {/* Language Selection Buttons after first AI reply */}
                        {msg.sender === 'assistant' && idx === 2 && !languageSelected && (
                          <div className="mt-3 flex gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleLanguageSelect('Malayalam')}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                            >
                              മലയാളം
                            </button>
                            <button
                              onClick={() => handleLanguageSelect('English')}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                            >
                              English
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex justify-start">
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 rounded-tl-xs shadow-2xs flex items-center gap-2.5">
                        <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                        <span className="text-[11px] font-semibold text-slate-700">Hemo is typing...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick Action Navigation Links */}
              <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200/60 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAction('/donor/search')}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-red-50 border border-slate-200 text-slate-700 hover:text-red-600 text-[10px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Search className="w-3 h-3 text-red-600" />
                  <span>Find Donors</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('/requests')}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-red-50 border border-slate-200 text-slate-700 hover:text-red-600 text-[10px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Droplets className="w-3 h-3 text-red-600" />
                  <span>Blood Requests</span>
                </button>
              </div>

              {/* Chat Input Form */}
              <div className="p-3 border-t border-slate-200/80 bg-white shrink-0">
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
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isThinking}
                    className="p-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl transition-all disabled:opacity-40 shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Mascot Trigger Button */}
        <div className="relative pointer-events-auto flex items-center gap-3">
          <AnimatePresence>
            {showTooltip && !isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 whitespace-nowrap"
              >
                <span>Chat with Hemo</span>
                <button
                  type="button"
                  onClick={() => setShowTooltip(false)}
                  className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setShowTooltip(false);
            }}
            whileTap={{ scale: 0.94 }}
            className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center p-0 bg-transparent border-0 outline-none cursor-pointer group drop-shadow-xl"
          >
            <MascotVideo
              showBubble={!isOpen}
              className="w-full h-full object-contain filter drop-shadow(0 12px 24px rgba(220,38,38,0.35))"
            />
          </motion.button>
        </div>
      </div>
    </>
  );
}
