import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { SiteHeader } from "@/components/site-header";
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
import { apiFetch } from "@/lib/api/client";
import { passwordError } from "@/lib/password";

function resetPasswordSchema(locale: "pt" | "en") {
  return z
    .object({
      password: z.string().superRefine((pw, ctx) => {
        const message = passwordError(pw, locale);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: locale === "pt" ? "Senhas não coincidem" : "Passwords don't match",
      path: ["confirm"],
    });
}
type ResetPasswordValues = z.infer<ReturnType<typeof resetPasswordSchema>>;

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema(locale)),
    defaultValues: { password: "", confirm: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      return notify.warning(
        locale === "pt"
          ? "Link inválido — peça um novo email de recuperação."
          : "Invalid link — request a new reset email.",
      );
    }
    setLoading(true);
    try {
      await apiFetch("/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: values.password }),
      });
      notify.success(
        locale === "pt"
          ? "Senha atualizada — inicie sessão."
          : "Password updated — please sign in.",
      );
      navigate({ to: "/auth" });
    } catch (e) {
      const normalized = notify.fromError(e, { dedupeKey: "reset-password:submit" });
      if (normalized.fieldPaths?.includes("password")) {
        form.setError("password", { type: "server", message: normalized.description });
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="glass rounded-3xl p-8 shadow-glow">
          <h1 className="font-display text-2xl font-bold">
            {locale === "pt" ? "Definir nova senha" : "Set new password"}
          </h1>
          <Form {...form}>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "pt" ? "Nova senha" : "New password"}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "pt" ? "Confirmar" : "Confirm"}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
          </Form>
        </div>
      </div>
    </div>
  );
}
