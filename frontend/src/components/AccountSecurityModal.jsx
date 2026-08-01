import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import {
  X, Lock, Mail, Eye, EyeOff, KeyRound,
  CheckCircle2, AlertTriangle, Loader2, ShieldCheck
} from 'lucide-react';

/**
 * AccountSecurityModal — matches DeleteConfirmModal design language.
 * Props:
 *   mode: 'password' | 'email'
 *   onClose: () => void
 */
export default function AccountSecurityModal({ mode = 'password', onClose }) {
  const { changePassword, changeEmail, loading, user } = useAuthStore();
  const { triggerToast } = useAppStore();

  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [emailPwd, setEmailPwd]       = useState('');
  const [newEmail, setNewEmail]       = useState('');
  const [showEmailPwd, setShowEmailPwd] = useState(false);

  const [submitting, setSubmitting]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [success, setSuccess]         = useState(false);

  const isPassword = mode === 'password';

  // Password strength
  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };
  const strengthScore  = isPassword ? getStrength(newPwd) : 0;
  const strengthLabel  = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor  = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strengthScore];

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!currentPwd || !newPwd || !confirmPwd) { setErrorMsg('Please fill in all fields.'); return; }
    if (newPwd.length < 6)                      { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd)                  { setErrorMsg('Passwords do not match.'); return; }
    setSubmitting(true);
    const res = await changePassword(currentPwd, newPwd);
    setSubmitting(false);
    if (res.success) {
      setSuccess(true);
      triggerToast('Password changed successfully!', 'success');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } else {
      setErrorMsg(res.error || 'Failed to change password.');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailPwd || !newEmail) { setErrorMsg('Please fill in all fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setErrorMsg('Enter a valid email address.'); return; }
    setSubmitting(true);
    const res = await changeEmail(emailPwd, newEmail);
    setSubmitting(false);
    if (res.success) {
      setSuccess(true);
      triggerToast('Email updated successfully!', 'success');
      setEmailPwd(''); setNewEmail('');
    } else {
      setErrorMsg(res.error || 'Failed to update email.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-red-100 p-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>

          {/* Icon circle */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
            {isPassword
              ? <KeyRound className="w-8 h-8 text-red-600" />
              : <Mail className="w-8 h-8 text-red-600" />
            }
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-gray-900 leading-tight text-center">
            {isPassword ? 'Change Password' : 'Change Email'}
          </h3>
          <p className="text-xs font-medium text-gray-500 mt-1 text-center px-2">
            {isPassword
              ? 'Enter your current password then set a new one'
              : `Current email: ${user?.email || '—'}`
            }
          </p>

          {/* Success state */}
          {success && (
            <div className="mt-4 p-2.5 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isPassword ? 'Password updated successfully!' : 'Email updated successfully!'}</span>
            </div>
          )}

          {/* Error state */}
          {errorMsg && (
            <div className="mt-4 p-2.5 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-red-600">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form
              onSubmit={isPassword ? handlePasswordSubmit : handleEmailSubmit}
              className="mt-4 space-y-3"
            >
              {isPassword ? (
                <>
                  <PwdField
                    label="Current Password"
                    value={currentPwd}
                    onChange={setCurrentPwd}
                    show={showCurrent}
                    onToggle={() => setShowCurrent(v => !v)}
                    id="cp-current"
                    placeholder="Your current password"
                  />
                  <PwdField
                    label="New Password"
                    value={newPwd}
                    onChange={setNewPwd}
                    show={showNew}
                    onToggle={() => setShowNew(v => !v)}
                    id="cp-new"
                    placeholder="Min. 6 characters"
                  />

                  {/* Strength bar */}
                  {newPwd.length > 0 && (
                    <div className="space-y-1 px-0.5">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= strengthScore ? strengthColor : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-gray-500">
                        Strength: <span className="text-gray-700">{strengthLabel}</span>
                      </p>
                    </div>
                  )}

                  <PwdField
                    label="Confirm Password"
                    value={confirmPwd}
                    onChange={setConfirmPwd}
                    show={showConfirm}
                    onToggle={() => setShowConfirm(v => !v)}
                    id="cp-confirm"
                    placeholder="Re-enter new password"
                  />
                  {confirmPwd && newPwd !== confirmPwd && (
                    <p className="text-[10px] font-semibold text-red-500 px-0.5">Passwords do not match.</p>
                  )}
                </>
              ) : (
                <>
                  <PwdField
                    label="Current Password"
                    value={emailPwd}
                    onChange={setEmailPwd}
                    show={showEmailPwd}
                    onToggle={() => setShowEmailPwd(v => !v)}
                    id="ce-pwd"
                    placeholder="Confirm with your password"
                  />
                  <EmailField
                    value={newEmail}
                    onChange={setNewEmail}
                  />
                </>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-xl shadow-red-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {(submitting || loading)
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <ShieldCheck className="w-3.5 h-3.5" />
                  }
                  {(submitting || loading)
                    ? 'Saving...'
                    : isPassword ? 'Update Password' : 'Update Email'
                  }
                </button>
              </div>
            </form>
          )}

          {/* After success — close button */}
          {success && (
            <button
              onClick={onClose}
              className="mt-4 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs shadow-xl shadow-red-200 transition-all cursor-pointer"
            >
              Done
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ── Sub-components ─────────────────────────────── */

function PwdField({ label, value, onChange, show, onToggle, id, placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 text-sm text-gray-900 placeholder-slate-300 bg-transparent outline-none"
        />
        <button type="button" onClick={onToggle} tabIndex={-1} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function EmailField({ value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="ce-email">
        New Email Address
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          id="ce-email"
          type="email"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="your@newemail.com"
          autoComplete="email"
          className="flex-1 text-sm text-gray-900 placeholder-slate-300 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}
