import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';

export default function Toast() {
  const { toast, clearToast } = useAppStore();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-white shrink-0" />,
    error:   <XCircle className="w-5 h-5 text-white shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-white shrink-0" />,
    info:    <Info className="w-5 h-5 text-white shrink-0" />,
  };

  return (
    <div className="fixed top-8 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={clearToast}
            className="pointer-events-auto flex items-center gap-3 px-6 py-3.5 rounded-full bg-red-600 text-white shadow-[0_8px_30px_rgb(220,38,38,0.3)] cursor-pointer max-w-md w-max"
          >
            {icons[toast.type] || icons.info}
            <p className="text-sm font-bold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
