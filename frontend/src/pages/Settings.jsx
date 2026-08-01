import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Moon, Sun, BellRing, Smartphone, KeyRound, Mail, ChevronRight, Settings as SettingsIcon
} from 'lucide-react';
import AccountSecurityModal from '../components/AccountSecurityModal.jsx';

// Reusable toggle switch
function Toggle({ enabled, onToggle, id }) {
  return (
    <button
      id={id}
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-300 cursor-pointer shrink-0 ${
        enabled ? 'bg-primary' : 'bg-slate-200'
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

export default function Settings() {
  const { triggerToast } = useAppStore();
  const { user } = useAuthStore();

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [securityModal, setSecurityModal] = useState(null); // 'password' | 'email' | null

  const showAccountSecurity = user?.role !== 'unit_squad';

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
  const togglePush = () => {
    setPushEnabled(v => !v);
    triggerToast(!pushEnabled ? 'Push notifications enabled!' : 'Push notifications disabled.', 'info');
  };
  const toggleSms = () => {
    setSmsEnabled(v => !v);
    triggerToast(!smsEnabled ? 'SMS alerts enabled!' : 'SMS alerts disabled.', 'info');
  };

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

        {/* ── Appearance ─────────────────────────────────── */}
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

        {/* ── Notifications ──────────────────────────────── */}
        <div className="card p-5 space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Notifications</p>

          <SettingRow
            id="push-notifications-row"
            icon={BellRing}
            iconBg="bg-blue-50 text-blue-600"
            title="Push Notifications"
            subtitle="Receive nearby blood request alerts"
            right={<Toggle enabled={pushEnabled} onToggle={togglePush} id="push-toggle" />}
          />

          <div className="border-t border-slate-100 my-1" />

          <SettingRow
            id="sms-alerts-row"
            icon={Smartphone}
            iconBg="bg-emerald-50 text-emerald-600"
            title="SMS Alerts"
            subtitle="Emergency SMS broadcast dispatch"
            right={<Toggle enabled={smsEnabled} onToggle={toggleSms} id="sms-toggle" />}
          />
        </div>

        {/* ── Account Security — not for unit_squad ─────── */}
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

      {/* Account Security Modal */}
      {securityModal && (
        <AccountSecurityModal
          mode={securityModal}
          onClose={() => setSecurityModal(null)}
        />
      )}
    </>
  );
}
