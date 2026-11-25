export default function Logo({
  size = "md",
  layout = "horizontal",
  textColor,
  showText = true,
  subtitle = false,
  className = "",
}) {
  const sizeMap = {
    sm: { box: "w-8 h-8", text: "text-base", sub: "text-[11px]" },
    md: { box: "w-10 h-10", text: "text-xl", sub: "text-xs" },
    lg: { box: "w-14 h-14", text: "text-2xl", sub: "text-sm" },
    xl: { box: "w-20 h-20", text: "text-3xl", sub: "text-base" },
  };

  const s = sizeMap[size] || sizeMap.md;
  const isVertical = layout === "vertical";

  return (
    <div
      className={`inline-flex ${
        isVertical ? "flex-col items-center text-center gap-2.5" : "flex-row items-center gap-3 text-right"
      } select-none group ${className}`}
    >
      {/* High-Precision Modern AgriTech Glowing Emblem */}
      <div className={`relative ${s.box} shrink-0`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-600/30 via-emerald-400/20 to-teal-400/10 blur-sm group-hover:blur-md transition-all duration-300 pointer-events-none" />
        
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-md"
        >
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#13261C" />
              <stop offset="100%" stopColor="#08120B" />
            </linearGradient>
            <linearGradient id="logoBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Hexagonal / Rounded Shield Background */}
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="26"
            fill="url(#logoBg)"
            stroke="url(#logoBorder)"
            strokeWidth="3.5"
          />

          {/* Modern Soil Furrow Arc Waves */}
          <path
            d="M24 70 C36 60, 64 60, 76 70"
            stroke="#10B981"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M32 78 C40 71, 60 71, 68 78"
            stroke="#34D399"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Plant Central Sprout Stem */}
          <path d="M50 64 V33" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />

          {/* Left Leaf */}
          <path
            d="M50 50 C38 44, 28 47, 26 38 C25 28, 40 31, 50 40 Z"
            fill="url(#leafGrad)"
          />

          {/* Right Leaf */}
          <path
            d="M50 42 C62 33, 72 37, 74 27 C75 18, 60 21, 50 32 Z"
            fill="url(#leafGrad)"
          />

          {/* Sun / Growth Light Dot at Top */}
          <circle cx="50" cy="22" r="5" fill="url(#sunGrad)" />
        </svg>
      </div>

      {showText && (
        <div className={`flex flex-col ${isVertical ? "items-center" : "items-start"}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-tight bg-gradient-to-l from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent ${s.text}`}
              style={textColor ? { color: textColor } : {}}
            >
              المزارع السعيد
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          {subtitle && (
            <span
              className={`font-medium tracking-wide text-emerald-400/80 ${s.sub}`}
            >
              المنظومة الزراعية الذكية
            </span>
          )}
        </div>
      )}
    </div>
  );
}
