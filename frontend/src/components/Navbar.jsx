import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { LogOut, User, Users, Bell, ChevronDown, Settings, Siren, Award, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorageUrl } from '../store/api.js';
import CommunityChoiceModal from './CommunityChoiceModal.jsx';
import JeevaLinkLogo from './JeevaLinkLogo.jsx';

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'Find Donors', to: '/donor/search' },
  { label: 'Requests', to: '/requests' },
  { label: 'Directory', to: '/volunteer-directory' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { notifications, triggerToast } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
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
    user?.role === 'technical_admin' ? '/technical-admin/dashboard' :
    user?.role === 'super_admin' ? '/super-admin/dashboard' :
    (user?.role === 'block_admin' || user?.role === 'admin') ? '/block-admin/dashboard' :
    user?.role === 'volunteer' ? '/volunteer/dashboard' :
    user?.role === 'unit_squad' ? '/unit-squad/dashboard' :
    '/dashboard';

  const isActive = (to) => location.pathname === to;

  const getMiniIcon = (type) => {
    switch (type) {
      case 'SOS':
        return (
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 animate-pulse">
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
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Bell className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-white/95 shadow-sm border-b border-slate-100'
          : 'bg-white/90 border-b border-slate-100'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <JeevaLinkLogo size={34} textClassName="text-lg" />
        </Link>

        {/* Clean Minimal Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive(link.to)
                  ? 'text-red-600 bg-red-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unread > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-11 w-80 rounded-2xl shadow-xl p-3 z-50 border border-slate-100 bg-white"
                    >
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800">Alerts</span>
                        <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-[11px] text-red-600 hover:underline font-bold">
                          View All
                        </Link>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-slate-400 font-semibold">No recent alerts</p>
                        ) : (
                          notifications.slice(0, 3).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => useAppStore.getState().markNotificationRead(n._id)}
                              className={`p-2.5 rounded-xl border cursor-pointer flex gap-2.5 items-start transition-all ${
                                n.read 
                                  ? 'opacity-50 bg-slate-50 border-slate-100' 
                                  : 'bg-red-50 hover:bg-red-100/60 border-red-100'
                              }`}
                            >
                              {getMiniIcon(n.type)}
                              <div className="min-w-0 flex-1 text-left">
                                <p className="text-[11px] font-bold text-slate-900 truncate">{n.title}</p>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
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
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-red-300 bg-white transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                    {user.profilePicture || user.photo ? (
                      <img src={getStorageUrl(user.profilePicture || user.photo)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-black text-xs">
                        {user.primaryName?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block text-xs font-bold text-slate-700 max-w-[90px] truncate">
                    {user.primaryName?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-11 w-48 rounded-2xl shadow-xl p-1.5 z-50 border border-slate-100 bg-white"
                    >
                      <Link to={dashboardLink} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                        <User className="w-4 h-4 text-slate-400" /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                        <User className="w-4 h-4 text-slate-400" /> Profile
                      </Link>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                        <Settings className="w-4 h-4 text-slate-400" /> Settings
                      </Link>
                      <div className="my-1 h-px bg-slate-100 mx-2" />
                      <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCommunityModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-red-600" />
                <span>Enter Community</span>
              </button>

              <Link to="/login" className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors rounded-xl hover:bg-slate-50">
                Sign In
              </Link>

            </>
          )}
        </div>
      </div>

      <CommunityChoiceModal
        isOpen={communityModalOpen}
        onClose={() => setCommunityModalOpen(false)}
      />
    </header>
  );
}
