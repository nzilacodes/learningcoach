import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Volume2, Mic, Square, Loader2, Sparkles, RotateCcw, BookOpen, Gauge } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { speak, startRecording, transcribe, type Recorder } from "@/lib/voice";
import { assessReading, getReadingHistory } from "@/lib/reading.functions";
import { awardActivity } from "@/lib/gamification";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/reading")({
  component: ReadingPage,
  head: () => ({
    meta: [
      { title: "Reading Mode — Learning English with Coach" },
      {
        name: "description",
        content:
          "Modo Reading completo: texto, áudio nativo, vocabulário, IPA, quiz e Read Aloud com análise por IA (pronúncia, fluência, ritmo).",
      },
      { property: "og:title", content: "Reading Mode — Coach" },
      { property: "og:description", content: "Leia, ouça, grave e receba um relatório detalhado." },
      { property: "og:type", content: "article" },
    ],
  }),
});

type Passage = {
  key: string;
  level: string;
  title: { pt: string; en: string };
  text: string;
  vocab: { word: string; ipa: string; pt: string }[];
  quiz: { q: string; options: string[]; answer: number }[];
};

const PASSAGES: Passage[] = [
  {
    key: "morning-routine-a2",
    level: "A2",
    title: { pt: "Rotina da manhã", en: "Morning routine" },
    text:
      "Every morning I wake up at seven o'clock. I drink a glass of water and open the window. The sun is bright and the birds are singing. After a quick shower, I have breakfast with my family. We usually eat toast, fruit and coffee. Then I walk to the bus stop and go to work.",
    vocab: [
      { word: "wake up", ipa: "/ˈweɪk ʌp/", pt: "acordar" },
      { word: "bright", ipa: "/braɪt/", pt: "brilhante" },
      { word: "shower", ipa: "/ˈʃaʊ.ər/", pt: "duche" },
      { word: "breakfast", ipa: "/ˈbrek.fəst/", pt: "pequeno-almoço" },
    ],
    quiz: [
      { q: "What time do I wake up?", options: ["6", "7", "8"], answer: 1 },
      { q: "What do we eat for breakfast?", options: ["Rice", "Toast and fruit", "Soup"], answer: 1 },
      { q: "How do I go to work?", options: ["By car", "By bus", "By bike"], answer: 1 },
    ],
  },
  {
    key: "city-park-b1",
    level: "B1",
    title: { pt: "No parque da cidade", en: "At the city park" },
    text:
      "On Saturday afternoons the park is full of families. Children run across the grass while their parents chat on wooden benches. Near the pond, an old man feeds the ducks with pieces of bread. A street musician plays a soft guitar melody and a few tourists stop to listen and drop coins into his open case.",
    vocab: [
      { word: "grass", ipa: "/ɡrɑːs/", pt: "relva" },
      { word: "bench", ipa: "/bentʃ/", pt: "banco" },
      { word: "pond", ipa: "/pɒnd/", pt: "lago pequeno" },
      { word: "melody", ipa: "/ˈmel.ə.di/", pt: "melodia" },
    ],
    quiz: [
      { q: "When is the park full?", options: ["Monday morning", "Saturday afternoon", "Sunday night"], answer: 1 },
      { q: "Who feeds the ducks?", options: ["A child", "An old man", "A tourist"], answer: 1 },
      { q: "What does the musician play?", options: ["Piano", "Guitar", "Violin"], answer: 1 },
    ],
  },
  {
    key: "climate-change-b2",
    level: "B2",
    title: { pt: "Mudanças climáticas", en: "Climate change" },
    text:
      "Scientists agree that human activity is warming the planet at an unprecedented rate. Rising sea levels threaten coastal cities, while extreme weather events have become alarmingly frequent. Although governments have pledged ambitious targets, meaningful progress depends on the daily choices of individuals: how we travel, what we eat and the energy we consume at home.",
    vocab: [
      { word: "unprecedented", ipa: "/ʌnˈpres.ɪ.den.tɪd/", pt: "sem precedentes" },
      { word: "threaten", ipa: "/ˈθret.ən/", pt: "ameaçar" },
      { word: "pledge", ipa: "/pledʒ/", pt: "prometer" },
      { word: "consume", ipa: "/kənˈsjuːm/", pt: "consumir" },
    ],
    quiz: [
      { q: "What is rising?", options: ["Prices", "Sea levels", "Populations"], answer: 1 },
      { q: "Progress depends on…", options: ["Only governments", "Individual choices too", "Scientists"], answer: 1 },
      { q: "How frequent are extreme events?", options: ["Rare", "Alarmingly frequent", "Unchanged"], answer: 1 },
    ],
  },
];

