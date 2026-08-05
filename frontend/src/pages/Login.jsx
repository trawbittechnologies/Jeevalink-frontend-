import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { normalizeRole } from '../utils/rbac.js';
import { Mail, Eye, EyeOff, ArrowRight, Heart } from 'lucide-react';
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
        triggerToast('Authentication Successful.', 'success');
        
        Promise.allSettled([
          fetchRequests(),
          fetchNotifications(),
          ['admin', 'volunteer', 'super_admin', 'technical_admin', 'unit_squad'].includes(res.role) ? fetchUsers() : Promise.resolve()
        ]).catch(err => console.warn('[DEBUG Login] Background fetch warning:', err));

        redirectByRole(res.role);
      } else {
        const errorMsg = res?.error || 'Invalid credentials. Try again.';
        triggerToast(errorMsg, 'error');
      }
    } catch (err) {
      triggerToast('Login failed: ' + (err.message || 'Server error'), 'error');
    }
  };

  return (
    <div className="min-h-screen relative bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans selection:bg-red-200 selection:text-red-900">
      
      {/* ── Dynamic Animated Background Orbs ── */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, 80, 0], y: [0, -40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-red-400/20 rounded-full blur-[100px] md:blur-[140px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.4, 1], x: [0, -80, 0], y: [0, 80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-rose-400/20 rounded-full blur-[120px] md:blur-[160px] pointer-events-none"
      />
      
      {/* Noise Texture Overlay for Premium Feel */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      ></div>

      {/* ── Main Glassmorphic Container ── */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-6xl rounded-[2rem] md:rounded-[3rem] bg-white/60 backdrop-blur-2xl md:backdrop-blur-3xl border border-white shadow-[0_30px_100px_-20px_rgba(220,38,38,0.15)] overflow-hidden flex flex-col lg:flex-row"
      >
        
        {/* Left Side: Cinematic Branding */}
        <div className="lg:w-[45%] p-10 md:p-16 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-200/50">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative z-10 flex flex-col items-start cursor-default"
          >
            {/* Friendly, humanized logo arrangement */}
            <div className="flex items-center gap-3 mb-2">
               <JeevaLinkLogo showText={false} size={42} className="drop-shadow-sm" />
               <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight flex items-center">
                 Jeeva<span className="text-red-600">Link</span>
               </h2>
            </div>
            
            {/* Humanized Subtitle */}
            <div className="flex items-center gap-2 pl-1 opacity-90 mt-1">
               <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
               </svg>
               <span className="text-sm font-medium text-slate-500 tracking-wide">
                 Connecting lives, sharing hope.
               </span>
            </div>
          </motion.div>

          <div className="relative z-10 mt-16 mb-8 lg:my-auto">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 leading-[1.1] tracking-tight mb-6">
                Be the reason <br/>
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-pink-500 drop-shadow-sm">someone smiles.</span>
              </h1>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-sm font-medium">
                Every drop counts. Join our community of lifesavers and make a real difference in the world today.
              </p>
            </motion.div>
          </div>

          {/* Decorative Abstract Nodes (Softened) */}
          <div className="relative z-10 hidden md:flex items-center gap-4">
             <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full border border-slate-200 bg-white/50 flex items-center justify-center backdrop-blur-md relative z-30 shadow-md">
                   <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div className="w-12 h-12 rounded-full border border-slate-200/60 bg-white/30 flex items-center justify-center backdrop-blur-sm relative z-20"></div>
                <div className="w-12 h-12 rounded-full border border-slate-200/40 bg-white/10 flex items-center justify-center backdrop-blur-sm relative z-10"></div>
             </div>
             <div className="text-[11px] text-slate-400 font-medium">A Lifesaving Community</div>
          </div>
        </div>

        {/* Right Side: Glassmorphic Form */}
        <div className="flex-1 p-8 md:p-16 lg:p-20 flex flex-col justify-center relative bg-white/40">
           
           {/* Internal ambient glow */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-400/10 rounded-full blur-[80px] pointer-events-none" />

           <div className="relative z-10 w-full max-w-[400px] mx-auto">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4 }}
             >
               <div className="mb-12">
                 <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
                 <p className="text-slate-500 text-sm font-medium">Sign in to continue your lifesaving journey.</p>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-6">
                 
                 {/* Email Input */}
                 <div className="space-y-2 group">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-red-600 transition-colors duration-300">
                      Email or ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={credential}
                        onChange={(e) => setCredential(e.target.value)}
                        className="w-full bg-white/70 border border-slate-200/80 text-slate-900 placeholder-slate-400 px-5 py-4 rounded-2xl focus:outline-none focus:border-red-400 focus:bg-white transition-all duration-300 text-sm md:text-base font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        placeholder="Enter your email"
                      />
                    </div>
                 </div>

                 {/* Password Input */}
                 <div className="space-y-2 group">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-red-600 transition-colors duration-300">
                        Password
                      </label>
                      <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/70 border border-slate-200/80 text-slate-900 placeholder-slate-400 px-5 py-4 rounded-2xl focus:outline-none focus:border-red-400 focus:bg-white transition-all duration-300 text-sm md:text-base font-medium pr-12 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                 </div>

                 {/* Checkbox */}
                 <div className="flex items-center pt-2 pb-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 border border-slate-300 rounded-md bg-white peer-checked:bg-red-600 peer-checked:border-red-600 transition-all duration-300"></div>
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-300" viewBox="0 0 14 10" fill="none">
                          <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-slate-500 group-hover:text-slate-800 transition-colors font-medium">Keep me signed in</span>
                    </label>
                 </div>

                 {/* Glowing Submit Button */}
                 <button
                   type="submit"
                   disabled={loading}
                   className="relative w-full group overflow-hidden rounded-2xl shadow-[0_8px_20px_rgba(220,38,38,0.2)] hover:shadow-[0_8px_30px_rgba(220,38,38,0.3)] transition-all duration-500"
                 >
                   <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity duration-500"></span>
                   <div className="relative px-4 py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors duration-500">
                     {loading ? (
                       <>
                         <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                         </svg>
                         <span className="text-white text-sm font-bold tracking-widest uppercase">Signing In...</span>
                       </>
                     ) : (
                       <>
                         <span className="text-white text-sm font-bold tracking-widest uppercase">Sign In</span>
                         <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                       </>
                     )}
                   </div>
                 </button>

               </form>
             </motion.div>
           </div>
        </div>
      </motion.div>
      
      {/* ── Forgot Password Glass Modal ── */}
      <AnimatePresence>
        {forgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setForgotOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm rounded-[2rem] bg-white/95 backdrop-blur-2xl border border-white p-8 md:p-10 shadow-[0_20px_60px_rgba(220,38,38,0.15)] overflow-hidden"
            >
              {/* Internal glow for modal */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-400/10 rounded-full blur-[60px] pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-full border border-red-100 bg-red-50 flex items-center justify-center mb-6 shadow-sm">
                    <Mail className="w-6 h-6 text-red-500" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Reset Password</h3>
                 <p className="text-slate-500 text-xs md:text-sm font-medium mb-8 leading-relaxed">
                   Enter your email address and we'll send you a link to reset your password.
                 </p>
                 
                 <div className="w-full space-y-6">
                   <input
                      type="email"
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 px-5 py-4 rounded-xl focus:outline-none focus:border-red-400 focus:bg-white transition-all text-sm font-medium text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                   />
                   <div className="flex gap-3">
                     <button 
                       onClick={() => setForgotOpen(false)} 
                       className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold tracking-widest uppercase transition-all"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={async () => {
                         if (!forgotInput) return triggerToast('Enter your email.', 'warning');
                         const res = await useAuthStore.getState().forgotPassword(forgotInput);
                         if (res.success) {
                           triggerToast('Password reset link sent.', 'success');
                           setForgotOpen(false);
                           setForgotInput('');
                         } else {
                           triggerToast(res.error, 'error');
                         }
                       }}
                       disabled={loading}
                       className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-bold tracking-widest uppercase shadow-[0_4px_15px_rgba(220,38,38,0.25)] transition-all disabled:opacity-50"
                     >
                       {loading ? 'Sending...' : 'Transmit'}
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
