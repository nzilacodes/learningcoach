import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Users,
  Send,
  Baby,
  GraduationCap,
  User,
  Shield,
  Mic,
  MicOff,
  Lock,
  Play,
  AlertTriangle,
  Flag,
  UserX,
} from "lucide-react";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { ageToRoom, type AgeTheme } from "@/lib/age-theme";
import { startRecording, transcribe, describeTranscriptionRejection, type Recorder } from "@/lib/voice";
import { describeGetUserMediaError } from "@/lib/media-devices";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotification } from "@/lib/notifications/notification-provider";
import { SITE_URL } from "@/lib/site-url";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
  head: () => ({
    meta: [
      { title: "Sala de conversa — Learning English with Coach" },
      {
        name: "description",
        content:
          "Pratique inglês em salas moderadas por IA, separadas por faixa etária: crianças (6–12), adolescentes (13–17) e adultos.",
      },
      { property: "og:title", content: "Sala de conversa — Learning English with Coach" },
      {
        property: "og:description",
        content:
          "Salas de prática de inglês isoladas por idade, com moderação por IA e ambiente seguro.",
      },
      { property: "og:url", content: `${SITE_URL}/community` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/community` }],
  }),
});

type Room = AgeTheme;

const roomsMeta: Record<
  Room,
  { pt: string; en: string; range: string; icon: typeof Baby; gradient: string }
> = {
  kids: {
    pt: "Sala Crianças",
    en: "Kids Room",
    range: "6–12",
    icon: Baby,
    gradient: "from-amber to-sunset",
  },
  teens: {
    pt: "Sala Adolescentes",
    en: "Teen Room",
    range: "13–17",
    icon: GraduationCap,
    gradient: "from-sunset to-magenta",
  },
  adults: {
    pt: "Sala Adultos",
    en: "Adult Room",
    range: "18+",
    icon: User,
    gradient: "from-magenta to-violet",
  },
};

type Message = {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  kind: string;
  created_at: string;
};

// Same app-shell wrapper as the rest of the authenticated app (curriculum,
// games, rewards, etc.) — community was still on the marketing SiteHeader,
// one of the un-reclassified SiteHeader pages the NAV-1 audit flagged.
function CommunityShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <VideosSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-display text-xl font-bold text-[var(--ink)] truncate">
              Comunidade
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">{children}</main>
      </div>
      <VideosMobileNav />
    </div>
  );
}

function CommunityPage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<Recorder | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // Client-side preview only — the backend computes the real room from the
  // caller's own age server-side and never trusts this for enforcement.
  const room: Room | null = user ? ageToRoom(user.age) : null;
  const displayName = user?.fullName || (user?.email?.split("@")[0] ?? "You");

  // Incremental polling (PERF-01): after the first snapshot, each 3s poll
  // only asks the server for messages created after the last one we've
  // seen, instead of re-fetching (and re-transferring) the same up-to-200-row
  // snapshot every time. sinceRef lives outside React Query's cache on
  // purpose — it must survive between polls without itself triggering one.
  const [messages, setMessages] = useState<Message[]>([]);
  const sinceRef = useRef<string | null>(null);

  useEffect(() => {
    setMessages([]);
    sinceRef.current = null;
  }, [room]);

  const { isError, refetch } = useQuery({
    queryKey: ["community_messages", room],
    enabled: !!room && started,
    refetchInterval: 3000,
    queryFn: async () => {
      const since = sinceRef.current;
      const qs = since ? `?since=${encodeURIComponent(since)}` : "";
      const res = await apiFetch<{ room: Room; messages: Message[] }>(
        `/v1/community/messages${qs}`,
      );
      if (res.messages.length > 0) {
        sinceRef.current = res.messages[res.messages.length - 1]!.created_at;
        setMessages((prev) => (since ? [...prev, ...res.messages] : res.messages));
      } else if (!since) {
        setMessages([]);
      }
      return res;
    },
  });

  const { data: blockedUsers = [], refetch: refetchBlocked } = useQuery({
    queryKey: ["community_blocked"],
    enabled: !!user && started,
    queryFn: () => apiFetch<{ id: string; display_name: string }[]>("/v1/community/blocked"),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const send = async (kind: "text" | "voice" = "text", contentOverride?: string) => {
    if (!user || !room) return;
    const raw = contentOverride ?? input.trim();
    if (!raw) return;
    try {
      const sent = await apiFetch<Message>("/v1/community/messages", {
        method: "POST",
        body: JSON.stringify({ content: raw, kind }),
      });
      if (sent.content !== raw)
        showToast(locale === "pt" ? "Mensagem filtrada pela IA 💛" : "Message filtered by AI 💛");
      setInput("");
      await qc.invalidateQueries({ queryKey: ["community_messages", room] });
    } catch (e) {
      notify.fromError(e, { dedupeKey: "community:send" });
    }
  };

  const reportMessage = async (messageId: string) => {
    const reason = window.prompt(
      locale === "pt" ? "Motivo da denúncia (opcional):" : "Reason for reporting (optional):",
    );
    if (reason === null) return;
    try {
      await apiFetch(`/v1/community/messages/${messageId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      notify.success(locale === "pt" ? "Denúncia enviada. Obrigado." : "Report sent. Thank you.");
    } catch (e) {
      notify.fromError(e, { dedupeKey: "community:report" });
    }
  };

  const blockUser = async (targetUserId: string, targetName: string) => {
    const ok = window.confirm(
      locale === "pt"
        ? `Bloquear ${targetName}? Deixarás de ver mensagens desta pessoa nesta sala.`
        : `Block ${targetName}? You'll stop seeing this person's messages in this room.`,
    );
    if (!ok) return;
    try {
      await apiFetch(`/v1/community/users/${targetUserId}/block`, { method: "POST" });
      // Full re-snapshot, not an incremental poll — a block must also purge
      // that user's messages already sitting in local state, which a
      // since-cursor fetch would never touch (it only ever adds new rows).
      sinceRef.current = null;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["community_messages", room] }),
        refetchBlocked(),
      ]);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "community:block" });
    }
  };

  const unblockUser = async (targetUserId: string) => {
    try {
      await apiFetch(`/v1/community/users/${targetUserId}/block`, { method: "DELETE" });
      sinceRef.current = null;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["community_messages", room] }),
        refetchBlocked(),
      ]);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "community:unblock" });
    }
  };

  const startVoiceRecording = async () => {
    try {
      recorderRef.current = await startRecording();
      setRecording(true);
    } catch (e) {
      const { title, description } = describeGetUserMediaError(e, locale);
      notify.error(title, { description, dedupeKey: "community:mic-permission" });
    }
  };

  const sendVoice = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    if (!recorder) return;
    setTranscribing(true);
    try {
      const blob = await recorder.stop();
      const text = (await transcribe(blob, { language: locale })).trim();
      if (text) {
        await send("voice", text);
      } else {
        notify.warning(locale === "pt" ? "Não entendi o áudio" : "Couldn't hear that", {
          description: locale === "pt" ? "Tente novamente." : "Please try again.",
          dedupeKey: "community:no-speech",
        });
      }
    } catch (e) {
      const rejection = describeTranscriptionRejection(e, locale);
      if (rejection) {
        notify.warning(rejection.title, { description: rejection.description, dedupeKey: "community:no-speech" });
      } else {
        notify.fromError(e, { dedupeKey: "community:transcribe" });
      }
    } finally {
      setTranscribing(false);
    }
  };

  if (loading || !user) {
    return (
      <CommunityShell>
        <div className="p-16 text-center text-muted-foreground">Loading…</div>
      </CommunityShell>
    );
  }

  if (!started && room) {
    const meta = roomsMeta[room];
    const Icon = meta.icon;
    return (
      <CommunityShell>
        <div className="mx-auto max-w-lg px-6 py-16">
          <div className="glass rounded-3xl p-8 text-center shadow-glow">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white shadow-soft`}
            >
              <Icon className="h-7 w-7" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold">
              {locale === "pt" ? `Bem-vindo(a), ${displayName}!` : `Welcome, ${displayName}!`}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "pt"
                ? `Você entra na ${meta.pt} (${meta.range} anos).`
                : `You'll join the ${meta.en} (ages ${meta.range}).`}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 text-left">
              {(Object.keys(roomsMeta) as Room[]).map((r) => {
                const m = roomsMeta[r];
                const locked = r !== room;
                const RIcon = m.icon;
                return (
                  <div
                    key={r}
                    className={`rounded-xl border p-3 text-xs ${
                      locked
                        ? "border-border bg-muted/40 text-muted-foreground"
                        : "border-magenta bg-magenta/5 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      {locked ? <Lock className="h-3 w-3" /> : <RIcon className="h-3 w-3" />}
                      {locale === "pt" ? m.pt : m.en}
                    </div>
                    <div className="mt-1 text-2xs">{m.range}</div>
                  </div>
                );
              })}
            </div>

            {user.age == null && (
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber/10 p-3 text-left text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                <span>
                  {locale === "pt"
                    ? "Idade não definida no perfil — assumindo Adulto. Atualize o perfil para entrar noutra sala."
                    : "No age set in your profile — defaulting to Adult. Update your profile to join another room."}
                </span>
              </div>
            )}

            <Button
              onClick={() => setStarted(true)}
              size="lg"
              className="mt-6 w-full bg-gradient-sunset text-white shadow-soft hover:opacity-90"
            >
              <Play className="mr-1.5 h-4 w-4" />
              {locale === "pt" ? "Iniciar Conversa" : "Start Conversation"}
            </Button>
            <p className="mt-4 text-2xs text-muted-foreground">
              {locale === "pt"
                ? "Moderação por IA ativa. As salas são isoladas por idade — crianças nunca conversam com adultos."
                : "AI moderation active. Rooms are isolated by age — kids never chat with adults."}
            </p>
          </div>
        </div>
      </CommunityShell>
    );
  }

  if (!room) return null;
  const meta = roomsMeta[room];
  const onlineCount = new Set(messages.slice(-30).map((m) => m.user_id)).size || 1;

  return (
    <CommunityShell>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet">
              <Users className="h-3.5 w-3.5" /> {locale === "pt" ? meta.pt : meta.en} · {meta.range}
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold">
              {locale === "pt" ? "Sala de Prática" : "Practice Room"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {locale === "pt"
                ? `Praticando como ${displayName}.`
                : `Practicing as ${displayName}.`}
            </p>
          </div>
          <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            {locale === "pt" ? "Moderação por IA ativa" : "AI moderation active"}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="glass flex h-[600px] flex-col overflow-hidden rounded-3xl shadow-card">
            <div className="flex items-center justify-between border-b border-border bg-background/60 px-6 py-4">
              <div>
                <div className="font-display text-lg font-bold">
                  {locale === "pt" ? meta.pt : meta.en}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {onlineCount} {locale === "pt" ? "recentes" : "recent"}
                </div>
              </div>
              <button
                onClick={() => setVoiceMode((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  voiceMode
                    ? "bg-gradient-sunset text-white"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {voiceMode ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                {locale === "pt" ? "Voz" : "Voice"}
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {isError && (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  <p>
                    {locale === "pt"
                      ? "Não foi possível carregar as mensagens."
                      : "Couldn't load messages."}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                    {locale === "pt" ? "Tentar novamente" : "Try again"}
                  </Button>
                </div>
              )}
              {!isError && messages.length === 0 && (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {locale === "pt" ? "Seja o primeiro a escrever 👋" : "Be the first to say hi 👋"}
                </div>
              )}
              {messages.map((m) => {
                const me = m.user_id === user.id;
                return (
                  <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[75%]">
                      {!me && (
                        <div className="mb-1 text-xs font-semibold text-muted-foreground">
                          {m.display_name}
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          me
                            ? "bg-gradient-sunset text-white shadow-soft"
                            : "border border-border bg-background"
                        }`}
                      >
                        {m.kind === "voice" && <span className="mr-1.5">▶️</span>}
                        {m.content}
                      </div>
                      <div
                        className={`mt-1 flex items-center gap-2 text-2xs text-muted-foreground ${me ? "justify-end" : ""}`}
                      >
                        <span>
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!me && (
                          <>
                            <button
                              onClick={() => reportMessage(m.id)}
                              className="hover:text-foreground"
                              aria-label={locale === "pt" ? "Denunciar mensagem" : "Report message"}
                              title={locale === "pt" ? "Denunciar" : "Report"}
                            >
                              <Flag className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => blockUser(m.user_id, m.display_name)}
                              className="hover:text-destructive"
                              aria-label={locale === "pt" ? "Bloquear utilizador" : "Block user"}
                              title={locale === "pt" ? "Bloquear" : "Block"}
                            >
                              <UserX className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-border bg-background/60 p-4">
              {toastMsg && (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {toastMsg}
                </div>
              )}
              {voiceMode ? (
                <Button
                  onClick={() => (recording ? sendVoice() : startVoiceRecording())}
                  disabled={transcribing}
                  className={`w-full ${recording ? "bg-red-500 text-white hover:bg-red-600" : "bg-gradient-sunset text-white hover:opacity-90"}`}
                  size="lg"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {transcribing
                    ? locale === "pt"
                      ? "Transcrevendo…"
                      : "Transcribing…"
                    : recording
                      ? locale === "pt"
                        ? "● Gravando… toque para enviar"
                        : "● Recording… tap to send"
                      : locale === "pt"
                        ? "Toque para gravar"
                        : "Tap to record"}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={locale === "pt" ? "Escreva em inglês…" : "Type in English…"}
                  />
                  <Button
                    aria-label={locale === "pt" ? "Enviar mensagem" : "Send message"}
                    onClick={() => send()}
                    disabled={!input.trim()}
                    className="bg-gradient-sunset text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-3xl p-6 shadow-card">
              <h3 className="font-display font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-magenta" />
                {locale === "pt" ? "Regras da sala" : "Room rules"}
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>✓ {locale === "pt" ? "Fale sempre em inglês" : "Speak in English"}</li>
                <li>✓ {locale === "pt" ? "Respeito e gentileza" : "Be kind and respectful"}</li>
                <li>
                  ✓{" "}
                  {locale === "pt"
                    ? "Sem palavras ofensivas (filtradas pela IA)"
                    : "No offensive language (AI-filtered)"}
                </li>
                <li>
                  ✓{" "}
                  {locale === "pt" ? "Sem partilha de dados pessoais" : "Never share personal data"}
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold">
                <Shield className="h-3.5 w-3.5" />
                {locale === "pt" ? "Sala isolada por idade" : "Age-isolated room"}
              </div>
              <p className="mt-1.5">
                {locale === "pt"
                  ? "Você só vê e envia mensagens para a sua faixa etária."
                  : "You only see and send messages within your age group."}
              </p>
            </div>
            {blockedUsers.length > 0 && (
              <div className="glass rounded-3xl p-6 shadow-card">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  {locale === "pt" ? "Bloqueados" : "Blocked"}
                </h3>
                <ul className="mt-3 space-y-2">
                  {blockedUsers.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-muted-foreground">{b.display_name}</span>
                      <button
                        onClick={() => unblockUser(b.id)}
                        className="shrink-0 font-semibold text-magenta hover:underline"
                      >
                        {locale === "pt" ? "Desbloquear" : "Unblock"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-center">
              <Link
                to="/dashboard"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ← {locale === "pt" ? "Voltar ao painel" : "Back to dashboard"}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </CommunityShell>
  );
}
