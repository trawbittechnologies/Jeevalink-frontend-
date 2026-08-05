import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, Users, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function CommunityChoiceModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleYes = () => {
    onClose();
    navigate('/login');
  };

  const handleNo = () => {
    onClose();
    navigate('/volunteer-directory');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden z-10 p-6 sm:p-8"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header & Creative Title */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-50 border border-red-200/80 rounded-full text-red-600 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Enter The Community</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Do you already have an account?
            </h2>

            <p className="text-sm text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Choose your path below to access your portal or connect with your local area volunteer coordinator.
            </p>
          </div>

          {/* Choice Cards */}
          <div className="space-y-4">
            {/* Option 1: Already Have Account */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleYes}
              className="w-full text-left p-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl shadow-red-500/20 border border-red-500 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                  <LogIn className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-200 bg-white/10 px-2 py-0.5 rounded-md">
                      Yes
                    </span>
                    <span className="text-xs text-red-100 font-medium">Existing Member</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white flex items-center justify-between">
                    I Have An Account
                    <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-red-100/90 mt-1">
                    Log in with your email/phone to open your dashboard & manage blood requests.
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Option 2: No Account / Contact Volunteer */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNo}
              className="w-full text-left p-5 rounded-2xl bg-slate-50 hover:bg-red-50/60 border border-slate-200 hover:border-red-300 text-slate-900 shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                      No
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Need Volunteer Support</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-between group-hover:text-red-600 transition-colors">
                    Contact Your Area Volunteer
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your District & Block Committee to find direct volunteer contact numbers.
                  </p>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified 24/7 DYFI Emergency Blood Network</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
