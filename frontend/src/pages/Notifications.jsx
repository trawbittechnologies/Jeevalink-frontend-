import { useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useNavigate } from 'react-router-dom';
import { Bell, Siren, Award, CheckSquare, Sparkles, Inbox, ArrowLeft, MapPin } from 'lucide-react';

export default function Notifications() {
  const { 
    notifications, 
    fetchNotifications, 
    markNotificationRead,
    triggerToast 
  } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = (id) => {
    markNotificationRead(id);
  };

  const handleMarkAllRead = () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    unread.forEach(n => markNotificationRead(n._id));
    triggerToast('All notifications marked as read!', 'success');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'SOS':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-650 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/40 animate-pulse animate-duration-1000">
            <Siren className="w-5 h-5" />
          </div>
        );
      case 'Reward':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Award className="w-5 h-5 fill-amber-500/10" />
          </div>
        );
      case 'Fulfilled':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckSquare className="w-5 h-5" />
          </div>
        );
      case 'Match':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <MapPin className="w-5 h-5" />
          </div>
        );
      case 'Request':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-primary flex items-center justify-center shrink-0 border border-red-100">
            <Sparkles className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-650 flex items-center justify-center shrink-0 border border-purple-100">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 pt-6 pb-24 select-none">
      <div className="max-w-2xl mx-auto">
        {/* Notifications Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all text-slate-800 dark:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100">Alerts Center</h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Real-time emergency updates</p>
          </div>
        </div>

        {notifications.filter(n => !n.read).length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-3xl border-white shadow-[0_8px_30px_rgb(220,38,38,0.04)] hover:shadow-[0_8px_40px_rgb(220,38,38,0.08)] transition-all dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-12 text-center text-slate-400">
          <Inbox className="w-9 h-9 mx-auto mb-3 text-slate-350 dark:text-zinc-750" />
          <p className="text-sm font-semibold">Your inbox is empty</p>
          <p className="text-xs text-slate-500 mt-1">We will alert you when blood requests occur nearby.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.read && handleMarkRead(notif._id)}
              className={`p-4 rounded-2xl border transition-all duration-200 flex gap-3.5 items-start ${
                notif.read 
                  ? 'bg-white/50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800 opacity-70' 
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-750 cursor-pointer shadow-sm'
              }`}
            >
              {getIcon(notif.type)}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className={`text-xs font-bold truncate ${notif.read ? 'text-slate-700 dark:text-zinc-400' : 'text-slate-900 dark:text-zinc-100'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-550 shrink-0 font-medium pl-2">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${notif.read ? 'text-slate-500 dark:text-zinc-500' : 'text-slate-650 dark:text-zinc-350'}`}>
                  {notif.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
