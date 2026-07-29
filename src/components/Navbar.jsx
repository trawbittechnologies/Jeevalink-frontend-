import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { LogOut, User, Bell, ChevronDown, Settings, Siren, Award, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorageUrl } from '../store/api.js';

import JeevaLinkLogo from './JeevaLinkLogo.jsx';

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Find Donors', to: '/donor/search' },
  { label: 'Blood Requests', to: '/requests' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'Block Committee Directory', to: '/volunteer-directory' },
  { label: 'Tech Reports', to: '/technical-reports' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { notifications, triggerToast } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    triggerToast('Logged out successfully.', 'success');
    navigate('/login');
  };

  const dashboardLink =
    user?.role === 'technical_admin' ? '/technical-admin' :
    user?.role === 'super_admin' ? '/super-admin' :
    user?.role === 'admin' ? '/admin/dashboard' :
    user?.role === 'volunteer' ? '/volunteer/dashboard' :
    '/donor/dashboard';

  const isActive = (to) => location.pathname === to;

  const getMiniIcon = (type) => {
    switch (type) {
      case 'SOS':
        return (
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-650 flex items-center justify-center shrink-0 border border-red-100 animate-pulse animate-duration-1000">
            <Siren className="w-3.5 h-3.5" />
          </div>
        );
      case 'Reward':
        return (
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Award className="w-3.5 h-3.5" />
          </div>
        );
      case 'Fulfilled':
        return (
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        );
      case 'Match':
        return (
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <MapPin className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-650 flex items-center justify-center shrink-0 border border-purple-100">
            <Bell className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-gray-100'
          : 'border-b border-gray-100'
      }`}
      style={{ background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.95)' }}
    >
      <div className="container-wide flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <JeevaLinkLogo size={36} textClassName="text-[17px]" />
        </Link>

        {/* Desktop Nav — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-0.5">
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive(link.to)
                  ? 'text-primary bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
              {isActive(link.to) && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications — desktop only */}
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors cursor-pointer"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-3 z-50 border border-gray-100 bg-white"
                    >
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-800">Recent Alerts</span>
                        <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-[10px] text-primary hover:underline font-bold">
                          View All
                        </Link>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-gray-400 font-semibold">No recent alerts</p>
                        ) : (
                          notifications.slice(0, 3).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => useAppStore.getState().markNotificationRead(n._id)}
                              className={`p-2.5 rounded-xl border cursor-pointer flex gap-2.5 items-start transition-all ${
                                n.read 
                                  ? 'opacity-50 bg-gray-50 border-gray-100' 
                                  : 'bg-red-50 hover:bg-red-100/60 border-red-100'
                              }`}
                            >
                              {getMiniIcon(n.type)}
                              <div className="min-w-0 flex-1 text-left">
                                <p className="text-[11px] font-bold text-gray-900 truncate">{n.title}</p>
                                <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-red-300 bg-white hover:bg-red-50 transition-all cursor-pointer shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-gray-100">
                    {user.profilePicture || user.photo ? (
                      <img src={getStorageUrl(user.profilePicture || user.photo)} alt="Avatar" className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-red-800 flex items-center justify-center text-white font-black text-xs">
                        {user.fullName?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[100px] truncate">
                    {user.fullName?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-52 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-1.5 z-50 border border-gray-100 bg-white"
                    >
                      <Link to={dashboardLink} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <User className="w-4 h-4" /> Dashboard
                      </Link>
                      {(user?.role === 'donor' || user?.role === 'user') && (
                        <Link to="/donor/eligibility" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Health Check
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <div className="my-1 h-px bg-gray-100 mx-2" />
                      <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-100">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2 bg-primary hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-[0_4px_18px_rgba(220,38,38,0.3)] transition-all">
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
