export const inputCls =
  "w-full px-4 py-3 rounded-2xl bg-[#0B150F] border border-emerald-500/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition duration-200 text-sm shadow-inner";

export const btnCls =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-950/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

export const btnSecondaryCls =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 active:scale-[0.98] transition-all duration-200 border border-emerald-500/25 shadow-sm disabled:opacity-50 cursor-pointer";

export const btnDangerCls =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 transition cursor-pointer";

export const badgeHealthyCls =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 shadow-xs";

export function Card({ title, subtitle, extra, children, className = "" }) {
  return (
    <section className={`bg-[#0E1A13]/85 backdrop-blur-xl rounded-3xl border border-emerald-500/15 p-6 shadow-xl shadow-black/30 hover:border-emerald-500/25 transition duration-300 ${className}`}>
      {(title || extra) && (
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-500/10">
          <div>
            {title && <h2 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, icon, children, className = "" }) {
  return (
    <label className={`block text-right ${className}`}>
      <span className="block mb-2 text-xs font-bold text-emerald-300/90 flex items-center gap-1.5">
        {icon && <span className="opacity-80 text-emerald-400">{icon}</span>}
        {label}
      </span>
      {children}
    </label>
  );
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return (
    <div className="my-2.5 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs font-medium text-rose-200 flex items-center gap-2.5 backdrop-blur-md shadow-lg" role="alert">
      <span className="text-sm">⚠️</span>
      <span>{children}</span>
    </div>
  );
}

export const STATUS = {
  green: { label: "الحالة ممتازة", cls: "border-emerald-500/30 bg-emerald-950/50 text-emerald-300" },
  yellow: { label: "تحتاج متابعة", cls: "border-amber-500/30 bg-amber-950/50 text-amber-300" },
  red: { label: "تنبيه حرج", cls: "border-rose-500/30 bg-rose-950/50 text-rose-300" },
  unknown: { label: "لا توجد قراءات بعد", cls: "border-slate-700 bg-slate-900/60 text-slate-400" },
};

export const SEVERITY_CLS = {
  info: "border-emerald-500/30 bg-emerald-950/40 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-950/40 text-amber-300",
  critical: "border-rose-500/30 bg-rose-950/40 text-rose-300",
};
