import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { LogIn, Phone, Mail, Eye, EyeOff, ArrowRight, Heart, Shield, Users } from 'lucide-react';
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
  const [method, setMethod] = useState('email');
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');

  const { login, googleLogin, loading } = useAuthStore();
  const { triggerToast, fetchRequests, fetchNotifications, fetchUsers } = useAppStore();
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    if (role === 'technical_admin') navigate('/technical-admin/dashboard');
    else if (role === 'super_admin') navigate('/super-admin/dashboard');
    else if (role === 'block_admin' || role === 'admin') navigate('/block-admin/dashboard');
    else if (role === 'volunteer') navigate('/volunteer/dashboard');
    else if (role === 'unit_squad') navigate('/unit-squad/dashboard');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credential || !password) { triggerToast('Please fill all fields.', 'warning'); return; }
    const res = await login(credential, password);
    if (res.success) {
      triggerToast('Welcome back to JeevaLink!', 'success');
      await fetchRequests();
      await fetchNotifications();
      if (['admin', 'volunteer', 'super_admin', 'technical_admin', 'unit_squad'].includes(res.role)) {
        await fetchUsers();
      }
      redirectByRole(res.role);
    } else {
      triggerToast('Invalid credentials. Try again.', 'error');
    }
  };

  const handleGoogle = async () => {
    const res = await googleLogin('demo@gmail.com', 'Google Demo User');
    if (res.success) {
      triggerToast('Google sign-in successful!', 'success');
      redirectByRole(res.role);
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

          {/* Method Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {[['mobile', Phone, 'Mobile'], ['email', Mail, 'Email']].map(([val, Icon, label]) => (
              <button
                key={val}
                onClick={() => { setMethod(val); setCredential(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  method === val
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {method === 'mobile' ? 'Mobile Number' : 'Email Address'}
              </label>
              <input
                type={method === 'mobile' ? 'tel' : 'email'}
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder={method === 'mobile' ? '9876543210' : 'you@example.com'}
                className="input-base"
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

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-slate-50 px-3 text-xs font-semibold text-slate-400 uppercase">
              Or Continue With
            </span>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Register here
            </Link>
          </p>
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
