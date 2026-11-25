import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { badgeHealthyCls, btnCls, btnSecondaryCls, ErrorMsg, Field, inputCls } from "../components/ui.jsx";

const today = () => new Date().toISOString().slice(0, 10);

// Default staple crops with high-res photography
const defaultCrops = [
  {
    id: "default-tomato",
    name: "بندورة كرزية",
    image: "/assets/tomato_hd.jpg",
    fallbackImage: "/assets/exact_tomato.png",
    status: "صحي وممتاز",
    score: 99,
    planted: "2026-03-15",
    area: "8 دونم",
    cycle: "مرحلة الإثمار",
  },
  {
    id: "default-lettuce",
    name: "خس روماني هيدروبونيك",
    image: "/assets/lettuce_hd.jpg",
    fallbackImage: "/assets/exact_lettuce.png",
    status: "صحي وممتاز",
    score: 98,
    planted: "2026-04-01",
    area: "5 دونم",
    cycle: "اكتمال النمو",
  },
  {
    id: "default-cucumber",
    name: "خيار بيوت محمية",
    image: "/assets/cucumber_hd.jpg",
    fallbackImage: "/assets/exact_cucumber.png",
    status: "صحي وممتاز",
    score: 97,
    planted: "2026-03-20",
    area: "6 دونم",
    cycle: "حصاد مستمر",
  },
];

