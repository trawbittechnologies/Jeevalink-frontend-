import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import { LogOut, Bell, User, HeartPulse, Compass, LayoutDashboard, Settings, Sun, Moon } from 'lucide-react';
import JeevaLinkLogo from './JeevaLinkLogo.jsx';

export default function Header() {
  const { activeView, setActiveView, notifications, triggerToast } = useAppStore();
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Sync state with DOM class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    triggerToast(nextDark ? 'Dark mode enabled!' : 'Light mode enabled!', 'info');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    setActiveView('Login');
    triggerToast('Logged out successfully.', 'info');
  };

  // Hide navigation on splash, login, and register pages
  if (['Splash', 'Login', 'Register'].includes(activeView)) return null;

  const menuItems = [
    { name: 'Dashboard', view: 'Dashboard', icon: LayoutDashboard },
    { name: 'Find Donors', view: 'FindDonors', icon: Compass },
    { name: 'Blood Alerts', view: 'Requests', icon: HeartPulse },
    { name: 'Alerts Feed', view: 'Notifications', icon: Bell, badge: true },
    { name: 'Donor Passport', view: 'Profile', icon: User }
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEWPORT: PERSISTENT SIDEBAR LAYOUT                           */}
      {/* ========================================================================= */}
      <header className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-[#fffdfd] border-r border-slate-100 dark:border-rose-100/50 px-5 py-7 justify-between shrink-0 select-none transition-colors duration-300">
        
        {/* Top Section: Branding Logo */}
        <div className="space-y-8">
          <div 
            onClick={() => setActiveView('Dashboard')}
            className="cursor-pointer hover:opacity-90 transition-opacity px-1"
          >
            <JeevaLinkLogo size={36} textClassName="text-xl" />
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.name}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between group ${
                    isActive 
                      ? 'text-primary bg-primary/5 dark:bg-primary/5 border-l-4 border-primary' 
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-600 dark:hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-slate-450 group-hover:text-slate-655 dark:text-slate-400 dark:group-hover:text-slate-600'}`} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && unreadCount > 0 && (
                    <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-4 text-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Theme Toggles & User Summary Details Card */}
        <div className="pt-5 border-t border-slate-100 dark:border-rose-100/40 space-y-4">
          
          {/* Quick theme toggler control */}
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-600 dark:text-slate-600">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Dark Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                isDark ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-200'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  isDark ? 'translate-x-4' : ''
                }`} 
              />
            </button>
          </div>

          {/* User profile compact passport */}
          <div className="bg-slate-50 dark:bg-rose-50/10 border border-slate-150/70 dark:border-rose-100/30 rounded-2xl p-3 flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-900 truncate">
                {user ? user.primaryName.split(' ')[0] : 'Guest'}
              </h4>
              <p className="text-[9px] font-black text-primary uppercase tracking-wider mt-0.5">
                Group: {user ? user.bloodGroup : 'O-'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveView('Settings')}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-rose-100/40 hover:bg-slate-100 dark:hover:bg-rose-50/30 text-slate-600 dark:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="App Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogout}
                className="w-7 h-7 rounded-lg border border-red-200/40 hover:bg-red-500/10 text-primary flex items-center justify-center cursor-pointer transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEWPORT: TOP HORIZONTAL NAVBAR HEADER                          */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-white/95 dark:bg-white/95 border-b border-slate-100 dark:border-rose-100/40 backdrop-blur-md transition-colors duration-300 select-none">
        <div className="px-6 h-16 flex items-center justify-between">
          
          <div 
            onClick={() => setActiveView('Dashboard')}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <JeevaLinkLogo size={32} textClassName="text-base" />
          </div>

          {/* Quick profile redirect / settings toggle */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black text-slate-800 dark:text-slate-800 leading-none">
                {user ? user.primaryName.split(' ')[0] : 'Guest'}
              </span>
              <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-0.5 leading-none">
                {user ? user.bloodGroup : 'O-'}
              </span>
            </div>
            
            <div className="h-6 w-[1px] bg-slate-150 dark:bg-rose-100/40" />

            <button
              onClick={() => setActiveView('Settings')}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                activeView === 'Settings'
                  ? 'bg-primary/5 border-primary/20 text-primary'
                  : 'bg-white hover:bg-slate-50 dark:bg-white dark:hover:bg-rose-50/20 border-slate-200 dark:border-rose-100/40 text-slate-700 dark:text-slate-650'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
