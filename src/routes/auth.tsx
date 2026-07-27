import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Entrar — Learning English with Coach" },
      { name: "description", content: "Entre ou crie a sua conta para começar a aprender inglês com o Coach." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AuthPage() {
  const { locale } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !session) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("age").eq("id", session.user.id).maybeSingle();
      navigate({ to: data?.age == null ? "/onboarding" : "/dashboard" });
    })();
  }, [session, loading, navigate]);

  const signInGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) toast.error(res.error.message || "Google sign-in failed");
  };

  const signInApple = async () => {
    const res = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (res.error) toast.error(res.error.message || "Apple sign-in failed");
  };

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
                { pt: "Dados sincronizados em todos os seus dispositivos", en: "Data synced across all your devices" },
                { pt: "Sessão segura e privacidade total (RLS)", en: "Secure session and full privacy (RLS)" },
                { pt: "Certificados oficiais a cada nível CEFR", en: "Official CEFR certificates per level" },
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
                  className={`flex-1 rounded-lg px-4 py-2 transition-all ${mode === "signin" ? "bg-background shadow-card" : "text-muted-foreground"
                    }`}
                >
                  {locale === "pt" ? "Entrar" : "Sign in"}
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-lg px-4 py-2 transition-all ${mode === "signup" ? "bg-background shadow-card" : "text-muted-foreground"
                    }`}
                >
                  {locale === "pt" ? "Criar conta" : "Sign up"}
                </button>
              </div>
            )}

            {mode === "signin" && <SignInForm onForgot={() => setMode("forgot")} />}
            {mode === "signup" && <SignUpForm onDone={() => setMode("signin")} />}
            {mode === "forgot" && <ForgotForm onBack={() => setMode("signin")} />}

            {mode !== "forgot" && (
              <>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    {locale === "pt" ? "ou" : "or"}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button variant="outline" className="mt-4 w-full" onClick={signInGoogle}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {locale === "pt" ? "Continuar com Google" : "Continue with Google"}
                </Button>
                <Button variant="outline" className="mt-2 w-full" onClick={signInApple}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  {locale === "pt" ? "Continuar com Apple" : "Continue with Apple"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Check lockout before attempting
    const { data: lockData } = await supabase.rpc("is_account_locked", { _email: email });
    const lock = lockData as { locked: boolean; until: string | null } | null;
    if (lock?.locked) {
      setLoading(false);
      const mins = lock.until ? Math.max(1, Math.ceil((new Date(lock.until).getTime() - Date.now()) / 60000)) : 15;
      return toast.error(locale === "pt"
        ? `Conta bloqueada por segurança. Tente novamente em ${mins} min.`
        : `Account locked for security. Try again in ${mins} min.`);
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Record attempt (best-effort)
    supabase.rpc("record_login_attempt", {
      _email: email,
      _success: !error,
      _ua: navigator.userAgent,
      _reason: error?.message ?? undefined,
    }).then(({ data }) => {
      const r = data as { locked: boolean; failed_attempts: number } | null;
      if (r?.locked) toast.error(locale === "pt"
        ? "Muitas tentativas falhadas. Conta bloqueada por 15 minutos."
        : "Too many failed attempts. Account locked for 15 minutes.");
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!remember) {
      // best-effort: clear on tab close via sessionStorage swap
      try {
        const key = Object.keys(localStorage).find((k) => k.startsWith("sb-"));
        if (key) {
          sessionStorage.setItem(key, localStorage.getItem(key)!);
          localStorage.removeItem(key);
        }
      } catch { }
    }
    toast.success(locale === "pt" ? "Sessão iniciada" : "Signed in");
    // Route handled by parent useEffect based on profile completeness.
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-9" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{locale === "pt" ? "Senha" : "Password"}</Label>
          <button type="button" onClick={onForgot} className="text-xs font-semibold text-magenta hover:underline">
            {locale === "pt" ? "Esqueceu?" : "Forgot?"}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-border" />
        {locale === "pt" ? "Lembrar de mim" : "Remember me"}
      </label>
      <Button type="submit" disabled={loading} size="lg" className="bg-gradient-sunset w-full text-white shadow-soft hover:opacity-90">
        {loading ? "..." : locale === "pt" ? "Entrar" : "Sign in"} <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </form>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const { locale } = useLocale();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error(locale === "pt" ? "Senha mínima: 8 caracteres" : "Password: min 8 chars");
    if (password !== confirm) return toast.error(locale === "pt" ? "Senhas não coincidem" : "Passwords don't match");
    if (!terms || !privacy) return toast.error(locale === "pt" ? "Aceite os termos e a política" : "Accept terms & privacy");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(locale === "pt" ? "Conta criada! Pode iniciar sessão." : "Account created! You can sign in.");
    onDone();
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label>{locale === "pt" ? "Nome completo" : "Full name"}</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maria Silva" className="pl-9" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-9" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{locale === "pt" ? "Senha" : "Password"}</Label>
          <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label>{locale === "pt" ? "Confirmar" : "Confirm"}</Label>
          <Input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>{locale === "pt" ? "Aceito os Termos de Utilização" : "I accept the Terms of Use"}</span>
      </label>
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>{locale === "pt" ? "Aceito a Política de Privacidade" : "I accept the Privacy Policy"}</span>
      </label>
      <Button type="submit" disabled={loading} size="lg" className="bg-gradient-sunset w-full text-white shadow-soft hover:opacity-90">
        {loading ? "..." : locale === "pt" ? "Criar conta" : "Create account"} <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(locale === "pt" ? "Verifique o seu email" : "Check your email");
    onBack();
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <h3 className="font-display text-xl font-bold">{locale === "pt" ? "Recuperar senha" : "Reset password"}</h3>
      <p className="text-sm text-muted-foreground">
        {locale === "pt"
          ? "Enviaremos um link seguro para o seu email."
          : "We'll send a secure reset link to your email."}
      </p>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
      </div>
      <Button type="submit" disabled={loading} className="bg-gradient-sunset w-full text-white">
        {loading ? "..." : locale === "pt" ? "Enviar link" : "Send link"}
      </Button>
      <button type="button" onClick={onBack} className="w-full text-xs text-muted-foreground hover:text-foreground">
        {locale === "pt" ? "← Voltar" : "← Back"}
      </button>
    </form>
  );
}
