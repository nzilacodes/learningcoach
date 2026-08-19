import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowRight, Check, Loader2 } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      notify.success(locale === "pt" ? "Sessão iniciada" : "Signed in");
      // Route handled by AuthPage's useEffect based on profile completeness.
    } catch (e) {
      notify.fromError(e, { dedupeKey: "auth:signin" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="pl-9"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{locale === "pt" ? "Senha" : "Password"}</Label>
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
          <Input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-9"
          />
        </div>
      </div>
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
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = passwordError(password, locale);
    if (pwError) return notify.warning(pwError);
    if (password !== confirm)
      return notify.warning(locale === "pt" ? "Senhas não coincidem" : "Passwords don't match");
    if (!terms || !privacy)
      return notify.warning(locale === "pt" ? "Aceite os termos e a política" : "Accept terms & privacy");
    setLoading(true);
    try {
      await apiFetch("/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName }),
      });
      await refresh();
      notify.success(locale === "pt" ? "Conta criada!" : "Account created!");
      onDone();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "auth:signup" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label>{locale === "pt" ? "Nome completo" : "Full name"}</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Maria Silva"
            className="pl-9"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="pl-9"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{locale === "pt" ? "Senha" : "Password"}</Label>
          <Input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-2">
          <Label>{locale === "pt" ? "Confirmar" : "Confirm"}</Label>
          <Input
            required
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          {locale === "pt" ? "Aceito os Termos de Utilização" : "I accept the Terms of Use"}
        </span>
      </label>
      <label className="flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={privacy}
          onChange={(e) => setPrivacy(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          {locale === "pt" ? "Aceito a Política de Privacidade" : "I accept the Privacy Policy"}
        </span>
      </label>
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
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      notify.success(locale === "pt" ? "Verifique o seu email" : "Check your email");
      onBack();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "auth:forgot-password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <h3 className="font-display text-xl font-bold">
        {locale === "pt" ? "Recuperar senha" : "Reset password"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {locale === "pt"
          ? "Enviaremos um link seguro para o seu email."
          : "We'll send a secure reset link to your email."}
      </p>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
        />
      </div>
      <Button type="submit" disabled={loading} className="bg-gradient-sunset w-full text-white">
        {loading ? "..." : locale === "pt" ? "Enviar link" : "Send link"}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-xs text-muted-foreground hover:text-foreground"
      >
        {locale === "pt" ? "← Voltar" : "← Back"}
      </button>
    </form>
  );
}
