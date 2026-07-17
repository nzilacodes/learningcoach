import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles, Mic, BookOpen, Pencil, MessageSquare, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";

export const Route = createFileRoute("/ai-coach")({
  component: AICoachPage,
  head: () => ({
    meta: [
      { title: "AI Coach — Professor de inglês com IA 24/7" },
      {
        name: "description",
        content:
          "Converse com o AI Coach para praticar inglês em qualquer nível. Correção instantânea de gramática, pronúncia e vocabulário.",
      },
      { property: "og:title", content: "AI Coach — Professor de inglês com IA 24/7" },
      {
        property: "og:description",
        content:
          "Prática guiada de inglês com IA: gramática, pronúncia, vocabulário e conversação livre.",
      },
      { property: "og:url", content: "https://coach-speak-bright.lovable.app/ai-coach" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://coach-speak-bright.lovable.app/ai-coach" }],
  }),
});

type Msg = { role: "user" | "coach"; text: string };

function AICoachPage() {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "coach",
      text:
        locale === "pt"
          ? "Olá, Maria! 👋 Sou seu Coach. Sobre o que quer praticar hoje — gramática, pronúncia, vocabulário ou uma conversa livre?"
          : "Hi Maria! 👋 I'm your Coach. What would you like to practice today — grammar, pronunciation, vocabulary or free conversation?",
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text:
            locale === "pt"
              ? "Ótima pergunta! Vou explicar com um exemplo simples. Em inglês, usamos o Present Perfect (\"have + past participle\") para conectar o passado com o agora. Ex.: \"I have studied English for 3 years.\" Quer praticar com 3 frases?"
              : "Great question! Let me explain with a simple example. We use the Present Perfect (\"have + past participle\") to connect past and present. Ex.: \"I have studied English for 3 years.\" Want to practice with 3 sentences?",
        },
      ]);
    }, 700);
  };

  const suggestions = [
    { icon: BookOpen, pt: "Explicar Present Perfect", en: "Explain Present Perfect" },
    { icon: Mic, pt: "Praticar pronúncia de 'th'", en: "Practice 'th' pronunciation" },
    { icon: Pencil, pt: "Corrigir minha redação", en: "Correct my essay" },
    { icon: MessageSquare, pt: "Simular entrevista de emprego", en: "Simulate a job interview" },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-aurora flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">AI Coach</h1>
            <div className="text-sm text-muted-foreground">
              {locale === "pt"
                ? "Seu tutor pessoal 24/7 — gramática, pronúncia, escrita e conversação"
                : "Your personal 24/7 tutor — grammar, pronunciation, writing and conversation"}
            </div>
          </div>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <div className="glass rounded-full px-3 py-1.5 text-xs font-bold">
              <Zap className="mr-1 inline h-3 w-3 text-amber" />
              {locale === "pt" ? "Ilimitado" : "Unlimited"}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_260px]">
          {/* Chat */}
          <div className="glass flex h-[560px] flex-col overflow-hidden rounded-3xl shadow-card">
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-sunset text-white shadow-soft"
                        : "bg-background border border-border"
                    }`}
                  >
                    {m.role === "coach" && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet">
                        <Sparkles className="h-3 w-3" /> Coach
                      </div>
                    )}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border bg-background/60 p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={locale === "pt" ? "Digite sua pergunta..." : "Ask anything..."}
                  className="flex-1"
                />
                <Button aria-label={locale === "pt" ? "Enviar mensagem ao Coach" : "Send message to Coach"} onClick={send} className="bg-gradient-sunset text-white shadow-soft hover:opacity-90">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <aside className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {locale === "pt" ? "Sugestões rápidas" : "Quick prompts"}
            </div>
            {suggestions.map((s) => (
              <button
                key={s.en}
                onClick={() => setInput(locale === "pt" ? s.pt : s.en)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-magenta/40 hover:shadow-soft"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-magenta/10 text-magenta">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold">{locale === "pt" ? s.pt : s.en}</div>
              </button>
            ))}
          </aside>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
