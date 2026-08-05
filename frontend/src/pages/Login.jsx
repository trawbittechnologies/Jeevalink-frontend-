import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { normalizeRole } from '../utils/rbac.js';
import { Mail, Eye, EyeOff, Lock, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JeevaLinkLogo from '../components/JeevaLinkLogo.jsx';

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
    if (norm === 'technical_admin') navigate('/technical-admin/dashboard');
    else if (norm === 'super_admin') navigate('/super-admin/dashboard');
    else if (norm === 'block_admin') navigate('/block-admin/dashboard');
    else if (norm === 'volunteer') navigate('/volunteer/dashboard');
    else if (norm === 'unit_squad') navigate('/unit-squad/dashboard');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credential || !password) { triggerToast('Please fill all fields.', 'warning'); return; }
    
    try {
      const res = await login(credential, password);
      
      if (res && res.success) {
        triggerToast('Authentication Successful. Welcome back!', 'success');
        
        Promise.allSettled([
          fetchRequests(),
          fetchNotifications(),
          ['admin', 'volunteer', 'super_admin', 'technical_admin', 'unit_squad'].includes(res.role) ? fetchUsers() : Promise.resolve()
        ]).catch(err => console.warn('[DEBUG Login] Background fetch warning:', err));

        redirectByRole(res.role);
      } else {
        const errorMsg = res?.error || 'Invalid credentials. Please try again.';
        triggerToast(errorMsg, 'error');
      }
    } catch (err) {
      triggerToast('Login failed: ' + (err.message || 'Server error'), 'error');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col lg:flex-row bg-[#F8FAFC] overflow-hidden font-sans selection:bg-rose-200 selection:text-rose-900">
      
      {/* ── Immersive Abstract Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b lg:bg-gradient-to-br from-red-600 via-rose-600 to-red-900">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-red-950/20 rounded-full blur-[100px] mix-blend-multiply"
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-rose-400/20 rounded-full blur-[120px] mix-blend-screen opacity-50"
        />
        <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* ── Brand Hero (Top on Mobile, Left on Desktop) ── */}
      <div className="relative z-10 w-full lg:w-[45%] xl:w-[50%] flex flex-col justify-start lg:justify-center px-6 pt-12 pb-32 sm:pb-40 lg:p-20 text-white">
        {/* Logo and name removed for extreme minimalism, as user already saw it on landing page */}

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 lg:mt-16 max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-sm">
            <Heart className="w-3.5 h-3.5 text-rose-200 fill-rose-200/50" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-white drop-shadow-sm">A Community of Hope</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.1] tracking-tight mb-5 text-white drop-shadow-md">
            Humanity at its <br/>
            <span className="italic text-white/90 font-light">most vital.</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed drop-shadow-sm font-medium">
            Behind every login is a potential life saved. Access your portal to coordinate, connect, and continue the mission of compassion.
          </p>
        </motion.div>
      </div>

      {/* ── Auth Form (Bottom Sheet on Mobile, Right Panel on Desktop) ── */}
      <div className="relative z-20 w-full lg:w-[55%] xl:w-[50%] flex items-end lg:items-center justify-center -mt-20 lg:mt-0 lg:p-12 xl:p-16">
        <motion.div 
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 1, delay: 0.3 }}
          className="w-full max-w-[500px] bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.3)] lg:shadow-2xl px-6 sm:px-10 py-8 lg:p-12 pb-24 lg:pb-12"
        >
           {/* iOS-style drag handle indicator for mobile only */}
           <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 lg:hidden"></div>
           
           <div className="mb-10 text-center lg:text-left">
             <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
               Welcome Back
             </h2>
             <p className="text-slate-500 text-sm font-medium">Please securely log in to your portal.</p>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-6">
             
             {/* Modern Outline Input - Email */}
             <div className="space-y-1.5">
               <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 block text-left">
                 Email Address
               </label>
               <div className="relative flex items-center group">
                 <div className="absolute left-4">
                   <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                 </div>
                 <input
                   type="text"
                   value={credential}
                   onChange={(e) => setCredential(e.target.value)}
                   className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-red-500 rounded-2xl transition-all duration-300 py-4 pl-12 pr-4 text-slate-900 font-medium text-sm outline-none shadow-sm"
                   placeholder="you@jeevalink.org"
                 />
               </div>
             </div>

             {/* Modern Outline Input - Password */}
             <div className="space-y-1.5">
               <div className="flex justify-between items-center pl-1 pr-2">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left">
                   Password
                 </label>
                 <button type="button" onClick={() => setForgotOpen(true)} className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors">
                   Forgot?
                 </button>
               </div>
               <div className="relative flex items-center group">
                 <div className="absolute left-4">
                   <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                 </div>
                 <input
                   type={showPassword ? 'text' : 'password'}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-red-500 rounded-2xl transition-all duration-300 py-4 pl-12 pr-12 text-slate-900 font-medium text-sm outline-none tracking-widest shadow-sm"
                   placeholder="••••••••"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 text-slate-400 hover:text-slate-800 transition-colors p-1"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>
             </div>

             {/* Remember Me */}
             <div className="flex items-center justify-between pt-2 pb-2">
                 <label className="flex items-center gap-3 cursor-pointer group">
                   <div className="relative flex items-center justify-center">
                     <input
                       type="checkbox"
                       checked={rememberMe}
                       onChange={(e) => setRememberMe(e.target.checked)}
                       className="peer sr-only"
                     />
                     <div className="w-4 h-4 border-2 border-slate-300 rounded bg-white peer-checked:bg-red-600 peer-checked:border-red-600 transition-all duration-300 flex items-center justify-center">
                       <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300" viewBox="0 0 14 10" fill="none">
                         <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                       </svg>
                     </div>
                   </div>
                   <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors font-medium">Keep me signed in</span>
                 </label>
             </div>

             {/* Action Button */}
             <button
               type="submit"
               disabled={loading}
               className="relative w-full group overflow-hidden rounded-2xl bg-red-600 hover:bg-red-700 transition-colors duration-300 shadow-[0_8px_20px_rgba(220,38,38,0.2)] hover:shadow-[0_15px_30px_rgba(220,38,38,0.4)] transform hover:-translate-y-0.5"
             >
               <div className="px-6 py-4 flex items-center justify-center gap-3">
                 {loading ? (
                     <>
                       <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                       </svg>
                       <span className="text-white text-xs font-bold tracking-widest uppercase">Authenticating...</span>
                     </>
                 ) : (
                   <>
                     <span className="text-white text-xs font-bold tracking-widest uppercase">Sign In</span>
                     <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
               </div>
             </button>
           </form>
           
           <div className="mt-8 flex items-center justify-center gap-1.5 opacity-60">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                Secured by JeevaLink Enterprise
              </p>
           </div>
        </motion.div>
      </div>

      {/* ── Forgot Password Minimal Modal ── */}
      <AnimatePresence>
        {forgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setForgotOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl overflow-hidden"
            >
              <div className="relative z-10 flex flex-col">
                 <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-6">
                    <Mail className="w-6 h-6 text-red-600" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Reset Password</h3>
                 <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                   Enter your registered email address. We'll send you a secure link to reset your password.
                 </p>
                 
                 <div className="w-full space-y-8">
                   <div className="relative flex items-center group">
                     <div className="absolute left-4">
                       <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                     </div>
                     <input
                        type="email"
                        value={forgotInput}
                        onChange={(e) => setForgotInput(e.target.value)}
                        placeholder="you@jeevalink.org"
                        className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 focus:border-red-500 rounded-2xl transition-all duration-300 py-4 pl-12 pr-4 text-slate-900 font-medium text-sm outline-none shadow-sm"
                     />
                   </div>
                   
                   <div className="flex gap-4">
                     <button 
                       onClick={() => setForgotOpen(false)} 
                       className="flex-1 py-4 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={async () => {
                         if (!forgotInput) return triggerToast('Please enter your email.', 'warning');
                         const res = await useAuthStore.getState().forgotPassword(forgotInput);
                         if (res.success) {
                           triggerToast('Secure reset link dispatched to your email.', 'success');
                           setForgotOpen(false);
                           setForgotInput('');
                         } else {
                           triggerToast(res.error, 'error');
                         }
                       }}
                       disabled={loading}
                       className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                     >
                       {loading ? 'Sending...' : 'Send Link'}
                     </button>
                   </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
