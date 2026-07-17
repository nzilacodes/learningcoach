import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

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
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(locale === "pt" ? "Senha mínima 8 caracteres" : "Password min 8 chars");
    if (password !== confirm) return toast.error(locale === "pt" ? "Senhas não coincidem" : "Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(locale === "pt" ? "Senha atualizada" : "Password updated");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="glass rounded-3xl p-8 shadow-glow">
          <h1 className="font-display text-2xl font-bold">{locale === "pt" ? "Definir nova senha" : "Set new password"}</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>{locale === "pt" ? "Nova senha" : "New password"}</Label>
              <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{locale === "pt" ? "Confirmar" : "Confirm"}</Label>
              <Input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="bg-gradient-sunset w-full text-white">
              {loading ? "..." : locale === "pt" ? "Guardar" : "Save"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
