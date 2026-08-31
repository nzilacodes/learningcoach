import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
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
import coachLogo from "@/assets/coach-logo.png";
import "@/styles/auth-page.css";
import "@/styles/auth-controls.css";

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
  const { locale, setLocale } = useLocale();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    navigate({ to: user.age == null ? "/onboarding" : "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <main className="lewc-auth-shell">
      <section
        className="lewc-auth-story"
        aria-label={locale === "pt" ? "A tua jornada" : "Your journey"}
      >
        <div className="lewc-auth-story-inner">
          <div className="lewc-auth-kicker">
            {locale === "pt" ? "O teu espaço de aprendizagem" : "Your learning space"}
          </div>
          <h1>
            {locale === "pt" ? "Sua jornada de inglês " : "Your English journey "}
            <span>{locale === "pt" ? "continua aqui." : "continues here."}</span>
          </h1>
          <p className="lewc-auth-story-copy">
            {locale === "pt"
              ? "Retome de onde parou, mantenha sua sequência e conquiste novos níveis com o Coach."
              : "Pick up where you left off, keep your streak, and unlock new levels with Coach."}
          </p>
          <div className="lewc-auth-features">
            {[
              {
                pt: "Dados sincronizados",
                en: "Synced data",
                detailPt: "todos os dispositivos",
                detailEn: "all devices",
              },
              {
                pt: "Sessão segura",
                en: "Secure session",
                detailPt: "cookies HttpOnly",
                detailEn: "HttpOnly cookies",
              },
              {
                pt: "Certificados oficiais",
                en: "Official certificates",
                detailPt: "níveis CEFR",
                detailEn: "CEFR levels",
              },
            ].map((feature) => (
              <div className="lewc-auth-feature" key={feature.en}>
                <strong>{locale === "pt" ? feature.pt : feature.en}</strong>
                <span> · {locale === "pt" ? feature.detailPt : feature.detailEn}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lewc-auth-panel">
        <div className="lewc-auth-panel-top">
          <Link to="/" className="lewc-auth-brand" aria-label="LEWC">
            <img src={coachLogo} alt="LEWC" />
            <span>LEWC</span>
          </Link>
          <div className="lewc-auth-languages" aria-label="Language">
            <button
              className={locale === "pt" ? "active" : ""}
              onClick={() => setLocale("pt")}
              type="button"
            >
              PT
            </button>
            <button
              className={locale === "en" ? "active" : ""}
              onClick={() => setLocale("en")}
              type="button"
            >
              EN
            </button>
          </div>
        </div>

        <div className="lewc-auth-content">
          <div className="lewc-auth-kicker">{locale === "pt" ? "Acesso" : "Sign in"}</div>
          <h2>
            {locale === "pt" ? "Bem-vindo " : "Welcome "}
            <span>{locale === "pt" ? "de volta." : "back."}</span>
          </h2>
          <p className="lewc-auth-intro">
            {locale === "pt"
              ? "A tua próxima sessão está a um passo. Retoma de onde ficaste."
              : "Your next session is one step away. Pick up where you left off."}
          </p>

          {mode !== "forgot" && (
            <div className="lewc-auth-tabs" role="tablist">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={mode === "signin" ? "active" : ""}
              >
                {locale === "pt" ? "Entrar" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={mode === "signup" ? "active" : ""}
              >
                {locale === "pt" ? "Criar conta" : "Sign up"}
              </button>
            </div>
          )}

          {mode === "signin" && <SignInForm onForgot={() => setMode("forgot")} />}
          {mode === "signup" && <SignUpForm onDone={() => setMode("signin")} />}
          {mode === "forgot" && <ForgotForm onBack={() => setMode("signin")} />}
        </div>
        <div className="lewc-auth-footer">Learning English with Coach</div>
      </section>
    </main>
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
  const [showPassword, setShowPassword] = useState(false);
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
      <form className="lewc-auth-form" onSubmit={submit}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="lewc-auth-form-item">
              <FormLabel className="lewc-auth-form-label">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  className="lewc-auth-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="lewc-auth-message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="lewc-auth-form-item">
              <div className="lewc-auth-form-head">
                <FormLabel className="lewc-auth-form-label">
                  {locale === "pt" ? "Senha" : "Password"}
                </FormLabel>
                <button type="button" onClick={onForgot} className="lewc-auth-forgot-link">
                  {locale === "pt" ? "Esqueceu?" : "Forgot?"}
                </button>
              </div>
              <div className="lewc-auth-input-wrap">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="lewc-auth-input"
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  className="lewc-auth-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
              <FormMessage className="lewc-auth-message" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading} size="lg" className="lewc-auth-primary">
          {loading ? <Loader2 className="animate-spin" /> : locale === "pt" ? "Entrar" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}

function signUpSchema(locale: "pt" | "en") {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(
          3,
          locale === "pt"
            ? "O nome precisa de pelo menos 3 caracteres"
            : "Name must be at least 3 characters",
        )
        .max(
          30,
          locale === "pt"
            ? "O nome pode ter no máximo 30 caracteres"
            : "Name must be at most 30 characters",
        )
        .regex(
          /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u,
          locale === "pt"
            ? "O nome contém caracteres inválidos"
            : "Name contains invalid characters",
        ),
      email: z
        .string()
        .min(1, locale === "pt" ? "Email obrigatório" : "Email is required")
        .email(locale === "pt" ? "Email inválido" : "Invalid email"),
      password: z
        .string()
        .min(
          8,
          locale === "pt"
            ? "A senha precisa de pelo menos 8 caracteres"
            : "Password needs at least 8 characters",
        )
        .regex(
          /[A-Z]/,
          locale === "pt"
            ? "A senha precisa de uma letra maiúscula"
            : "Password needs an uppercase letter",
        )
        .regex(
          /[0-9]/,
          locale === "pt" ? "A senha precisa de um número" : "Password needs a number",
        )
        .regex(
          /[^A-Za-z0-9]/,
          locale === "pt" ? "A senha precisa de um símbolo" : "Password needs a symbol",
        ),
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
      <form className="lewc-auth-form" onSubmit={submit}>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="lewc-auth-form-item">
              <FormLabel className="lewc-auth-form-label">
                {locale === "pt" ? "Nome completo" : "Full name"}
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder="Maria Silva"
                  className="lewc-auth-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="lewc-auth-message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="lewc-auth-form-item">
              <FormLabel className="lewc-auth-form-label">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  className="lewc-auth-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="lewc-auth-message" />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="lewc-auth-form-item">
                <FormLabel className="lewc-auth-form-label">
                  {locale === "pt" ? "Senha" : "Password"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="lewc-auth-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="lewc-auth-message" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem className="lewc-auth-form-item">
                <FormLabel className="lewc-auth-form-label">
                  {locale === "pt" ? "Confirmar" : "Confirm"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="lewc-auth-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="lewc-auth-message" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="lewc-auth-form-item">
              <label className="lewc-auth-check-row lewc-auth-check-row-inline">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <span>
                  {locale === "pt" ? "Aceito os Termos de Utilização" : "I accept the Terms of Use"}
                </span>
              </label>
              <FormMessage className="lewc-auth-message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="privacy"
          render={({ field }) => (
            <FormItem className="lewc-auth-form-item">
              <label className="lewc-auth-check-row lewc-auth-check-row-inline">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
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
        <Button type="submit" disabled={loading} size="lg" className="lewc-auth-primary">
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : locale === "pt" ? (
            "Criar conta"
          ) : (
            "Create account"
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
      <form onSubmit={submit} className="lewc-auth-form">
        <h3 className="lewc-auth-forgot-title">
          {locale === "pt" ? "Recuperar senha" : "Reset password"}
        </h3>
        <p className="lewc-auth-forgot-copy">
          {locale === "pt"
            ? "Enviaremos um link seguro para o seu email."
            : "We'll send a secure reset link to your email."}
        </p>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="lewc-auth-form-item">
              <FormLabel className="lewc-auth-form-label">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  className="lewc-auth-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="lewc-auth-message" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading} className="lewc-auth-primary">
          {loading ? (
            <Loader2 className="mx-auto animate-spin" />
          ) : locale === "pt" ? (
            "Enviar link"
          ) : (
            "Send link"
          )}
        </Button>
        <button type="button" onClick={onBack} className="lewc-auth-back">
          {locale === "pt" ? "← Voltar" : "← Back"}
        </button>
      </form>
    </Form>
  );
}
