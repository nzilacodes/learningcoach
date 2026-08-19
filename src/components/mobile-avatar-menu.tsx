import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { User, Settings, LogOut, Zap, HelpCircle, Gift } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useClickOutside } from "@/hooks/use-click-outside";
import { NotificationBell } from "@/components/notifications/notification-bell";

/** The Upgrade/Help/Gift/Notifications cluster at the start of every
 * VideosSidebar page header — was duplicated (and the bell absent) across
 * every copy; extracting one shared component rolls the bell out everywhere
 * that already adopted this component in one change. */
export function HeaderActionLinks() {
  const { locale } = useLocale();
  return (
    <>
      <Link
        to="/pricing"
        className="bg-[var(--ink)] text-white px-3 md:px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
        <span className="hidden sm:inline">Upgrade</span>
      </Link>
      <Link
        to="/contact"
        title={locale === "pt" ? "Ajuda" : "Help"}
        className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors hidden sm:inline-flex"
      >
        <HelpCircle className="w-5 h-5" />
      </Link>
      <Link
        to="/rewards"
        title={locale === "pt" ? "Recompensas" : "Rewards"}
        className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors hidden sm:inline-flex"
      >
        <Gift className="w-5 h-5" />
      </Link>
      <NotificationBell />
    </>
  );
}

/**
 * The mobile-only avatar dropdown (Ver perfil / Definições / Sair da conta)
 * duplicated with copy-pasted markup across every VideosSidebar-based page's
 * own header. Every prior copy shipped with "Ver perfil"/"Definições" missing
 * their onClick — extracting one shared component fixes every current call
 * site at once and stops the bug from recurring on the next new page.
 */
export function MobileAvatarMenu() {
  const { locale } = useLocale();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, setOpen);

  return (
    <div className="relative md:hidden" ref={ref}>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
            <button
              onClick={() => {
                setOpen(false);
                navigate({ to: "/profile" });
              }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left"
            >
              <User className="w-4 h-4 text-[var(--violet)]" />
              {locale === "pt" ? "Ver perfil" : "View profile"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                navigate({ to: "/settings" });
              }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left"
            >
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
        onClick={() => setOpen(!open)}
        aria-label={locale === "pt" ? "Menu de conta" : "Account menu"}
        aria-expanded={open}
        className="relative inline-flex"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600" />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      </button>
    </div>
  );
}

/** The desktop-only avatar link next to it — also duplicated, also dead (no destination) in every copy. */
export function DesktopAvatarLink() {
  const { locale } = useLocale();
  return (
    <Link
      to="/profile"
      className="hidden md:block"
      title={locale === "pt" ? "Ver perfil" : "View profile"}
    >
      <div className="relative inline-flex">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
          <User className="w-4 h-4 text-gray-600" />
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
      </div>
    </Link>
  );
}
