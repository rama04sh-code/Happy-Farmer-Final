import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, fmtDate } from "../api.js";
import AuthImage from "../components/AuthImage.jsx";
import { btnCls, Card, ErrorMsg } from "../components/ui.jsx";

const DIAG_STATUS = {
  healthy: { label: "سليم وخالٍ من الآفات", cls: "border-emerald-500/30 bg-emerald-950/60 text-emerald-300" },
  disease: { label: "مرض أو آفة محتملة", cls: "border-rose-500/30 bg-rose-950/60 text-rose-300" },
  uncertain: { label: "يحتاج فحصاً إضافياً", cls: "border-amber-500/30 bg-amber-950/60 text-amber-300" },
};
const num = (n) => Number(n).toLocaleString("ar-JO-u-nu-latn");
const MAX_MB = 5;

function DiagnosisCard({ d, highlight, onDelete }) {
  const st = DIAG_STATUS[d.status] ?? DIAG_STATUS.uncertain;
  const pct = Math.round((d.confidence ?? 0) * 100);

  return (
    <div
      className={`rounded-2xl border p-4 transition backdrop-blur-md ${st.cls} ${
        highlight ? "ring-2 ring-emerald-400" : ""
      }`}
    >
      {d.is_demo && (
        <p className="mb-2 rounded-lg bg-rose-900/80 px-3 py-1 text-center text-xs font-bold text-white border border-rose-500/30">
          نتيجة تجريبية بالنموذج الإرشادي
        </p>
      )}

      <div className="flex gap-4">
        <AuthImage
          path={d.image_url}
          alt="صورة الورقة"
          className="h-24 w-24 shrink-0 rounded-xl border border-emerald-500/30 object-cover shadow-md"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold opacity-80 font-mono">
            {st.label} · {fmtDate(d.created_at)}
          </p>
          <p className="text-lg font-black text-white mt-0.5">{d.disease_name}</p>
          
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-300 font-mono">درجة الثقة: {pct}%</p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-slate-200 leading-relaxed bg-[#070D09]/60 p-3 rounded-xl border border-white/5">
        {d.recommendation}
      </p>

      <div className="mt-3 flex items-center justify-between text-xs opacity-80 pt-2 border-t border-white/10">
        <span className="text-slate-400">النتيجة إرشادية وتدعم قرار المهندس الزراعي.</span>
        <button
          type="button"
          onClick={() => onDelete(d)}
          className="font-bold text-rose-400 hover:underline cursor-pointer"
        >
          حذف التشخيص
        </button>
      </div>
    </div>
  );
}

