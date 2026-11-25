import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, fmtDate } from "../api.js";
import { Card, ErrorMsg, SEVERITY_CLS } from "../components/ui.jsx";

const TYPE_LABEL = { low_moisture: "ري", disease: "مرض" };

export default function Notifications() {
  const { id } = useParams();
  const [items, setItems] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      api(`/farms/${id}/notifications${unreadOnly ? "?unread_only=true" : ""}`)
        .then(setItems)
        .catch((e) => setError(e.message)),
    [id, unreadOnly]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(nid) {
    try {
      await api(`/notifications/${nid}/read`, { method: "POST" });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6 text-right font-['Cairo',sans-serif]">
      <div>
        <Link
          to={`/farms/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
        >
          <span>← العودة إلى المزرعة</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-emerald-500/10">
        <div>
          <h1 className="text-3xl font-black text-white">
            سجل التنبيهات الميدانية
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تابع كافة إشعارات الري، مستويات رطوبة التربة، وتحذيرات الآفات
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-[#0E1A13] px-4 py-2 rounded-full border border-emerald-500/20 cursor-pointer shadow-md select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded bg-[#070D09] border-emerald-500/30 text-emerald-500 focus:ring-emerald-500/20"
          />
          <span>غير المقروء فقط</span>
        </label>
      </div>

      <ErrorMsg>{error}</ErrorMsg>

      <Card>
        {items === null ? (
          <p className="text-slate-400 text-center py-10">جارٍ التحميل...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-400 text-center py-10">
            {unreadOnly ? "لا توجد تنبيهات غير مقروءة حالياً." : "لا توجد أي تنبيهات مسجلة لهذه المزرعة."}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border p-4 text-xs transition backdrop-blur-md ${
                  SEVERITY_CLS[n.severity] || "border-emerald-500/15 bg-[#08120C]"
                } ${n.is_read ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-sm text-white">{n.message}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-[10px] font-mono">
                    {TYPE_LABEL[n.type] || n.type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-white/5 font-mono">
                  <span>{fmtDate(n.created_at)}</span>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="font-bold text-emerald-400 hover:underline cursor-pointer"
                    >
                      تحديد كمقروء ✓
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
