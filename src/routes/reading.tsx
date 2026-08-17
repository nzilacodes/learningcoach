import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Volume2,
  Mic,
  Square,
  Loader2,
  Sparkles,
  BookOpen,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { speak, startRecording, transcribe, type Recorder } from "@/lib/voice";
import { describeGetUserMediaError } from "@/lib/media-devices";
import { uploadMedia } from "@/lib/media";
import { apiFetch } from "@/lib/api/client";
import { awardActivity } from "@/lib/gamification";
import { useNotification } from "@/lib/notifications/notification-provider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { VideosSidebar, VideosMobileNav } from "@/components/videos/videos-sidebar";
import {
  HeaderActionLinks,
  MobileAvatarMenu,
  DesktopAvatarLink,
} from "@/components/mobile-avatar-menu";

export const Route = createFileRoute("/reading")({
  component: ReadingPage,
  head: () => ({
    meta: [
      { title: "Reading — Learning English with Coach" },
      {
        name: "description",
        content: "Modo Reading: texto, áudio nativo, vocabulário, pronúncia e quiz.",
      },
      { property: "og:title", content: "Reading — Coach" },
    ],
  }),
});

type Passage = {
  key: string;
  level: string;
  title: { pt: string; en: string };
  text: string;
  vocab: { word: string; ipa: string; pt: string }[];
  idiom: { pt: string; en: string; meaning: string };
  quiz: { q: string; options: string[]; answer: number }[];
};

const PASSAGES: Passage[] = [
  {
    key: "morning-routine-a2",
    level: "A2",
    title: { pt: "Rotina da manhã", en: "Morning routine" },
    text: "Every morning I wake up at seven o'clock. I drink a glass of water and open the window. The sun is bright and the birds are singing. After a quick shower, I have breakfast with my family. We usually eat toast, fruit and coffee. Then I walk to the bus stop and go to work.",
    vocab: [
      { word: "wake up", ipa: "/ˈweɪk ʌp/", pt: "acordar" },
      { word: "bright", ipa: "/braɪt/", pt: "brilhante" },
      { word: "shower", ipa: "/ˈʃaʊ.ər/", pt: "duche" },
      { word: "breakfast", ipa: "/ˈbrek.fəst/", pt: "pequeno-almoço" },
    ],
    idiom: {
      pt: "Chave para o sucesso",
      en: "The key to success",
      meaning: "Algo fundamental para alcançar o sucesso.",
    },
    quiz: [
      { q: "Que horas eu acordo?", options: ["6 horas", "7 horas", "8 horas"], answer: 1 },
      {
        q: "O que comemos ao pequeno-almoço?",
        options: ["Arroz", "Torradas e fruta", "Sopa"],
        answer: 1,
      },
      {
        q: "Como vou trabalhar?",
        options: ["De carro", "De autocarro", "De bicicleta"],
        answer: 1,
      },
    ],
  },
  {
    key: "city-park-b1",
    level: "B1",
    title: { pt: "No parque da cidade", en: "At the city park" },
    text: "On Saturday afternoons the park is full of families. Children run across the grass while their parents chat on wooden benches. Near the pond, an old man feeds the ducks with pieces of bread. A street musician plays a soft guitar melody and a few tourists stop to listen and drop coins into his open case.",
    vocab: [
      { word: "grass", ipa: "/ɡrɑːs/", pt: "relva" },
      { word: "bench", ipa: "/bentʃ/", pt: "banco" },
      { word: "pond", ipa: "/pɒnd/", pt: "lago pequeno" },
      { word: "melody", ipa: "/ˈmel.ə.di/", pt: "melodia" },
    ],
    idiom: {
      pt: "Deitar moedas",
      en: "Drop coins",
      meaning: "Contribuir com dinheiro para alguém.",
    },
    quiz: [
      {
        q: "Quando o parque está cheio?",
        options: ["Segunda de manhã", "Sábado à tarde", "Domingo à noite"],
        answer: 1,
      },
      {
        q: "Quem alimenta os patos?",
        options: ["Uma criança", "Um homem idoso", "Um turista"],
        answer: 1,
      },
      { q: "O que o músico toca?", options: ["Piano", "Guitarra", "Violino"], answer: 1 },
    ],
  },
  {
    key: "climate-change-b2",
    level: "B2",
    title: { pt: "Mudanças climáticas", en: "Climate change" },
    text: "Scientists agree that human activity is warming the planet at an unprecedented rate. Rising sea levels threaten coastal cities, while extreme weather events have become alarmingly frequent. Although governments have pledged ambitious targets, meaningful progress depends on the daily choices of individuals: how we travel, what we eat and the energy we consume at home.",
    vocab: [
      { word: "unprecedented", ipa: "/ʌnˈpres.ɪ.den.tɪd/", pt: "sem precedentes" },
      { word: "threaten", ipa: "/ˈθret.ən/", pt: "ameaçar" },
      { word: "pledge", ipa: "/pledʒ/", pt: "prometer" },
      { word: "consume", ipa: "/kənˈsjuːm/", pt: "consumir" },
    ],
    idiom: {
      pt: "Sem precedentes",
      en: "Unprecedented",
      meaning: "Algo que nunca aconteceu antes na história.",
    },
    quiz: [
      { q: "O que está a subir?", options: ["Preços", "Nível do mar", "Populações"], answer: 1 },
      {
        q: "O progresso depende de…",
        options: ["Apenas governos", "Escolhas individuais também", "Cientistas"],
        answer: 1,
      },
      {
        q: "Quão frequentes são os eventos extremos?",
        options: ["Raros", "Alarmemente frequentes", "Inalterados"],
        answer: 1,
      },
    ],
  },
];

