
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
      <div
        className="relative flex items-center justify-center shrink-0 bg-white shadow-sm border border-red-300 rounded-[24%] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-red-400 p-1.5"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo.png"
          alt="JeevaLink Logo"
          className={`object-contain w-full h-full drop-shadow-sm ${imgClassName}`}
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <span
          style={{ fontFamily: "'Comfortaa', display" }}
          className={`font-bold tracking-tight leading-none ${light ? 'text-white' : 'text-slate-900'
            } ${textClassName || 'text-xl'}`}
        >
          Jeeva<span className="text-red-600 font-bold">Link</span>
        </span>
      )}
    </div>
  );
}
