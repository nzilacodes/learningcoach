import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
  // A server-side beforeLoad session check could be added here later as a
  // single option — every child route mounts only inside <Outlet/> below,
  // so none of them would need touching.
  head: () => ({
    meta: [
      { title: "Admin — Learning English with Coach" },
      { name: "description", content: "Painel de administração." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

/** Centralized shell + auth guard for every /admin/* window — previously
 * duplicated per-page across admin.tsx, analytics.tsx and audit.tsx. */
function AdminShell() {
  const { locale } = useLocale();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
        <div className="mx-auto max-w-lg text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-magenta" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            {locale === "pt" ? "Acesso restrito" : "Restricted access"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {locale === "pt"
              ? "Esta área é apenas para administradores. Se acredita que devia ter acesso, contacte o Coach."
              : "This area is admin-only. Contact the Coach if you should have access."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">{locale === "pt" ? "Ir para o painel" : "Go to dashboard"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <AppHeader
          title={locale === "pt" ? "Painel do Administrador" : "Administrator Dashboard"}
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
