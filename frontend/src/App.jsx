import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { useAppStore } from './store/appStore.js';
import Toast from './components/Toast.jsx';
import { Loader2 } from 'lucide-react';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

function safeLazy(importFn) {
  return lazy(() =>
    importFn().catch((error) => {
      const pageRefreshed = sessionStorage.getItem('chunk_retry_refreshed');
      if (!pageRefreshed) {
        sessionStorage.setItem('chunk_retry_refreshed', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem('chunk_retry_refreshed');
      throw error;
    })
  );
}

// Lazy-loaded Pages
const Splash = safeLazy(() => import('./pages/Splash.jsx'));
const Landing = safeLazy(() => import('./pages/Landing.jsx'));
const Login = safeLazy(() => import('./pages/Login.jsx'));
const Register = safeLazy(() => import('./pages/Register.jsx'));
const ResetPassword = safeLazy(() => import('./pages/ResetPassword.jsx'));
const CompleteProfile = safeLazy(() => import('./pages/CompleteProfile.jsx'));
const DonorDashboard = safeLazy(() => import('./pages/DonorDashboard.jsx'));
const DonorEligibility = safeLazy(() => import('./pages/DonorEligibility.jsx'));
const VolunteerDashboard = safeLazy(() => import('./pages/VolunteerDashboard.jsx'));
const AdminDashboard = safeLazy(() => import('./pages/AdminDashboard.jsx'));
const DonorSearch = safeLazy(() => import('./pages/DonorSearch.jsx'));
const BloodRequests = safeLazy(() => import('./pages/BloodRequests.jsx'));
const Profile = safeLazy(() => import('./pages/Profile.jsx'));
const About = safeLazy(() => import('./pages/About.jsx'));
const Contact = safeLazy(() => import('./pages/Contact.jsx'));
const Privacy = safeLazy(() => import('./pages/Privacy.jsx'));
const Terms = safeLazy(() => import('./pages/Terms.jsx'));
const Notifications = safeLazy(() => import('./pages/Notifications.jsx'));
const Settings = safeLazy(() => import('./pages/Settings.jsx'));
const EmergencyDashboard = safeLazy(() => import('./pages/EmergencyDashboard.jsx'));

// Volunteer Module Pages
const VolunteerUserManagement = safeLazy(() => import('./pages/volunteer/UserManagement.jsx'));
const UnitCommittee = safeLazy(() => import('./pages/volunteer/UnitCommittee.jsx'));

// Admin Module Pages
const VolunteerManagement = safeLazy(() => import('./pages/admin/VolunteerManagement.jsx'));
const FeedbackManagement = safeLazy(() => import('./pages/admin/FeedbackManagement.jsx'));
const SupportCenter = safeLazy(() => import('./pages/admin/SupportCenter.jsx'));
const ReportsAnalytics = safeLazy(() => import('./pages/admin/ReportsAnalytics.jsx'));
const ActivityLogs = safeLazy(() => import('./pages/admin/ActivityLogs.jsx'));
const SystemSettings = safeLazy(() => import('./pages/admin/SystemSettings.jsx'));
const PartnerManagement = safeLazy(() => import('./pages/admin/PartnerManagement.jsx'));
const TechnicalAdminDashboard = safeLazy(() => import('./pages/admin/TechnicalAdminDashboard.jsx'));
const SuperAdminDashboard = safeLazy(() => import('./pages/admin/SuperAdminDashboard.jsx'));
const SuperAdminManagement = safeLazy(() => import('./pages/admin/SuperAdminManagement.jsx'));
const BlockCommitteeManagement = safeLazy(() => import('./pages/admin/BlockCommitteeManagement.jsx'));

// V2 Common & Public Pages
const Leaderboard = safeLazy(() => import('./pages/Leaderboard.jsx'));
const VolunteerDirectory = safeLazy(() => import('./pages/VolunteerDirectory.jsx'));
const TechnicalReports = safeLazy(() => import('./pages/TechnicalReports.jsx'));
const Campaigns = safeLazy(() => import('./pages/Campaigns.jsx'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center animate-spin">
        <Loader2 className="w-6 h-6" />
      </div>
      <p className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Module...</p>
    </div>
  );
}

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
  const isNonDonorRole = ['technical_admin', 'super_admin', 'block_admin', 'volunteer', 'unit_squad'].includes(user?.role);

  if (!isNonDonorRole && user) {
    const basicComplete = !!(user.city && user.district);
    const isComplete = basicComplete && !!user.bloodGroup && user.bloodGroup !== 'N/A';
    if (!isComplete && window.location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  if (roles && user && !roles.includes(user.role)) {
    const redirect =
      user.role === 'technical_admin' ? '/technical-admin/dashboard' :
      user.role === 'super_admin' ? '/super-admin/dashboard' :
      user.role === 'block_admin' ? '/block-admin/dashboard' :
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
        <Suspense fallback={<PageLoader />}>
          <Splash onComplete={() => setShowSplash(false)} />
        </Suspense>
      ) : (
        <>
          <Toast />
          <Suspense fallback={<PageLoader />}>
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
                  <ProtectedRoute roles={['technical_admin']}>
                    <TechnicalAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/technical-admin" element={<Navigate to="/technical-admin/dashboard" replace />} />
                <Route path="/technical-admin/super-admins" element={
                  <ProtectedRoute roles={['technical_admin']}>
                    <SuperAdminManagement />
                  </ProtectedRoute>
                } />

                {/* Super Admin Dashboard */}
                <Route path="/super-admin/dashboard" element={
                  <ProtectedRoute roles={['super_admin', 'technical_admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
                <Route path="/super-admin/blocks" element={
                  <ProtectedRoute roles={['super_admin', 'technical_admin']}>
                    <BlockCommitteeManagement />
                  </ProtectedRoute>
                } />

                {/* Block Admin Dashboard */}
                <Route path="/block-admin/dashboard" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/block-admin" element={<Navigate to="/block-admin/dashboard" replace />} />
                <Route path="/admin/volunteers" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <VolunteerManagement />
                  </ProtectedRoute>
                } />

                {/* Admin Sub-pages */}
                <Route path="/admin/feedback" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <FeedbackManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/support" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <SupportCenter />
                  </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <ReportsAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/admin/activity-logs" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <ActivityLogs />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <SystemSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/partners" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <PartnerManagement />
                  </ProtectedRoute>
                } />

                {/* Volunteer Dashboard */}
                <Route path="/volunteer/dashboard" element={
                  <ProtectedRoute roles={['volunteer', 'block_admin', 'super_admin', 'technical_admin']}>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/volunteer/users" element={
                  <ProtectedRoute roles={['volunteer', 'unit_squad', 'block_admin', 'super_admin', 'technical_admin']}>
                    <VolunteerUserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/volunteer/unit-committee" element={
                  <ProtectedRoute roles={['volunteer', 'block_admin', 'super_admin', 'technical_admin']}>
                    <UnitCommittee />
                  </ProtectedRoute>
                } />

                {/* Unit Squad Dashboard */}
                <Route path="/unit-squad/dashboard" element={
                  <ProtectedRoute roles={['unit_squad', 'volunteer', 'block_admin', 'super_admin', 'technical_admin']}>
                    <VolunteerUserManagement />
                  </ProtectedRoute>
                } />

                {/* User Dashboard */}
                <Route path="/dashboard" element={
                  <ProtectedRoute roles={['user', 'unit_squad', 'volunteer', 'block_admin', 'super_admin', 'technical_admin']}>
                    <DonorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/donor/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/donor/eligibility" element={
                  <ProtectedRoute roles={['user']}>
                    <DonorEligibility />
                  </ProtectedRoute>
                } />

                {/* Common Features */}
                <Route path="/technical-reports" element={<TechnicalReports />} />
                <Route path="/admin/emergency" element={
                  <ProtectedRoute roles={['block_admin', 'super_admin', 'technical_admin']}>
                    <EmergencyDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/donor/search" element={
                  <ProtectedRoute roles={['user', 'volunteer', 'block_admin', 'super_admin', 'technical_admin']}>
                    <DonorSearch />
                  </ProtectedRoute>
                } />
                <Route path="/requests" element={
                  <ProtectedRoute roles={['user', 'volunteer', 'block_admin', 'super_admin', 'technical_admin']}>
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
          </Suspense>
        </>
      )}
    </BrowserRouter>
  );
}
