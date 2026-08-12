import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Globe, Cake, Languages, Heart, Target, Loader2, Check, Mail, GraduationCap } from "lucide-react";
import { useNotification } from "@/lib/notifications/notification-provider";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { INTEREST_OPTIONS, GOAL_OPTIONS } from "@/lib/profile-options";

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

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [nativeLang, setNativeLang] = useState("");
  const [goal, setGoal] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Resync local fields whenever the loaded user changes (e.g. after refresh()).
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setAge(user.age?.toString() ?? "");
    setCountry(user.country ?? "");
    setNativeLang(user.nativeLanguage ?? "");
    setGoal(user.learningGoal ?? "");
    setInterests(user.interests ?? []);
  }, [user]);

  const toggleInterest = (id: string) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {locale === "pt" ? "A carregar…" : "Loading…"}
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    if (!fullName.trim()) return notify.warning(locale === "pt" ? "Nome obrigatório" : "Name required");
    if (!Number.isFinite(ageNum) || ageNum < 4 || ageNum > 120)
      return notify.warning(locale === "pt" ? "Idade inválida (4–120)" : "Invalid age (4–120)");

    setSaving(true);
    try {
      await apiFetch("/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: fullName.trim(),
          age: ageNum,
          country: country.trim(),
          nativeLanguage: nativeLang.trim(),
          learningGoal: goal || undefined,
          interests,
        }),
      });
      await refresh();
      notify.success(locale === "pt" ? "Perfil atualizado" : "Profile updated");
    } catch (err) {
      notify.fromError(err, { dedupeKey: "profile:save" });
    } finally {
      setSaving(false);
    }
  };

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

            <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 premium-shadow">
              <FieldRow icon={User} label={locale === "pt" ? "Nome completo" : "Full name"}>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" />
              </FieldRow>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow icon={Cake} label={locale === "pt" ? "Idade" : "Age"}>
                  <Input required type="number" min={4} max={120} value={age} onChange={(e) => setAge(e.target.value)} className="pl-9" />
                </FieldRow>
                <FieldRow icon={Globe} label={locale === "pt" ? "País" : "Country"}>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} className="pl-9" />
                </FieldRow>
              </div>

              <FieldRow icon={Languages} label={locale === "pt" ? "Língua materna" : "Native language"}>
                <Input value={nativeLang} onChange={(e) => setNativeLang(e.target.value)} className="pl-9" />
              </FieldRow>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Target className="h-4 w-4" /> {locale === "pt" ? "Objetivo principal" : "Main goal"}</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GOAL_OPTIONS.map((g) => {
                    const active = goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoal(g.id)}
                        className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${
                          active ? "border-[var(--violet)] bg-[var(--violet)]/10" : "border-gray-100 hover:border-[var(--violet)]/50"
                        }`}
                      >
                        {locale === "pt" ? g.pt : g.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Heart className="h-4 w-4" /> {locale === "pt" ? "Interesses" : "Interests"}</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((i) => {
                    const active = interests.includes(i.id);
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => toggleInterest(i.id)}
                        className={`flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition ${
                          active ? "border-[var(--violet)] bg-[var(--violet)] text-white" : "border-gray-100 hover:border-[var(--violet)]/50"
                        }`}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {locale === "pt" ? i.pt : i.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" size="lg" disabled={saving} className="w-full bg-[var(--violet)] text-white hover:opacity-90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : locale === "pt" ? "Guardar alterações" : "Save changes"}
              </Button>
            </form>
          </div>
        </main>
      </div>
      <VideosMobileNav />
    </div>
  );
}

function FieldRow({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        {children}
      </div>
    </div>
  );
}
