import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  LayoutDashboard,
  Gamepad2,
  BookOpen,
  Bot,
  Film,
  Mic,
  BookMarked,
  Trophy,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  LogOut,
  Grid3X3,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import coachLogo from "@/assets/coach-logo.png";

const NAV_SECTIONS = [
  {
    label: { pt: "Plataforma", en: "Platform" },
    items: [
      { to: "/", Icon: Home, hoverColor: "group-hover:text-[var(--violet)]", label: { pt: "Home", en: "Home" } },
      { to: "/dashboard", Icon: LayoutDashboard, hoverColor: "group-hover:text-[var(--amber)]", label: { pt: "Dashboard", en: "Dashboard" } },
      { to: "/games", Icon: Gamepad2, hoverColor: "group-hover:text-[var(--magenta)]", label: { pt: "Jogos", en: "Games" } },
    ],
  },
  {
    label: { pt: "Aprendizado", en: "Learning" },
    items: [
      { to: "/curriculum", Icon: BookOpen, hoverColor: "", label: { pt: "Currículo", en: "Curriculum" } },
      { to: "/ai-coach", Icon: Bot, hoverColor: "", label: { pt: "AI Coach", en: "AI Coach" } },
      { to: "/videos", Icon: Film, hoverColor: "", label: { pt: "Vídeos", en: "Videos" } },
      { to: "/pronunciation", Icon: Mic, hoverColor: "", label: { pt: "Pronúncia", en: "Pronunciation" } },
      { to: "/reading", Icon: BookMarked, hoverColor: "", label: { pt: "Reading", en: "Reading" } },
      { to: "/rewards", Icon: Trophy, hoverColor: "", label: { pt: "Recompensas", en: "Rewards" } },
    ],
  },
  {
    label: { pt: "Comunidade", en: "Community" },
    items: [
      { to: "/community", Icon: Users, hoverColor: "", label: { pt: "Comunidade", en: "Community" } },
    ],
  },
];

export function VideosSidebar() {
  const { locale } = useLocale();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-white border-r border-gray-100 z-20 transition-all duration-300 relative ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center transition-all duration-300 ${
        collapsed ? "justify-center p-6" : "justify-between p-8 pb-10"
      }`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3">
            <img src={coachLogo} alt="LEWC" className="w-10 h-10 rounded-xl object-contain shadow-lg ring-1 ring-gray-100" />
            <div className="leading-tight">
              <div className="font-display font-bold text-lg text-[var(--ink)]">Learning</div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Coach</div>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="mx-auto">
            <img src={coachLogo} alt="LEWC" className="w-10 h-10 rounded-xl object-contain shadow-lg ring-1 ring-gray-100" />
          </Link>
        )}
        {!collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
            title="Recolher Menu"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-7 w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 shadow-sm transition-all z-30"
          >
            <PanelLeftOpen className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-8 scrollbar-hide">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label.en} className="space-y-1">
            {!collapsed && (
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                {locale === "pt" ? section.label.pt : section.label.en}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-item flex items-center gap-3 px-4 py-3 rounded-2xl font-medium group transition-all ${
                    isActive
                      ? "bg-[var(--violet)]/5 text-[var(--violet)] font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  } ${collapsed ? "justify-center px-3" : ""}`}
                  title={collapsed ? (locale === "pt" ? item.label.pt : item.label.en) : undefined}
                >
                  <item.Icon className={`w-5 h-5 shrink-0 ${item.hoverColor}`} />
                  {!collapsed && (
                    <span className="nav-text text-sm">
                      {locale === "pt" ? item.label.pt : item.label.en}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`border-t border-gray-50 relative ${collapsed ? "p-4 flex justify-center" : "p-6"}`} ref={profileRef}>
        {/* Profile Dropdown */}
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
            <div className={`absolute bottom-full mb-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow ${
              collapsed
                ? "left-full ml-2 w-52"
                : "left-4 right-4"
            }`}>
              <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                <User className="w-4 h-4 text-[var(--violet)]" />
                {locale === "pt" ? "Ver perfil" : "View profile"}
              </button>
              <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                <Settings className="w-4 h-4 text-gray-400" />
                {locale === "pt" ? "Definições" : "Settings"}
              </button>
              <div className="mx-3 my-1 h-px bg-gray-50" />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-red-400 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                {locale === "pt" ? "Sair da conta" : "Sign out"}
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={`cursor-pointer group w-full text-left ${collapsed ? "" : "flex items-center gap-3 px-2"}`}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-md overflow-hidden">
              {user?.email ? (
                <span>{user.email.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-[var(--ink)]">
                  {user?.email?.split("@")[0] || "Utilizador"}
                </p>
                <p className="text-[11px] text-gray-400 font-medium truncate">
                  Premium Member
                </p>
              </div>
              {profileOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ============================================================
   Mobile Bottom Navigation + "Mais" Dropdown
   ============================================================ */

const MOBILE_PRIMARY = [
  { to: "/", Icon: Home, label: { pt: "Home", en: "Home" } },
  { to: "/curriculum", Icon: BookOpen, label: { pt: "Cursos", en: "Courses" } },
  { to: "/ai-coach", Icon: Bot, label: { pt: "AI Coach", en: "AI Coach" } },
  { to: "/community", Icon: Users, label: { pt: "Comunidade", en: "Community" } },
];

const MOBILE_MORE_ITEMS = [
  { to: "/dashboard", Icon: LayoutDashboard, label: { pt: "Dashboard", en: "Dashboard" } },
  { to: "/games", Icon: Gamepad2, label: { pt: "Jogos", en: "Games" } },
  { to: "/videos", Icon: Film, label: { pt: "Vídeos", en: "Videos" } },
  { to: "/pronunciation", Icon: Mic, label: { pt: "Pronúncia", en: "Pronunciation" } },
  { to: "/reading", Icon: BookMarked, label: { pt: "Reading", en: "Reading" } },
  { to: "/rewards", Icon: Trophy, label: { pt: "Recompensas", en: "Rewards" } },
];

export function VideosMobileNav() {
  const { locale } = useLocale();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      {/* More dropdown overlay */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMoreOpen(false)} />
      )}

      {/* More dropdown panel */}
      {moreOpen && (
        <div
          ref={moreRef}
          className="md:hidden fixed bottom-20 right-4 left-4 z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 dropdown-enter max-h-[60vh] overflow-y-auto"
        >
          <div className="px-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            {locale === "pt" ? "Mais opções" : "More options"}
          </div>
          {MOBILE_MORE_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive(item.to) ? "text-[var(--violet)] bg-[var(--violet)]/5" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.Icon className="w-5 h-5" />
              {locale === "pt" ? item.label.pt : item.label.en}
            </Link>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
        <div className="flex items-center justify-around py-2">
          {MOBILE_PRIMARY.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                isActive(item.to) ? "text-[var(--violet)]" : "text-gray-400"
              }`}
            >
              <item.Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">
                {locale === "pt" ? item.label.pt : item.label.en}
              </span>
            </Link>
          ))}
          {/* Mais button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
              moreOpen ? "text-[var(--violet)]" : "text-gray-400"
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">
              {locale === "pt" ? "Mais" : "More"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
