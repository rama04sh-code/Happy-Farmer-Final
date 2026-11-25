import { useState, useId } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import Logo from "../components/Logo.jsx";
import BotanicalDecoration from "../components/BotanicalDecoration.jsx";

// Live Farm Data for the Interactive Simulator
const SIMULATED_FARMS = [
  {
    id: "tomato-sector",
    title: "حقل الطماطم الذكي (قطاع A)",
    crop: "طماطم معلقة (هجين)",
    image: "/assets/tomato_hd.jpg",
    fallbackImage: "/assets/crop_tomato.png",
    moisture: 78,
    moistureStatus: "رطوبة مثالية",
    temp: 24.2,
    humidity: 58,
    ph: 6.4,
    health: 98,
    irrigationNext: "بعد 45 دقيقة",
    aiDiagnosis: "نمو متناسق، لا توجد أي علامات للندوة المبكرة أو الذبول.",
    tag: "بيوت محمية ذكية",
  },
  {
    id: "cucumber-sector",
    title: "صوبة الخيار الهيدروبونيك (قطاع B)",
    crop: "خيار صالونات فائق الجودة",
    image: "/assets/cucumber_hd.jpg",
    fallbackImage: "/assets/crop_cucumber.png",
    moisture: 82,
    moistureStatus: "تغذية مائية ممتازة",
    temp: 23.0,
    humidity: 64,
    ph: 6.2,
    health: 96,
    irrigationNext: "دوران مستمر هيدروبونيك",
    aiDiagnosis: "مستوى الكلوروفيل مرتفع، جاهز للحصاد بعد 5 أيام.",
    tag: "زراعة مائية مغلقة",
  },
  {
    id: "lettuce-sector",
    title: "مزرعة الخس الروماني (قطاع C)",
    crop: "خس روماني عضوي",
    image: "/assets/lettuce_hd.jpg",
    fallbackImage: "/assets/crop_lettuce.png",
    moisture: 74,
    moistureStatus: "توازن رطوبي دقيق",
    temp: 21.5,
    humidity: 55,
    ph: 6.5,
    health: 99,
    irrigationNext: "الري بالتنقيط نشط",
    aiDiagnosis: "أوراق نضرة خالية تماماً من الحشرات الفطرية.",
    tag: "زراعة عضوية دقيقة",
  },
];

