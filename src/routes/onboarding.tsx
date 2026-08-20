import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  User,
  Globe,
  Cake,
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  Languages,
  Heart,
  GraduationCap,
  BookOpen,
  Rocket,
  Crown,
  PlayCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
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
import { useAuth, type AuthUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { ageToRoom, useAgeTheme } from "@/lib/age-theme";
import { INTEREST_OPTIONS, GOAL_OPTIONS } from "@/lib/profile-options";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingWizard,
  head: () => ({
    meta: [
      { title: "Onboarding — Learning English with Coach" },
      { name: "description", content: "Complete o seu onboarding para começar a aprender inglês." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Status = "profile" | "placement" | "plan" | "demo" | "checkout" | "complete";

const STEPS: { key: Status; labelPt: string; labelEn: string; icon: typeof User }[] = [
  { key: "profile", labelPt: "Perfil", labelEn: "Profile", icon: User },
  { key: "placement", labelPt: "Teste", labelEn: "Test", icon: GraduationCap },
  { key: "plan", labelPt: "Plano", labelEn: "Plan", icon: Target },
  { key: "demo", labelPt: "Demo", labelEn: "Demo", icon: PlayCircle },
  { key: "checkout", labelPt: "Pagamento", labelEn: "Checkout", icon: CreditCard },
];

function OnboardingWizard() {
  const { locale } = useLocale();
  const { user, loading, refresh: refreshAuth } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();
  const [goingBack, setGoingBack] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const status: Status = (user?.onboardingStatus as Status) ?? "profile";
  const activeIdx = STEPS.findIndex((s) => s.key === status);
  const knownStep = activeIdx !== -1;

  // onboardingStatus is server-authoritative (each step's onDone() PATCHes it
  // forward) — going back means PATCHing it to the previous step's key, same
  // mechanism UnknownStatusStep's reset already uses, not a client-side index.
  const goBack = async () => {
    if (activeIdx <= 0) return;
    setGoingBack(true);
    try {
      await apiFetch("/v1/me", {
        method: "PATCH",
        body: JSON.stringify({ onboardingStatus: STEPS[activeIdx - 1].key }),
      });
      await refreshAuth();
    } catch (e) {
      notify.fromError(e, { dedupeKey: "onboarding:back" });
    } finally {
      setGoingBack(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {locale === "pt" ? "A carregar…" : "Loading…"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="bg-hero">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {/* Stepper */}
          <div className="glass mb-6 rounded-2xl p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < activeIdx;
                const active = i === activeIdx;
                return (
                  <div key={s.key} className="flex flex-1 items-center gap-2 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-magenta bg-magenta text-white"
                          : active
                            ? "border-sunset bg-sunset text-white shadow-soft"
                            : "border-border bg-background/60 text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 hidden sm:block">
                      <div
                        className={`truncate text-xs font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {locale === "pt" ? s.labelPt : s.labelEn}
                      </div>
                    </div>
                    {i < STEPS.length - 1 && <div className="h-0.5 flex-1 bg-border" />}
                  </div>
                );
              })}
            </div>
          </div>

          {knownStep && activeIdx > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={goingBack}
              className="mb-3"
            >
              {goingBack ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeft className="mr-1.5 h-4 w-4" />
              )}
              {locale === "pt" ? "Voltar" : "Back"}
            </Button>
          )}

          {status === "profile" && <ProfileStep user={user} onDone={refreshAuth} />}
          {status === "placement" && <PlacementStep onDone={refreshAuth} />}
          {status === "plan" && <PlanStep user={user} onDone={refreshAuth} />}
          {status === "demo" && <DemoStep onDone={refreshAuth} />}
          {status === "checkout" && <CheckoutStep onDone={refreshAuth} />}
          {!knownStep && status !== "complete" && <UnknownStatusStep onDone={refreshAuth} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- FALLBACK: unrecognized onboardingStatus ---------------- */

function UnknownStatusStep({ onDone }: { onDone: () => Promise<void> }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [resetting, setResetting] = useState(false);

  const reset = async () => {
    setResetting(true);
    try {
      await apiFetch("/v1/me", {
        method: "PATCH",
        body: JSON.stringify({ onboardingStatus: "profile" }),
      });
    } catch (e) {
      setResetting(false);
      return notify.fromError(e, { dedupeKey: "onboarding:reset" });
    }
    setResetting(false);
    await onDone();
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-glow text-center">
      <h2 className="font-display text-xl font-bold">
        {locale === "pt"
          ? "Algo correu mal com o seu progresso"
          : "Something went wrong with your progress"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {locale === "pt"
          ? "Não foi possível determinar o passo atual do onboarding. Reinicie para continuar."
          : "We couldn't determine your current onboarding step. Restart to continue."}
      </p>
      <Button
        onClick={reset}
        disabled={resetting}
        size="lg"
        className="bg-gradient-sunset mt-6 text-white shadow-soft hover:opacity-90"
      >
        {resetting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : locale === "pt" ? (
          "Reiniciar onboarding"
        ) : (
          "Restart onboarding"
        )}
      </Button>
    </div>
  );
}

/* ---------------- STEP 1: PROFILE ---------------- */

function onboardingProfileSchema(locale: "pt" | "en") {
  return z.object({
    fullName: z.string().min(1, locale === "pt" ? "Nome obrigatório" : "Name required"),
    age: z.coerce
      .number({ invalid_type_error: locale === "pt" ? "Idade inválida" : "Invalid age" })
      .int()
      .min(4, locale === "pt" ? "Idade inválida (4–120)" : "Invalid age (4–120)")
      .max(120, locale === "pt" ? "Idade inválida (4–120)" : "Invalid age (4–120)"),
    country: z.string().min(1, locale === "pt" ? "País obrigatório" : "Country required"),
    nativeLang: z
      .string()
      .min(1, locale === "pt" ? "Língua materna obrigatória" : "Native language required"),
    goal: z.string().min(1, locale === "pt" ? "Escolha um objetivo" : "Choose a goal"),
    interests: z
      .array(z.string())
      .min(1, locale === "pt" ? "Escolha pelo menos 1 interesse" : "Pick at least 1 interest"),
  });
}
type OnboardingProfileValues = z.infer<ReturnType<typeof onboardingProfileSchema>>;

function ProfileStep({ user, onDone }: { user: AuthUser; onDone: () => Promise<void> }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const { setTheme } = useAgeTheme();
  const [saving, setSaving] = useState(false);

  const form = useForm<OnboardingProfileValues>({
    resolver: zodResolver(onboardingProfileSchema(locale)),
    defaultValues: {
      fullName: user.fullName ?? "",
      age: user.age ?? (undefined as unknown as number),
      country: user.country ?? "",
      nativeLang: user.nativeLanguage ?? "",
      goal: user.learningGoal ?? "",
      interests: user.interests ?? [],
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await apiFetch("/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          age: values.age,
          country: values.country.trim(),
          nativeLanguage: values.nativeLang.trim(),
          learningGoal: values.goal,
          interests: values.interests,
          onboardingStatus: "placement",
        }),
      });
    } catch (e) {
      setSaving(false);
      return notify.fromError(e, { dedupeKey: "onboarding:profile" });
    }
    setSaving(false);
    setTheme(ageToRoom(values.age));
    await onDone();
  });

  return (
    <div className="glass rounded-3xl p-8 shadow-glow">
      <Badge icon={Sparkles} label={locale === "pt" ? "Passo 3 · Perfil" : "Step 3 · Profile"} />
      <h1 className="mt-4 font-display text-3xl font-bold">
        {locale === "pt" ? "Complete o seu perfil" : "Complete your profile"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {locale === "pt"
          ? "Estas informações personalizam o seu plano de aprendizagem."
          : "This information personalizes your learning plan."}
      </p>

      <Form {...form}>
        <form onSubmit={submit} className="mt-6 space-y-5">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{locale === "pt" ? "Idade" : "Age"}</FormLabel>
                  <div className="relative">
                    <Cake className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        min={4}
                        max={120}
                        placeholder="18"
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
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{locale === "pt" ? "País" : "Country"}</FormLabel>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        autoComplete="country-name"
                        placeholder="Angola"
                        className="pl-9"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nativeLang"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{locale === "pt" ? "Língua materna" : "Native language"}</FormLabel>
                <div className="relative">
                  <Languages className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder={locale === "pt" ? "Português" : "Portuguese"}
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
            name="goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Target className="h-4 w-4" />{" "}
                  {locale === "pt" ? "Objetivo principal" : "Main goal"}
                </FormLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GOAL_OPTIONS.map((g) => {
                    const active = field.value === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => field.onChange(g.id)}
                        className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${
                          active
                            ? "border-sunset bg-sunset/10 shadow-soft"
                            : "border-border bg-background/60 hover:border-magenta/50"
                        }`}
                      >
                        {locale === "pt" ? g.pt : g.en}
                      </button>
                    );
                  })}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> {locale === "pt" ? "Interesses" : "Interests"}
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((i) => {
                    const active = (field.value as string[]).includes(i.id);
                    const toggle = () =>
                      field.onChange(
                        active
                          ? (field.value as string[]).filter((x) => x !== i.id)
                          : [...(field.value as string[]), i.id],
                      );
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={toggle}
                        className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-magenta bg-magenta text-white"
                            : "border-border bg-background/60 hover:border-magenta/50"
                        }`}
                      >
                        {locale === "pt" ? i.pt : i.en}
                      </button>
                    );
                  })}
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            disabled={saving}
            className="bg-gradient-sunset w-full text-white shadow-soft hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {locale === "pt" ? "Continuar" : "Continue"}{" "}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

/* ---------------- STEP 2: PLACEMENT (redirects to full /placement diagnostic) ---------------- */

function PlacementStep({ onDone }: { onDone: () => Promise<void> }) {
  // Unlike the other steps, this one hands off entirely to /placement — its
  // own success screen navigates straight to /dashboard rather than back into
  // this wizard, so there's no "advance to next step" moment here to call
  // onDone() from. Kept in the signature only for parity with the sibling
  // steps at the call site below.
  void onDone;
  const { locale } = useLocale();
  const navigate = useNavigate();
  return (
    <div className="glass rounded-3xl p-8 shadow-glow">
      <Badge
        icon={GraduationCap}
        label={locale === "pt" ? "Passo 4 · Diagnóstico completo" : "Step 4 · Full diagnostic"}
      />
      <h2 className="mt-4 font-display text-2xl font-bold">
        {locale === "pt" ? "Vamos avaliar 7 skills do seu inglês" : "Let's assess 7 English skills"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {locale === "pt"
          ? "Grammar, Vocabulary, Reading, Listening, Writing, Speaking e Pronunciation. Duração: ~15 min. Vai usar o microfone."
          : "Grammar, Vocabulary, Reading, Listening, Writing, Speaking and Pronunciation. ~15 min. Uses your microphone."}
      </p>
      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {[
          locale === "pt" ? "Nível CEFR (A1–C2)" : "CEFR level (A1–C2)",
          locale === "pt" ? "Relatório detalhado" : "Detailed report",
          locale === "pt" ? "Pontos fortes/fracos" : "Strengths/weaknesses",
          locale === "pt" ? "Plano de 4 semanas" : "4-week learning plan",
        ].map((it) => (
          <li
            key={it}
            className="flex items-center gap-2 rounded-xl border border-border bg-background/60 p-3"
          >
            <Check className="h-4 w-4 text-magenta" /> {it}
          </li>
        ))}
      </ul>
      <Button
        size="lg"
        className="mt-6 bg-gradient-sunset text-white shadow-soft hover:opacity-90"
        onClick={() => navigate({ to: "/placement" })}
      >
        {locale === "pt" ? "Começar diagnóstico" : "Start diagnostic"}{" "}
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </Button>
    </div>
  );
}

/* ---------------- STEP 3: PLAN (CEFR result + personalized plan) ---------------- */

const PLAN_BY_LEVEL: Record<string, { pt: string[]; en: string[] }> = {
  A1: {
    pt: [
      "Fundamentos: alfabeto, saudações, números",
      "Verbo to be, artigos, plurais",
      "Vocabulário do dia-a-dia (100 palavras)",
      "Frases simples e presentes",
      "Pronúncia básica com Coach",
    ],
    en: [
      "Fundamentals: alphabet, greetings, numbers",
      "Verb to be, articles, plurals",
      "Everyday vocabulary (100 words)",
      "Simple sentences & present tense",
      "Basic pronunciation with Coach",
    ],
  },
  A2: {
    pt: [
      "Passado simples e futuro com will/going to",
      "Vocabulário de rotinas, viagens e comida",
      "Conversação básica com Coach IA",
      "Compreensão auditiva guiada",
      "Leitura de textos curtos",
    ],
    en: [
      "Past simple & future with will/going to",
      "Vocabulary: routines, travel, food",
      "Basic conversation with AI Coach",
      "Guided listening comprehension",
      "Reading short texts",
    ],
  },
  B1: {
    pt: [
      "Present perfect e condicionais 1",
      "Expressões idiomáticas comuns",
      "Debates simples com Coach IA",
      "Redação de emails e opiniões",
      "Compreensão de podcasts curtos",
    ],
    en: [
      "Present perfect & first conditional",
      "Common idiomatic expressions",
      "Simple debates with AI Coach",
      "Writing emails & opinions",
      "Understanding short podcasts",
    ],
  },
  B2: {
    pt: [
      "Condicionais avançadas e passiva",
      "Vocabulário académico e profissional",
      "Reuniões e apresentações simuladas",
      "Leitura de artigos jornalísticos",
      "Redação argumentativa",
    ],
    en: [
      "Advanced conditionals & passive voice",
      "Academic & professional vocabulary",
      "Simulated meetings & presentations",
      "Reading journalistic articles",
      "Argumentative writing",
    ],
  },
  C1: {
    pt: [
      "Nuances de estilo e registo",
      "Debate avançado com Coach IA",
      "Análise de literatura contemporânea",
      "Escrita académica e ensaios",
      "Preparação IELTS/TOEFL",
    ],
    en: [
      "Style & register nuances",
      "Advanced debate with AI Coach",
      "Contemporary literature analysis",
      "Academic writing & essays",
      "IELTS/TOEFL preparation",
    ],
  },
  C2: {
    pt: [
      "Domínio de expressões idiomáticas raras",
      "Retórica e persuasão avançada",
      "Tradução literária e técnica",
      "Debates a nível nativo",
      "Certificação C2 Proficiency",
    ],
    en: [
      "Mastery of rare idioms",
      "Advanced rhetoric & persuasion",
      "Literary & technical translation",
      "Native-level debates",
      "C2 Proficiency certification",
    ],
  },
};

function PlanStep({ user, onDone }: { user: AuthUser; onDone: () => Promise<void> }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [advancing, setAdvancing] = useState(false);
  const level = (user.cefrLevel as keyof typeof PLAN_BY_LEVEL) ?? "A1";
  const plan = PLAN_BY_LEVEL[level] ?? PLAN_BY_LEVEL.A1;

  const advance = async () => {
    setAdvancing(true);
    try {
      await apiFetch("/v1/me", {
        method: "PATCH",
        body: JSON.stringify({ onboardingStatus: "demo" }),
      });
    } catch (e) {
      setAdvancing(false);
      return notify.fromError(e, { dedupeKey: "onboarding:plan" });
    }
    setAdvancing(false);
    await onDone();
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-glow">
      <Badge
        icon={Target}
        label={locale === "pt" ? "Passos 5–6 · Nível e plano" : "Steps 5–6 · Level & plan"}
      />
      <div className="mt-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {locale === "pt" ? "O seu nível CEFR" : "Your CEFR level"}
        </div>
        <div className="text-gradient-sunset mt-2 font-display text-7xl font-bold">{level}</div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Rocket className="h-5 w-5 text-magenta" />
          {locale === "pt" ? "O seu plano personalizado" : "Your personalized plan"}
        </h2>
        <ul className="mt-4 space-y-2">
          {plan[locale].map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl border border-border bg-background/60 p-3 text-sm"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-magenta" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={advance}
        disabled={advancing}
        size="lg"
        className="bg-gradient-sunset mt-8 w-full text-white shadow-soft hover:opacity-90"
      >
        {advancing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {locale === "pt" ? "Continuar para aula demo" : "Continue to demo lesson"}{" "}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

/* ---------------- STEP 4: DEMO LESSON ---------------- */

const DEMO_CARDS = [
  { en: "Hello, nice to meet you!", pt: "Olá, prazer em conhecer!" },
  { en: "How are you today?", pt: "Como está hoje?" },
  { en: "I would like to learn English.", pt: "Gostaria de aprender inglês." },
];

function DemoStep({ onDone }: { onDone: () => Promise<void> }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  const speak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await apiFetch("/v1/me", {
        method: "PATCH",
        body: JSON.stringify({ demoCompleted: true, onboardingStatus: "checkout" }),
      });
    } catch (e) {
      setSaving(false);
      return notify.fromError(e, { dedupeKey: "onboarding:demo" });
    }
    setSaving(false);
    await onDone();
  };

  const card = DEMO_CARDS[i];
  const done = i >= DEMO_CARDS.length - 1 && revealed;

  return (
    <div className="glass rounded-3xl p-8 shadow-glow">
      <Badge
        icon={PlayCircle}
        label={locale === "pt" ? "Passo 7 · Aula de demonstração" : "Step 7 · Demo lesson"}
      />
      <h2 className="mt-4 font-display text-2xl font-bold">
        {locale === "pt" ? "Experimente uma aula" : "Try a lesson"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {locale === "pt"
          ? "Toque no cartão para ouvir e ver a tradução."
          : "Tap the card to hear and see the translation."}
      </p>

      <div className="mt-6">
        <div className="mb-3 text-xs font-semibold text-muted-foreground">
          {locale === "pt" ? "Cartão" : "Card"} {i + 1} / {DEMO_CARDS.length}
        </div>
        <button
          onClick={() => {
            setRevealed(true);
            speak(card.en);
          }}
          className="w-full rounded-3xl border-2 border-border bg-background/60 p-8 text-center transition hover:border-magenta shadow-soft"
        >
          <div className="font-display text-2xl font-bold">{card.en}</div>
          {revealed && <div className="mt-3 text-sm text-muted-foreground">{card.pt}</div>}
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-magenta">
            <BookOpen className="h-4 w-4" /> {locale === "pt" ? "Ouvir novamente" : "Play again"}
          </div>
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          disabled={i === 0}
          onClick={() => {
            setI(i - 1);
            setRevealed(false);
          }}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {locale === "pt" ? "Anterior" : "Back"}
        </Button>
        {!done ? (
          <Button
            size="lg"
            disabled={!revealed}
            className="bg-gradient-sunset text-white shadow-soft hover:opacity-90"
            onClick={() => {
              setI(i + 1);
              setRevealed(false);
            }}
          >
            {locale === "pt" ? "Próximo" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={saving}
            onClick={finish}
            className="bg-gradient-sunset text-white shadow-soft hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {locale === "pt" ? "Escolher plano" : "Choose plan"}{" "}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------------- STEP 5: CHECKOUT ---------------- */

type PlanKey = "free" | "pro" | "premium";
const PLANS: {
  key: PlanKey;
  icon: typeof Rocket;
  pt: { name: string; price: string; desc: string; features: string[] };
  en: { name: string; price: string; desc: string; features: string[] };
}[] = [
  {
    key: "free",
    icon: Rocket,
    pt: {
      name: "Grátis",
      price: "0€ / mês",
      desc: "Comece a aprender sem custo",
      features: ["3 aulas / semana", "Coach IA (limitado)", "Progresso básico"],
    },
    en: {
      name: "Free",
      price: "0€ / mo",
      desc: "Start learning at no cost",
      features: ["3 lessons / week", "AI Coach (limited)", "Basic progress"],
    },
  },
  {
    key: "pro",
    icon: Sparkles,
    pt: {
      name: "Pro",
      price: "9,99€ / mês",
      desc: "Para aprendizes sérios",
      features: [
        "Aulas ilimitadas",
        "Coach IA ilimitado",
        "Certificados CEFR",
        "Análise de pronúncia",
      ],
    },
    en: {
      name: "Pro",
      price: "9.99€ / mo",
      desc: "For serious learners",
      features: [
        "Unlimited lessons",
        "Unlimited AI Coach",
        "CEFR certificates",
        "Pronunciation analysis",
      ],
    },
  },
  {
    key: "premium",
    icon: Crown,
    pt: {
      name: "Premium",
      price: "19,99€ / mês",
      desc: "Tudo + sessões 1:1",
      features: [
        "Tudo do Pro",
        "Aulas ao vivo semanais",
        "Correções de escrita humanas",
        "Prioridade no suporte",
      ],
    },
    en: {
      name: "Premium",
      price: "19.99€ / mo",
      desc: "Everything + 1:1 sessions",
      features: [
        "Everything in Pro",
        "Weekly live classes",
        "Human writing feedback",
        "Priority support",
      ],
    },
  },
];

function CheckoutStep({ onDone }: { onDone: () => Promise<void> }) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [selected, setSelected] = useState<PlanKey>("pro");
  const [processing, setProcessing] = useState(false);

  const currentPlan = useMemo(() => PLANS.find((p) => p.key === selected)!, [selected]);

  const confirm = async () => {
    setProcessing(true);
    // Payment provider not yet integrated: mark selected plan and complete onboarding.
    // Real Stripe/Paddle checkout will replace this in a future step.
    try {
      await apiFetch("/v1/me", {
        method: "PATCH",
        body: JSON.stringify({ selectedPlan: selected, onboardingStatus: "complete" }),
      });
    } catch (e) {
      setProcessing(false);
      return notify.fromError(e, { dedupeKey: "onboarding:checkout" });
    }
    setProcessing(false);
    notify.success(locale === "pt" ? "Bem-vindo à plataforma!" : "Welcome to the platform!");
    await onDone();
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-glow">
      <Badge
        icon={CreditCard}
        label={locale === "pt" ? "Passos 8–9 · Plano & pagamento" : "Steps 8–9 · Plan & payment"}
      />
      <h2 className="mt-4 font-display text-2xl font-bold">
        {locale === "pt" ? "Escolha o seu plano" : "Choose your plan"}
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const active = selected === p.key;
          const info = p[locale];
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setSelected(p.key)}
              className={`rounded-2xl border-2 p-5 text-left transition ${
                active
                  ? "border-sunset bg-sunset/10 shadow-soft"
                  : "border-border bg-background/60 hover:border-magenta/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-magenta" />
                <div className="font-display text-lg font-bold">{info.name}</div>
              </div>
              <div className="mt-2 text-2xl font-bold text-gradient-sunset">{info.price}</div>
              <div className="text-xs text-muted-foreground">{info.desc}</div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {info.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-magenta" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {locale === "pt" ? "Selecionado" : "Selected"}
            </div>
            <div className="font-bold">
              {currentPlan[locale].name} · {currentPlan[locale].price}
            </div>
          </div>
          <Button
            size="lg"
            disabled={processing}
            onClick={confirm}
            className="bg-gradient-sunset text-white shadow-soft hover:opacity-90"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {selected === "free"
                  ? locale === "pt"
                    ? "Ativar plano grátis"
                    : "Activate free plan"
                  : locale === "pt"
                    ? "Ativar plano"
                    : "Activate plan"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        {selected !== "free" && (
          <p className="mt-3 text-xs text-muted-foreground">
            {locale === "pt"
              ? "Nota: o processamento de pagamentos será ativado em breve. Por agora, o plano será registado e poderá aceder à plataforma."
              : "Note: payment processing will be enabled soon. For now, your plan will be recorded and you can access the platform."}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Badge({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold">
      <Icon className="h-3.5 w-3.5 text-magenta" />
      {label}
    </div>
  );
}
