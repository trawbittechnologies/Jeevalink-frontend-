import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.js';

export default function InstallButton({
  variant = 'button',
  className = '',
  showInstalledState = false,
  label = 'Install Web App',
}) {
  const { canInstall, isInstalled, showInstallPrompt } = usePWAInstall();

  if (isInstalled) {
    if (!showInstalledState) return null;
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Installed</span>
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  if (variant === 'sidebar-item') {
    return (
      <button
        type="button"
        onClick={showInstallPrompt}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-red-50 transition-colors cursor-pointer group ${className}`}
        title="Install Web App to Home Screen"
      >
        <div className="w-8 h-8 rounded-xl bg-red-100/70 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Download className="w-4 h-4" />
        </div>
        <span className="truncate">{label}</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={showInstallPrompt}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-red-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    );
  }

  // Default button
  return (
    <button
      type="button"
      onClick={showInstallPrompt}
      className={`inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-primary text-xs font-bold transition-all active:scale-[0.99] cursor-pointer ${className}`}
    >
      <Download className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
