import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal — Confirmation dialog for destructive / important actions.
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   onConfirm    () => void
 *   title        string
 *   message      string
 *   confirmLabel string (default: 'Confirm')
 *   variant      'danger' | 'warning' | 'info'
 *   loading      boolean
 */
export default function ConfirmModal({
  isOpen, onClose, onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}) {
  const variantMap = {
    danger:  { icon: AlertTriangle, bg: 'bg-red-50 border-red-100', text: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20' },
    info:    { icon: AlertTriangle, bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20' },
  };
  const v = variantMap[variant] || variantMap.danger;
  const Icon = v.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[99]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md p-4"
          >
            <div className="bg-white border border-red-100 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              {/* Top Red Gradient Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Red & White Icon Badge */}
              <div className={`w-14 h-14 ${v.bg} border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <Icon className={`w-7 h-7 ${v.text}`} />
              </div>

              {/* Content */}
              <h3 className="text-slate-900 font-black text-center text-lg tracking-tight mb-2">{title}</h3>
              <p className="text-slate-500 text-xs text-center leading-relaxed mb-6 px-2">{message}</p>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-3 text-xs font-bold rounded-2xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${v.btn}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
