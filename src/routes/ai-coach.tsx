import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Mic,
  Square,
  BookOpen,
  Pencil,
  MessageSquare,
  Plus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api/client";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";
import { startRecording, transcribe, describeTranscriptionRejection, type Recorder } from "@/lib/voice";
import { describeGetUserMediaError } from "@/lib/media-devices";
import { SITE_URL } from "@/lib/site-url";
import { useNotification } from "@/lib/notifications/notification-provider";

const MAX_MESSAGE_LENGTH = 4000; // matches sendCoachMessageSchema.content.max(4000) on the backend

export const Route = createFileRoute("/ai-coach")({
  component: AICoachPage,
  head: () => ({
    meta: [
      { title: "AI Coach — Professor de inglês com IA 24/7" },
      {
        name: "description",
        content: "Converse com o AI Coach para praticar inglês em qualquer nível.",
      },
      { property: "og:title", content: "AI Coach — Professor de inglês com IA 24/7" },
      {
        property: "og:description",
        content:
          "Prática guiada de inglês com IA: gramática, pronúncia, vocabulário e conversação livre.",
      },
      { property: "og:url", content: `${SITE_URL}/ai-coach` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ai-coach` }],
  }),
});

type Conversation = { id: string; title: string | null; created_at: string; updated_at: string };
type CoachMessage = { id: string; role: "user" | "assistant"; content: string; created_at: string };

function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ["ai_conversations", userId],
    enabled: !!userId,
    queryFn: () => apiFetch<Conversation[]>("/v1/ai/conversations"),
  });
}

function useCoachMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai_messages", conversationId],
    enabled: !!conversationId,
    queryFn: () => apiFetch<CoachMessage[]>(`/v1/ai/conversations/${conversationId}/messages`),
  });
}

function AICoachPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notify = useNotification();
  const [input, setInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [projectsSidebarOpen, setProjectsSidebarOpen] = useState(true);
  const [recorder, setRecorder] = useState<Recorder | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  // Messages whose AI reply failed server-side — the user's message is still
  // safely persisted (see backend sendCoachMessage's partial-success shape),
  // so we offer a per-message retry instead of losing it or failing loudly.
  const [failedMessageIds, setFailedMessageIds] = useState<Set<string>>(new Set());
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(user?.id);
  const { data: transcript = [], isLoading: transcriptLoading } = useCoachMessages(activeId);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript.length, sending]);

  // Without this, navigating away (or switching conversations) while
  // recording leaves the getUserMedia stream open and the mic indicator lit
  // — same leak already fixed once in components/games/game-play-modal.tsx.
  // Keyed on `recorder` (not []) so the cleanup closure always sees the
  // current instance instead of the `null` captured on first render.
  useEffect(() => {
    return () => {
      recorder?.stop().catch(() => {});
    };
  }, [recorder]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    try {
      let conversationId = activeId;
      if (!conversationId) {
        const conversation = await apiFetch<Conversation>("/v1/ai/conversations", {
          method: "POST",
          body: JSON.stringify({}),
        });
        conversationId = conversation.id;
        setActiveId(conversationId);
      }
      // Always 201 now — a failed AI reply is reported as status:"failed" with
      // the user's message still persisted (see backend sendCoachMessage),
      // never thrown as an HTTP error that would make it look lost.
      const result = await apiFetch<{
        userMessage: CoachMessage;
        assistantMessage: CoachMessage | null;
        status: "ok" | "failed";
      }>(`/v1/ai/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      qc.invalidateQueries({ queryKey: ["ai_messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["ai_conversations", user?.id] });
      if (result.status === "failed") {
        setFailedMessageIds((prev) => new Set(prev).add(result.userMessage.id));
        notify.warning(
          locale === "pt"
            ? "O Coach está temporariamente indisponível"
            : "Coach is temporarily unavailable",
          {
            description:
              locale === "pt"
                ? "Não conseguimos processar a sua mensagem agora. A sua mensagem não foi perdida."
                : "We couldn't process your message right now. Your message wasn't lost.",
            dedupeKey: "ai-coach:reply-failed",
          },
        );
      }
    } catch (e) {
      setInput(content);
      notify.fromError(e, {
        dedupeKey: "ai-coach:send",
        onRetry: () => send(),
        onUpgrade: () => navigate({ to: "/pricing" }),
      });
    } finally {
      setSending(false);
    }
  };

  const retry = async (messageId: string) => {
    if (!activeId || retryingId) return;
    setRetryingId(messageId);
    try {
      const result = await apiFetch<{
        assistantMessage: CoachMessage | null;
        status: "ok" | "failed";
      }>(`/v1/ai/conversations/${activeId}/messages/${messageId}/retry`, { method: "POST" });
      qc.invalidateQueries({ queryKey: ["ai_messages", activeId] });
      if (result.status === "ok") {
        setFailedMessageIds((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
      } else {
        notify.warning(
          locale === "pt" ? "Ainda sem resposta do Coach" : "Still no reply from Coach",
          {
            description:
              locale === "pt" ? "Tente novamente em instantes." : "Please try again shortly.",
            dedupeKey: "ai-coach:retry-failed",
          },
        );
      }
    } catch (e) {
      notify.fromError(e, {
        dedupeKey: "ai-coach:retry",
        onUpgrade: () => navigate({ to: "/pricing" }),
      });
    } finally {
      setRetryingId(null);
    }
  };

  const toggleVoice = async () => {
    if (recorder) {
      setTranscribing(true);
      try {
        const blob = await recorder.stop();
        setRecorder(null);
        const text = await transcribe(blob, { language: locale });
        if (text.trim()) setInput((prev) => (prev ? `${prev} ${text}` : text));
      } catch (e) {
        const rejection = describeTranscriptionRejection(e, locale);
        if (rejection) {
          notify.warning(rejection.title, { description: rejection.description, dedupeKey: "ai-coach:no-speech" });
        } else {
          notify.fromError(e, { dedupeKey: "ai-coach:transcribe" });
        }
      } finally {
        setTranscribing(false);
      }
      return;
    }
    try {
      setRecorder(await startRecording());
    } catch (e) {
      const { title, description } = describeGetUserMediaError(e, locale);
      notify.error(title, { description, dedupeKey: "ai-coach:mic-permission" });
    }
  };

  const suggestions = [
    {
      icon: BookOpen,
      text: locale === "pt" ? "Explicar Present Perfect" : "Explain Present Perfect",
    },
    {
      icon: Mic,
      text: locale === "pt" ? "Praticar pronúncia de 'th'" : "Practice 'th' pronunciation",
    },
    { icon: Pencil, text: locale === "pt" ? "Corrigir minha redação" : "Correct my essay" },
    {
      icon: MessageSquare,
      text: locale === "pt" ? "Simular entrevista de emprego" : "Simulate a job interview",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Left Sidebar */}
      <VideosSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-[var(--ink)]">AI Coach</h1>
          </div>
          <div className="flex items-center gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center scrollbar-hide pb-20 md:pb-6">
            {!activeId ? (
              <div className="w-full max-w-[800px]">
                {/* Welcome Header */}
                <div className="text-center mb-12">
                  <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--ink)] mb-4 leading-tight">
                    {locale === "pt" ? "O que vamos aprender hoje?" : "What shall we learn today?"}
                  </h2>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                  {suggestions.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => setInput(s.text)}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-[var(--primary)]/40 cursor-pointer transition-all shadow-sm text-left group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[var(--primary)]/5 transition-colors">
                        <s.icon className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--ink)]">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[800px] flex-1 space-y-5 mb-8">
                {transcriptLoading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">
                      {locale === "pt" ? "Carregando conversa…" : "Loading conversation…"}
                    </span>
                  </div>
                ) : (
                  transcript.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-[var(--primary)] text-white"
                            : "bg-gray-50 border border-gray-100 text-[var(--ink)]"
                        }`}
                      >
                        {m.content}
                      </div>
                      {m.role === "user" && failedMessageIds.has(m.id) && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-amber-600">
                          <span>
                            {locale === "pt" ? "Sem resposta do Coach." : "No reply from Coach."}
                          </span>
                          <button
                            type="button"
                            onClick={() => retry(m.id)}
                            disabled={retryingId === m.id}
                            className="font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-50"
                          >
                            {retryingId === m.id
                              ? locale === "pt"
                                ? "A tentar…"
                                : "Retrying…"
                              : locale === "pt"
                                ? "Tentar novamente"
                                : "Try again"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-2.5 bg-gray-50 border border-gray-100 flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Coach</span>
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* Chat Input */}
            <div className="w-full max-w-[800px] mx-auto">
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-[var(--primary)]/20 transition-all overflow-hidden">
                <div className="flex items-start px-4 pt-4 pb-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    maxLength={MAX_MESSAGE_LENGTH}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={
                      transcribing
                        ? locale === "pt"
                          ? "Transcrevendo áudio…"
                          : "Transcribing audio…"
                        : locale === "pt"
                          ? "Digite sua pergunta..."
                          : "Ask anything..."
                    }
                    disabled={transcribing}
                    rows={1}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm text-[var(--ink)] placeholder:text-muted-foreground max-h-40 outline-none"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !input.trim()}
                    className="ml-2 p-2 text-muted-foreground hover:text-[var(--primary)] transition-colors shrink-0 disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/30 border-t border-gray-100/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleVoice}
                      disabled={transcribing}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                        recorder
                          ? "bg-red-50 border-red-200 text-red-600"
                          : "bg-white border-gray-200/50 hover:bg-gray-50 text-muted-foreground"
                      }`}
                    >
                      {recorder ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                      <span className="text-2xs font-medium">
                        {recorder
                          ? locale === "pt"
                            ? "Parar"
                            : "Stop"
                          : locale === "pt"
                            ? "Mensagem de voz"
                            : "Voice Message"}
                      </span>
                    </button>
                  </div>
                  <div className="text-2xs font-medium text-muted-foreground">
                    {input.length} / {MAX_MESSAGE_LENGTH.toLocaleString()}
                  </div>
                </div>
              </div>
              <p className="text-2xs text-center mt-3 text-muted-foreground">
                {locale === "pt"
                  ? "O Coach pode gerar informações imprecisas."
                  : "Coach may generate inaccurate information."}
              </p>
            </div>
          </main>

          {/* Right Sidebar - Projects */}
          {projectsSidebarOpen && (
            <aside className="hidden lg:flex w-[320px] shrink-0 bg-white border-l border-gray-100 flex-col">
              {/* Projects Header */}
              <div className="p-6 flex items-center">
                <button
                  onClick={() => setProjectsSidebarOpen(false)}
                  className="p-1 hover:bg-gray-50 rounded-md transition-colors text-muted-foreground mr-2"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-display text-lg font-semibold text-[var(--ink)]">
                    {locale === "pt" ? "Conversas" : "Conversations"}
                  </span>
                  <span className="text-muted-foreground text-sm">({conversations.length})</span>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollbar-hide">
                {/* New Conversation Button */}
                <button
                  onClick={() => setActiveId(null)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all text-left"
                >
                  <Plus className="w-5 h-5 text-[var(--primary)]" />
                  <div className="text-sm font-bold text-[var(--ink)]">
                    {locale === "pt" ? "Nova conversa" : "New conversation"}
                  </div>
                </button>

                {/* Conversation Cards */}
                {conversations.map((conversation) => {
                  const active = conversation.id === activeId;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setActiveId(conversation.id)}
                      className={`w-full text-left p-4 rounded-xl bg-white border hover:border-[var(--primary)]/40 cursor-pointer transition-all shadow-sm ${
                        active ? "border-[var(--primary)]" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-[var(--ink)] truncate pr-4">
                          {conversation.title ||
                            (locale === "pt" ? "Nova conversa" : "New conversation")}
                        </h4>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 mt-1 ${active ? "bg-[var(--primary)]" : "bg-gray-200"}`}
                        />
                      </div>
                      <p className="text-[12px] text-muted-foreground">
                        {new Date(conversation.updated_at).toLocaleDateString(
                          locale === "pt" ? "pt-PT" : "en-US",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </button>
                  );
                })}
                {conversationsLoading && conversations.length === 0 && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!conversationsLoading && conversations.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    {locale === "pt" ? "Nenhuma conversa ainda." : "No conversations yet."}
                  </p>
                )}
              </div>
            </aside>
          )}

          {/* Collapsed Projects toggle */}
          {!projectsSidebarOpen && (
            <button
              onClick={() => setProjectsSidebarOpen(true)}
              className="hidden lg:flex items-center justify-center w-10 shrink-0 border-l border-gray-100 hover:bg-gray-50 transition-colors text-muted-foreground"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <VideosMobileNav />
    </div>
  );
}
