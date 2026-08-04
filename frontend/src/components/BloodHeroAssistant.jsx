import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Search, Droplets, Send, RefreshCw, Sparkles } from 'lucide-react';
import CommunityChoiceModal from './CommunityChoiceModal.jsx';
import { queryJeevaLinkAI } from '../utils/aiService.js';
import MascotVideo from './MascotVideo.jsx';

export default function BloodHeroAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "👋 Hello! I am Jeeva Hero, your voluntary blood assistant. How can I help you save lives today?"
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

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

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputQuery.trim() || isThinking) return;

    const userText = inputQuery.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await queryJeevaLinkAI(userText);
      setMessages((prev) => [...prev, { sender: 'assistant', text: response }]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'assistant', text: 'Thank you for your question. You can search voluntary donors or register on JeevaLink.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAction = (path) => {
    setIsOpen(false);
    navigate(path);
  };

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
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto mb-4 w-80 sm:w-96 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 overflow-hidden flex flex-col h-[520px]"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {/* Cutout Mascot Avatar */}
                  <div className="w-14 h-14 flex items-center justify-center shrink-0">
                    <MascotVideo className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                      <span>Jeeva Hero Assistant</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-[11px] text-red-100 font-medium">Voluntary Blood Companion</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chatbox Body Area with Cutout Mascot Avatar */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Cutout Character Mascot Avatar Box */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-50/80 border border-red-100/90 shadow-sm">
                  <div className="w-20 h-20 flex items-center justify-center shrink-0">
                    <MascotVideo className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-red-700 uppercase tracking-wider">Jeeva Hero</span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Online</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      Ask any question regarding blood donation criteria or choose a quick shortcut below:
                    </p>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction('/donor/search')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 text-left transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-red-600">Find Donors</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('/requests')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 text-left transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    <Droplets className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-red-600">Blood Requests</span>
                  </button>
                </div>

                {/* Conversation History inside Chatbox */}
                <div className="space-y-3 pt-2">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl ${
                          msg.sender === 'user'
                            ? 'bg-red-600 text-white font-medium rounded-br-none'
                            : 'bg-slate-100 text-slate-800 font-normal rounded-bl-none border border-slate-200/60'
                        }`}
                      >
                        {msg.sender === 'assistant' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-600 mb-1">
                            <Sparkles className="w-3 h-3" /> Jeeva Hero
                          </div>
                        )}
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex justify-start">
                      <div className="p-3 rounded-2xl bg-slate-100 text-slate-500 rounded-bl-none flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                        <span className="text-[11px] font-semibold">Jeeva Hero is typing...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input Form inside Chatbox */}
              <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask Jeeva Hero anything..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isThinking}
                    className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Significantly Enlarged Cutout Floating Mascot Trigger */}
        <div className="relative pointer-events-auto flex items-center gap-3">
          {/* Greeting Speech Tooltip */}
          <AnimatePresence>
            {showTooltip && !isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 whitespace-nowrap"
              >
                <span>Need help with blood sourcing?</span>
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

          {/* Extra Large Cutout Mascot Button */}
          <motion.button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setShowTooltip(false);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center p-0 bg-transparent border-0 outline-none cursor-pointer group drop-shadow-2xl"
          >
            <MascotVideo className="w-full h-full object-contain mix-blend-multiply filter drop-shadow(0 16px 32px rgba(220,38,38,0.45))" />
          </motion.button>
        </div>
      </div>
    </>
  );
}
