import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Languages, KeyRound, LogOut, Loader2, CreditCard, ChevronRight } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { passwordError } from "@/lib/password";

function changePasswordSchema(locale: "pt" | "en") {
  return z
    .object({
      currentPassword: z.string().min(1, locale === "pt" ? "Obrigatório" : "Required"),
      newPassword: z.string().superRefine((pw, ctx) => {
        const message = passwordError(pw, locale);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }),
      confirmPassword: z.string(),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: locale === "pt" ? "As palavras-passe não coincidem" : "Passwords don't match",
      path: ["confirmPassword"],
    });
}
type ChangePasswordValues = z.infer<ReturnType<typeof changePasswordSchema>>;

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Definições — Learning English with Coach" },
      { name: "description", content: "Idioma, palavra-passe e conta." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const notify = useNotification();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const [saving, setSaving] = useState(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema(locale)),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
        {locale === "pt" ? "A carregar…" : "Loading…"}
      </div>
    );
  }

  const changePassword = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await apiFetch("/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      // The backend revokes every refresh token (this session included) when
      // the password changes, so the current session is already dead server-
      // side — sign out locally and send the user to log back in explicitly,
      // rather than let them hit a confusing 401 on the next silent refresh.
      notify.success(
        locale === "pt"
          ? "Palavra-passe alterada. Entre novamente."
          : "Password changed. Please sign in again.",
      );
      await signOut();
      navigate({ to: "/auth" });
    } catch (err) {
      const normalized = notify.fromError(err, { dedupeKey: "settings:change-password" });
      if (normalized.fieldPaths?.includes("currentPassword")) {
        form.setError("currentPassword", { type: "server", message: normalized.description });
      }
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center px-4 md:px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <h1 className="font-display text-xl font-bold text-[var(--ink)] truncate">
            {locale === "pt" ? "Definições" : "Settings"}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Language */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 premium-shadow">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--ink)]">
                <Languages className="h-5 w-5 text-[var(--violet)]" />
                {locale === "pt" ? "Idioma" : "Language"}
              </h2>
              <div className="mt-4 flex gap-2">
                {(["pt", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition ${
                      locale === l
                        ? "border-[var(--violet)] bg-[var(--violet)] text-white"
                        : "border-gray-100 hover:border-[var(--violet)]/50"
                    }`}
                  >
                    {l === "pt" ? "Português" : "English"}
                  </button>
                ))}
              </div>
            </section>

            {/* Subscription */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 premium-shadow">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--ink)]">
                <CreditCard className="h-5 w-5 text-[var(--violet)]" />
                {locale === "pt" ? "Assinatura" : "Subscription"}
              </h2>
              <Link
                to="/subscription"
                className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--violet)]/50"
              >
                {locale === "pt" ? "Gerir plano e faturação" : "Manage plan & billing"}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </section>

            {/* Change password */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 premium-shadow">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--ink)]">
                <KeyRound className="h-5 w-5 text-[var(--violet)]" />
                {locale === "pt" ? "Alterar palavra-passe" : "Change password"}
              </h2>
              <Form {...form}>
                <form onSubmit={changePassword} className="mt-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {locale === "pt" ? "Palavra-passe atual" : "Current password"}
                        </FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {locale === "pt" ? "Nova palavra-passe" : "New password"}
                        </FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <p className="text-xs text-gray-400">
                          {locale === "pt"
                            ? "Mínimo 8 caracteres, com pelo menos uma letra e um número."
                            : "At least 8 characters, with at least one letter and one number."}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {locale === "pt"
                            ? "Confirmar nova palavra-passe"
                            : "Confirm new password"}
                        </FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[var(--violet)] text-white hover:opacity-90"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : locale === "pt" ? (
                      "Alterar palavra-passe"
                    ) : (
                      "Change password"
                    )}
                  </Button>
                </form>
              </Form>
            </section>

            {/* Sign out */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 premium-shadow">
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {locale === "pt" ? "Sair da conta" : "Sign out"}
              </Button>
            </section>
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}
