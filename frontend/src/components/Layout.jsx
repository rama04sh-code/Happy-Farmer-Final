import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import Logo from "./Logo.jsx";
import BotanicalDecoration from "./BotanicalDecoration.jsx";

const navItems = [
  { to: "/farms", label: "الرئيسية", icon: "home", end: true },
  { to: "/crops", label: "المحاصيل", icon: "crops" },
  { to: "/schedule", label: "جدول الزراعة", icon: "calendar" },
  { to: "/diagnose", label: "كشف الأمراض بالـ AI", icon: "search" },
  { to: "/settings", label: "الملف الشخصي", icon: "user" },
];

function NavIcon({ name, size = 19 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );
    case "crops":
      return (
        <svg {...common}>
          <path d="M12 22v-9" />
          <path d="M12 13C8.5 13 4 10 4 5c4 0 7 2.5 8 8z" />
          <path d="M12 11c3.5 0 8-3 8-8-4 0-7 2.5-8 8z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = user?.name || "رما";
  const avatarLetter = (displayName.trim().charAt(0) || "R").toUpperCase();

  return (
    <div
      className="min-h-screen bg-[#070C09] text-slate-100 flex flex-row relative overflow-x-hidden font-['Cairo',sans-serif]"
      style={{ direction: "ltr" }}
    >
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Modern Obsidian Dark Sidebar on Left */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 w-60 sm:w-64 bg-[#0A140E]/95 backdrop-blur-2xl border-r border-emerald-500/15 text-white flex flex-col justify-between py-6 px-4 shrink-0 shadow-2xl transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ direction: "rtl" }}
      >
        <div>
          {/* Logo Header */}
          <div className="flex flex-col items-center justify-center pb-6 border-b border-emerald-500/15 relative">
            <Link to="/farms" className="flex flex-col items-center gap-2 text-center group">
              <Logo size="lg" layout="vertical" showText={true} subtitle={true} />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden absolute top-0 left-0 text-slate-400 hover:text-white p-1"
              aria-label="إغلاق القائمة"
            >
              ✕
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="mt-6 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-600/35 to-teal-600/20 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/40"
                      : "text-slate-400 hover:bg-emerald-950/30 hover:text-white border border-transparent"
                  }`
                }
              >
                <span className="shrink-0 opacity-90">
                  <NavIcon name={item.icon} size={19} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar: System Status & Logout */}
        <div className="pt-4 border-t border-emerald-500/15 flex flex-col gap-3">
          <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-slate-400">حالة المستشعرات:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              متصلة
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-slate-400 hover:bg-rose-950/30 hover:text-rose-300 hover:border-rose-500/30 border border-transparent transition cursor-pointer"
          >
            <NavIcon name="logout" size={19} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area on Right */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-[#070C09]" style={{ direction: "rtl" }}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#0A120D]/85 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-emerald-500/15 shadow-sm">
          {/* Mobile menu hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-emerald-950/50 text-emerald-300 border border-emerald-500/20"
            aria-label="فتح القائمة"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Search Pill Bar */}
          <div className="relative w-48 sm:w-64 md:w-80">
            <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-emerald-400/70">
              <NavIcon name="search" size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الحقول والمحاصيل..."
              className="w-full pr-10 pl-4 py-2 rounded-full bg-[#0E1A13] border border-emerald-500/20 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 shadow-inner"
            />
          </div>

          {/* User Profile & Notification Bell */}
          <div className="flex items-center gap-4">
            <Link
              to="/farms"
              title="التنبيهات"
              className="relative p-2 rounded-full text-slate-300 hover:text-white hover:bg-emerald-950/50 transition border border-emerald-500/20"
            >
              <NavIcon name="bell" size={19} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </Link>

            <Link to="/settings" className="flex items-center gap-2 hover:opacity-90 transition group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-sm shadow-md ring-2 ring-emerald-500/30">
                {avatarLetter}
              </div>
              <span className="hidden sm:inline font-bold text-sm text-slate-200 group-hover:text-emerald-300">
                {displayName} <span className="text-xs text-slate-500">∨</span>
              </span>
            </Link>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative pb-24 z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
