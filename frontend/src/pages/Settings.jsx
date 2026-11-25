import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { btnCls, btnDangerCls, Card, ErrorMsg, Field, inputCls } from "../components/ui.jsx";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (form.new_password !== form.confirm) {
      return setError("تأكيد كلمة المرور الجديدة غير متطابق");
    }
    if (form.new_password.length < 8) {
      return setError("كلمة المرور الجديدة يجب أن تتكون من 8 أحرف على الأقل");
    }
    setBusy(true);
    try {
      await api("/auth/password", {
        method: "PATCH",
        body: {
          current_password: form.current_password,
          new_password: form.new_password,
        },
      });
      setSuccess(true);
      setForm({ current_password: "", new_password: "", confirm: "" });
      setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl text-right font-['Cairo',sans-serif]">
      <div className="pb-2 border-b border-emerald-500/10">
        <h1 className="text-3xl font-black text-white">
          الملف الشخصي والإعدادات
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          إدارة بيانات الحساب وإعدادات الأمان
        </p>
      </div>

      <Card title="بيانات الحساب">
        <div className="flex items-center gap-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-black shadow-lg ring-2 ring-emerald-500/30">
            {(user?.name || "ر").trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.name || "المزارع"}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email || "user@example.com"}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
              حساب مزارع نشط ✦
            </span>
          </div>
        </div>
      </Card>

      <Card title="تغيير كلمة المرور">
        <form onSubmit={submit} className="space-y-4">
          <Field label="كلمة المرور الحالية">
            <input
              type="password"
              required
              minLength={8}
              dir="ltr"
              autoComplete="current-password"
              className={inputCls}
              value={form.current_password}
              onChange={(e) =>
                setForm({ ...form, current_password: e.target.value })
              }
            />
          </Field>

          <Field label="كلمة المرور الجديدة">
            <input
              type="password"
              required
              minLength={8}
              dir="ltr"
              autoComplete="new-password"
              className={inputCls}
              value={form.new_password}
              onChange={(e) =>
                setForm({ ...form, new_password: e.target.value })
              }
            />
          </Field>

          <Field label="تأكيد كلمة المرور الجديدة">
            <input
              type="password"
              required
              minLength={8}
              dir="ltr"
              autoComplete="new-password"
              className={inputCls}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </Field>

          {success && (
            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-bold text-emerald-300">
              ✓ تم تغيير كلمة المرور بنجاح! سيتم تحويلك لتسجيل الدخول مجدداً...
            </div>
          )}

          <ErrorMsg>{error}</ErrorMsg>

          <button className={`${btnCls} w-full`} disabled={busy}>
            {busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </form>
      </Card>

      <Card title="جلسة الدخول">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-bold text-white">إنهاء الجلسة الحالية</p>
            <p className="text-xs text-slate-400">تسجيل الخروج من الحساب على هذا الجهاز.</p>
          </div>
          <button onClick={logout} className={btnDangerCls}>
            تسجيل الخروج
          </button>
        </div>
      </Card>
    </div>
  );
}
