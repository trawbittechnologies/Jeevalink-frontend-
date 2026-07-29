import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = "Delete Blood Request?", message = "Are you sure you want to delete this request? This action cannot be undone." }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card - Red & White Theme */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-red-100 p-6 text-center"
        >
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>

          {/* Red Alert Icon Banner */}
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
            <Trash2 className="w-8 h-8 fill-red-600/10 text-red-600 animate-bounce" />
          </div>

          {/* Title & Message */}
          <h3 className="text-lg font-black text-gray-900 leading-tight">
            {title}
          </h3>
          <p className="text-xs font-medium text-gray-500 mt-2 px-2">
            {message}
          </p>

          {/* Warning Pill */}
          <div className="mt-4 p-2.5 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-red-600">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Permanent Action — Request will be removed</span>
          </div>

          {/* Footer Buttons - Red & White Theme */}
          <div className="flex gap-3 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-xl shadow-red-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Request
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
