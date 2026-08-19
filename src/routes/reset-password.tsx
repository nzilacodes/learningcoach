import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/client";
import { passwordError } from "@/lib/password";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Learning English with Coach" },
      { name: "description", content: "Redefina a senha da sua conta." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ResetPasswordPage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      return notify.warning(
        locale === "pt"
          ? "Link inválido — peça um novo email de recuperação."
          : "Invalid link — request a new reset email.",
      );
    }
    const pwError = passwordError(password, locale);
    if (pwError) return notify.warning(pwError);
    if (password !== confirm)
      return notify.warning(locale === "pt" ? "Senhas não coincidem" : "Passwords don't match");
    setLoading(true);
    try {
      await apiFetch("/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      notify.success(
        locale === "pt"
          ? "Senha atualizada — inicie sessão."
          : "Password updated — please sign in.",
      );
      navigate({ to: "/auth" });
    } catch (e) {
      notify.fromError(e, { dedupeKey: "reset-password:submit" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="glass rounded-3xl p-8 shadow-glow">
          <h1 className="font-display text-2xl font-bold">
            {locale === "pt" ? "Definir nova senha" : "Set new password"}
          </h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>{locale === "pt" ? "Nova senha" : "New password"}</Label>
              <Input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "pt" ? "Confirmar" : "Confirm"}</Label>
              <Input
                required
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-sunset w-full text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : locale === "pt" ? (
                "Guardar"
              ) : (
                "Save"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
