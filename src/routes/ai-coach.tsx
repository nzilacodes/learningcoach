import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Mic,
  BookOpen,
  Pencil,
  MessageSquare,
  Zap,
  HelpCircle,
  Gift,
  User,
  Settings,
  LogOut,
  Plus,
  ArrowRight,
  ChevronRight,
  Paperclip,
  Compass,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import { SITE_URL } from "@/lib/site-url";

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

type Msg = { role: "user" | "coach"; text: string };

const MOCK_PROJECTS = [
  {
    id: "1",
    title: "Learning From 100 Years o...",
    desc: "For athletes, high altitude prod...",
    active: true,
  },
  { id: "2", title: "Research officiants", desc: "Maxwell's equations—the foun...", active: true },
  {
    id: "3",
    title: "What does a senior lead de...",
    desc: "Physiological respiration involv...",
    active: true,
  },
  {
    id: "4",
    title: "Write a sweet note to your...",
    desc: "In the eighteenth century the G...",
    active: true,
  },
  {
    id: "5",
    title: "Meet with cake bakers",
    desc: "Physical space is often conceiv...",
    active: true,
  },
  { id: "6", title: "Archive Project Alpha", desc: "Completed marketing assets...", active: false },
];

function AICoachPage() {
  const { locale } = useLocale();
  const { user, signOut } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "coach",
      text:
        locale === "pt"
          ? "Olá! 👋 Sou seu Coach. Sobre o que quer praticar hoje?"
          : "Hi! 👋 I'm your Coach. What would you like to practice today?",
    },
  ]);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [projectsSidebarOpen, setProjectsSidebarOpen] = useState(true);
  const avatarRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text:
            locale === "pt"
              ? "Ótima pergunta! Vou explicar com um exemplo simples. Em inglês, usamos o Present Perfect para conectar o passado com o agora. Quer praticar com 3 frases?"
              : "Great question! Let me explain with a simple example. We use the Present Perfect to connect past and present. Want to practice with 3 sentences?",
        },
      ]);
    }, 700);
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
            {/* Upgrade button */}
            <button className="bg-[var(--ink)] text-white px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold hover:opacity-90 transition-opacity">
              <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
              Upgrade
            </button>
            {/* Help */}
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            {/* Gift */}
            <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
              <Gift className="w-5 h-5" />
            </button>
            {/* Avatar — mobile dropdown */}
            <div className="relative md:hidden" ref={avatarRef}>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setAvatarMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 py-2 dropdown-enter premium-shadow">
                    <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                      <User className="w-4 h-4 text-(--violet)" />
                      {locale === "pt" ? "Ver perfil" : "View profile"}
                    </button>
                    <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-colors w-full text-left">
                      <Settings className="w-4 h-4 text-gray-400" />
                      {locale === "pt" ? "Definições" : "Settings"}
                    </button>
                    <div className="mx-3 my-1 h-px bg-gray-50" />
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs font-bold text-red-400 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      {locale === "pt" ? "Sair da conta" : "Sign out"}
                    </button>
                  </div>
                </>
              )}
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="relative w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <User className="w-4 h-4 text-gray-600" />
                <span className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </button>
            </div>
            {/* Avatar — desktop */}
            <div className="hidden md:block">
              <div className="relative inline-flex">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center scrollbar-hide pb-20 md:pb-6">
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

            {/* Chat Input */}
            <div className="w-full max-w-[800px] mx-auto">
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-[var(--primary)]/20 transition-all overflow-hidden">
                <div className="flex items-start px-4 pt-4 pb-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
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
                    placeholder={locale === "pt" ? "Digite sua pergunta..." : "Ask anything..."}
                    rows={1}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm text-[var(--ink)] placeholder:text-gray-400 max-h-40 outline-none"
                  />
                  <button
                    onClick={send}
                    className="ml-2 p-2 text-gray-400 hover:text-[var(--primary)] transition-colors shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/30 border-t border-gray-100/50">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200/50 hover:bg-gray-50 transition-colors">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-[11px] font-medium text-gray-500">Attach</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200/50 hover:bg-gray-50 transition-colors">
                      <Mic className="w-4 h-4 text-gray-500" />
                      <span className="text-[11px] font-medium text-gray-500">Voice Message</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200/50 hover:bg-gray-50 transition-colors">
                      <Compass className="w-4 h-4 text-gray-500" />
                      <span className="text-[11px] font-medium text-gray-500">Browse Prompts</span>
                    </button>
                  </div>
                  <div className="text-[11px] font-medium text-gray-400">
                    {input.length} / 3,000
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-center mt-3 text-gray-400">
                {locale === "pt"
                  ? "O Coach pode gerar informações imprecisas. Modelo: Script AI v1.3"
                  : "Coach may generate inaccurate information. Model: Script AI v1.3"}
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
                  className="p-1 hover:bg-gray-50 rounded-md transition-colors text-gray-500 mr-2"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-display text-lg font-semibold text-[var(--ink)]">
                    Projects
                  </span>
                  <span className="text-gray-400 text-sm">({MOCK_PROJECTS.length})</span>
                </div>
                <button className="p-1 hover:bg-gray-50 rounded-md transition-colors text-gray-500">
                  <span className="text-lg">⋯</span>
                </button>
              </div>

              {/* Projects List */}
              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollbar-hide">
                {/* New Project Button */}
                <button className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all text-left">
                  <Plus className="w-5 h-5 text-[var(--primary)]" />
                  <div>
                    <div className="text-sm font-bold text-[var(--ink)]">New Project</div>
                    <div className="text-[12px] text-gray-400">—</div>
                  </div>
                </button>

                {/* Project Cards */}
                {MOCK_PROJECTS.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-xl bg-white border border-gray-200 hover:border-[var(--primary)]/40 cursor-pointer transition-all shadow-sm ${
                      !project.active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-[var(--ink)] truncate pr-4">
                        {project.title}
                      </h4>
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                          project.active ? "bg-[var(--primary)]/20" : "bg-gray-200"
                        }`}
                      />
                    </div>
                    <p className="text-[12px] text-gray-500 line-clamp-1">{project.desc}</p>
                  </div>
                ))}
              </div>

              {/* Ver Todos */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline">
                  {locale === "pt" ? "Ver Todos os Projectos" : "View All Projects"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </aside>
          )}

          {/* Collapsed Projects toggle */}
          {!projectsSidebarOpen && (
            <button
              onClick={() => setProjectsSidebarOpen(true)}
              className="hidden lg:flex items-center justify-center w-10 shrink-0 border-l border-gray-100 hover:bg-gray-50 transition-colors text-gray-500"
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
