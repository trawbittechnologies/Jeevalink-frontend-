import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import {
  LayoutDashboard, Users, Droplets, User,
  Settings, ClipboardList, ShieldCheck, LogOut, ChevronRight, ShieldAlert, Search,
  Building2, Megaphone
} from 'lucide-react';
import { motion } from 'framer-motion';
import JeevaLinkLogo from './JeevaLinkLogo.jsx';

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaign Hub', icon: Megaphone },
  { to: '/donor/eligibility', label: 'Health Eligibility', icon: ShieldCheck },
  { to: '/donor/search', label: 'Find Donors', icon: Search },
  { to: '/requests', label: 'Blood Requests', icon: Droplets },
  { to: '/technical-reports', label: 'Send Tech Report', icon: ShieldAlert },
  { to: '/profile', label: 'My Profile', icon: User },
];

const unitSquadLinks = [
  { to: '/unit-squad/dashboard', label: 'Unit Squad Dashboard', icon: LayoutDashboard },
  { to: '/volunteer/users', label: 'Add & Manage Users', icon: Users },
  { to: '/campaigns', label: 'Campaign Hub', icon: Megaphone },
  { to: '/technical-reports', label: 'Send Tech Report', icon: ShieldAlert },
  { to: '/profile', label: 'My Profile', icon: User },
];

const volunteerLinks = [
  { to: '/volunteer/dashboard', label: 'Volunteer Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaign Hub', icon: Megaphone },
  { to: '/volunteer/users', label: 'Manage Users & Donors', icon: Users },
  { to: '/volunteer/unit-committee', label: 'Unit Squad Committee', icon: ShieldCheck },
  { to: '/requests', label: 'Blood Requests', icon: Droplets },
  { to: '/donor/search', label: 'Find Donors', icon: Search },
  { to: '/technical-reports', label: 'Send Tech Report', icon: ShieldAlert },
  { to: '/profile', label: 'My Profile', icon: User },
];

const blockAdminLinks = [
  { to: '/block-admin/dashboard', label: 'Block Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaign Hub', icon: Megaphone },
  { to: '/admin/volunteers', label: 'Add & Manage Volunteers', icon: Users },
  { to: '/volunteer/unit-committee', label: 'Unit Squad Committee', icon: ShieldCheck },
  { to: '/admin/feedback', label: 'Feedback & Complaints', icon: ClipboardList },
  { to: '/requests', label: 'Blood Requests', icon: Droplets },
  { to: '/donor/search', label: 'Find Donors', icon: Search },
  { to: '/technical-reports', label: 'Send Tech Report', icon: ShieldAlert },
  { to: '/profile', label: 'My Profile', icon: User },
];

const superAdminLinks = [
  { to: '/super-admin/dashboard', label: 'District Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaign Hub', icon: Megaphone },
  { to: '/super-admin/blocks', label: 'Manage Block Committees', icon: Building2 },
  { to: '/admin/feedback', label: 'Feedback & Complaints', icon: ClipboardList },
  { to: '/requests', label: 'Blood Requests', icon: Droplets },
  { to: '/donor/search', label: 'Find Donors', icon: Search },
  { to: '/technical-reports', label: 'Send Tech Report', icon: ShieldAlert },
  { to: '/profile', label: 'My Profile', icon: User },
];

const technicalAdminLinks = [
  { to: '/technical-admin/dashboard', label: 'Technical Dashboard', icon: LayoutDashboard },
  { to: '/campaigns', label: 'Campaign Hub', icon: Megaphone },
  { to: '/technical-reports', label: 'Tech Reports Queue', icon: ShieldAlert },
  { to: '/profile', label: 'My Profile', icon: User },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuthStore();
  const { complaints } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  let links =
    user?.role === 'technical_admin' ? technicalAdminLinks :
      user?.role === 'super_admin' ? superAdminLinks :
        user?.role === 'block_admin' ? blockAdminLinks :
          user?.role === 'volunteer' ? volunteerLinks :
            user?.role === 'unit_squad' ? unitSquadLinks :
              userLinks;

  const isActive = (to) => {
    try {
      const toUrl = new URL(to, window.location.origin);
      const currentUrl = new URL(location.pathname + location.search, window.location.origin);

      if (toUrl.pathname !== currentUrl.pathname) {
        return false;
      }

      const toParams = Array.from(toUrl.searchParams.entries());
      if (toParams.length > 0) {
        return toParams.every(([key, value]) => currentUrl.searchParams.get(key) === value);
      }

      const currentTab = currentUrl.searchParams.get('tab');
      return !currentTab || currentTab === 'overview';
    } catch {
      return location.pathname === to;
    }
  };

  const pendingComplaintsCount = complaints.filter(
    (c) => c.status === 'Pending'
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-100/80 shadow-[2px_0_12px_rgba(0,0,0,0.03)] overflow-y-auto overflow-x-hidden transform transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:h-screen lg:sticky lg:top-0 shrink-0`}>

      {/* Logo */}
      <Link to="/" className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
        <JeevaLinkLogo size={36} textClassName="text-[17px]" />
      </Link>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);

          let badgeCount = 0;
          if (link.badgeCountKey === 'complaints') badgeCount = pendingComplaintsCount;

          return (
            <Link
              key={`${link.to}-${link.label}`}
              to={link.to}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${active
                ? 'bg-gradient-to-r from-rose-50 to-red-50/40 text-slate-900 shadow-xs border border-rose-100/80'
                : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-900'
                }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-rose-600 rounded-r-full"
                />
              )}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${active
                  ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/20 scale-105'
                  : 'bg-slate-100/80 text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-600 group-hover:scale-105'
                }`}>
                <Icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="truncate">{link.label}</span>
              {badgeCount > 0 ? (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-black bg-rose-600 text-white rounded-full animate-pulse shrink-0 shadow-xs">
                  {badgeCount}
                </span>
              ) : (
                active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-rose-500/80 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Blood group badge - Only for user role */}
      {user?.role === 'user' && user?.bloodGroup && user.bloodGroup !== 'N/A' && (
        <div className="px-4 mb-3">
          <div className="px-4 py-3 bg-gradient-to-br from-red-50 via-rose-50 to-red-50/50 rounded-2xl border border-red-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">Your Blood Group</p>
            <p className="text-3xl font-black text-primary leading-none">{user.bloodGroup}</p>
          </div>
        </div>
      )}

      {/* Settings & Sign out */}
      <div className="p-3 border-t border-slate-100 space-y-0.5">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-slate-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" /> Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
    </>
  );
}
