
/**
 * iDonate Official Logo Component
 * Uses the official logo image from public/idonate.png across navbar, sidebar, dashboard, and headers.
 */
export default function JeevaLinkLogo({
  size = 40,
  showText = true,
  className = '',
  textClassName = '',
  light = false,
  imgClassName = '',
  showSubtitle = false,
  subtitle = 'DYFI Kasaragod',
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official iDonate Logo Image from public/idonate.png */}
      <div
        className="relative flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <img
          src="/idonate.png"
          alt="iDonate Logo"
          className={`object-contain w-full h-full drop-shadow-sm rounded-lg ${imgClassName}`}
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center text-left">
          <span
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            className={`font-black tracking-tight leading-none ${light ? 'text-white' : 'text-slate-900'
              } ${textClassName || 'text-xl'}`}
          >
            <span style={{ color: '#dc2626' }}>i</span>
            <span style={{ color: light ? '#ffffff' : '#0f172a' }}>Donate</span>
          </span>
          {showSubtitle && subtitle && (
            <span
              className={`text-[9px] sm:text-[9.5px] font-black tracking-wider uppercase leading-none mt-1 ${
                light ? 'text-rose-200' : 'text-red-600'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
