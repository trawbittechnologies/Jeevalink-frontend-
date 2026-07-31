
/**
 * JeevaLink Official Logo Component
 * Uses the official logo image from public/logo.png across the navbar, loading screen, sidebar, and headers.
 */
export default function JeevaLinkLogo({
  size = 40,
  showText = true,
  className = '',
  textClassName = '',
  light = false,
  imgClassName = '',
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official JeevaLink Logo Image from public/logo.png */}
      <img
        src="/logo.png"
        alt="JeevaLink Logo"
        className={`object-contain shrink-0 transition-transform duration-300 hover:scale-105 ${imgClassName}`}
        style={{ width: size, height: size }}
      />

      {/* Brand Typography */}
      {showText && (
        <span
          className={`font-black tracking-tight leading-none ${
            light ? 'text-white' : 'text-slate-900'
          } ${textClassName || 'text-lg'}`}
        >
          Jeeva<span className="text-red-600 font-black">Link</span>
        </span>
      )}
    </div>
  );
}
