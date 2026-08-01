import { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useAppStore } from '../../store/appStore.js';
import {
  User, Lock, Globe, Bell, Database,
  Save, Eye, EyeOff, CheckCircle2,
  Download, AlertTriangle
} from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
      <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
        <Icon className="w-4 h-4 text-red-400" />
      </div>
      <h3 className="text-slate-900 font-bold text-sm">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InputField = ({ label, type = 'text', value, onChange, placeholder, readOnly }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors ${readOnly ? 'opacity-60 cursor-not-allowed' : ''} ${isPassword ? 'pr-10' : ''}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

const Toggle = ({ label, sub, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-slate-900 text-xs font-semibold">{label}</p>
      {sub && <p className="text-slate-600 text-[10px]">{sub}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer border ${checked ? 'bg-red-500 border-red-500' : 'bg-white/10 border-white/20'}`}
      style={{ height: '22px', minWidth: '40px' }}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  </div>
);

export default function SystemSettings() {
  const { user } = useAuthStore();
  const { triggerToast } = useAppStore();

  const [profile, setProfile] = useState({ username: user?.email || 'admin@jeevalink.org', displayName: user?.primaryName || 'System Admin' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [contact, setContact] = useState({ email: 'support@jeevalink.org', phone: '+91 98765 43210', address: 'JeevaLink HQ, Kochi, Kerala 682001', website: 'https://jeevalink.org' });
  const [notifSettings, setNotifSettings] = useState({ emailOnLogin: true, emailOnStatusChange: true, emailOnComplaint: true, pushNotifications: true, emergencyAlerts: true, weeklyReport: false });
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState('');

  const save = async (section) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setSavedSection(section);
    triggerToast(`${section} settings saved successfully!`, 'success');
    setTimeout(() => setSavedSection(''), 2000);
  };

  const renderSaveBtn = (section) => (
    <button
      onClick={() => save(section)}
      disabled={saving}
      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 mt-4 shadow-lg shadow-red-500/20"
    >
      {savedSection === section ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
      {savedSection === section ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
    </button>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 text-xl font-black">System Settings</h1>
        <p className="text-slate-500 text-xs mt-0.5">Configure admin credentials, contact info, and platform preferences</p>
      </div>

      {/* Admin Profile */}
      <Section title="Admin Profile" icon={User}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-500/20">
            {profile.displayName[0]}
          </div>
          <div>
            <p className="text-white font-black">{profile.displayName}</p>
            <p className="text-slate-500 text-xs">Super Administrator</p>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full mt-1 inline-block">Admin</span>
          </div>
        </div>
        <div className="space-y-3">
          <InputField label="Display Name" value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} placeholder="Administrator Name" />
          <InputField label="Admin Username / Email" type="email" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} placeholder="admin@jeevalink.org" />
        </div>
        {renderSaveBtn("Profile")}
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon={Lock}>
        <div className="space-y-3">
          <InputField label="Current Password" type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
          <InputField label="New Password" type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="At least 8 characters" />
          <InputField label="Confirm New Password" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
        </div>
        {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
          <p className="text-red-400 text-[10px] mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Passwords do not match.</p>
        )}
        <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-400 text-[10px]">
          🔐 Password must be at least 8 characters and contain uppercase, lowercase, and a number.
        </div>
        {renderSaveBtn("Password")}
      </Section>

      {/* Contact Info */}
      <Section title="Contact Information" icon={Globe}>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Support Email" type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} placeholder="support@example.com" />
          <InputField label="Contact Phone" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} placeholder="+91 99999 99999" />
          <div className="col-span-2">
            <InputField label="Office Address" value={contact.address} onChange={e => setContact(c => ({ ...c, address: e.target.value }))} placeholder="Full address" />
          </div>
          <div className="col-span-2">
            <InputField label="Website URL" value={contact.website} onChange={e => setContact(c => ({ ...c, website: e.target.value }))} placeholder="https://" />
          </div>
        </div>
        {renderSaveBtn("Contact")}
      </Section>

      {/* Notification Settings */}
      <Section title="Notification Preferences" icon={Bell}>
        <div className="space-y-0">
          {[
            { key: 'emailOnLogin', label: 'Email on Admin Login', sub: 'Receive email when admin logs in' },
            { key: 'emailOnStatusChange', label: 'Email on Status Change', sub: 'Get notified when user status changes' },
            { key: 'emailOnComplaint', label: 'Email on New Complaint', sub: 'Receive email for new safety reports' },
            { key: 'pushNotifications', label: 'Push Notifications', sub: 'Enable browser push notifications' },
            { key: 'emergencyAlerts', label: 'Emergency SOS Alerts', sub: 'Receive alerts for SOS emergencies' },
            { key: 'weeklyReport', label: 'Weekly Summary Report', sub: 'Receive weekly platform performance email' },
          ].map(({ key, label, sub }) => (
            <Toggle key={key} label={label} sub={sub} checked={notifSettings[key]} onChange={v => setNotifSettings(s => ({ ...s, [key]: v }))} />
          ))}
        </div>
        {renderSaveBtn("Notifications")}
      </Section>

      {/* Backup Management */}
      <Section title="Backup Management" icon={Database}>
        <p className="text-slate-500 text-xs mb-4">Download system data exports for backup and archival purposes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Export All Users', sub: 'CSV · ~50KB', icon: User },
            { label: 'Export Blood Requests', sub: 'CSV · ~30KB', icon: Download },
            { label: 'Export Activity Logs', sub: 'JSON · ~80KB', icon: Download },
            { label: 'Full System Backup', sub: 'ZIP · ~200KB', icon: Database },
          ].map(({ label, sub, icon: Icon }) => (
            <button key={label}
              onClick={() => triggerToast(`${label} downloaded!`, 'success')}
              className="flex items-center gap-3 p-3 bg-slate-50 border border-white/[0.08] rounded-xl hover:bg-white/8 hover:border-white/15 transition-colors cursor-pointer text-left group">
              <div className="w-9 h-9 bg-slate-100 border border-slate-500/20 rounded-xl flex items-center justify-center group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-colors">
                <Icon className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
              </div>
              <div>
                <p className="text-slate-900 text-xs font-semibold">{label}</p>
                <p className="text-slate-600 text-[10px]">{sub}</p>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-red-400 transition-colors" />
            </button>
          ))}
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="bg-white border border-red-500/20 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/10">
          <div className="w-8 h-8 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <h3 className="text-red-400 font-bold text-sm">Danger Zone</h3>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Clear All Activity Logs', sub: 'Permanently delete all admin action logs. Cannot be undone.' },
            { label: 'Logout All Admin Sessions', sub: 'Force logout from all active admin sessions.' },
          ].map(({ label, sub }) => (
            <div key={label} className="flex items-center justify-between gap-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
              <div>
                <p className="text-red-300 text-xs font-semibold">{label}</p>
                <p className="text-red-400/50 text-[10px]">{sub}</p>
              </div>
              <button
                onClick={() => triggerToast('Action requires confirmation. Feature disabled in demo.', 'warning')}
                className="shrink-0 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap">
                Execute
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
