import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import Toast from '../components/Toast.jsx';
import Sidebar from '../components/Sidebar.jsx';
import JeevaLinkLogo from '../components/JeevaLinkLogo.jsx';
import SOSButton from '../components/SOSButton.jsx';
import BloodHeroAssistant from '../components/BloodHeroAssistant.jsx';
import {
  LayoutDashboard, Droplets, Users, ClipboardList, User,
  Bell, Siren, Building2, Megaphone, Menu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getStorageUrl } from '../store/api.js';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loadProfile } = useAuthStore();
  const { notifications, startSOSCountdown } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const donorNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/donor/search', icon: Users, label: 'Donors' },
    { to: '/requests', icon: Droplets, label: 'Requests' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  const volNav = [
    { to: '/volunteer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/volunteer/users', icon: Users, label: 'Users' },
    { to: '/requests', icon: Droplets, label: 'Requests' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  const adminNav = [
    { to: '/block-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/admin/volunteers', icon: Users, label: 'Volunteers' },
    { to: '/requests', icon: Droplets, label: 'Requests' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  const superAdminNav = [
    { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/super-admin/blocks', icon: Building2, label: 'Block Committees' },
    { to: '/requests', icon: Droplets, label: 'Requests' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  const techAdminNav = [
    { to: '/technical-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/technical-reports', icon: ClipboardList, label: 'Reports' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  const unitSquadNav = [
    { to: '/unit-squad/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/volunteer/users', icon: Users, label: 'Manage Users' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/technical-reports', icon: ClipboardList, label: 'Tech Report' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  const hospitalNav = [
    { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/donor/search', icon: Users, label: 'Donors' },
    { to: '/requests', icon: Droplets, label: 'Requests' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Intercept navigation for pending hospital
  useEffect(() => {
    if (user?.role === 'hospital' && user?.status === 'Pending Approval' && location.pathname !== '/hospital/dashboard') {
      navigate('/hospital/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  let navLinks =
    user?.role === 'technical_admin' ? techAdminNav :
      user?.role === 'super_admin' ? superAdminNav :
        user?.role === 'admin' ? adminNav :
          user?.role === 'volunteer' ? volNav :
            user?.role === 'unit_squad' ? unitSquadNav :
              user?.role === 'hospital' ? hospitalNav :
                donorNav;

  if (user?.role === 'hospital' && user?.status === 'Pending Approval') {
    navLinks = [
      { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
    ];
  }

  const isActive = (to) => location.pathname === to;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toast />

      {/* Sidebar (desktop & mobile) */}
      <Sidebar mobileOpen={isMobileMenuOpen} setMobileOpen={setIsMobileMenuOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 h-14 flex items-center justify-between px-4 lg:px-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">

          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center">
              <JeevaLinkLogo size={32} textClassName="text-sm" />
            </Link>
          </div>

          {/* Page breadcrumb (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest capitalize">
              {user?.role} portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Emergency SOS */}
            <button
              onClick={() => startSOSCountdown(user)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 text-primary text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Siren className="w-3.5 h-3.5 animate-pulse" /> SOS
            </button>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-slate-100 hover:text-gray-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-white animate-pulse" />
              )}
            </Link>

            {/* Avatar */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 hover:shadow-md hover:shadow-red-200 transition-all shadow-sm border border-slate-200/50"
            >
              {(user?.profilePicture || user?.photo) ? (
                <img src={getStorageUrl(user.profilePicture || user.photo)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-red-800 flex items-center justify-center text-white font-black text-xs">
                  {user?.primaryName?.[0]}
                </div>
              )}
            </Link>

          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-6 min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Floating SOS button */}
      <SOSButton />
      {/* Floating Blood Hero Mascot Assistant */}
      <BloodHeroAssistant />
    </div>
  );
}
