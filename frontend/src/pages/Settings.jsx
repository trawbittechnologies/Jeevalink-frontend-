import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Moon, Sun, BellRing, Smartphone, KeyRound, Mail, ChevronRight,
  Settings as SettingsIcon, BellOff, AlertTriangle, CheckCircle2, Download
} from 'lucide-react';
import AccountSecurityModal from '../components/AccountSecurityModal.jsx';
import api from '../store/api.js';
import { requestNotificationPermission, removeNotificationToken } from '../services/firebaseMessaging.js';
import { isPushSupported, getPermissionStatus, hasActiveSubscription, initPushNotifications } from '../services/webPushService.js';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

// Reusable toggle switch
function Toggle({ enabled, onToggle, id, disabled }) {
  return (
    <button
      id={id}
      onClick={disabled ? undefined : onToggle}
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
        disabled
          ? 'bg-slate-200 cursor-not-allowed opacity-50'
          : enabled
          ? 'bg-primary cursor-pointer'
          : 'bg-slate-200 cursor-pointer'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Reusable section card row
function SettingRow({ icon: Icon, iconBg, title, subtitle, right, onClick, id }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      id={id}
      onClick={onClick}
      className={`w-full flex items-center gap-4 py-3 ${onClick ? 'cursor-pointer group' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
      </div>
      {right}
    </Wrapper>
  );
}

// Push notification status indicator
function PushStatusBanner({ permission }) {
  if (permission === 'unsupported') {
    return (
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-700">Not supported</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Push notifications are not supported in this browser. Try Chrome or Edge.
          </p>
        </div>
      </div>
    );
  }
  if (permission === 'denied') {
    return (
      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
        <BellOff className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-red-700">Notifications blocked</p>
          <p className="text-xs text-red-600 mt-0.5">
            You have blocked notifications for JeevaLink. To re-enable:{' '}
            <span className="font-bold">Browser menu &gt; Site settings &gt; Notifications &gt; Allow</span>.
          </p>
        </div>
      </div>
    );
  }
  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <p className="text-xs font-semibold text-green-700">Push notifications are active</p>
      </div>
    );
  }
  return null;
}

export default function Settings() {
  const { triggerToast } = useAppStore();
  const { user }         = useAuthStore();

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const [pushPermission, setPushPermission] = useState(() => {
    if (!isPushSupported()) return 'unsupported';
    return getPermissionStatus();
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const [smsEnabled, setSmsEnabled]       = useState(false);
  const [securityModal, setSecurityModal] = useState(null);

  const { canInstall, isInstalled, platform, showInstallPrompt } = usePWAInstall();

  const showAccountSecurity = user?.role !== 'unit_squad';

  // Check active subscription on mount
  useEffect(() => {
    if (pushPermission === 'granted') {
      hasActiveSubscription().then((active) => setPushEnabled(active));
    }
  }, [pushPermission]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDark = () => {
    setIsDarkMode(v => !v);
    triggerToast(!isDarkMode ? 'Dark mode enabled!' : 'Light mode enabled!', 'info');
  };

  const togglePush = async () => {
    if (pushLoading) return;
    if (pushPermission === 'unsupported') {
      triggerToast('Push notifications are not supported in this browser.', 'error');
      return;
    }
    if (pushPermission === 'denied') {
      triggerToast('Notifications are blocked. Enable them in browser site settings.', 'error');
      return;
    }

    setPushLoading(true);
    try {
      if (pushEnabled) {
        await removeNotificationToken();
        setPushEnabled(false);
        setPushPermission(getPermissionStatus());
        triggerToast('Push notifications disabled.', 'info');
      } else {
        const result       = await requestNotificationPermission();
        const newPermission = getPermissionStatus();
        setPushPermission(newPermission);

        if (result) {
          setPushEnabled(true);
          triggerToast('Push notifications enabled!', 'success');
        } else if (newPermission === 'denied') {
          triggerToast('Notifications blocked in browser. Enable from site settings.', 'error');
        } else {
          triggerToast('Failed to enable push notifications. Please try again.', 'error');
        }
      }
    } catch (err) {
      console.error('[Settings] Push toggle error:', err);
      triggerToast('Error updating notification preferences.', 'error');
    } finally {
      setPushLoading(false);
    }
  };

  const [testPushLoading, setTestPushLoading] = useState(false);

  const handleTestPush = async () => {
    if (testPushLoading) return;
    setTestPushLoading(true);
    try {
      // Ensure subscription is synced with backend
      await initPushNotifications();
      const res = await api.post('/notifications/test-web-push', { priority: 'immediate' });
      if (res.data?.success) {
        triggerToast('🚨 Test Emergency Push notification sent to your device!', 'success');
      } else {
        triggerToast(res.data?.message || 'Could not send test push.', 'error');
      }
    } catch (err) {
      console.error('[Settings] Test push failed:', err);
      triggerToast(err?.response?.data?.message || 'Failed to dispatch test notification.', 'error');
    } finally {
      setTestPushLoading(false);
    }
  };

  const toggleSms = () => {
    setSmsEnabled(v => !v);
    triggerToast(!smsEnabled ? 'SMS alerts enabled!' : 'SMS alerts disabled.', 'info');
  };

  const isPushToggleDisabled =
    pushLoading ||
    pushPermission === 'unsupported' ||
    pushPermission === 'denied';

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage preferences and account security</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-5 space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Appearance</p>
          <SettingRow
            id="dark-mode-row"
            icon={isDarkMode ? Moon : Sun}
            iconBg="bg-slate-100 text-slate-600"
            title="Dark Mode"
            subtitle={isDarkMode ? 'Dark theme is active' : 'Light theme is active'}
            right={<Toggle enabled={isDarkMode} onToggle={toggleDark} id="dark-mode-toggle" />}
          />
        </div>

        {/* Notifications */}
        <div className="card p-5 space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Notifications</p>

          <SettingRow
            id="push-notifications-row"
            icon={BellRing}
            iconBg="bg-blue-50 text-blue-600"
            title="Push Notifications"
            subtitle={
              pushLoading
                ? 'Updating...'
                : pushPermission === 'unsupported'
                ? 'Not supported in this browser'
                : pushPermission === 'denied'
                ? 'Blocked — enable in browser settings'
                : pushEnabled
                ? 'Receiving nearby blood request alerts'
                : 'Tap to enable blood request alerts'
            }
            right={
              <Toggle
                enabled={pushEnabled && pushPermission === 'granted'}
                onToggle={togglePush}
                id="push-toggle"
                disabled={isPushToggleDisabled}
              />
            }
          />

          <PushStatusBanner permission={pushPermission} />

          {pushPermission === 'granted' && (
            <div className="pt-2 px-1">
              <button
                id="send-test-push-btn"
                type="button"
                onClick={handleTestPush}
                disabled={testPushLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
              >
                <BellRing className={`w-4 h-4 ${testPushLoading ? 'animate-bounce' : ''}`} />
                {testPushLoading ? 'Dispatching Push Notification...' : '🔔 Send Test Push Notification to This Device'}
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-1.5">
                Tests delivery directly through Chrome / Windows / Mobile notification system.
              </p>
            </div>
          )}

          <div className="border-t border-slate-100 my-1 mt-3" />

          <SettingRow
            id="sms-alerts-row"
            icon={Smartphone}
            iconBg="bg-emerald-50 text-emerald-600"
            title="SMS Alerts"
            subtitle="Emergency SMS broadcast dispatch"
            right={<Toggle enabled={smsEnabled} onToggle={toggleSms} id="sms-toggle" />}
          />
        </div>

        {/* App & Device Experience (PWA) */}
        <div className="card p-5 space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">App & Device Experience</p>
          {isInstalled ? (
            <SettingRow
              id="pwa-installed-row"
              icon={CheckCircle2}
              iconBg="bg-emerald-50 text-emerald-600"
              title="Web App Installed"
              subtitle="Running as a standalone home screen application"
              right={
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
                  Installed
                </span>
              }
            />
          ) : canInstall ? (
            <SettingRow
              id="pwa-install-row"
              icon={Download}
              iconBg="bg-red-50 text-primary"
              title="Install Web App"
              subtitle={
                platform === 'ios'
                  ? 'Add iDonate to your iPhone or iPad Home Screen'
                  : 'Install iDonate for fast one-tap access & offline support'
              }
              onClick={showInstallPrompt}
              right={
                <button
                  type="button"
                  onClick={showInstallPrompt}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                >
                  {platform === 'ios' ? 'Add Guide' : 'Install'}
                </button>
              }
            />
          ) : (
            <SettingRow
              id="pwa-browser-row"
              icon={Smartphone}
              iconBg="bg-slate-100 text-slate-500"
              title="Web Application"
              subtitle="Browser mode — install is supported on Chrome, Edge & Safari"
            />
          )}
        </div>

        {/* Account Security */}
        {showAccountSecurity && (
          <div className="card p-5 space-y-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Account Security</p>

            <SettingRow
              id="change-password-btn"
              icon={KeyRound}
              iconBg="bg-red-50 text-primary"
              title="Change Password"
              subtitle="Update your account login password"
              onClick={() => setSecurityModal('password')}
              right={<ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors shrink-0" />}
            />

            <div className="border-t border-slate-100 my-1" />

            <SettingRow
              id="change-email-btn"
              icon={Mail}
              iconBg="bg-rose-50 text-rose-500"
              title="Change Email"
              subtitle={user?.email || 'Update your email address'}
              onClick={() => setSecurityModal('email')}
              right={<ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-500 transition-colors shrink-0" />}
            />
          </div>
        )}

      </div>

      {securityModal && (
        <AccountSecurityModal
          mode={securityModal}
          onClose={() => setSecurityModal(null)}
        />
      )}
    </>
  );
}
