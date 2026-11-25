import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { btnCls, ErrorMsg } from "../components/ui.jsx";
import Logo from "../components/Logo.jsx";
import BotanicalDecoration from "../components/BotanicalDecoration.jsx";

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      return setError("كلمة المرور يجب ألا تقل عن 8 أحرف");
    }
    setBusy(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070C09] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-['Cairo',sans-serif]" dir="rtl">
      <BotanicalDecoration position="top-right" />
      <BotanicalDecoration position="bottom-left" />

      <div className="w-full max-w-5xl bg-[#0D1812]/90 backdrop-blur-2xl rounded-3xl border border-emerald-500/20 p-6 sm:p-10 md:p-12 shadow-2xl shadow-black/80 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12 relative z-10">
        
        {/* Left Side: Brand Visual */}
        <div className="w-full md:w-1/2 flex flex-col items-center text-center">
          <div className="mb-4">
            <Logo size="xl" layout="vertical" showText={false} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            المزارع السعيد
          </h1>

          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-l from-emerald-400 to-teal-200 bg-clip-text text-transparent mt-2">
            انضم إلى المنظومة الذكية
          </p>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
            أنشئ حسابك خلال 60 ثانية وابدأ بربط مستشعرات حقولك ومتابعة محاصيلك
          </p>

          <div className="mt-6 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/20 bg-black/60 relative group">
            <img
              src="/assets/red_barn_classic.jpg"
              alt="المزرعة الكلاسيكية الحديثة"
              className="w-full h-44 object-cover opacity-85 group-hover:scale-105 transition duration-500"
              onError={(e) => {
                e.currentTarget.src = "/assets/farm_overview.png";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A120D] via-transparent to-transparent" />
            <div className="absolute bottom-3 right-3 text-right">
              <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                ★ تجربة مجانية لكافة الميزات
              </span>
              <span className="text-xs text-white font-semibold">
                حقول ومحاصيل غير محدودة
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Floating Register Card */}
        <div className="w-full md:w-1/2 max-w-md bg-[#0A140E]/80 rounded-3xl p-6 sm:p-8 border border-emerald-500/25 shadow-xl text-right">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 text-center">
            إنشاء حساب جديد
          </h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            سجل بياناتك للبدء في إدارة مزرعتك بذكاء
          </p>

          <form onSubmit={submit} className="space-y-4">
            {/* Name Field */}
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-emerald-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  placeholder="الاسم الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 rounded-2xl bg-[#070D09] border border-emerald-500/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition text-sm text-right shadow-inner"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-emerald-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 rounded-2xl bg-[#070D09] border border-emerald-500/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition text-sm text-right shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-emerald-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  dir="ltr"
                  autoComplete="new-password"
                  placeholder="كلمة المرور (8 أحرف على الأقل)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 pl-11 py-3 rounded-2xl bg-[#070D09] border border-emerald-500/20 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25 transition text-sm text-right shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <ErrorMsg>{error}</ErrorMsg>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className={`${btnCls} w-full py-3.5 text-base mt-2`}
            >
              <span>{busy ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب الآن"}</span>
              {!busy && <span>➔</span>}
            </button>
          </form>

          {/* Footer Login Link */}
          <div className="mt-6 text-center text-xs text-slate-400 border-t border-emerald-500/15 pt-4">
            لديك حساب بالفعل؟{" "}
            <Link
              to="/login"
              className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