// Crops Catalog with Interactive Details
const CROPS_DATA = [
  {
    id: "c1",
    name: "طماطم كرزية ودفيئات",
    category: "خضروات",
    image: "/assets/tomato_hd.jpg",
    fallback: "/assets/exact_tomato.png",
    growthStage: "مرحلة الإثمار (75%)",
    cycle: "90 يوماً",
    waterNeed: "معتدل - ذكي",
    optimalTemp: "22-26 °C",
    healthScore: 99,
    tag: "تصدير ممتاز",
  },
  {
    id: "c2",
    name: "خيار البيوت المحمية",
    category: "بيوت محمية",
    image: "/assets/cucumber_hd.jpg",
    fallback: "/assets/exact_cucumber.png",
    growthStage: "مرحلة الجني المستمر",
    cycle: "60 يوماً",
    waterNeed: "ري منتظم دقيق",
    optimalTemp: "20-24 °C",
    healthScore: 97,
    tag: "إنتاج يومي",
  },
  {
    id: "c3",
    name: "خس هيدروبونيك طازج",
    category: "زراعة مائية",
    image: "/assets/lettuce_hd.jpg",
    fallback: "/assets/exact_lettuce.png",
    growthStage: "اكتمال التورق (85%)",
    cycle: "45 يوماً",
    waterNeed: "تدوير مائي مغلق",
    optimalTemp: "18-22 °C",
    healthScore: 99,
    tag: "استهلاك مائي -85%",
  },
  {
    id: "c4",
    name: "المزرعة الكبرى المتكاملة",
    category: "مزارع مفتوحة",
    image: "/assets/red_barn_classic.jpg",
    fallback: "/assets/farm_overview.png",
    growthStage: "متابعة شاملة للحقول",
    cycle: "موسم 2026",
    waterNeed: "محاور ري ذكية",
    optimalTemp: "مستشعرات متعددة",
    healthScore: 95,
    tag: "أتمتة كاملة",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const farmAreaId = useId();

  // Interactive Simulator State
  const [activeFarmIdx, setActiveFarmIdx] = useState(0);
  const [isIrrigating, setIsIrrigating] = useState(false);
  const [irrigationNotice, setIrrigationNotice] = useState("");

  // Crop Filter State
  const [selectedCropCategory, setSelectedCropCategory] = useState("الكل");
  const [inspectedCrop, setInspectedCrop] = useState(null);

  // ROI Calculator State
  const [farmArea, setFarmArea] = useState(25); // dunums
  const [sensorType, setSensorType] = useState("full"); // full or basic

  // AI Scanner Interactive Demo State
  const [scanStep, setScanStep] = useState("ready"); // ready, scanning, complete

  const currentFarm = SIMULATED_FARMS[activeFarmIdx];

  const handleToggleIrrigation = () => {
    if (isIrrigating) {
      setIsIrrigating(false);
      setIrrigationNotice("تم إيقاف مضخات الري بنجاح.");
    } else {
      setIsIrrigating(true);
      setIrrigationNotice("تم تفعيل دورة الري الذكي حسب قراءات الرطوبة.");
    }
    setTimeout(() => setIrrigationNotice(""), 3500);
  };

  const runAiScanSimulation = () => {
    setScanStep("scanning");
    setTimeout(() => {
      setScanStep("complete");
    }, 1800);
  };

  // Dynamic calculations based on farm area
  const waterSavedM3 = Math.round(farmArea * 480 * (sensorType === "full" ? 1.35 : 1.0));
  const costSavedSAR = Math.round(farmArea * 1250);
  const yieldIncreasePct = sensorType === "full" ? 28 : 18;

  const filteredCrops =
    selectedCropCategory === "الكل"
      ? CROPS_DATA
      : CROPS_DATA.filter((c) => c.category === selectedCropCategory);

  return (
    <div className="min-h-screen bg-[#070C09] text-slate-100 relative overflow-x-hidden font-['Cairo',sans-serif] selection:bg-emerald-500/30 selection:text-white" dir="rtl">
      {/* Ambient Atmospheric Glows */}
      <BotanicalDecoration position="top-left" />
      <BotanicalDecoration position="top-right" />
      <BotanicalDecoration position="bottom-right" />

      {/* Subtle Tech Grid Overlay */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" />

      {/* Floating Dark Glass Navbar */}
      <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="bg-[#0D1812]/80 backdrop-blur-xl border border-emerald-500/20 rounded-full px-5 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl shadow-black/50 transition-all duration-300">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size="md" layout="horizontal" showText={true} subtitle={true} />
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#simulator" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>المحاكي المباشر</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              المميزات الذكية
            </a>
            <a href="#crops-catalog" className="hover:text-emerald-400 transition-colors">
              المحاصيل والبيوت
            </a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">
              حاسبة التوفير
            </a>
            <a href="#ai-scanner" className="hover:text-emerald-400 transition-colors">
              كاشف الأمراض
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Live Uptime Pill */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>الأنظمة نشطة</span>
            </div>

            {user ? (
              <Link
                to="/farms"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/60 transition active:scale-95"
              >
                <span>لوحة التحكم</span>
                <span>➔</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full font-bold text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/20 transition active:scale-95"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/60 transition active:scale-95"
                >
                  <span>ابدأ مجاناً</span>
                  <span>➔</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Text / Value Prop */}
          <div className="lg:col-span-6 flex flex-col text-right">
            {/* Tech Pill Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-5 shadow-inner">
              <span className="text-sm">🌾</span>
              <span>الجيل القادم من تكنولوجيا الزراعة الدقيقة بالـ AI</span>
            </div>

            {/* Main Headline with Emerald Glow Gradient */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.2] tracking-tight">
              ازرع بذكاء فائق..
              <br />
              <span className="bg-gradient-to-l from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                واحصد أعلى إنتاجية
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mt-5 leading-relaxed font-normal">
              منظومة المزارع السعيد المتطورة تربط مستشعرات التربة والطقس بالكاميرات الذكية لتحليل صحة النبات، جدولة الري آلياً، والحد من استهلاك المياه والأسمدة بنقرة زر واحدة.
            </p>

            {/* Quick Stats Mini-strip */}
            <div className="grid grid-cols-3 gap-3 my-7 py-4 px-5 rounded-2xl bg-[#0E1A13]/70 border border-emerald-500/15 backdrop-blur-md">
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">38%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">وفر في مياه الري</div>
              </div>
              <div className="border-r border-emerald-500/20 pr-3">
                <div className="text-xl sm:text-2xl font-black text-teal-300">99.2%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">دقة رصد الأمراض</div>
              </div>
              <div className="border-r border-emerald-500/20 pr-3">
                <div className="text-xl sm:text-2xl font-black text-amber-400">24/7</div>
                <div className="text-[11px] text-slate-400 mt-0.5">مراقبة ومستشعرات</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/farms" : "/register"}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950/80 active:scale-95 transition-all duration-200"
              >
                <span>ابدأ الآن مجاناً</span>
                <span className="text-lg">➔</span>
              </Link>

              <a
                href="#simulator"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 active:scale-95 transition-all duration-200"
              >
                <span>تجربة المحاكي الحي</span>
                <span>⚡</span>
              </a>
            </div>

            {/* Trust statement */}
            <div className="flex items-center gap-3 mt-6 text-xs text-slate-400">
              <span className="flex items-center text-emerald-400">✓ بدون بطاقة بنكية</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="flex items-center text-emerald-400">✓ تركيب متوافق مع كافة المستشعرات</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="flex items-center text-emerald-400">✓ دعم فني زراعي متكامل</span>
            </div>
          </div>

          {/* Right Column: Interactive Live Farm Simulator Widget */}
          <div id="simulator" className="lg:col-span-6 relative">
            {/* Outer Glow Halo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-600/10 blur-xl opacity-80" />

            {/* Main Interactive Deck */}
            <div className="relative rounded-3xl bg-[#0D1812]/90 border border-emerald-500/25 p-5 sm:p-6 backdrop-blur-2xl shadow-2xl shadow-black/80">
              {/* Simulator Header & Farm Picker Tabs */}
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    محاكي الحقول الحية (Live IoT Telemetry)
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 font-mono">
                  Node: #AGR-402
                </span>
              </div>

              {/* Sector Selector Tabs */}
              <div className="flex gap-2 my-4 overflow-x-auto pb-1 scrollbar-none">
                {SIMULATED_FARMS.map((f, idx) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFarmIdx(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeFarmIdx === idx
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                        : "bg-[#132319] text-slate-400 hover:text-slate-200 hover:bg-[#182C20] border border-emerald-500/10"
                    }`}
                  >
                    {f.title.split("(")[0]}
                  </button>
                ))}
              </div>

              {/* Visual Preview Window with Live Overlays */}
              <div className="relative rounded-2xl overflow-hidden h-52 sm:h-60 bg-black group border border-emerald-500/15">
                <img
                  src={currentFarm.image}
                  alt={currentFarm.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700 opacity-80"
                  onError={(e) => {
                    e.currentTarget.src = currentFarm.fallbackImage;
                  }}
                />
                
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09110B] via-[#09110B]/30 to-transparent" />

                {/* Floating Telemetry Tags */}
                <div className="absolute top-3 right-3 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {currentFarm.tag}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-slate-700 text-slate-300 text-[11px] font-mono">
                    {currentFarm.crop}
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>{currentFarm.title}</span>
                    </h3>
                    <p className="text-xs text-emerald-300/90 mt-0.5">
                      {currentFarm.aiDiagnosis}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-[10px] text-slate-400 block font-medium">مؤشر الصحة</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      %{currentFarm.health}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Sensor Dials Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {/* Moisture Gauge */}
                <div className="bg-[#101F16] border border-emerald-500/15 rounded-2xl p-3.5 text-right">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>رطوبة التربة</span>
                    <span className="text-emerald-400">💧</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1 font-mono">
                    %{currentFarm.moisture}
                  </div>
                  <div className="w-full bg-emerald-950 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${currentFarm.moisture}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-300/80 mt-1 block">
                    {currentFarm.moistureStatus}
                  </span>
                </div>

                {/* Temperature */}
                <div className="bg-[#101F16] border border-emerald-500/15 rounded-2xl p-3.5 text-right">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>الحرارة</span>
                    <span className="text-amber-400">🌡️</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1 font-mono">
                    {currentFarm.temp}°C
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    الرطوبة: %{currentFarm.humidity}
                  </span>
                </div>

                {/* Soil pH */}
                <div className="bg-[#101F16] border border-emerald-500/15 rounded-2xl p-3.5 text-right">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>حموضة التربة</span>
                    <span className="text-teal-400">🧪</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1 font-mono">
                    {currentFarm.ph} pH
                  </div>
                  <span className="text-[10px] text-teal-300/80 mt-2 block">
                    توازن مغذيات مثالي
                  </span>
                </div>

                {/* Irrigation Status */}
                <div className="bg-[#101F16] border border-emerald-500/15 rounded-2xl p-3.5 text-right">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>الري الآلي</span>
                    <span className="text-blue-400">⚙️</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-300 mt-1">
                    {isIrrigating ? "يعمل الآن ⚡" : "تلقائي ذكي"}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block truncate">
                    {currentFarm.irrigationNext}
                  </span>
                </div>
              </div>

              {/* Interactive Control Strip */}
              <div className="mt-4 pt-4 border-t border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={handleToggleIrrigation}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    isIrrigating
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 animate-pulse"
                      : "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  <span>{isIrrigating ? "إيقاف دورة الضخ" : "تفعيل دورة الري التجريبية"}</span>
                  <span>{isIrrigating ? "⏹" : "▶"}</span>
                </button>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>آخر تحديث للقراءات:</span>
                  <span className="text-emerald-400 font-mono font-bold">منذ 3 ثوانٍ</span>
                </div>
              </div>

              {/* Toast Notice */}
              {irrigationNotice && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 text-xs font-semibold text-center animate-fade-in">
                  {irrigationNotice}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Trust & Live Data Ticker Bar */}
      <section className="relative z-10 border-y border-emerald-500/15 bg-[#09120C]/80 backdrop-blur-md py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">1,450+</div>
            <div className="text-xs text-slate-400 mt-1">مزرعة ذكية متصلة</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">180,000+</div>
            <div className="text-xs text-slate-400 mt-1">قراءة مستشعر يومية</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">38.5%</div>
            <div className="text-xs text-slate-400 mt-1">متوسط خفض استهلاك المياه</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">99.2%</div>
            <div className="text-xs text-slate-400 mt-1">دقة تشخيص الآفات بالـ AI</div>
          </div>
        </div>
      </section>

      {/* Precision Agriculture Features Matrix */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-4 py-1.5 rounded-full inline-block">
            قدرات المنظومة المتكاملة
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
            تكنولوجيا زراعية متطورة تجعل قراراتك مبنية على البيانات
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            كل ما تحتاجه لإدارة محاصيلك ومياهك ومعداتك في منصة سحابية واحدة فائقة السرعة والأمان.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="rounded-3xl bg-[#0E1A13]/90 border border-emerald-500/15 p-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group shadow-xl shadow-black/40 text-right">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-2xl text-white mb-5 shadow-lg shadow-emerald-950/60 group-hover:scale-110 transition-transform">
              💧
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              الري الذكي المتكيف
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              تحليل رطوبة التربة عبر مستشعرات متعددة الأعماق وربطها بنماذج الطقس لضخ المياه في الوقت الدقيق وتفادي تعفن الجذور.
            </p>
            <div className="mt-4 pt-3 border-t border-emerald-500/10 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>توفير حتى 40% من المياه</span>
              <span>←</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl bg-[#0E1A13]/90 border border-emerald-500/15 p-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group shadow-xl shadow-black/40 text-right">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-2xl text-white mb-5 shadow-lg shadow-teal-950/60 group-hover:scale-110 transition-transform">
              🔬
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              كشف الآفات بالرؤية الحاسوبية
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              خوارزميات ذكاء اصطناعي مدربة على آلاف عينات النباتات لكشف الأمراض الفطرية والحشرية فوراً وتقديم حلول علاجية فورية.
            </p>
            <div className="mt-4 pt-3 border-t border-emerald-500/10 text-xs text-teal-400 font-semibold flex items-center gap-1">
              <span>تشخيص خلال 2 ثانية</span>
              <span>←</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl bg-[#0E1A13]/90 border border-emerald-500/15 p-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group shadow-xl shadow-black/40 text-right">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-emerald-600 flex items-center justify-center text-2xl text-white mb-5 shadow-lg shadow-amber-950/60 group-hover:scale-110 transition-transform">
              📊
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              التنبؤ بالحصاد والأرباح
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              حساب دقيق لمواعيد الجني وكميات الأطنان المتوقعة وتتبع تكاليف الإنتاج والسماد لكل محصول لتحقيق أعلى عائد استثماري.
            </p>
            <div className="mt-4 pt-3 border-t border-emerald-500/10 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>تقارير مالية تفصيلية</span>
              <span>←</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-3xl bg-[#0E1A13]/90 border border-emerald-500/15 p-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group shadow-xl shadow-black/40 text-right">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-2xl text-white mb-5 shadow-lg shadow-emerald-950/60 group-hover:scale-110 transition-transform">
              🛰️
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              خرائط NDVI بالأقمار والدرون
            </h3>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
              مسح طيفي للأراضي لرصد الإجهاد المائي ومؤشر الكتلة الحيوية بدقة فائقة دون الحاجة للتجول الشاق في الحقول الكبيرة.
            </p>
            <div className="mt-4 pt-3 border-t border-emerald-500/10 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>تغطية فورية للمساحات</span>
              <span>←</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Crops Catalog & Field Showcase */}
      <section id="crops-catalog" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3.5 py-1 rounded-full">
              محاصيل الحقول
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              تتبع دورة حياة محاصيلك لحظة بلحظة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              إحصائيات حية لمراحل النمو، درجات الحرارة المثالية، والإنتاج التراكمي
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {["الكل", "خضروات", "بيوت محمية", "زراعة مائية", "مزارع مفتوحة"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCropCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCropCategory === cat
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-900/50"
                    : "bg-[#0E1A13] text-slate-400 hover:text-white border border-emerald-500/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Crops Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCrops.map((crop) => (
            <div
              key={crop.id}
              className="rounded-3xl bg-[#0E1A13]/90 border border-emerald-500/15 overflow-hidden hover:border-emerald-500/40 transition-all duration-300 group shadow-xl shadow-black/40 flex flex-col justify-between"
            >
              {/* Crop Image Header */}
              <div className="relative h-44 overflow-hidden bg-black/60">
                <img
                  src={crop.image}
                  alt={crop.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-all duration-700 opacity-90"
                  onError={(e) => {
                    e.currentTarget.src = crop.fallback;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A13] via-transparent to-transparent" />
                
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  {crop.tag}
                </span>

                <div className="absolute bottom-2 right-3 left-3 flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded bg-black/60 text-emerald-400 font-mono">
                    صحة: %{crop.healthScore}
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {crop.cycle}
                  </span>
                </div>
              </div>

              {/* Crop Details */}
              <div className="p-5 text-right flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                    {crop.name}
                  </h3>
                  
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">مرحلة النمو:</span>
                      <span className="font-semibold text-emerald-400">{crop.growthStage}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">احتياج الري:</span>
                      <span className="font-semibold">{crop.waterNeed}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">الحرارة المثالية:</span>
                      <span className="font-mono text-amber-400">{crop.optimalTemp}</span>
                    </div>
                  </div>
                </div>

                {/* Inspect Action */}
                <button
                  onClick={() => setInspectedCrop(crop)}
                  className="mt-5 w-full py-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/25 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>عرض تقرير الـ AI</span>
                  <span>🔍</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal / Card for Crop Inspection */}
        {inspectedCrop && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-[#0D1812] border border-emerald-500/30 p-6 shadow-2xl text-right animate-scale-up">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>تقرير التشخيص الذكي:</span>
                  <span className="text-emerald-400">{inspectedCrop.name}</span>
                </h3>
                <button
                  onClick={() => setInspectedCrop(null)}
                  className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-300">
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200">
                  <div className="font-bold mb-1">🌿 حالة الكلوروفيل والنمو:</div>
                  معدل التخليق الضوئي ممتاز، الأوراق خالية من التبقعات أو نقص النيتروجين.
                </div>
                <div className="p-3 rounded-2xl bg-[#122218] border border-emerald-500/20">
                  <div className="font-bold text-white mb-1">💧 توصية الري للأيام الثلاثة القادمة:</div>
                  تقليل معدل الضخ بنسبة 10% نتيجة انخفاض متوقع في درجات الحرارة الليلية.
                </div>
                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>تاريخ آخر مسح طيفي:</span>
                  <span className="font-mono text-emerald-400">اليوم - 18:30 GMT</span>
                </div>
              </div>

              <button
                onClick={() => setInspectedCrop(null)}
                className="mt-6 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Interactive ROI & Water Savings Calculator */}
      <section id="calculator" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-[#0F2016] via-[#0C1710] to-[#070D08] border border-emerald-500/25 p-6 sm:p-10 md:p-12 shadow-2xl shadow-black/60 text-right">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Inputs Column */}
            <div className="lg:col-span-6">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1 rounded-full">
                حاسبة العائد الاقتصادي والتوفير
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
                احسب كم ستوفر مع منظومة "المزارع السعيد"
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                حرك المؤشر لتحديد مساحة مزرعتك واستكشف الحجم التقديري للتوفير السنوي في المياه وتكلفة الطاقة وزيادة الإنتاجية.
              </p>

              {/* Area Slider */}
              <div className="mt-8">
                <div className="flex items-center justify-between text-sm font-bold text-white mb-3">
                  <label htmlFor={farmAreaId} className="flex items-center gap-1 cursor-pointer">
                    <span>مساحة الحقول الزراعية:</span>
                    <span className="text-emerald-400 text-lg font-mono">{farmArea} دونم</span>
                  </label>
                  <span className="text-xs text-slate-400">({(farmArea * 0.1).toFixed(1)} هكتار)</span>
                </div>
                <input
                  id={farmAreaId}
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={farmArea}
                  onChange={(e) => setFarmArea(Number(e.target.value))}
                  className="w-full h-2.5 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                  <span>5 دونم</span>
                  <span>50 دونم</span>
                  <span>100 دونم</span>
                  <span>150 دونم</span>
                </div>
              </div>

              {/* Sensor Package Toggle */}
              <div className="mt-6">
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  مستوى الأتمتة والمستشعرات:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSensorType("full")}
                    className={`p-3 rounded-2xl text-xs font-bold border transition text-right cursor-pointer ${
                      sensorType === "full"
                        ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                        : "bg-[#09120C] border-emerald-500/15 text-slate-400"
                    }`}
                  >
                    <div className="font-bold text-white">المنظومة الكاملة ⭐</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">مستشعرات تربة + ري آلي + AI</div>
                  </button>
                  <button
                    onClick={() => setSensorType("basic")}
                    className={`p-3 rounded-2xl text-xs font-bold border transition text-right cursor-pointer ${
                      sensorType === "basic"
                        ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                        : "bg-[#09120C] border-emerald-500/15 text-slate-400"
                    }`}
                  >
                    <div className="font-bold text-white">الباقة القياسية</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">مستشعرات رطوبة وطقس فقط</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Results Deck */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Result 1: Water Saved */}
              <div className="bg-[#0A160F] border border-emerald-500/25 rounded-3xl p-6 shadow-xl">
                <span className="text-2xl">💧</span>
                <div className="text-3xl font-black text-emerald-400 mt-3 font-mono">
                  {waterSavedM3.toLocaleString()} م³
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  كمية مياه الري الموفرة سنوياً
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  بفضل تقليل فترات الري غير المجدية وتجنب التبخر وقت الظهيرة.
                </p>
              </div>

              {/* Result 2: Financial Saved */}
              <div className="bg-[#0A160F] border border-emerald-500/25 rounded-3xl p-6 shadow-xl">
                <span className="text-2xl">💰</span>
                <div className="text-3xl font-black text-amber-400 mt-3 font-mono">
                  {costSavedSAR.toLocaleString()} ر.س
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  وفر تقديري في الطاقة والأسمدة
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  خفض ساعات تشغيل المضخات وترشيد استهلاك المواد التسميدية.
                </p>
              </div>

              {/* Result 3: Yield Increase */}
              <div className="bg-[#0A160F] border border-emerald-500/25 rounded-3xl p-6 shadow-xl sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-black text-teal-300 font-mono">
                    +{yieldIncreasePct}% زيادة الإنتاجية
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    تحسين جودة الثمار وتقليل نسبة الفاقد والمحاصيل التالفة
                  </div>
                </div>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap shadow-lg shadow-emerald-950/60 cursor-pointer"
                >
                  ابدأ التجربة المجانية ➔
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive AI Disease Scanner Demo */}
      <section id="ai-scanner" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-[#0B150F] border border-emerald-500/20 p-6 sm:p-10 shadow-2xl text-right">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual Scanner Area */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden bg-black/80 border border-emerald-500/30 h-72 sm:h-80 flex items-center justify-center">
              <img
                src="/assets/tomato_hd.jpg"
                alt="فحص ورقة النبات"
                className="w-full h-full object-cover opacity-75"
              />

              {/* Laser Grid Scanner Animation */}
              {scanStep === "scanning" && (
                <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none flex flex-col justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-bounce" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-300 bg-black/70 px-4 py-2 rounded-full border border-emerald-400/40">
                    جاري التحليل الطيفي للورقة...
                  </div>
                </div>
              )}

              {/* Completed Bounding Box */}
              {scanStep === "complete" && (
                <div className="absolute inset-8 border-2 border-emerald-400 rounded-2xl bg-emerald-500/10 p-3 flex flex-col justify-between animate-scale-up">
                  <div className="flex justify-between items-center text-xs font-mono text-emerald-300 bg-black/70 px-2.5 py-1 rounded">
                    <span>Target: Solanum lycopersicum</span>
                    <span className="text-emerald-400 font-bold">Score: 99.4%</span>
                  </div>
                  <div className="bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs p-2.5 rounded-xl text-right">
                    ✓ النتيجة: الورقة سليمة وخالية من حشرات التوتا أبسلوتا أو فطر البياض الدقيقي.
                  </div>
                </div>
              )}

              {scanStep === "ready" && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    onClick={runAiScanSimulation}
                    className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl cursor-pointer flex items-center gap-2"
                  >
                    <span>ابدأ الفحص التجريبي الآن</span>
                    <span>📷</span>
                  </button>
                </div>
              )}
            </div>

            {/* Explanatory Text */}
            <div className="lg:col-span-6">
              <span className="text-xs font-bold text-teal-400 bg-teal-950/80 border border-teal-500/30 px-3.5 py-1 rounded-full">
                كشف الأمراض والآفات بالرؤية الحاسوبية
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
                طبيبك الزراعي الميداني في جيبك
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                التقط صورة بكاميرا هاتفك لأي نبات تظهر عليه أعراض غير طبيعية، وستتعرف المنظومة على نوع المرض أو النقص الغذائي خلال ثوانٍ معدودة مع بروتوكول علاج معتمد من خبراء الزراعة.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">✓</span>
                  <span>كشف أكثر من 120 مرضاً نباتياً وآفة حشرية</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">✓</span>
                  <span>توصيات فورية بالأدوية العضوية والكيميائية المرخصة</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">✓</span>
                  <span>سجل زمني لتوثيق علاج الحقول ومنع انتشار العدوى</span>
                </div>
              </div>

              {scanStep !== "ready" && (
                <button
                  onClick={() => setScanStep("ready")}
                  className="mt-6 text-xs text-emerald-400 hover:underline font-semibold cursor-pointer block"
                >
                  إعادة تشغيل الفحص التجريبي ↺
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="relative rounded-3xl bg-gradient-to-tr from-[#0C1A12] via-[#10241A] to-[#0A160F] border border-emerald-500/30 p-8 sm:p-14 shadow-2xl shadow-emerald-950/50 overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-80 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight relative z-10">
            انضم إلى مستقبل الزراعة الذكية اليوم
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-xl mx-auto relative z-10">
            حوّل مزرعتك إلى منشأة عالية الكفاءة وراقب صحة التربة والمحصول من شاشة هاتفك أينما كنت.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-10">
            <Link
              to="/register"
              className="px-8 py-4 rounded-full font-bold text-sm sm:text-base text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950/80 active:scale-95 transition-all"
            >
              أنشئ حسابك المجاني في دقيقة ➔
            </Link>
            <Link
              to="/login"
              className="px-7 py-4 rounded-full font-bold text-sm sm:text-base text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 active:scale-95 transition-all"
            >
              دخول المشتركين 👤
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Dark Footer */}
      <footer className="border-t border-emerald-500/15 bg-[#060A08] py-12 px-6 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" showText={true} subtitle={true} />

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#simulator" className="hover:text-emerald-400 transition">المحاكي المباشر</a>
            <a href="#features" className="hover:text-emerald-400 transition">المميزات</a>
            <a href="#crops-catalog" className="hover:text-emerald-400 transition">المحاصيل</a>
            <a href="#calculator" className="hover:text-emerald-400 transition">حاسبة التوفير</a>
            <Link to="/login" className="hover:text-emerald-400 transition">تسجيل الدخول</Link>
            <Link to="/register" className="hover:text-emerald-400 transition">تسجيل حساب جديد</Link>
          </div>

          <div className="text-center md:text-left text-[11px] text-slate-500 font-mono">
            © {new Date().getFullYear()} المزارع السعيد • جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
