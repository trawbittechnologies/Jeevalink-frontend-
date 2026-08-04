import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Search, Droplets, Phone, ArrowRight } from 'lucide-react';
import CommunityChoiceModal from './CommunityChoiceModal.jsx';

export default function BloodHeroAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const navigate = useNavigate();

  // Hide initial greeting tooltip after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  const handleAction = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleOpenCommunity = () => {
    setIsOpen(false);
    setIsCommunityModalOpen(true);
  };

  return (
    <>
      <CommunityChoiceModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
      />

      <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end pointer-events-none select-none">
        <AnimatePresence>
          {/* Expanded Assistant Dialog Card */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto mb-4 w-80 sm:w-96 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md p-0.5 border border-white/20 overflow-hidden shrink-0">
                    <video
                      src="/ef4440f93e8a494c85ff80cfb1c9bee4.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover rounded-full"
                    />
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

              {/* Card Body */}
              <div className="p-4 space-y-4">
                {/* Greeting Bubble */}
                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-100 text-xs text-slate-700 leading-relaxed font-medium">
                  👋 <strong>Hello!</strong> How can I assist you with blood sourcing today? Select an option:
                </div>

                {/* Quick Action Options */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleAction('/donor/search')}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-red-50/80 border border-slate-200/80 hover:border-red-200 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          Find Voluntary Donors
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Search by blood group & district</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('/requests')}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-red-50/80 border border-slate-200/80 hover:border-red-200 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          Post Emergency Request
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Submit hospital request for verification</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCommunity}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-red-50/80 border border-slate-200/80 hover:border-red-200 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          DYFI Emergency Helpline
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Connect with block coordinators</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Mascot Trigger */}
        <div className="relative pointer-events-auto flex items-center gap-3">
          {/* Greeting Speech Tooltip */}
          <AnimatePresence>
            {showTooltip && !isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-2xl shadow-lg border border-slate-800 flex items-center gap-2 whitespace-nowrap"
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

          {/* Video Character Floating Button */}
          <motion.button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              setShowTooltip(false);
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-red-600 shadow-2xl shadow-red-600/30 flex items-center justify-center p-0.5 overflow-hidden cursor-pointer group"
          >
            {/* Pulsing Aura Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping pointer-events-none" />

            <video
              src="/ef4440f93e8a494c85ff80cfb1c9bee4.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover rounded-full"
            />
          </motion.button>
        </div>
      </div>
    </>
  );
}