export default function Crops() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCrop, setNewCrop] = useState({
    farm_id: "",
    name: "",
    planting_date: today(),
    area_dunum: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const farmsList = await api("/farms");
      setFarms(farmsList);

      if (farmsList.length > 0) {
        setNewCrop((prev) => ({ ...prev, farm_id: farmsList[0].id }));
        const cropsPromises = farmsList.map((f) =>
          api(`/farms/${f.id}/crops`).catch(() => [])
        );
        const results = await Promise.all(cropsPromises);
        const allFetchedCrops = results.flat();
        setCrops(allFetchedCrops);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddCrop(e) {
    e.preventDefault();
    if (!newCrop.farm_id) {
      return setError("يرجى اختيار المزرعة أولاً");
    }
    setError("");
    try {
      await api(`/farms/${newCrop.farm_id}/crops`, {
        method: "POST",
        body: {
          name: newCrop.name,
          planting_date: newCrop.planting_date,
          area_dunum: newCrop.area_dunum ? Number(newCrop.area_dunum) : null,
        },
      });
      setShowAddModal(false);
      setNewCrop({
        farm_id: farms[0]?.id || "",
        name: "",
        planting_date: today(),
        area_dunum: "",
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const getCropImage = (name) => {
    if (name.includes("طماطم") || name.includes("بندورة")) return "/assets/tomato_hd.jpg";
    if (name.includes("خس") || name.includes("ورق")) return "/assets/lettuce_hd.jpg";
    if (name.includes("خيار") || name.includes("كوسا")) return "/assets/cucumber_hd.jpg";
    return "/assets/lettuce_hd.jpg";
  };

  const displayedCrops = crops.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 text-right font-['Cairo',sans-serif]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-emerald-500/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>إدارة الحقول والمحاصيل</span>
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <span>محاصيلي الزراعية</span>
            <span className="text-2xl">🌿</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            متابعة مراحل نمو النبات، الاحتياج المائي، والتشخيص البصري للأمراض
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (farms.length === 0) {
                navigate("/farms");
              } else {
                setShowAddModal(true);
              }
            }}
            className={`${btnCls} self-start sm:self-auto`}
          >
            <span>+ إضافة محصول</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن محصول..."
            className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1A13] border border-emerald-500/20 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="text-xs text-slate-400">
          عرض <span className="font-mono text-emerald-400 font-bold">{crops.length || defaultCrops.length}</span> محاصيل مسجلة
        </div>
      </div>

      <ErrorMsg>{error}</ErrorMsg>

      {/* Grid of Crop Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Render staple 3 cards if user crops are empty */}
        {crops.length === 0 && (
          <>
            {defaultCrops.map((c) => (
              <div
                key={c.id}
                className="bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 overflow-hidden shadow-xl shadow-black/40 hover:border-emerald-500/35 transition duration-300 flex flex-col justify-between group"
              >
                {/* Crop Photo Frame */}
                <div className="p-3 pb-0">
                  <div className="rounded-2xl overflow-hidden h-48 bg-black relative border border-emerald-500/20">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition duration-700 opacity-90"
                      onError={(e) => {
                        e.currentTarget.src = c.fallbackImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A13] via-transparent to-transparent" />
                    
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                      {c.cycle}
                    </span>

                    <span className="absolute bottom-2 right-3 text-xs font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                      مؤشر الصحة: %{c.score}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 text-right flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition">
                        {c.name}
                      </h3>
                      <span className={badgeHealthyCls}>✓ {c.status}</span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">تاريخ الغرس:</span>
                        <span className="font-mono text-slate-200">{c.planted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">المساحة المزروعة:</span>
                        <span className="font-mono text-emerald-400 font-bold">{c.area}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full mt-5 pt-3 border-t border-emerald-500/10">
                    <button
                      onClick={() => {
                        if (farms.length > 0) {
                          navigate(`/farms/${farms[0].id}`);
                        } else {
                          navigate("/farms");
                        }
                      }}
                      className="w-full py-2.5 rounded-2xl font-bold text-xs text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 transition border border-emerald-500/25 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>عرض تفاصيل الحقل</span>
                      <span>←</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Dynamic User Crops */}
        {displayedCrops.map((c) => (
          <div
            key={c.id}
            className="bg-[#0E1A13]/90 rounded-3xl border border-emerald-500/15 overflow-hidden shadow-xl shadow-black/40 hover:border-emerald-500/35 transition duration-300 flex flex-col justify-between group"
          >
            <div className="p-3 pb-0">
              <div className="rounded-2xl overflow-hidden h-48 bg-black relative border border-emerald-500/20">
                <img
                  src={getCropImage(c.name)}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition duration-700 opacity-90"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/exact_tomato.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A13] via-transparent to-transparent" />
                <span className="absolute bottom-2 right-3 text-xs font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                  مستشعر نشط
                </span>
              </div>
            </div>

            <div className="p-5 text-right flex flex-col flex-1 justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition">
                    {c.name}
                  </h3>
                  <span className={badgeHealthyCls}>✓ صحي</span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  {c.planting_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">تاريخ الغرس:</span>
                      <span className="font-mono text-slate-200">{c.planting_date}</span>
                    </div>
                  )}
                  {c.area_dunum && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">المساحة:</span>
                      <span className="font-mono text-emerald-400 font-bold">{c.area_dunum} دونم</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full mt-5 pt-3 border-t border-emerald-500/10">
                <Link
                  to={`/crops/${c.id}`}
                  className="w-full py-2.5 rounded-2xl font-bold text-xs text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 transition border border-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer text-center block"
                >
                  <span>عرض التفاصيل والتحليلات</span>
                  <span>←</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Crop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1812] rounded-3xl border border-emerald-500/25 p-6 sm:p-8 max-w-lg w-full shadow-2xl text-right animate-scale-up">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-500/15">
              <h2 className="text-xl font-black text-white">إضافة محصول جديد</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCrop} className="space-y-4">
              <Field label="المزرعة أو القطاع">
                <select
                  value={newCrop.farm_id}
                  onChange={(e) =>
                    setNewCrop({ ...newCrop, farm_id: e.target.value })
                  }
                  className={inputCls}
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#0D1812] text-white">
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="اسم المحصول">
                <input
                  required
                  minLength={2}
                  placeholder="مثال: طماطم، خس روماني، خيار..."
                  className={inputCls}
                  value={newCrop.name}
                  onChange={(e) =>
                    setNewCrop({ ...newCrop, name: e.target.value })
                  }
                />
              </Field>

              <Field label="تاريخ الزراعة">
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={newCrop.planting_date}
                  onChange={(e) =>
                    setNewCrop({ ...newCrop, planting_date: e.target.value })
                  }
                />
              </Field>

              <Field label="المساحة بالدونم (اختياري)">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="مثال: 5"
                  className={inputCls}
                  value={newCrop.area_dunum}
                  onChange={(e) =>
                    setNewCrop({ ...newCrop, area_dunum: e.target.value })
                  }
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
                  حفظ وإضافة المحصول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
