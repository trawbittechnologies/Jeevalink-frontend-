import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { useAppStore } from './store/appStore.js';
import Toast from './components/Toast.jsx';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Pages
import Splash from './pages/Splash.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import DonorDashboard from './pages/DonorDashboard.jsx';
import DonorEligibility from './pages/DonorEligibility.jsx';
import VolunteerDashboard from './pages/VolunteerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DonorSearch from './pages/DonorSearch.jsx';
import BloodRequests from './pages/BloodRequests.jsx';
import Profile from './pages/Profile.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import EmergencyDashboard from './pages/EmergencyDashboard.jsx';

// Volunteer Module Pages
import VolunteerUserManagement from './pages/volunteer/UserManagement.jsx';
import UnitCommittee from './pages/volunteer/UnitCommittee.jsx';

// Admin Module Pages
import VolunteerManagement from './pages/admin/VolunteerManagement.jsx';
import FeedbackManagement from './pages/admin/FeedbackManagement.jsx';
import SupportCenter from './pages/admin/SupportCenter.jsx';
import ReportsAnalytics from './pages/admin/ReportsAnalytics.jsx';
import ActivityLogs from './pages/admin/ActivityLogs.jsx';
import SystemSettings from './pages/admin/SystemSettings.jsx';
import PartnerManagement from './pages/admin/PartnerManagement.jsx';
import TechnicalAdminDashboard from './pages/admin/TechnicalAdminDashboard.jsx';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard.jsx';
import SuperAdminManagement from './pages/admin/SuperAdminManagement.jsx';
import BlockCommitteeManagement from './pages/admin/BlockCommitteeManagement.jsx';


// V2 Common & Public Pages
import Leaderboard from './pages/Leaderboard.jsx';
import VolunteerDirectory from './pages/VolunteerDirectory.jsx';
import TechnicalReports from './pages/TechnicalReports.jsx';
import Campaigns from './pages/Campaigns.jsx';

// Protected route — redirects to login if not authenticated
function ProtectedRoute({ children, roles }) {
  const { user, token, logout } = useAuthStore();
  const { allUsers, triggerToast } = useAppStore();

  if (!token) return <Navigate to="/login" replace />;

  // Real-time check if user de-activated
  const currentDbUser = allUsers.find(u => u._id === user?._id || u.email === user?.email);
  
  if (currentDbUser && currentDbUser.status !== user.status) {
    setTimeout(() => {
      useAuthStore.setState({
        user: { ...user, status: currentDbUser.status }
      });
      localStorage.setItem('jeevalink_user', JSON.stringify({ ...user, status: currentDbUser.status }));
    }, 0);
  }

  if (currentDbUser && (currentDbUser.status === 'Inactive' || currentDbUser.status === 'Suspended' || currentDbUser.status === 'Rejected')) {
    setTimeout(() => {
      logout();
      triggerToast('Your account is deactivated or suspended.', 'error');
    }, 0);
    return <Navigate to="/login" replace />;
  }

  // Check for profile completion
  const isNonDonorRole = ['technical_admin', 'super_admin', 'admin', 'volunteer', 'unit_squad'].includes(user.role);

  if (!isNonDonorRole) {
    const basicComplete = !!(user.city && user.district);
    const isComplete = basicComplete && !!user.bloodGroup && user.bloodGroup !== 'N/A';
    if (!isComplete && window.location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  if (roles && user && !roles.includes(user.role)) {
    // Redirect to correct dashboard
    const redirect =
      user.role === 'technical_admin' ? '/technical-admin/dashboard' :
      user.role === 'super_admin' ? '/super-admin/dashboard' :
      (user.role === 'block_admin' || user.role === 'admin') ? '/block-admin/dashboard' :
      user.role === 'volunteer' ? '/volunteer/dashboard' :
      user.role === 'unit_squad' ? '/unit-squad/dashboard' :
      '/dashboard';
    return <Navigate to={redirect} replace />;
  }
  return children;
}


export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { token, loadProfile } = useAuthStore();

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token, loadProfile]);

  return (
    <BrowserRouter>
      {showSplash ? (
        <Splash onComplete={() => setShowSplash(false)} />
      ) : (
        <>

          <Toast />
          <Routes>
            {/* Splash screen route for manual/direct access */}
            <Route path="/splash" element={<Splash />} />

            {/* Public layout — Navbar + Footer */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/volunteer-directory" element={<VolunteerDirectory />} />
            </Route>

            {/* Auth pages — no Navbar/Footer */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            {/* Dashboard layout — Sidebar + top bar */}
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              {/* Technical Admin Dashboard */}
              <Route path="/technical-admin/dashboard" element={
                <ProtectedRoute roles={['technical_admin', 'admin']}>
                  <TechnicalAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/technical-admin" element={<Navigate to="/technical-admin/dashboard" replace />} />
              <Route path="/technical-admin/super-admins" element={
                <ProtectedRoute roles={['technical_admin', 'admin']}>
                  <SuperAdminManagement />
                </ProtectedRoute>
              } />

              {/* Super Admin Dashboard */}
              <Route path="/super-admin/dashboard" element={
                <ProtectedRoute roles={['super_admin', 'technical_admin', 'admin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="/super-admin/blocks" element={
                <ProtectedRoute roles={['super_admin', 'technical_admin', 'admin']}>
                  <BlockCommitteeManagement />
                </ProtectedRoute>
              } />

              {/* Block Admin Dashboard */}
              <Route path="/block-admin/dashboard" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={<Navigate to="/block-admin/dashboard" replace />} />
              <Route path="/admin/volunteers" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <VolunteerManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/feedback" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <FeedbackManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/support" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <SupportCenter />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <ReportsAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/admin/activity-logs" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <ActivityLogs />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <SystemSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/partners" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <PartnerManagement />
                </ProtectedRoute>
              } />

              {/* Volunteer Dashboard */}
              <Route path="/volunteer/dashboard" element={
                <ProtectedRoute roles={['volunteer', 'block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <VolunteerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/volunteer/users" element={
                <ProtectedRoute roles={['volunteer', 'unit_squad', 'block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <VolunteerUserManagement />
                </ProtectedRoute>
              } />
              <Route path="/volunteer/unit-committee" element={
                <ProtectedRoute roles={['volunteer', 'block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <UnitCommittee />
                </ProtectedRoute>
              } />

              {/* Unit Squad Dashboard */}
              <Route path="/unit-squad/dashboard" element={
                <ProtectedRoute roles={['unit_squad', 'volunteer', 'block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <VolunteerUserManagement />
                </ProtectedRoute>
              } />

              {/* User / Donor Dashboard */}
              <Route path="/dashboard" element={
                <ProtectedRoute roles={['user', 'donor', 'unit_squad', 'volunteer', 'block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <DonorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/donor/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/donor/eligibility" element={
                <ProtectedRoute roles={['donor', 'user']}>
                  <DonorEligibility />
                </ProtectedRoute>
              } />

              {/* Common Features */}
              <Route path="/technical-reports" element={<TechnicalReports />} />
              <Route path="/admin/emergency" element={
                <ProtectedRoute roles={['block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <EmergencyDashboard />
                </ProtectedRoute>
              } />
              <Route path="/donor/search" element={
                <ProtectedRoute roles={['donor', 'user', 'volunteer', 'block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <DonorSearch />
                </ProtectedRoute>
              } />
              <Route path="/requests" element={
                <ProtectedRoute roles={['donor', 'user', 'volunteer', 'block_admin', 'admin', 'super_admin', 'technical_admin']}>
                  <BloodRequests />
                </ProtectedRoute>
              } />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      )}
    </BrowserRouter>
  );
}
