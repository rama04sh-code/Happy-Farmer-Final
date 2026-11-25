import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, fmtDate } from "../api.js";
import { btnCls, Card, ErrorMsg, Field, inputCls, SEVERITY_CLS, STATUS } from "../components/ui.jsx";

const today = () => new Date().toISOString().slice(0, 10);

export default function FarmDetail() {
  const { id } = useParams();
  const [dash, setDash] = useState(null);
  const [readings, setReadings] = useState([]);
  const [crops, setCrops] = useState([]);
  const [error, setError] = useState("");
  const [reading, setReading] = useState({ soil_moisture: "", temperature: "" });
  const [crop, setCrop] = useState({ name: "", planting_date: today(), area_dunum: "" });

  const load = useCallback(async () => {
    try {
      const [d, r, c] = await Promise.all([
        api(`/farms/${id}/dashboard`),
        api(`/farms/${id}/readings?limit=20`),
        api(`/farms/${id}/crops`),
      ]);
      setDash(d);
      setReadings(r);
      setCrops(c);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addReading(e) {
    e.preventDefault();
    try {
      await api(`/farms/${id}/readings`, {
        method: "POST",
        body: {
          soil_moisture: Number(reading.soil_moisture),
          temperature: reading.temperature === "" ? null : Number(reading.temperature),
        },
      });
      setReading({ soil_moisture: "", temperature: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addCrop(e) {
    e.preventDefault();
    try {
      await api(`/farms/${id}/crops`, {
        method: "POST",
        body: { ...crop, area_dunum: crop.area_dunum ? Number(crop.area_dunum) : null },
      });
      setCrop({ name: "", planting_date: today(), area_dunum: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCrop(c) {
    if (!window.confirm(`سيتم حذف المحصول «${c.name}» وسجل التشخيص وصوره وتوقعاته. هل تريد المتابعة؟`)) return;
    try {
      await api(`/crops/${c.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markRead(nid) {
    try {
      await api(`/notifications/${nid}/read`, { method: "POST" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!dash)
    return error ? (
      <ErrorMsg>{error}</ErrorMsg>
    ) : (
      <p className="text-slate-400 text-center py-12">جارٍ تحميل بيانات الحقل...</p>
    );

  const st = STATUS[dash.status] || STATUS.unknown;
  const chartData = [...readings].reverse().map((r) => ({
    t: fmtDate(r.recorded_at),
    v: r.soil_moisture,
  }));

  return (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      <div>
        <Link
          to="/farms"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>← العودة إلى لوحة المزارع</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-emerald-500/10">
        <div>
          <h1 className="text-3xl font-black text-white">
            {dash.farm.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            {dash.farm.location || "الموقع الميداني غير محدد"}
            {dash.farm.area_dunum ? ` · المساحة: ${dash.farm.area_dunum} دونم` : ""}
          </p>
        </div>

        <span className="self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>مراقبة متصلة ومباشرة</span>
        </span>
      </div>

      <ErrorMsg>{error}</ErrorMsg>

      {/* Status Banner */}
      <div className={`rounded-3xl border p-5 shadow-xl flex items-center justify-between backdrop-blur-md ${st.cls}`}>
        <div>
          <p className="text-lg font-bold">{st.label}</p>
          {dash.latest_reading ? (
            <p className="mt-1 text-xs opacity-90 font-mono">
              رطوبة التربة: %{dash.latest_reading.soil_moisture}
              {dash.latest_reading.temperature != null && (
                <> · درجة الحرارة: {dash.latest_reading.temperature}°C</>
              )}
              {" · "}آخر تحديث: {fmtDate(dash.latest_reading.recorded_at)}
            </p>
          ) : (
            <p className="mt-1 text-xs opacity-90">أدخل أول قراءة رطوبة عبر المستشعر لتظهر حالة الحقل بدقة.</p>
          )}
        </div>
        <span className="text-3xl">🌿</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={`التنبيهات الميدانية (${dash.unread_notifications} غير مقروء)`}
          extra={
            <Link
              to={`/farms/${id}/notifications`}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              عرض الكل ←
            </Link>
          }
        >
          {dash.recent_notifications.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">لا توجد تنبيهات حرجة حالياً، الوضع مستقر.</p>
          ) : (
            <ul className="space-y-2.5">
              {dash.recent_notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-2xl border p-3.5 text-xs backdrop-blur-md ${
                    SEVERITY_CLS[n.severity] || "border-emerald-500/20 bg-emerald-950/40"
                  } ${n.is_read ? "opacity-60" : ""}`}
                >
                  <p className="font-semibold text-sm text-white">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between opacity-80 text-[11px]">
                    <span className="font-mono">{fmtDate(n.created_at)}</span>
                    {!n.is_read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="font-bold text-emerald-400 hover:underline cursor-pointer"
                      >
                        تم الاطلاع ✓
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="إدخال قراءة جديدة للتربة">
          <form onSubmit={addReading} className="space-y-4">
            <Field label="مستوى رطوبة التربة % (0 - 100)">
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.1"
                placeholder="مثال: 68.5"
                className={inputCls}
                value={reading.soil_moisture}
                onChange={(e) =>
                  setReading({ ...reading, soil_moisture: e.target.value })
                }
              />
            </Field>

            <Field label="درجة الحرارة المئوية °C (اختياري)">
              <input
                type="number"
                min="-30"
                max="70"
                step="0.1"
                placeholder="مثال: 24.5"
                className={inputCls}
                value={reading.temperature}
                onChange={(e) =>
                  setReading({ ...reading, temperature: e.target.value })
                }
              />
            </Field>

            <button className={`${btnCls} w-full`}>
              حفظ القراءة في السجل
            </button>
          </form>
        </Card>
      </div>

      {/* Chart Section */}
      <Card title="منحنى رطوبة التربة ومستويات الري (آخر 20 قراءة)">
        {chartData.length < 2 ? (
          <p className="text-sm text-slate-400 py-10 text-center">
            يلزم إدخال قراءتين على الأقل لعرض الرسم البياني التفاعلي.
          </p>
        ) : (
          <div dir="ltr" className="h-72 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52, 211, 153, 0.08)" />
                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={{ stroke: "rgba(52, 211, 153, 0.2)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A140E",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                    borderRadius: "16px",
                    color: "#FFFFFF",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    fontFamily: "Cairo, sans-serif",
                  }}
                />
                <ReferenceLine y={25} stroke="#F43F5E" strokeDasharray="4 4" label={{ value: "جفاف حرج", fill: "#F43F5E", fontSize: 10 }} />
                <ReferenceLine y={45} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "مستوى ري معتدل", fill: "#F59E0B", fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="v"
                  name="الرطوبة %"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", r: 4 }}
                  activeDot={{ r: 6, fill: "#34D399" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Crops of this farm */}
      <Card title={`محاصيل هذا الحقل (${crops.length})`}>
        {crops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {crops.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-emerald-500/15 bg-[#0A140E] flex flex-col justify-between hover:border-emerald-500/30 transition group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-white group-hover:text-emerald-300 transition">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCrop(c)}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    تاريخ الغرس: {c.planting_date}
                    {c.area_dunum ? ` · المساحة: ${c.area_dunum} دونم` : ""}
                  </p>
                </div>

                <Link
                  to={`/crops/${c.id}`}
                  className="mt-4 block text-center py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/20 transition cursor-pointer"
                >
                  فحص وتشخيص الذكاء الاصطناعي ←
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-6 text-center">لا توجد محاصيل مضافة لهذا الحقل بعد.</p>
        )}

        <div className="pt-4 border-t border-emerald-500/10">
          <h3 className="text-sm font-bold text-emerald-300 mb-3">إضافة محصول لهذا الحقل:</h3>
          <form onSubmit={addCrop} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Field label="اسم المحصول">
              <input
                required
                minLength={2}
                placeholder="مثال: بندورة هجين"
                className={inputCls}
                value={crop.name}
                onChange={(e) => setCrop({ ...crop, name: e.target.value })}
              />
            </Field>

            <Field label="تاريخ الغرس">
              <input
                type="date"
                required
                className={inputCls}
                value={crop.planting_date}
                onChange={(e) => setCrop({ ...crop, planting_date: e.target.value })}
              />
            </Field>

            <Field label="المساحة بالدونم (اختياري)">
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="مثال: 4"
                className={inputCls}
                value={crop.area_dunum}
                onChange={(e) => setCrop({ ...crop, area_dunum: e.target.value })}
              />
            </Field>

            <div className="flex items-end">
              <button className={`${btnCls} w-full`}>
                + حفظ المحصول
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