function highlightPassage(text: string, wrongWords: string[], vocab: string[]) {
  const wrong = new Set(wrongWords.map((w) => w.toLowerCase()));
  const vocabSet = new Set(vocab.map((w) => w.toLowerCase()));
  const parts = text.split(/(\s+|[.,!?;:])/);
  return parts.map((tok, i) => {
    const norm = tok.toLowerCase().replace(/[^a-z']/g, "");
    if (wrong.has(norm))
      return (
        <span key={i} className="rounded-md bg-red-500/20 px-1 font-semibold text-red-700 dark:text-red-300">
          {tok}
        </span>
      );
    if (vocabSet.has(norm))
      return (
        <span key={i} className="rounded-md bg-sunset/10 px-1 font-semibold text-sunset">
          {tok}
        </span>
      );
    return <span key={i}>{tok}</span>;
  });
}

function ReadingPage() {
  const [idx, setIdx] = useState(0);
  const passage = PASSAGES[idx];
  const [showTranslation, setShowTranslation] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState<Awaited<ReturnType<typeof assessReading>> | null>(null);
  const [transcript, setTranscript] = useState("");
  const [attempts, setAttempts] = useState(0);
  const recorderRef = useRef<Recorder | null>(null);
  const startRef = useRef<number>(0);

  const [history, setHistory] = useState<Array<Record<string, number | string | null>>>([]);
  const fetchHistory = useServerFn(getReadingHistory);
  const runAssess = useServerFn(assessReading);

  useEffect(() => {
    fetchHistory({ data: { passageKey: passage.key } })
      .then((r) => setHistory(r as never))
      .catch(() => setHistory([]));
  }, [passage.key, fetchHistory, attempts]);

  const vocabWords = useMemo(() => passage.vocab.map((v) => v.word.split(" ")[0]), [passage]);

  const handlePlay = async () => {
    try {
      setPlaying(true);
      await speak(passage.text, { accent: "uk" });
    } catch {
      toast.error("Áudio indisponível");
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
      } catch {
        toast.error("Permite o acesso ao microfone");
      }
      return;
    }
    setRecording(false);
    setProcessing(true);
    try {
      const blob = await recorderRef.current!.stop();
      recorderRef.current = null;
      const durationSeconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
      const text = await transcribe(blob);
      setTranscript(text);
      const r = await runAssess({
        data: {
          passageKey: passage.key,
          passage: passage.text,
          transcript: text,
          durationSeconds,
        },
      });
      setReport(r);
      setAttempts((n) => n + 1);
      awardActivity("reading", { meta: { overall: r.overall ?? 0 } }).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na análise");
    } finally {
      setProcessing(false);
    }
  };

  const wrong = report?.mispronounced?.map((m) => m.word) ?? report?.missing ?? [];
  const quizScore = passage.quiz.reduce(
    (acc, q, i) => acc + (quizAnswers[i] === q.answer ? 1 : 0),
    0,
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Reading Mode
            </div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              {passage.title.pt}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {PASSAGES.map((p, i) => (
              <button
                key={p.key}
                onClick={() => {
                  setIdx(i);
                  setReport(null);
                  setTranscript("");
                  setQuizAnswers({});
                }}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all ${
                  i === idx
                    ? "border-sunset bg-sunset text-white shadow-soft"
                    : "border-border bg-background hover:border-magenta/50"
                }`}
              >
                {p.level} · {p.title.pt}
              </button>
            ))}
          </div>
        </div>

        {/* Passage */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{passage.level}</Badge>
              <Button size="sm" variant="outline" onClick={handlePlay} disabled={playing}>
                {playing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Volume2 className="mr-1.5 h-4 w-4" />}
                Ouvir nativo (UK)
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowTranslation((s) => !s)}>
                <BookOpen className="mr-1.5 h-4 w-4" />
                {showTranslation ? "Ocultar tradução" : "Mostrar tradução"}
              </Button>
            </div>
            <p className="mt-5 font-display text-xl leading-relaxed">
              {highlightPassage(passage.text, wrong, vocabWords)}
            </p>
            {showTranslation && (
              <p className="mt-3 rounded-2xl bg-muted/40 p-4 text-sm italic text-muted-foreground">
                Tradução gerada pelo aluno via <em>Mostrar tradução</em> — usa o coach de IA para pedir uma tradução contextual quando precisar.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vocab */}
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold">Vocabulário destacado</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {passage.vocab.map((v) => (
              <Card key={v.word}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-lg font-bold">{v.word}</div>
                    <button
                      onClick={() => speak(v.word, { accent: "uk" }).catch(() => {})}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-sunset/10 text-sunset hover:bg-sunset/20"
                      aria-label={`Ouvir ${v.word}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1 font-mono text-xs text-magenta">{v.ipa}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{v.pt}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Read Aloud */}
        <section className="mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Read Aloud
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold">Lê o texto em voz alta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A IA vai avaliar pronúncia, fluência, ritmo, entoação, velocidade, pausas e clareza.
              </p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={handleMic}
                  disabled={processing}
                  className={`bg-gradient-sunset shadow-glow relative flex h-24 w-24 items-center justify-center rounded-full text-white transition-transform disabled:opacity-70 ${
                    recording ? "scale-110 animate-pulse" : ""
                  }`}
                >
                  {processing ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : recording ? (
                    <Square className="h-8 w-8" />
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                </button>
                <div className="text-sm text-muted-foreground">
                  {processing
                    ? "A analisar..."
                    : recording
                      ? "A gravar... toca para parar"
                      : "Toca para gravar"}
                </div>
                {report && (
                  <Button size="sm" variant="outline" onClick={handleMic}>
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Repetir tentativa
                  </Button>
                )}
              </div>

              {transcript && (
                <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-border bg-background/60 p-4 text-left text-sm">
                  <div className="font-semibold">O que ouvimos:</div>
                  <div className="text-muted-foreground">"{transcript}"</div>
                </div>
              )}

              {report && (
                <div className="mx-auto mt-6 max-w-3xl space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: "Geral", v: report.overall },
                      { label: "Pronúncia", v: report.pronunciation },
                      { label: "Fluência", v: report.fluency },
                      { label: "Entoação", v: report.intonation },
                      { label: "Ritmo", v: report.rhythm },
                      { label: "Clareza", v: report.clarity },
                      { label: "Pausas", v: report.pauses },
                      { label: "WPM", v: report.wpm, raw: true },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-border bg-card p-3">
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                        <div className="mt-1 font-display text-2xl font-bold">
                          {Math.round(m.v)}
                          {m.raw ? "" : ""}
                        </div>
                        {!m.raw && <Progress value={m.v} className="mt-2 h-1.5" />}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="h-4 w-4 text-violet" /> Feedback do Coach
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{report.feedback}</p>
                  </div>

                  {report.mispronounced && report.mispronounced.length > 0 && (
                    <div className="rounded-2xl border border-border bg-background/60 p-4">
                      <div className="text-sm font-semibold">Palavras a melhorar</div>
                      <ul className="mt-2 space-y-2 text-sm">
                        {report.mispronounced.map((m, i) => (
                          <li key={i} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 p-2">
                            <div>
                              <span className="font-semibold text-red-700 dark:text-red-300">{m.word}</span>
                              {m.expected_ipa && (
                                <span className="ml-2 font-mono text-xs text-magenta">{m.expected_ipa}</span>
                              )}
                              {m.tip && <div className="text-xs text-muted-foreground">{m.tip}</div>}
                            </div>
                            <button
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunset/10 text-sunset hover:bg-sunset/20"
                              onClick={() => speak(m.word, { accent: "uk", speed: 0.7 }).catch(() => {})}
                              aria-label={`Ouvir ${m.word} devagar`}
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Comprehension quiz */}
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-bold">Questões de compreensão</h2>
          <div className="space-y-4">
            {passage.quiz.map((q, qi) => (
              <Card key={qi}>
                <CardContent className="p-5">
                  <div className="font-semibold">
                    {qi + 1}. {q.q}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {q.options.map((opt, oi) => {
                      const chosen = quizAnswers[qi] === oi;
                      const correct = quizAnswers[qi] !== undefined && oi === q.answer;
                      const wrongPick = chosen && oi !== q.answer;
                      return (
                        <button
                          key={oi}
                          onClick={() => setQuizAnswers((s) => ({ ...s, [qi]: oi }))}
                          className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${
                            correct
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : wrongPick
                                ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
                                : chosen
                                  ? "border-sunset bg-sunset/10"
                                  : "border-border hover:border-magenta/40"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
            {Object.keys(quizAnswers).length === passage.quiz.length && (
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <Gauge className="mx-auto h-6 w-6 text-sunset" />
                <div className="mt-1 font-display text-lg font-bold">
                  {quizScore} / {passage.quiz.length} corretas
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Evolution */}
        {history.length > 1 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-lg font-bold">Evolução nesta leitura</h2>
            <Card>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={history.map((h, i) => ({
                      i: i + 1,
                      overall: Number(h.overall ?? 0),
                      pronunciation: Number(h.pronunciation ?? 0),
                      fluency: Number(h.fluency ?? 0),
                      wpm: Number(h.wpm ?? 0),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="i" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="overall" stroke="#f97316" strokeWidth={2} />
                    <Line type="monotone" dataKey="pronunciation" stroke="#d946ef" strokeWidth={2} />
                    <Line type="monotone" dataKey="fluency" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="wpm" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
