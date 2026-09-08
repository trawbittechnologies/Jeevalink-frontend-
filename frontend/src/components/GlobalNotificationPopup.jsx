import { useState, useEffect } from 'react';
import { BellRing, X, Loader2 } from 'lucide-react';
import { requestNotificationPermission } from '../services/firebaseMessaging';
import { useAppStore } from '../store/appStore';

export default function GlobalNotificationPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { triggerToast } = useAppStore();

  useEffect(() => {
    // Check if browser supports notifications
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // If permission is already granted or denied, don't show
    if (Notification.permission !== 'default') {
      return;
    }

    // Check if we prompted recently (within 24 hours)
    const lastPrompted = localStorage.getItem('jeevalink_notification_prompted');
    if (lastPrompted) {
      const timeSincePrompt = Date.now() - parseInt(lastPrompted, 10);
      if (timeSincePrompt < 24 * 60 * 60 * 1000) {
        return; // Prompted within last 24h
      }
    }

    // Delay popup slightly so it doesn't aggressively block on immediate login
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('jeevalink_notification_prompted', Date.now().toString());
    setIsOpen(false);
  };

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        triggerToast('Notifications enabled successfully!', 'success');
        setIsOpen(false);
      } else if (Notification.permission === 'denied') {
        triggerToast('Notification permission blocked by browser.', 'error');
        setIsOpen(false);
      } else {
        triggerToast('Failed to enable notifications.', 'error');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Error enabling notifications.', 'error');
    } finally {
      setIsLoading(false);
      // Even if failed, mark as prompted so we don't annoy them
      localStorage.setItem('jeevalink_notification_prompted', Date.now().toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative h-32 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <BellRing className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="p-6 text-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Don't Miss Alerts!</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Enable notifications to instantly receive urgent blood requests matching your group. Your quick response can save a life.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleAllow}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Setting up...</>
              ) : (
                'Allow Notifications'
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
