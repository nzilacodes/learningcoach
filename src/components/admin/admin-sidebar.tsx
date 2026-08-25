import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Download,
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
import { useClickOutside } from "@/hooks/use-click-outside";
import coachLogo from "@/assets/coach-logo.png";

const NAV_SECTIONS = [
  {
    label: { pt: "Visão geral", en: "Overview" },
    items: [{ to: "/admin", Icon: LayoutDashboard, label: { pt: "Visão geral", en: "Overview" } }],
  },
  {
    label: { pt: "Gestão", en: "Management" },
    items: [
      { to: "/admin/users", Icon: Users, label: { pt: "Alunos", en: "Learners" } },
      { to: "/admin/payments", Icon: CreditCard, label: { pt: "Pagamentos", en: "Payments" } },
      { to: "/admin/subscriptions", Icon: Wallet, label: { pt: "Assinaturas", en: "Subscriptions" } },
    ],
  },
  {
    label: { pt: "Conteúdo", en: "Content" },
    items: [{ to: "/admin/curriculum", Icon: BookOpen, label: { pt: "Currículo", en: "Curriculum" } }],
  },
  {
    label: { pt: "Insights", en: "Insights" },
    items: [
      { to: "/admin/analytics", Icon: TrendingUp, label: { pt: "Analytics", en: "Analytics" } },
      { to: "/admin/audit", Icon: ShieldCheck, label: { pt: "Auditoria", en: "Audit" } },
      { to: "/admin/reports", Icon: Download, label: { pt: "Relatórios", en: "Reports" } },
    ],
  },
];

export function AdminSidebar() {
  const { locale } = useLocale();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useClickOutside(profileRef, setProfileOpen);

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-white border-r border-gray-100 z-20 transition-all duration-300 relative ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div
        className={`flex items-center transition-all duration-300 ${
          collapsed ? "justify-center p-6" : "justify-between p-8 pb-10"
        }`}
      >
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-3">
            <img
              src={coachLogo}
              alt="LEWC"
              className="w-10 h-10 rounded-xl object-contain shadow-lg ring-1 ring-gray-100"
            />
            <div className="leading-tight">
              <div className="font-display font-bold text-lg text-ink">Learning</div>
              <div className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">
                Admin
              </div>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link to="/admin" className="mx-auto">
            <img
              src={coachLogo}
              alt="LEWC"
              className="w-10 h-10 rounded-xl object-contain shadow-lg ring-1 ring-gray-100"
            />
          </Link>
        )}
        {!collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-black hover:bg-gray-50 rounded-lg transition-all"
            title="Recolher Menu"
            aria-label="Recolher Menu"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-6 w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-muted-foreground hover:text-black hover:bg-gray-50 shadow-sm transition-all z-30"
            title="Expandir menu"
            aria-label="Expandir menu"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-8 scrollbar-hide">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label.en} className="space-y-1">
            {!collapsed && (
              <p className="px-4 text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
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
                      ? "bg-violet/5 text-violet font-bold"
                      : "text-muted-foreground hover:bg-gray-50 hover:text-black"
                  } ${collapsed ? "justify-center px-3" : ""}`}
                  title={collapsed ? (locale === "pt" ? item.label.pt : item.label.en) : undefined}
                >
                  <item.Icon className="w-5 h-5 shrink-0" />
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

      <div
        className={`border-t border-gray-50 relative ${collapsed ? "p-4 flex justify-center" : "p-6"}`}
        ref={profileRef}
      >
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
            <div
              className={`absolute bottom-full mb-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow ${
                collapsed ? "left-full ml-2 w-52" : "left-4 right-4"
              }`}
            >
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate({ to: "/profile" });
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-muted-foreground transition-colors w-full text-left"
              >
                <User className="w-4 h-4 text-violet" />
                {locale === "pt" ? "Ver perfil" : "View profile"}
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate({ to: "/settings" });
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-muted-foreground transition-colors w-full text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
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
          aria-label={locale === "pt" ? "Menu de conta" : "Account menu"}
          className={`cursor-pointer group w-full text-left ${collapsed ? "" : "flex items-center gap-3 px-2"}`}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-md overflow-hidden">
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
                <p className="text-sm font-bold truncate text-ink">
                  {user?.email?.split("@")[0] || "Admin"}
                </p>
                <p className="text-2xs text-muted-foreground font-medium truncate">Administrador</p>
              </div>
              {profileOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

const MOBILE_PRIMARY = [
  { to: "/admin", Icon: LayoutDashboard, label: { pt: "Geral", en: "Overview" } },
  { to: "/admin/users", Icon: Users, label: { pt: "Alunos", en: "Learners" } },
  { to: "/admin/payments", Icon: CreditCard, label: { pt: "Pagtos", en: "Payments" } },
  { to: "/admin/curriculum", Icon: BookOpen, label: { pt: "Currículo", en: "Curriculum" } },
];

const MOBILE_MORE_ITEMS = [
  { to: "/admin/subscriptions", Icon: Wallet, label: { pt: "Assinaturas", en: "Subscriptions" } },
  { to: "/admin/analytics", Icon: TrendingUp, label: { pt: "Analytics", en: "Analytics" } },
  { to: "/admin/audit", Icon: ShieldCheck, label: { pt: "Auditoria", en: "Audit" } },
  { to: "/admin/reports", Icon: Download, label: { pt: "Relatórios", en: "Reports" } },
];

export function AdminMobileNav() {
  const { locale } = useLocale();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useClickOutside(moreRef, setMoreOpen);

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div
          ref={moreRef}
          className="md:hidden fixed bottom-20 right-4 left-4 z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 dropdown-enter max-h-[60vh] overflow-y-auto"
        >
          <div className="px-4 pb-2 text-2xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {locale === "pt" ? "Mais opções" : "More options"}
          </div>
          {MOBILE_MORE_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive(item.to) ? "text-violet bg-violet/5" : "text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <item.Icon className="w-5 h-5" />
              {locale === "pt" ? item.label.pt : item.label.en}
            </Link>
          ))}
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
        <div className="flex items-center justify-around py-2">
          {MOBILE_PRIMARY.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                isActive(item.to) ? "text-violet" : "text-muted-foreground"
              }`}
            >
              <item.Icon className="w-5 h-5" />
              <span className="text-2xs font-medium">
                {locale === "pt" ? item.label.pt : item.label.en}
              </span>
            </Link>
          ))}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
              moreOpen ? "text-violet" : "text-muted-foreground"
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-2xs font-medium">{locale === "pt" ? "Mais" : "More"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
