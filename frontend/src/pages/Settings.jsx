import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore.js';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, BellRing, Smartphone, ShieldCheck, Info } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { triggerToast } = useAppStore();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    triggerToast(
      !isDarkMode ? 'Dark mode enabled!' : 'Light mode enabled!',
      'info'
    );
  };

  const handleTogglePush = () => {
    setPushEnabled(!pushEnabled);
    triggerToast(
      !pushEnabled ? 'Push notifications activated!' : 'Push notifications silenced.',
      'info'
    );
  };

  const handleToggleSms = () => {
    setSmsEnabled(!smsEnabled);
    triggerToast(
      !smsEnabled ? 'Emergency SMS dispatch activated!' : 'Emergency SMS dispatch muted.',
      'info'
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 pt-6 pb-24 select-none">
      <div className="max-w-2xl mx-auto">
        {/* Settings Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm text-slate-800 dark:text-zinc-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100">Settings</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-550">Configure application configurations</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-4">
        {/* Visual Settings */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
          <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-zinc-500 mb-4 pl-0.5">Appearance</h3>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-100 flex items-center justify-center">
                {isDarkMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Dark Theme Override</h4>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">Toggle dark mode visual system</p>
              </div>
            </div>
            {/* Toggle Switch */}
            <button
              onClick={handleThemeToggle}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                isDarkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  isDarkMode ? 'translate-x-4' : ''
                }`} 
              />
            </button>
          </div>
        </div>

        {/* Notifications & Alert Settings */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-zinc-500 pl-0.5">Alert Dispatch Settings</h3>
          
          {/* Push alert toggle */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-100 flex items-center justify-center">
                <BellRing className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Push Notifications</h4>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">Receive nearby blood requests</p>
              </div>
            </div>
            <button
              onClick={handleTogglePush}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                pushEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  pushEnabled ? 'translate-x-4' : ''
                }`} 
              />
            </button>
          </div>

          {/* SMS Alert toggle */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-100 flex items-center justify-center">
                <Smartphone className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">SMS Broadcasts</h4>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">Dispatch local SMS alerts (simulated)</p>
              </div>
            </div>
            <button
              onClick={handleToggleSms}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                smsEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-800'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  smsEnabled ? 'translate-x-4' : ''
                }`} 
              />
            </button>
          </div>
        </div>

        {/* Security & Health Standards */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-zinc-500 pl-0.5">Health Standards</h3>
          
          <div className="flex items-start gap-3 text-xs leading-relaxed text-slate-550 dark:text-zinc-400">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              JeevaLink complies with regional health donation timelines. Donors must weigh at least 45kg and allow a 90-day cooldown interval between blood donations.
            </p>
          </div>
        </div>

        {/* About App metadata */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-400 dark:text-zinc-500 pl-0.5">Build Information</h3>
          
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-100 flex items-center justify-center shrink-0">
              <Info className="w-4.5 h-4.5" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-zinc-100">JeevaLink Core (v2.0.26)</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">React 19, Vite, Tailwind CSS v4, Zustand</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Developed by Advanced Agentic Coding</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400">
            <span>Server connection</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
