import { useState } from "react";
import { Link } from "react-router-dom";
import { btnCls, ErrorMsg } from "../components/ui.jsx";
import Logo from "../components/Logo.jsx";
import BotanicalDecoration from "../components/BotanicalDecoration.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await new Promise((res) => setTimeout(res, 600));
      setSuccess(true);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء إرسال الرابط");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070C09] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-['Cairo',sans-serif]" dir="rtl">
      <BotanicalDecoration position="top-right" />
      <BotanicalDecoration position="bottom-left" />

      <div className="w-full max-w-4xl bg-[#0D1812]/90 backdrop-blur-2xl rounded-3xl border border-emerald-500/20 p-6 sm:p-10 md:p-12 shadow-2xl shadow-black/80 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
        
        <div className="w-full md:w-1/2 flex flex-col items-center text-center">
          <div className="mb-4">
            <Logo size="xl" layout="vertical" showText={false} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white">
            المزارع السعيد
          </h1>

          <p className="text-xl font-bold bg-gradient-to-l from-emerald-400 to-teal-200 bg-clip-text text-transparent mt-2">
            استعادة كلمة المرور
          </p>

          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
            أدخل بريدك الإلكتروني المسجل لاستلام رابط إعادة تعيين كلمة المرور فوراً
          </p>
        </div>

        <div className="w-full md:w-1/2 max-w-md bg-[#0A140E]/80 rounded-3xl p-6 sm:p-8 border border-emerald-500/25 shadow-xl text-right">
          <h2 className="text-2xl font-black text-white mb-2 text-center">
            نسيت كلمة المرور؟
          </h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            سنرسل لك رابطاً آمناً لاسترجاع حسابك
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
                تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني. تفقد صندوق الوارد وصندوق الرسائل غير المرغوبة.
              </div>
              <Link
                to="/login"
                className={`${btnCls} w-full py-3.5 text-sm text-center block`}
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
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

              <ErrorMsg>{error}</ErrorMsg>

              <button
                type="submit"
                disabled={busy}
                className={`${btnCls} w-full py-3.5 text-base mt-2`}
              >
                <span>{busy ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}</span>
                {!busy && <span>➔</span>}
              </button>

              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
