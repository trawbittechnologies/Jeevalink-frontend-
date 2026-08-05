import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { normalizeRole } from '../utils/rbac.js';
import { LogIn, Mail, Eye, EyeOff, ArrowRight, Heart, Shield, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import JeevaLinkLogo from '../components/JeevaLinkLogo.jsx';

const trustStats = [
  { value: '12,847+', label: 'Donors' },
  { value: '4,521+', label: 'Lives Saved' },
  { value: '24/7', label: 'Emergency' },
  { value: '98%', label: 'Match Rate' },
];

export default function Login() {
  const [credential, setCredential] = useState('techadmin@jeevalink.org');
  const [password, setPassword] = useState('TechAdmin@2026');
  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');

  const { login, loading } = useAuthStore();
  const { triggerToast, fetchRequests, fetchNotifications, fetchUsers } = useAppStore();
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    const norm = normalizeRole(role);
    console.log('[DEBUG Login] redirectByRole:', { rawRole: role, normalizedRole: norm });
    if (norm === 'technical_admin') navigate('/technical-admin/dashboard');
    else if (norm === 'super_admin') navigate('/super-admin/dashboard');
    else if (norm === 'block_admin') navigate('/block-admin/dashboard');
    else if (norm === 'volunteer') navigate('/volunteer/dashboard');
    else if (norm === 'unit_squad') navigate('/unit-squad/dashboard');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[DEBUG Login] Form submitted for:', credential);
    if (!credential || !password) { triggerToast('Please fill all fields.', 'warning'); return; }
    
    try {
      const res = await login(credential, password);
      console.log('[DEBUG Login] login result object:', res);
      
      if (res && res.success) {
        triggerToast('Welcome back to JeevaLink!', 'success');
        
        // Execute background data loads asynchronously without blocking route navigation
        Promise.allSettled([
          fetchRequests(),
          fetchNotifications(),
          ['admin', 'volunteer', 'super_admin', 'technical_admin', 'unit_squad'].includes(res.role) ? fetchUsers() : Promise.resolve()
        ]).catch(err => console.warn('[DEBUG Login] Background fetch warning:', err));

        console.log('[DEBUG Login] Triggering navigation for role:', res.role);
        redirectByRole(res.role);
      } else {
        const errorMsg = res?.error || 'Invalid credentials. Try again.';
        console.error('[DEBUG Login] Login failed with error:', errorMsg);
        triggerToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('[DEBUG Login] Exception in handleSubmit:', err);
      triggerToast('Login failed: ' + (err.message || 'Server error'), 'error');
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-red-600 via-red-700 to-rose-800 flex-col justify-between px-14 py-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/3 rounded-full pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <JeevaLinkLogo size={38} textClassName="text-xl" light={true} />
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-white/90 font-semibold">12,000+ Active Donors Online</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-4 leading-tight tracking-tight">
            Welcome Back,<br />
            <span className="text-red-200 inline-flex items-center gap-2">Life Saver <Heart className="w-6 h-6 fill-current inline-block" /></span>
          </h1>
          <p className="text-red-200 text-sm leading-relaxed mb-8">
            Sign in to check active blood requests, manage your donor profile,
            and keep saving lives across India.
          </p>

          {/* Trust stats */}
          <div className="grid grid-cols-2 gap-3">
            {trustStats.map(({ value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-red-300 text-xs font-semibold mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative z-10 flex items-center gap-3 flex-wrap">
          {[
            { icon: Shield, label: 'Verified' },
            { icon: Heart, label: 'Trusted' },
            { icon: Users, label: 'Community' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
              <Icon className="w-3 h-3 text-red-300" />
              <span className="text-xs text-white/90 font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-slate-500 mt-1.5">Connecting Life · Sharing Hope</p>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email or JeevaLink ID
              </label>
              <input
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="you@example.com or JL-SA-KSD-0001"
                className="input-base"
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 font-semibold cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm rounded-2xl shadow-lg shadow-red-100 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>




        </motion.div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-slate-100"
          >
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1.5 tracking-tight">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Enter your registered email and we'll send you a password reset link.
            </p>
            <input
              type="email"
              value={forgotInput}
              onChange={(e) => setForgotInput(e.target.value)}
              placeholder="your@email.com"
              className="input-base mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setForgotOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!forgotInput) return triggerToast('Enter your email.', 'warning');
                  const res = await useAuthStore.getState().forgotPassword(forgotInput);
                  if (res.success) {
                    triggerToast('Password reset link sent to your email.', 'success');
                    setForgotOpen(false);
                    setForgotInput('');
                  } else {
                    triggerToast(res.error, 'error');
                  }
                }}
                disabled={loading}
                className="flex-1 py-2.5 bg-primary hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Sending…' : 'Send Link'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
