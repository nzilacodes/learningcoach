import { Link, useNavigate } from "@tanstack/react-router";
import { User, Settings, LogOut, Zap, HelpCircle, Gift } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function AccountAvatar({ url }: { url: string | null }) {
  return (
    <Avatar className="h-8 w-8">
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback className="bg-gray-200">
        <User className="h-4 w-4 text-gray-600" />
      </AvatarFallback>
    </Avatar>
  );
}

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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={locale === "pt" ? "Menu de conta" : "Account menu"}
          className="relative inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <AccountAvatar url={user?.avatarUrl ?? null} />
          <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52 rounded-2xl border-gray-100 p-2 premium-shadow"
        >
          <DropdownMenuItem
            onClick={() => navigate({ to: "/profile" })}
            className="gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-600"
          >
            <User className="h-4 w-4 text-[var(--violet)]" />
            {locale === "pt" ? "Ver perfil" : "View profile"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate({ to: "/settings" })}
            className="gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-600"
          >
            <Settings className="h-4 w-4 text-gray-400" />
            {locale === "pt" ? "Definições" : "Settings"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-red-400 focus:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            {locale === "pt" ? "Sair da conta" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** The desktop-only avatar link next to it. */
export function DesktopAvatarLink() {
  const { locale } = useLocale();
  const { user } = useAuth();
  return (
    <Link
      to="/profile"
      className="hidden md:block"
      title={locale === "pt" ? "Ver perfil" : "View profile"}
    >
      <div className="relative inline-flex">
        <AccountAvatar url={user?.avatarUrl ?? null} />
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
      </div>
    </Link>
  );
}
