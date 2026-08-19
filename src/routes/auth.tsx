import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Mail, Lock, User, ArrowRight, Check, Loader2 } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/lib/auth";
import { passwordError } from "@/lib/password";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Entrar — Learning English with Coach" },
      {
        name: "description",
        content: "Entre ou crie a sua conta para começar a aprender inglês com o Coach.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AuthPage() {
  const { locale } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    navigate({ to: user.age == null ? "/onboarding" : "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="bg-hero min-h-screen flex justify-center items-center">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          <div className="hidden flex-col justify-center md:flex">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold shadow-card backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-magenta" />
              {locale === "pt" ? "Bem-vindo(a) de volta" : "Welcome back"}
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-tight">
              {locale === "pt" ? "Sua jornada de inglês " : "Your English journey "}
              <span className="text-gradient-sunset">
                {locale === "pt" ? "continua aqui." : "continues here."}
              </span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {locale === "pt"
                ? "Retome de onde parou, mantenha sua sequência e conquiste novos níveis com o Coach."
                : "Pick up where you left off, keep your streak, and unlock new levels with Coach."}
            </p>
            <div className="mt-8 space-y-3">
              {[
                {
                  pt: "Dados sincronizados em todos os seus dispositivos",
                  en: "Data synced across all your devices",
                },
                {
                  pt: "Sessão segura com cookies HttpOnly",
                  en: "Secure session with HttpOnly cookies",
                },
                {
                  pt: "Certificados oficiais a cada nível CEFR",
                  en: "Official CEFR certificates per level",
                },
              ].map((f) => (
                <div key={f.en} className="flex items-center gap-3 text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-sunset text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  {locale === "pt" ? f.pt : f.en}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-8 shadow-glow">
            {mode !== "forgot" && (
              <div className="flex rounded-xl bg-muted p-1 text-sm font-semibold">
                <button
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-lg px-4 py-2 transition-all ${
                    mode === "signin" ? "bg-background shadow-card" : "text-muted-foreground"
                  }`}
                >
                  {locale === "pt" ? "Entrar" : "Sign in"}
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-lg px-4 py-2 transition-all ${
                    mode === "signup" ? "bg-background shadow-card" : "text-muted-foreground"
                  }`}
                >
                  {locale === "pt" ? "Criar conta" : "Sign up"}
                </button>
              </div>
            )}

            {mode === "signin" && <SignInForm onForgot={() => setMode("forgot")} />}
            {mode === "signup" && <SignUpForm onDone={() => setMode("signin")} />}
            {mode === "forgot" && <ForgotForm onBack={() => setMode("signin")} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function signInSchema(locale: "pt" | "en") {
  return z.object({
    email: z
      .string()
      .min(1, locale === "pt" ? "Email obrigatório" : "Email is required")
      .email(locale === "pt" ? "Email inválido" : "Invalid email"),
    password: z.string().min(1, locale === "pt" ? "Senha obrigatória" : "Password is required"),
  });
}
type SignInValues = z.infer<ReturnType<typeof signInSchema>>;

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema(locale)),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await apiFetch("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      await refresh();
      notify.success(locale === "pt" ? "Sessão iniciada" : "Signed in");
      // Route handled by AuthPage's useEffect based on profile completeness.
    } catch (e) {
      const normalized = notify.fromError(e, { dedupeKey: "auth:signin" });
      normalized.fieldPaths?.forEach((path) => {
        if (path === "email" || path === "password") {
          form.setError(path, { type: "server", message: normalized.description });
        }
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Form {...form}>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{locale === "pt" ? "Senha" : "Password"}</FormLabel>
                <button
                  type="button"
                  onClick={onForgot}
                  className="text-xs font-semibold text-magenta hover:underline"
                >
                  {locale === "pt" ? "Esqueceu?" : "Forgot?"}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="bg-gradient-sunset w-full text-white shadow-soft hover:opacity-90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {locale === "pt" ? "Entrar" : "Sign in"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

function signUpSchema(locale: "pt" | "en") {
  return z
    .object({
      fullName: z.string().min(1, locale === "pt" ? "Nome obrigatório" : "Name is required"),
      email: z
        .string()
        .min(1, locale === "pt" ? "Email obrigatório" : "Email is required")
        .email(locale === "pt" ? "Email inválido" : "Invalid email"),
      password: z.string().superRefine((pw, ctx) => {
        const message = passwordError(pw, locale);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }),
      confirm: z.string(),
      terms: z.boolean(),
      privacy: z.boolean(),
    })
    .refine((v) => v.password === v.confirm, {
      message: locale === "pt" ? "Senhas não coincidem" : "Passwords don't match",
      path: ["confirm"],
    })
    .refine((v) => v.terms && v.privacy, {
      message: locale === "pt" ? "Aceite os termos e a política" : "Accept terms & privacy",
      path: ["terms"],
    });
}
type SignUpValues = z.infer<ReturnType<typeof signUpSchema>>;

function SignUpForm({ onDone }: { onDone: () => void }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema(locale)),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirm: "",
      terms: false,
      privacy: false,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await apiFetch("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
        }),
      });
      await refresh();
      notify.success(locale === "pt" ? "Conta criada!" : "Account created!");
      onDone();
    } catch (e) {
      const normalized = notify.fromError(e, { dedupeKey: "auth:signup" });
      normalized.fieldPaths?.forEach((path) => {
        if (path === "email" || path === "password" || path === "fullName") {
          form.setError(path, { type: "server", message: normalized.description });
        }
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Form {...form}>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{locale === "pt" ? "Nome completo" : "Full name"}</FormLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="Maria Silva"
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{locale === "pt" ? "Senha" : "Password"}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
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
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-start gap-2 text-xs">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <span>
                  {locale === "pt" ? "Aceito os Termos de Utilização" : "I accept the Terms of Use"}
                </span>
              </label>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="privacy"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-start gap-2 text-xs">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <span>
                  {locale === "pt"
                    ? "Aceito a Política de Privacidade"
                    : "I accept the Privacy Policy"}
                </span>
              </label>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="bg-gradient-sunset w-full text-white shadow-soft hover:opacity-90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {locale === "pt" ? "Criar conta" : "Create account"}{" "}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

function forgotSchema(locale: "pt" | "en") {
  return z.object({
    email: z
      .string()
      .min(1, locale === "pt" ? "Email obrigatório" : "Email is required")
      .email(locale === "pt" ? "Email inválido" : "Invalid email"),
  });
}
type ForgotValues = z.infer<ReturnType<typeof forgotSchema>>;

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema(locale)),
    defaultValues: { email: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await apiFetch("/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      notify.success(locale === "pt" ? "Verifique o seu email" : "Check your email");
      onBack();
    } catch (e) {
      const normalized = notify.fromError(e, { dedupeKey: "auth:forgot-password" });
      if (normalized.fieldPaths?.includes("email")) {
        form.setError("email", { type: "server", message: normalized.description });
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <h3 className="font-display text-xl font-bold">
          {locale === "pt" ? "Recuperar senha" : "Reset password"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {locale === "pt"
            ? "Enviaremos um link seguro para o seu email."
            : "We'll send a secure reset link to your email."}
        </p>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading} className="bg-gradient-sunset w-full text-white">
          {loading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : locale === "pt" ? (
            "Enviar link"
          ) : (
            "Send link"
          )}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {locale === "pt" ? "← Voltar" : "← Back"}
        </button>
      </form>
    </Form>
  );
}