type ReadingReport = {
  pronunciation: number;
  fluency: number;
  intonation: number;
  rhythm: number;
  clarity: number;
  pauses: number;
  overall: number;
  mispronounced: Array<{ word: string; expected_ipa: string; heard: string; tip: string }>;
  feedback: string;
  wpm: number;
  missing: string[];
};

function ReadingPage() {
  const { locale } = useLocale();
  const notify = useNotification();
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const passage = PASSAGES[idx];
  const [playing, setPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState<ReadingReport | null>(null);
  const [transcript, setTranscript] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [quizChecked, setQuizChecked] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);
  const startRef = useRef<number>(0);

  // Without this, navigating away mid-recording (e.g. switching passages)
  // leaves the getUserMedia stream open and the mic indicator lit — same
  // leak already fixed once in components/games/game-play-modal.tsx.
  useEffect(() => {
    return () => {
      recorderRef.current?.stop().catch(() => {});
    };
  }, []);

  const [history, setHistory] = useState<Array<Record<string, number | string | null>>>([]);

  useEffect(() => {
    apiFetch<Array<Record<string, number | string | null>>>(
      `/v1/me/reading-history?passageKey=${encodeURIComponent(passage.key)}`,
    )
      .then((r) => setHistory(r))
      .catch(() => setHistory([]));
  }, [passage.key, attempts]);

  const vocabWords = useMemo(() => passage.vocab.map((v) => v.word.split(" ")[0]), [passage]);

  // Switching passages must clear quiz/report state — it's keyed by question
  // index, not passage, so leftover answers/report would otherwise appear to
  // belong to the newly selected passage.
  const selectPassage = (i: number) => {
    setIdx(i);
    setQuizAnswers({});
    setQuizChecked(false);
    setReport(null);
    setTranscript("");
  };

  const handlePlay = async () => {
    try {
      setPlaying(true);
      await speak(passage.text, { accent: "uk" });
    } catch (e) {
      notify.fromError(e, { dedupeKey: "reading:play" });
    } finally {
      setPlaying(false);
    }
  };

  const handleMic = async () => {
    if (processing) return;
    if (!recording) {
      try {
        recorderRef.current = await startRecording();
        startRef.current = Date.now();
        setRecording(true);
        setReport(null);
        setTranscript("");
      } catch (e) {
        const { title, description } = describeGetUserMediaError(e, locale);
        notify.error(title, { description, dedupeKey: "reading:mic-permission" });
      }
      return;
    }
    setRecording(false);
    setProcessing(true);
    try {
      const blob = await recorderRef.current!.stop();
      recorderRef.current = null;
      const durationSeconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
      // Uploading the recording is best-effort and never blocks assessment —
      // see the identical comment in components/word-card.tsx.
      const [text, mediaAsset] = await Promise.all([
        transcribe(blob),
        uploadMedia(blob, { filename: "leitura.webm" }).catch(() => null),
      ]);
      setTranscript(text);
      const r = await apiFetch<ReadingReport>("/v1/reading/assess", {
        method: "POST",
        body: JSON.stringify({
          passageKey: passage.key,
          passage: passage.text,
          transcript: text,
          durationSeconds,
          mediaAssetId: mediaAsset?.id ?? null,
        }),
      });
      setReport(r);
      setAttempts((n) => n + 1);
      // awardActivity() already catches its own failures internally (returns
      // null rather than rejecting) — no .catch() needed here.
      awardActivity("reading", { meta: { overall: r.overall ?? 0 } });
    } catch (e) {
      notify.fromError(e, { dedupeKey: "reading:assess" });
    } finally {
      setProcessing(false);
    }
  };

  const quizScore = passage.quiz.reduce(
    (acc, q, i) => acc + (quizAnswers[i] === q.answer ? 1 : 0),
    0,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Left Sidebar */}
      <VideosSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-[var(--ink)]">Reading</h1>
          </div>
          <div className="flex items-center gap-3">
            <HeaderActionLinks />
            <MobileAvatarMenu />
            <DesktopAvatarLink />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scrollbar-hide">
          {/* Mobile: single column | Desktop: two columns */}
          <div className="px-4 md:px-6 py-6 md:py-10">
            {/* 1. Pronunciation Section — full width on both */}
            <section className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_0px_rgba(0,0,0,0.04)] border border-gray-100 mb-6 md:mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="font-display text-lg font-bold text-[var(--ink)]">Pronúncia</h2>
              </div>
              <p className="text-gray-500 mb-6 text-sm md:text-base">
                {locale === "pt"
                  ? "Repita a frase abaixo para praticar sua fluência:"
                  : "Repeat the sentence below to practice your fluency:"}
              </p>
              <div className="bg-gray-50 rounded-xl p-5 md:p-6 mb-6 md:mb-8 text-center">
                <p className="text-lg md:text-xl font-bold text-[var(--ink)] leading-relaxed mb-2">
                  "O aprendizado contínuo é a chave para o domínio de qualquer idioma."
                </p>
                <p className="text-xs md:text-sm text-gray-400 italic">
                  "Continuous learning is the key to mastering any language."
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
                <button
                  onClick={handleMic}
                  disabled={processing}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                    recording
                      ? "bg-red-500 animate-pulse scale-110"
                      : processing
                        ? "bg-gray-400"
                        : "bg-[var(--primary)] hover:scale-105"
                  }`}
                >
                  {processing ? (
                    <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin" />
                  ) : recording ? (
                    <Square className="w-6 h-6 md:w-8 md:h-8" />
                  ) : (
                    <Mic className="w-7 h-7 md:w-8 md:h-8" />
                  )}
                </button>
                <span className="text-[11px] md:text-xs font-bold text-[var(--primary)] tracking-widest uppercase">
                  {processing ? "Analisando..." : recording ? "Gravando..." : "Toque para falar"}
                </span>
              </div>
              {report && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { label: "Geral", v: report.overall },
                    { label: "Pronúncia", v: report.pronunciation },
                    { label: "Fluência", v: report.fluency },
                    { label: "Clareza", v: report.clarity },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center"
                    >
                      <div className="text-[10px] md:text-xs text-gray-400">{m.label}</div>
                      <div className="mt-1 font-display text-xl md:text-2xl font-bold text-[var(--ink)]">
                        {Math.round(m.v)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Desktop: two columns | Mobile: stacked */}
            <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* Left Column: Reading + Vocabulary */}
              <div className="flex-1 space-y-6 md:space-y-8">
                {/* 2. Reading Section */}
                <section className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="font-display text-lg font-bold text-[var(--ink)]">Leitura</h2>
                    <div className="ml-auto flex gap-1.5">
                      {PASSAGES.map((p, i) => (
                        <button
                          key={p.key}
                          onClick={() => selectPassage(i)}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                            idx === i
                              ? "bg-[var(--primary)] text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {p.level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100">
                    <h3 className="font-display text-xl font-bold mb-4 text-[var(--ink)]">
                      {passage.title.pt}
                    </h3>
                    <div className="space-y-4 text-gray-600 text-sm md:text-base leading-relaxed">
                      <p>{passage.text}</p>
                    </div>
                    <button
                      onClick={handlePlay}
                      disabled={playing}
                      className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
                    >
                      <Volume2 className="w-4 h-4" />
                      {playing ? "A reproduzir..." : "Ouvir áudio"}
                    </button>
                  </div>
                </section>

                {/* 3. Vocabulary Section */}
                <section className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                      Vocabulário
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {passage.vocab.map((v) => (
                      <div
                        key={v.word}
                        className="bg-white p-4 md:p-5 rounded-xl border border-gray-100 hover:border-[var(--primary)]/30 transition-colors"
                      >
                        <span className="text-[10px] md:text-xs font-bold text-[var(--primary)] mb-1 md:mb-2 block">
                          Palavra
                        </span>
                        <h4 className="font-bold text-base md:text-lg mb-0.5 md:mb-1">{v.word}</h4>
                        <p className="text-xs md:text-sm text-gray-500">{v.pt}</p>
                        <button
                          onClick={() => speak(v.word, { accent: "uk" }).catch(() => {})}
                          className="mt-2 text-[var(--primary)]"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {/* Idiom card */}
                    <div className="col-span-2 bg-[var(--primary)] p-4 md:p-5 rounded-xl text-white">
                      <span className="text-[10px] md:text-xs font-bold text-white/80 mb-1 md:mb-2 block">
                        Expressão Idiomática
                      </span>
                      <h4 className="font-bold text-lg md:text-xl mb-1">{passage.idiom.pt}</h4>
                      <p className="text-xs md:text-sm opacity-90">
                        "{passage.idiom.en}" - {passage.idiom.meaning}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Quiz (Compreensão) */}
              <div className="w-full lg:w-[380px] shrink-0">
                <section className="flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                    <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                      Compreensão
                    </h2>
                  </div>
                  <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-4">Teste seu entendimento do texto</p>

                    <div className="space-y-6">
                      {passage.quiz.map((q, qi) => (
                        <div key={qi}>
                          <p className="font-bold text-[var(--ink)] mb-3 text-sm md:text-base">
                            {qi + 1}. {q.q}
                          </p>
                          <div className="flex flex-col gap-2">
                            {q.options.map((opt, oi) => {
                              const chosen = quizAnswers[qi] === oi;
                              const correct = quizChecked && oi === q.answer;
                              const wrongPick = quizChecked && chosen && oi !== q.answer;
                              return (
                                <label
                                  key={oi}
                                  className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                                    wrongPick
                                      ? "border-red-400 bg-red-50"
                                      : correct
                                        ? "border-green-500 bg-green-50"
                                        : chosen
                                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                          : "border-gray-200 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`q${qi}`}
                                    checked={chosen}
                                    onChange={() => {
                                      setQuizAnswers((s) => ({ ...s, [qi]: oi }));
                                      setQuizChecked(false);
                                    }}
                                    className="w-4 h-4 text-[var(--primary)]"
                                  />
                                  {wrongPick && <XCircle className="w-4 h-4 text-red-500 ml-2" />}
                                  {correct && (
                                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                                  )}
                                  <span className="ml-3">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {quizChecked && (
                      <p
                        className={`mt-4 text-sm font-bold ${
                          quizScore === passage.quiz.length ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {quizScore === passage.quiz.length
                          ? "Correto! Muito bem!"
                          : `Acertou ${quizScore} de ${passage.quiz.length}. Tente novamente.`}
                      </p>
                    )}

                    <button
                      onClick={() => setQuizChecked(true)}
                      disabled={Object.keys(quizAnswers).length < passage.quiz.length}
                      className={`w-full mt-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        Object.keys(quizAnswers).length < passage.quiz.length
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-[var(--primary)] text-white hover:opacity-90"
                      }`}
                    >
                      Verificar Resposta
                    </button>
                  </div>
                </section>
              </div>
            </div>

            {/* Evolution Chart — full width */}
            {history.length > 1 && (
              <section className="mt-6 md:mt-8 pb-8">
                <h2 className="mb-3 font-display text-lg font-bold">Evolução</h2>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={history.map((h, i) => ({
                        i: i + 1,
                        overall: Number(h.overall ?? 0),
                        pronunciation: Number(h.pronunciation ?? 0),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="i" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="overall"
                        stroke="var(--primary)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="pronunciation"
                        stroke="#d946ef"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <VideosMobileNav />
    </div>
  );
}
