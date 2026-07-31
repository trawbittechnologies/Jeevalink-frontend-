import { Home, Users, HeartPulse, Bell, User } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';

export default function BottomNav() {
  const { activeView, setActiveView, notifications } = useAppStore();

  const navItems = [
    { name: 'Home', icon: Home, view: 'Dashboard' },
    { name: 'Donors', icon: Users, view: 'FindDonors' },
    { name: 'Requests', icon: HeartPulse, view: 'Requests' },
    { name: 'Alerts', icon: Bell, view: 'Notifications', badge: true },
    { name: 'Profile', icon: User, view: 'Profile' }
  ];

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Render bottom nav only if not on Splash or Login/Register screens
  if (['Splash', 'Login', 'Register'].includes(activeView)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 max-w-md mx-auto pointer-events-none md:hidden">
      <div className="glass-panel-light dark:glass-panel-dark h-16 w-full rounded-2xl shadow-xl flex items-center justify-around px-2 pointer-events-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          return (
            <button
              key={item.name}
              onClick={() => setActiveView(item.view)}
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 cursor-pointer group"
            >
              {/* Highlight background */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl transition-transform duration-300 scale-100" />
              )}
              
              <Icon 
                className={`w-5.5 h-5.5 transition-all duration-300 ${
                  isActive 
                    ? 'text-primary scale-110' 
                    : 'text-slate-500 dark:text-zinc-400 group-hover:scale-105'
                }`} 
              />
              
              <span className={`text-[10px] font-semibold mt-1 transition-all duration-300 ${
                isActive 
                  ? 'text-primary scale-100 font-bold' 
                  : 'text-slate-500 dark:text-zinc-400 group-hover:opacity-100 opacity-80'
              }`}>
                {item.name}
              </span>

              {/* Notification Badges */}
              {item.badge && unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4 text-center border-2 border-slate-50 dark:border-zinc-950 scale-100">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
