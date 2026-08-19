import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Globe,
  Cake,
  Languages,
  Heart,
  Target,
  Loader2,
  Check,
  Mail,
  GraduationCap,
} from "lucide-react";
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
import { INTEREST_OPTIONS, GOAL_OPTIONS } from "@/lib/profile-options";

function profileSchema(locale: "pt" | "en") {
  return z.object({
    fullName: z.string().min(1, locale === "pt" ? "Nome obrigatório" : "Name required"),
    age: z.coerce
      .number({ invalid_type_error: locale === "pt" ? "Idade inválida" : "Invalid age" })
      .int()
      .min(4, locale === "pt" ? "Idade inválida (4–120)" : "Invalid age (4–120)")
      .max(120, locale === "pt" ? "Idade inválida (4–120)" : "Invalid age (4–120)"),
    country: z.string(),
    nativeLang: z.string(),
    goal: z.string(),
    interests: z.array(z.string()),
  });
}
type ProfileValues = z.infer<ReturnType<typeof profileSchema>>;

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "O meu perfil — Learning English with Coach" },
      { name: "description", content: "Veja e edite os seus dados de perfil." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ProfilePage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const [saving, setSaving] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema(locale)),
    defaultValues: {
      fullName: "",
      age: undefined as unknown as number,
      country: "",
      nativeLang: "",
      goal: "",
      interests: [],
    },
  });

  // Resync the form whenever the loaded user changes (e.g. after refresh()).
  useEffect(() => {
    if (!user) return;
    form.reset({
      fullName: user.fullName ?? "",
      age: user.age ?? (undefined as unknown as number),
      country: user.country ?? "",
      nativeLang: user.nativeLanguage ?? "",
      goal: user.learningGoal ?? "",
      interests: user.interests ?? [],
    });
  }, [user, form]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
        {locale === "pt" ? "A carregar…" : "Loading…"}
      </div>
    );
  }

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
          learningGoal: values.goal || undefined,
          interests: values.interests,
        }),
      });
      await refresh();
      notify.success(locale === "pt" ? "Perfil atualizado" : "Profile updated");
    } catch (err) {
      notify.fromError(err, { dedupeKey: "profile:save" });
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
            {locale === "pt" ? "O meu perfil" : "My profile"}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 premium-shadow">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {user.email}
                </span>
                {user.cefrLevel && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" /> CEFR {user.cefrLevel}
                  </span>
                )}
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={submit}
                className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 premium-shadow"
              >
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "pt" ? "Nome completo" : "Full name"}</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <FormControl>
                          <Input autoComplete="name" className="pl-9" {...field} />
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
                          <Cake className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <FormControl>
                            <Input type="number" min={4} max={120} className="pl-9" {...field} />
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
                          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <FormControl>
                            <Input autoComplete="country-name" className="pl-9" {...field} />
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
                      <FormLabel>
                        {locale === "pt" ? "Língua materna" : "Native language"}
                      </FormLabel>
                      <div className="relative">
                        <Languages className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <FormControl>
                          <Input className="pl-9" {...field} />
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
                                  ? "border-[var(--violet)] bg-[var(--violet)]/10"
                                  : "border-gray-100 hover:border-[var(--violet)]/50"
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
                              className={`flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                                active
                                  ? "border-[var(--violet)] bg-[var(--violet)] text-white"
                                  : "border-gray-100 hover:border-[var(--violet)]/50"
                              }`}
                            >
                              {active && <Check className="h-3 w-3" />}
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
                  className="w-full bg-[var(--violet)] text-white hover:opacity-90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : locale === "pt" ? (
                    "Guardar alterações"
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}
