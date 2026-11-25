export default function BotanicalDecoration({ position = "top-left", className = "" }) {
  const glows = {
    "top-left": "top-0 left-0 -translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl",
    "top-right": "top-0 right-0 translate-x-1/3 -translate-y-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl",
    "bottom-left": "bottom-0 left-0 -translate-x-1/3 translate-y-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl",
    "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl",
    "crops-left": "bottom-10 left-10 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl",
  };

  const glowClass = glows[position] || glows["top-left"];

  return (
    <div
      className={`pointer-events-none absolute z-0 select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className={glowClass} />
    </div>
  );
}
