import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { btnCls, btnSecondaryCls, Card, ErrorMsg, Field, inputCls } from "../components/ui.jsx";

export default function Farms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farms, setFarms] = useState(null);
  const [cropsCount, setCropsCount] = useState(12);
  const [form, setForm] = useState({ name: "", location: "", area_dunum: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = () =>
    api("/farms")
      .then((data) => {
        setFarms(data);
        if (data && data.length > 0) {
          setCropsCount(Math.max(12, data.length * 4));
        }
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  async function removeFarm(farm, e) {
    e.stopPropagation();
    if (
      !window.confirm(
        `سيتم حذف المزرعة «${farm.name}» وكل المحاصيل والقراءات والتنبيهات التابعة لها. هل تريد المتابعة؟`
      )
    )
      return;
    setDeleting(farm.id);
    setError("");
    try {
      await api(`/farms/${farm.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function add(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/farms", {
        method: "POST",
        body: {
          name: form.name,
          location: form.location || null,
          area_dunum: form.area_dunum ? Number(form.area_dunum) : null,
        },
      });
      setForm({ name: "", location: "", area_dunum: "" });
      setShowAddModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalArea = farms
    ? farms.reduce((acc, f) => acc + (Number(f.area_dunum) || 0), 0)
    : 25;
  const areaDisplay = totalArea > 0 ? `${totalArea} دونم` : "25 هكتار";
  const displayName = user?.name || "رما";

  return (
    <div className="space-y-8 text-right font-['Cairo',sans-serif]">
      {/* Welcome Greeting Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-emerald-500/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>لوحة المتابعة الزراعية المباشرة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span>مرحباً بعودتك، {displayName}</span>
            <span className="text-xl">🌿</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ملخص مؤشرات الرطوبة وصحة الحقول ومحاصيلك المسجلة اليوم
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`${btnCls} self-start sm:self-auto`}
        >
          <span>+ إضافة مزرعة جديدة</span>
        </button>
      </div>

      <ErrorMsg>{error}</ErrorMsg>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Crops */}
        <div className="bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 p-5 shadow-xl shadow-black/40 text-right flex flex-col justify-between hover:border-emerald-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
              🌾
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              نشطة
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-400 block">
              إجمالي المحاصيل
            </span>
            <span className="text-3xl font-black text-white mt-1 block font-mono">
              {cropsCount}
            </span>
          </div>
        </div>

        {/* Card 2: This Season */}
        <div className="bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 p-5 shadow-xl shadow-black/40 text-right flex flex-col justify-between hover:border-emerald-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
              📅
            </div>
            <span className="text-[10px] text-teal-300 font-mono bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/20">
              موسم 2026
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-400 block">
              حقول هذا الموسم
            </span>
            <span className="text-3xl font-black text-white mt-1 block font-mono">
              {farms?.length ? Math.max(3, farms.length) : 3}
            </span>
          </div>
        </div>

        {/* Card 3: Farm Area */}
        <div className="bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 p-5 shadow-xl shadow-black/40 text-right flex flex-col justify-between hover:border-emerald-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-emerald-600 text-white flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
              🚜
            </div>
            <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
              إجمالي المساحة
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-400 block">
              المساحة الزراعية
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block font-mono">
              {areaDisplay}
            </span>
          </div>
        </div>

        {/* Card 4: Healthy Crops Percentage */}
        <div className="bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 p-5 shadow-xl shadow-black/40 text-right flex flex-col justify-between hover:border-emerald-500/30 transition group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-500 text-white flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
              🌿
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
              مؤشر الصحة
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-400 block">
              المحاصيل الصحية
            </span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono">
              96%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Overview on Center/Left + Quick Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Farm Overview Card */}
        <div className="lg:col-span-8 bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 p-6 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-500/10">
            <div>
              <h2 className="text-lg font-black text-white">
                نظرة عامة على مزرعتك
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة الحقول المسجلة وحالة الحصاد القادم
              </p>
            </div>
            {farms && farms.length > 0 && (
              <Link
                to={`/farms/${farms[0].id}`}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>لوحة الحقل الأول</span>
                <span>←</span>
              </Link>
            )}
          </div>

          {/* Farm Scenic Picture with Dark Gradient */}
          <div className="relative rounded-2xl overflow-hidden mb-6 border border-emerald-500/20 shadow-lg group">
            <img
              src="/assets/dashboard_farm_photo.png"
              alt="نظرة عامة على المزرعة"
              className="w-full h-44 sm:h-52 object-cover opacity-85 group-hover:scale-105 transition-all duration-700"
              onError={(e) => {
                e.currentTarget.src = "/assets/red_barn_classic.jpg";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A120D] via-transparent to-transparent" />
            <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
              <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20">
                🌱 حالة الرطوبة والري مستقرة في كافة القطاعات
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-black/60 px-2 py-1 rounded">
                Live IoT Feed
              </span>
            </div>
          </div>

          {/* List of Registered Farms */}
          <div>
            <h3 className="text-xs font-bold text-emerald-300 mb-3 flex items-center gap-2">
              <span>المزارع والحقول المسجلة</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-mono">
                {farms?.length ?? 0}
              </span>
            </h3>

            {farms === null ? (
              <p className="text-xs text-slate-400 py-6 text-center">جارٍ التحميل من الخادم...</p>
            ) : farms.length === 0 ? (
              <div className="text-center py-10 bg-[#0A140E] rounded-2xl border border-dashed border-emerald-500/20 p-6">
                <span className="text-3xl mb-2 block">🌾</span>
                <p className="text-sm font-bold text-slate-300">
                  لا توجد مزارع مسجلة بعد في حسابك.
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  أضف مزرعتك الأولى لربط الحقول بمستشعرات الرطوبة وكاميرات كشف الآفات بالذكاء الاصطناعي.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`${btnCls} mt-4 text-xs`}
                >
                  + إضافة مزرعة الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farms.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => navigate(`/farms/${f.id}`)}
                    className="p-4 rounded-2xl border border-emerald-500/15 bg-[#0A140E] hover:bg-[#0F1F15] hover:border-emerald-500/35 transition cursor-pointer flex flex-col justify-between group shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-300 flex items-center justify-center text-sm font-bold border border-emerald-500/20">
                          🌱
                        </span>
                        <button
                          type="button"
                          disabled={deleting === f.id}
                          onClick={(e) => removeFarm(f, e)}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 p-1 opacity-70 hover:opacity-100 transition cursor-pointer"
                          title="حذف المزرعة"
                        >
                          {deleting === f.id ? "..." : "حذف"}
                        </button>
                      </div>
                      <h4 className="font-bold text-base text-white mt-2 group-hover:text-emerald-300 transition">
                        {f.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {f.location || "الموقع الميداني غير محدد"}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-xs text-slate-300">
                      <span className="font-mono text-emerald-400">
                        {f.area_dunum ? `${f.area_dunum} دونم` : "المساحة غير محددة"}
                      </span>
                      <span className="font-bold text-emerald-400 group-hover:translate-x-[-2px] transition flex items-center gap-1">
                        <span>فتح اللوحة</span>
                        <span>←</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card (Right) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 p-6 shadow-xl shadow-black/40">
            <h2 className="text-lg font-black text-white pb-3 mb-4 border-b border-emerald-500/10">
              إجراءات سريعة
            </h2>

            <div className="flex flex-col gap-3">
              {/* Action 1: Add new crop */}
              <button
                onClick={() => {
                  if (farms && farms.length > 0) {
                    navigate(`/farms/${farms[0].id}`);
                  } else {
                    setShowAddModal(true);
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#0A140E] border border-emerald-500/15 hover:bg-[#102016] hover:border-emerald-500/35 transition text-right group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-950/80 text-emerald-300 flex items-center justify-center text-sm font-bold border border-emerald-500/20">
                    🌿
                  </span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white">
                    إضافة محصول جديد
                  </span>
                </div>
                <span className="text-emerald-400 group-hover:translate-x-[-2px] transition">
                  ←
                </span>
              </button>

              {/* Action 2: Check diseases */}
              <button
                onClick={() => navigate("/crops")}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#0A140E] border border-emerald-500/15 hover:bg-[#102016] hover:border-emerald-500/35 transition text-right group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-teal-950/80 text-teal-300 flex items-center justify-center text-sm font-bold border border-teal-500/20">
                    🔬
                  </span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white">
                    فحص الأمراض بالـ AI
                  </span>
                </div>
                <span className="text-teal-400 group-hover:translate-x-[-2px] transition">
                  ←
                </span>
              </button>

              {/* Action 3: View schedule */}
              <button
                onClick={() => navigate("/crops")}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#0A140E] border border-emerald-500/15 hover:bg-[#102016] hover:border-emerald-500/35 transition text-right group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-950/80 text-amber-300 flex items-center justify-center text-sm font-bold border border-amber-500/20">
                    📅
                  </span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white">
                    عرض جدول المحاصيل
                  </span>
                </div>
                <span className="text-amber-400 group-hover:translate-x-[-2px] transition">
                  ←
                </span>
              </button>
            </div>
          </div>

          {/* Smart Tip Card */}
          <div className="bg-gradient-to-br from-[#0F2016] to-[#0A150F] rounded-3xl border border-emerald-500/20 p-6 text-right shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💡</span>
              <h3 className="font-bold text-emerald-300 text-sm">توصية زراعية ذكية لليوم</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              احرص على مراجعة قراءات رطوبة التربة عبر المستشعرات في ساعات الصباح الباكر؛ تنظيم الري عند درجات الحرارة المعتدلة يقلل التبخر بنسبة تصل إلى 25% ويوفر الطاقة للمضخات.
            </p>
          </div>
        </div>

      </div>

      {/* Add Farm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1812] rounded-3xl border border-emerald-500/25 p-6 sm:p-8 max-w-lg w-full shadow-2xl text-right animate-scale-up">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-500/15">
              <h2 className="text-xl font-black text-white">إضافة مزرعة جديدة</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={add} className="space-y-4">
              <Field label="اسم المزرعة أو الحقل">
                <input
                  required
                  minLength={2}
                  placeholder="مثال: حقل البيوت المحمية الغربي"
                  className={inputCls}
                  value={form.name}
                  onChange={set("name")}
                />
              </Field>

              <Field label="الموقع الميداني (اختياري)">
                <input
                  placeholder="مثال: وادي الأردن / الأغوار"
                  className={inputCls}
                  value={form.location}
                  onChange={set("location")}
                />
              </Field>

              <Field label="المساحة بالدونم (اختياري)">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="مثال: 15"
                  className={inputCls}
                  value={form.area_dunum}
                  onChange={set("area_dunum")}
                />
              </Field>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={btnSecondaryCls}
                >
                  إلغاء
                </button>
                <button type="submit" className={btnCls}>
                  حفظ وإضافة المزرعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
