import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  PlusSquare,
  Zap,
  BellRing,
  X,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.js';

export default function InstallWebAppModal() {
  const {
    isPromptOpen,
    isIOSGuideOpen,
    platform,
    browser,
    isInstalled,
    install,
    dismissInstallPrompt,
    closeIOSInstructions,
  } = usePWAInstall();

  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPromptOpen) {
        dismissInstallPrompt(true);
      }
    };

    if (isPromptOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPromptOpen, dismissInstallPrompt]);

  // If already installed or prompt not open, render nothing
  if (isInstalled || !isPromptOpen) {
    return null;
  }

  const isIOS = platform === 'ios';
  const showGuide = isIOS || isIOSGuideOpen;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-modal-title"
        aria-describedby="pwa-modal-description"
        ref={modalRef}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dismissInstallPrompt(true)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal / Bottom Sheet Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden z-10 m-0 sm:m-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {/* Header Banner */}
          <div className="relative p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
            <button
              onClick={() => dismissInstallPrompt(true)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 p-0.5 shadow-md shadow-red-500/20 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="/pwa-192x192.png"
                  alt="iDonate App Icon"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>

              <div className="min-w-0 pr-6">
                <span className="inline-block px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/50 text-primary text-[10px] font-black uppercase tracking-wider mb-0.5">
                  Official Web App
                </span>
                <h2
                  id="pwa-modal-title"
                  className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate"
                >
                  {showGuide ? 'Add to Home Screen' : 'Install iDonate'}
                </h2>
                <p
                  id="pwa-modal-description"
                  className="text-xs text-slate-500 dark:text-zinc-400 truncate"
                >
                  Faster access, alerts & offline experience
                </p>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 pt-4 space-y-4">
            {showGuide ? (
              /* iOS Step-by-Step Instructions */
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300">
                  Follow these 3 simple steps in Safari to add iDonate to your iPhone or iPad:
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0 font-black text-xs">
                      1
                    </div>
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">Tap the Share button</span>
                      <p className="text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        Located at the bottom of Safari <Share2 className="w-3.5 h-3.5 text-blue-500 inline" />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/50 text-primary flex items-center justify-center shrink-0 font-black text-xs">
                      2
                    </div>
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">Select "Add to Home Screen"</span>
                      <p className="text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        Scroll down the share sheet to find <PlusSquare className="w-3.5 h-3.5 text-primary inline" />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-850 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-xs">
                      3
                    </div>
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">Tap "Add" in top-right</span>
                      <p className="text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                        The iDonate icon will appear on your home screen!
                      </p>
                    </div>
                  </div>
                </div>

                {browser.isInApp && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <ExternalLink className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>
                      You are in an in-app browser. Tap the menu icon and choose <strong>"Open in Safari"</strong> to enable Add to Home Screen.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={closeIOSInstructions}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-2xl transition-all shadow-md active:scale-[0.99] cursor-pointer"
                >
                  Got It
                </button>
              </div>
            ) : (
              /* Android / Desktop Benefit Points & Direct Install */
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-zinc-300">
                    <div className="w-7 h-7 rounded-xl bg-red-50 dark:bg-red-950/50 text-primary flex items-center justify-center shrink-0">
                      <BellRing className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold">Instant Emergency Blood Alerts</span>
                      <p className="text-slate-400 dark:text-zinc-500 text-[11px]">Real-time push notifications when nearby donors are needed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-zinc-300">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold">Fast One-Tap Access</span>
                      <p className="text-slate-400 dark:text-zinc-500 text-[11px]">Launches instantly from home screen without browser bars</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-700 dark:text-zinc-300">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold">Seamless Native Experience</span>
                      <p className="text-slate-400 dark:text-zinc-500 text-[11px]">Works smoothly offline and takes zero phone storage</p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={install}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-red-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-600/25 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Web App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => dismissInstallPrompt(true)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-sm font-semibold rounded-2xl transition-colors cursor-pointer"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
