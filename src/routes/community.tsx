import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Users, Send, Baby, GraduationCap, User, Shield, Mic, MicOff, Lock, LogIn, Play, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

type Room = "kids" | "teens" | "adults";

const roomsMeta: Record<Room, { pt: string; en: string; range: string; icon: typeof Baby; gradient: string }> = {
  kids: { pt: "Sala Crianças", en: "Kids Room", range: "6–12", icon: Baby, gradient: "from-amber to-sunset" },
  teens: { pt: "Sala Adolescentes", en: "Teen Room", range: "13–17", icon: GraduationCap, gradient: "from-sunset to-magenta" },
  adults: { pt: "Sala Adultos", en: "Adult Room", range: "18+", icon: User, gradient: "from-magenta to-violet" },
};

function ageToRoom(age: number | null | undefined): Room {
  if (age == null) return "adults";
  if (age < 13) return "kids";
  if (age < 18) return "teens";
  return "adults";
}

type Message = { id: string; user_id: string; display_name: string; content: string; kind: string; created_at: string };

function CommunityPage() {
  const { locale } = useLocale();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // Client-side preview only — the backend computes the real room from the
  // caller's own age server-side and never trusts this for enforcement.
  const room: Room | null = user ? ageToRoom(user.age) : null;
  const displayName = user?.fullName || (user?.email?.split("@")[0] ?? "You");

  const { data } = useQuery({
    queryKey: ["community_messages", room],
    enabled: !!room && started,
    refetchInterval: 3000,
    queryFn: () => apiFetch<{ room: Room; messages: Message[] }>("/v1/community/messages"),
  });
  const messages = data?.messages ?? [];

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
      if (sent.content !== raw) showToast(locale === "pt" ? "Mensagem filtrada pela IA 💛" : "Message filtered by AI 💛");
      setInput("");
      await qc.invalidateQueries({ queryKey: ["community_messages", room] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const sendVoice = () => {
    setRecording(false);
    send("voice", locale === "pt" ? "🎙️ Mensagem de voz (0:07)" : "🎙️ Voice message (0:07)");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="p-16 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!started && room) {
    const meta = roomsMeta[room];
    const Icon = meta.icon;
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-16">
          <div className="glass rounded-3xl p-8 text-center shadow-glow">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-white shadow-soft`}>
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
                      locked ? "border-border bg-muted/40 text-muted-foreground" : "border-magenta bg-magenta/5 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      {locked ? <Lock className="h-3 w-3" /> : <RIcon className="h-3 w-3" />}
                      {locale === "pt" ? m.pt : m.en}
                    </div>
                    <div className="mt-1 text-[10px]">{m.range}</div>
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
            <p className="mt-4 text-[11px] text-muted-foreground">
              {locale === "pt"
                ? "Moderação por IA ativa. As salas são isoladas por idade — crianças nunca conversam com adultos."
                : "AI moderation active. Rooms are isolated by age — kids never chat with adults."}
            </p>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!room) return null;
  const meta = roomsMeta[room];
  const onlineCount = new Set(messages.slice(-30).map((m: any) => m.user_id)).size || 1;

  return (
    <div className="min-h-screen">
      <SiteHeader />
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
              {locale === "pt" ? `Praticando como ${displayName}.` : `Practicing as ${displayName}.`}
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
                <div className="font-display text-lg font-bold">{locale === "pt" ? meta.pt : meta.en}</div>
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
                  voiceMode ? "bg-gradient-sunset text-white" : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {voiceMode ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                {locale === "pt" ? "Voz" : "Voice"}
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.length === 0 && (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {locale === "pt" ? "Seja o primeiro a escrever 👋" : "Be the first to say hi 👋"}
                </div>
              )}
              {messages.map((m: any) => {
                const me = m.user_id === user.id;
                return (
                  <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[75%]">
                      {!me && <div className="mb-1 text-xs font-semibold text-muted-foreground">{m.display_name}</div>}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm ${
                          me ? "bg-gradient-sunset text-white shadow-soft" : "border border-border bg-background"
                        }`}
                      >
                        {m.kind === "voice" && <span className="mr-1.5">▶️</span>}
                        {m.content}
                      </div>
                      <div className={`mt-1 text-[10px] text-muted-foreground ${me ? "text-right" : ""}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                  onClick={() => (recording ? sendVoice() : setRecording(true))}
                  className={`w-full ${recording ? "bg-red-500 text-white hover:bg-red-600" : "bg-gradient-sunset text-white hover:opacity-90"}`}
                  size="lg"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {recording
                    ? locale === "pt" ? "● Gravando… toque para enviar" : "● Recording… tap to send"
                    : locale === "pt" ? "Segurar para gravar" : "Hold to record"}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={locale === "pt" ? "Escreva em inglês…" : "Type in English…"}
                  />
                  <Button aria-label={locale === "pt" ? "Enviar mensagem" : "Send message"} onClick={() => send()} disabled={!input.trim()} className="bg-gradient-sunset text-white">
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
                <li>✓ {locale === "pt" ? "Sem palavras ofensivas (filtradas pela IA)" : "No offensive language (AI-filtered)"}</li>
                <li>✓ {locale === "pt" ? "Sem partilha de dados pessoais" : "Never share personal data"}</li>
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
            <div className="text-center">
              <Link to="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                ← {locale === "pt" ? "Voltar ao painel" : "Back to dashboard"}
              </Link>
            </div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