export default function CropDetail() {
  const { id } = useParams();
  const [crop, setCrop] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [latestYield, setLatestYield] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [yieldError, setYieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newId, setNewId] = useState(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [c, d, p] = await Promise.all([
        api(`/crops/${id}`),
        api(`/crops/${id}/diagnoses`),
        api(`/crops/${id}/yield-predictions`),
      ]);
      setCrop(c);
      setDiagnoses(d);
      setPredictions(p);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(e) {
    const f = e.target.files?.[0];
    setError("");
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      return setError("الصيغ المسموحة: JPEG أو PNG أو WebP");
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return setError(`حجم الصورة يتجاوز ${MAX_MB} ميغابايت`);
    }
    setFile(f);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const d = await api(`/crops/${id}/diagnoses`, { method: "POST", formData: fd });
      setNewId(d.id);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeDiagnosis(d) {
    if (!window.confirm("سيتم حذف سجل التشخيص وملف الصورة نهائياً. هل تريد المتابعة؟")) return;
    try {
      await api(`/diagnoses/${d.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function predict() {
    setYieldError("");
    try {
      setLatestYield(await api(`/crops/${id}/yield-prediction`, { method: "POST" }));
      load();
    } catch (err) {
      setYieldError(err.message);
    }
  }

  if (!crop)
    return error ? (
      <ErrorMsg>{error}</ErrorMsg>
    ) : (
      <p className="text-center py-12 text-slate-400">جارٍ تحميل بيانات المحصول...</p>
    );

  return (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      <div>
        <Link
          to={`/farms/${crop.farm_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>← العودة إلى المزرعة</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-emerald-500/10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <span>{crop.name}</span>
            <span className="text-2xl">🌿</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            تاريخ الغرس: {crop.planting_date}
            {crop.area_dunum ? ` · المساحة: ${num(crop.area_dunum)} دونم` : ""}
          </p>
        </div>

        <span className="self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 shadow-sm">
          فحص وتحليل ذكي بالـ AI ✦
        </span>
      </div>

      <ErrorMsg>{error}</ErrorMsg>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="تشخيص مرض ورقة النبات بالذكاء الاصطناعي">
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            التقط صورة لورقة واحدة من مسافة قريبة بإضاءة واضحة ليقوم الذكاء الاصطناعي بتشخيص الآفة أو المرض الفطري.
          </p>

          <div className="border-2 border-dashed border-emerald-500/25 rounded-2xl p-6 text-center bg-[#08120C] hover:bg-[#0B1810] transition">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pick}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-950 file:text-emerald-300 hover:file:bg-emerald-900 cursor-pointer"
            />
            {preview && (
              <div className="mt-4 flex justify-center">
                <img
                  src={preview}
                  alt="معاينة الصورة"
                  className="h-44 rounded-xl object-cover shadow-lg border border-emerald-500/30"
                />
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={!file || busy}
            className={`${btnCls} w-full mt-4`}
          >
            {busy ? "جارٍ تحليل الصورة بالذكاء الاصطناعي..." : "تحليل الصورة واكتشاف الآفات 🔍"}
          </button>
        </Card>

        <Card title="توقع إنتاج المحصول وحجم الحصاد">
          <p className="text-xs text-slate-400 mb-4">
            خوارزمية تنبؤية لتقدير كميات الحصاد بالكيلوغرام وتاريخ النضج المثالي وفقاً للظروف المناخية.
          </p>

          <button onClick={predict} className={`${btnCls} w-full`}>
            حساب التوقع التقديري للإنتاج 📊
          </button>
          
          {yieldError && <ErrorMsg>{yieldError}</ErrorMsg>}

          {latestYield && (
            <div className="mt-5 p-4 rounded-2xl bg-[#08120C] border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">الإنتاج المقدر:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ≈ {num(latestYield.estimated_kg)} كغ
                </span>
              </div>
              
              <p className="text-xs text-slate-400 font-mono">
                المدى المتوقع: {num(latestYield.low_kg)} – {num(latestYield.high_kg)} كغ
              </p>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-950">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${latestYield.progress_pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>المرحلة: {latestYield.stage} ({latestYield.progress_pct}%)</span>
                <span>الحصاد المتوقع: {latestYield.expected_harvest_date}</span>
              </div>

              <p className="text-[11px] text-slate-500 pt-2 border-t border-emerald-500/10">
                {latestYield.disclaimer}
              </p>
            </div>
          )}

          {predictions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-emerald-500/10">
              <h4 className="text-xs font-bold text-emerald-300 mb-2">التوقعات السابقة المسجلة:</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {predictions.slice(0, 4).map((p) => (
                  <li key={p.id} className="flex justify-between py-1 border-b border-emerald-500/5 last:border-0">
                    <span className="font-bold text-emerald-400 font-mono">{num(p.estimated_kg)} كغ</span>
                    <span className="font-mono text-slate-400">{fmtDate(p.created_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {diagnoses.length > 0 && (
        <Card title={`سجل الفحوصات والتشخيصات السابقة (${diagnoses.length})`}>
          <div className="space-y-3">
            {diagnoses.map((d) => (
              <DiagnosisCard
                key={d.id}
                d={d}
                highlight={d.id === newId}
                onDelete={removeDiagnosis}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
