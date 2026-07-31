import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * AdminStatCard — Reusable metric card with icon, value, trend, and optional sparkline.
 *
 * Props:
 *   label        string   — card title
 *   value        string|number — primary metric
 *   sub          string   — subtitle / secondary info
 *   icon         LucideIcon
 *   color        string   — Tailwind class string for icon background + text
 *   trend        number   — percentage change (positive = up, negative = down, 0 = flat)
 *   delay        number   — animation delay in seconds
 *   accent       string   — 'red' | 'green' | 'amber' | 'blue' | 'purple' | 'indigo'
 *   pulse        boolean  — show pulsing indicator (for live/emergency stats)
 */
const ACCENT_MAP = {
  red:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    border: 'border-rose-200/80', shadow: 'shadow-md shadow-rose-500/10' },
  green:  { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200/80', shadow: 'shadow-md shadow-emerald-500/10' },
  amber:  { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-200/80', shadow: 'shadow-md shadow-amber-500/10' },
  blue:   { bg: 'bg-blue-50',    icon: 'text-blue-600',    border: 'border-blue-200/80', shadow: 'shadow-md shadow-blue-500/10' },
  purple: { bg: 'bg-purple-50',  icon: 'text-purple-600',  border: 'border-purple-200/80', shadow: 'shadow-md shadow-purple-500/10' },
  indigo: { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  border: 'border-indigo-200/80', shadow: 'shadow-md shadow-indigo-500/10' },
};

export default function AdminStatCard({
  label, value, sub, icon: Icon, trend = null, delay = 0, accent = 'red', pulse = false
}) {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.red;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="relative bg-white border border-slate-200/80 rounded-3xl p-5 overflow-hidden hover:shadow-md shadow-xs transition-all duration-300 group"
    >
      {/* Background glow */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${a.bg} rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500`} />

      {/* Pulse indicator */}
      {pulse && (
        <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
        </span>
      )}

      <div className="relative z-10">
        {/* Icon + Trend row */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-11 h-11 ${a.bg} border ${a.border} ${a.shadow} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-5 h-5 ${a.icon}`} />
          </div>
          {trend !== null && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              trend > 0 ? 'bg-emerald-50 text-emerald-600' :
              trend < 0 ? 'bg-red-50 text-red-600' :
              'bg-slate-50 text-slate-600'
            }`}>
              {trend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> :
               trend < 0 ? <TrendingDown className="w-2.5 h-2.5" /> :
               <Minus className="w-2.5 h-2.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        {/* Value */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="text-2xl font-black text-slate-900 tracking-tight"
        >
          {value ?? '—'}
        </motion.p>

        {/* Label */}
        <p className="text-slate-500 text-xs font-semibold mt-0.5">{label}</p>

        {/* Sub */}
        {sub && (
          <p className={`text-[10px] font-medium mt-1.5 ${a.icon} opacity-70`}>{sub}</p>
        )}
      </div>
    </motion.div>
  );
}
