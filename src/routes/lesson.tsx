import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Volume2,
  Mic,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Youtube,
  BookOpen,
  Trophy,
  Loader2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { WordCard } from "@/components/word-card";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { youtubeByAge, type AgeGroup } from "@/lib/youtube-by-age";
import { speak, startRecording, transcribe, scorePronunciation, feedbackFor, type Recorder } from "@/lib/voice";
import { toast } from "sonner";
import vocabMenu from "@/assets/vocab-menu.jpg";
import vocabWaiter from "@/assets/vocab-waiter.jpg";
import vocabDelicious from "@/assets/vocab-delicious.jpg";
import vocabBill from "@/assets/vocab-bill.jpg";

export const Route = createFileRoute("/lesson")({
  component: LessonPage,
  head: () => ({
    meta: [
      { title: "Aula demo — Learning English with Coach" },
      {
        name: "description",
        content:
          "Exemplo de aula interativa com vocabulário, diálogo e prática de pronúncia no restaurante.",
      },
      { property: "og:title", content: "Aula demo — Learning English with Coach" },
      { property: "og:description", content: "Vocabulário, diálogo e pronúncia em uma aula interativa." },
      { property: "og:url", content: "https://coach-speak-bright.lovable.app/lesson" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://coach-speak-bright.lovable.app/lesson" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Restaurant English — Aula demo",
          description: "Vocabulário e diálogo para pedir em um restaurante em inglês.",
          provider: { "@type": "Organization", name: "Learning English with Coach" },
        }),
      },
    ],
  }),
});

const vocab = [
  { word: "menu", ipa: "/ˈmen.juː/", pt: "cardápio", image: vocabMenu },
  { word: "waiter", ipa: "/ˈweɪ.tər/", pt: "garçom", image: vocabWaiter },
  { word: "delicious", ipa: "/dɪˈlɪʃ.əs/", pt: "delicioso", image: vocabDelicious },
  { word: "bill", ipa: "/bɪl/", pt: "conta", image: vocabBill },
];

const TARGET_SENTENCE = "I'd like the grilled salmon, please.";

function LessonPage() {
  const { locale } = useLocale();
  const [tab, setTab] = useState<"vocab" | "read" | "speak" | "quiz">("vocab");
  const [answer, setAnswer] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("teens");
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [score, setScore] = useState<number | null>(null);
  const recorderRef = useRef<Recorder | null>(null);

  const handleSpeak = async (text: string, key = text) => {
    try {
      setPlayingWord(key);
      await speak(text);
    } catch {
      toast.error(locale === "pt" ? "Falha ao reproduzir áudio" : "Failed to play audio");
    } finally {
      setPlayingWord(null);
    }
  };

  const handleMic = async () => {
    if (processing) return;
    if (!recording) {
      try {
        recorderRef.current = await startRecording();
        setRecording(true);
        setTranscript("");
        setScore(null);
      } catch {
        toast.error(locale === "pt" ? "Permita o acesso ao microfone" : "Please allow microphone access");
      }
      return;
    }
    setRecording(false);
    setProcessing(true);
    try {
      const blob = await recorderRef.current!.stop();
      recorderRef.current = null;
      const text = await transcribe(blob);
      setTranscript(text);
      setScore(scorePronunciation(TARGET_SENTENCE, text));
    } catch {
      toast.error(locale === "pt" ? "Falha na transcrição" : "Transcription failed");
    } finally {
      setProcessing(false);
    }
  };


  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground">
            {locale === "pt" ? "Painel" : "Dashboard"}
          </Link>
          <span>/</span>
          <span>B1 · {locale === "pt" ? "Unidade 3" : "Unit 3"}</span>
          <span>/</span>
          <span className="text-foreground font-semibold">
            {locale === "pt" ? "Aula 4" : "Lesson 4"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              {locale === "pt" ? "Pedindo no restaurante" : "Ordering at a restaurant"}
            </h1>
            <div className="mt-2 text-sm text-muted-foreground">
              {locale === "pt" ? "Vocabulário · Leitura · Fala · Quiz" : "Vocabulary · Reading · Speaking · Quiz"}
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="glass rounded-full px-3 py-1.5 text-xs font-bold">62%</div>
            <div className="rounded-full bg-sunset/10 px-3 py-1.5 text-xs font-bold text-sunset">+120 XP</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="bg-gradient-sunset h-full w-[62%]" />
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              { k: "vocab", pt: "Vocabulário", en: "Vocabulary" },
              { k: "read", pt: "Leitura", en: "Reading" },
              { k: "speak", pt: "Fala", en: "Speaking" },
              { k: "quiz", pt: "Quiz", en: "Quiz" },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
                tab === t.k
                  ? "border-sunset bg-sunset text-white shadow-soft"
                  : "border-border bg-background hover:border-magenta/50"
              }`}
            >
              {locale === "pt" ? t.pt : t.en}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "vocab" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {vocab.map((v) => (
                <WordCard key={v.word} word={v.word} lessonId="lesson-restaurant-b1" />
              ))}
            </div>
          )}

          {tab === "read" && (
            <div className="glass rounded-3xl p-8 shadow-card">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {locale === "pt" ? "Diálogo" : "Dialogue"}
              </div>
              <div className="mt-4 space-y-4 font-display text-lg leading-relaxed">
                <p>
                  <span className="font-bold text-magenta">Waiter:</span> Good evening! Are you ready to order?
                </p>
                <p>
                  <span className="font-bold text-sunset">Anna:</span> Yes, please. I'd like the grilled salmon with a side salad.
                </p>
                <p>
                  <span className="font-bold text-magenta">Waiter:</span> Excellent choice. Anything to drink?
                </p>
                <p>
                  <span className="font-bold text-sunset">Anna:</span> A glass of sparkling water, please.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => handleSpeak(
                    "Waiter: Good evening! Are you ready to order? Anna: Yes, please. I'd like the grilled salmon with a side salad. Waiter: Excellent choice. Anything to drink? Anna: A glass of sparkling water, please.",
                    "dialogue"
                  )}
                  disabled={playingWord === "dialogue"}
                  className="bg-gradient-sunset text-white shadow-soft hover:opacity-90"
                >
                  {playingWord === "dialogue" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Volume2 className="mr-1.5 h-4 w-4" />}
                  {locale === "pt" ? "Ouvir narração" : "Play audio"}
                </Button>
                <Button variant="outline">
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  {locale === "pt" ? "Ver tradução" : "Show translation"}
                </Button>
                <a
                  href={youtubeByAge[ageGroup][0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
                >
                  <Youtube className="h-4 w-4 text-red-600" />
                  {locale === "pt" ? "Assistir no YouTube" : "Watch on YouTube"}
                </a>
              </div>

              {/* Age-specific YouTube resources */}
              <div className="mt-8 rounded-2xl border border-border bg-background/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Youtube className="h-4 w-4 text-red-600" />
                    {locale === "pt" ? "Vídeos por faixa etária" : "Videos by age group"}
                  </div>
                  <div className="flex gap-1 rounded-full bg-muted p-1 text-xs font-semibold">
                    {(["kids", "teens", "adults"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setAgeGroup(g)}
                        className={`rounded-full px-3 py-1 transition-all ${
                          ageGroup === g
                            ? "bg-gradient-sunset text-white shadow-soft"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {g === "kids"
                          ? locale === "pt" ? "Crianças" : "Kids"
                          : g === "teens"
                          ? locale === "pt" ? "Adolescentes" : "Teens"
                          : locale === "pt" ? "Adultos" : "Adults"}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {youtubeByAge[ageGroup].map((v) => (
                    <li key={v.url}>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-magenta/40 hover:shadow-soft"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                            <Youtube className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold group-hover:text-magenta">
                              {locale === "pt" ? v.title.pt : v.title.en}
                            </div>
                            <div className="text-xs text-muted-foreground">{v.channel}</div>
                          </div>
                        </div>
                        <span className="rounded-full bg-sunset/10 px-2.5 py-1 text-xs font-bold text-sunset">
                          {v.level}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "speak" && (
            <div className="glass rounded-3xl p-10 text-center shadow-card">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {locale === "pt" ? "Repita esta frase" : "Repeat this sentence"}
              </div>
              <div className="mt-4 font-display text-3xl font-bold">
                "{TARGET_SENTENCE}"
              </div>
              <div className="mt-2 font-mono text-sm text-magenta">
                /aɪd laɪk ðə ˈɡrɪld ˈsæm.ən pliːz/
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleSpeak(TARGET_SENTENCE, "target")}
                  disabled={playingWord === "target"}
                >
                  {playingWord === "target" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Volume2 className="mr-1.5 h-4 w-4" />}
                  {locale === "pt" ? "Ouvir modelo" : "Listen to model"}
                </Button>
              </div>

              <button
                onClick={handleMic}
                disabled={processing}
                className={`bg-gradient-sunset shadow-glow relative mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full text-white transition-transform disabled:opacity-70 ${
                  recording ? "scale-110 animate-pulse" : ""
                }`}
              >
                {processing ? <Loader2 className="h-10 w-10 animate-spin" /> : <Mic className="h-10 w-10" />}
                {recording && <span className="absolute inset-0 rounded-full ring-4 ring-sunset/30 animate-ping" />}
              </button>
              <div className="mt-4 text-sm text-muted-foreground">
                {processing
                  ? locale === "pt" ? "Analisando..." : "Analyzing..."
                  : recording
                    ? locale === "pt" ? "Gravando... toque para parar" : "Recording... tap to stop"
                    : locale === "pt" ? "Toque para gravar" : "Tap to record"}
              </div>

              {(transcript || score !== null) && (
                <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-background/60 p-5 text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-violet" /> Coach AI
                  </div>
                  {transcript && (
                    <div className="mt-2 text-sm">
                      <span className="font-semibold">{locale === "pt" ? "Você disse: " : "You said: "}</span>
                      <span className="text-muted-foreground">"{transcript}"</span>
                    </div>
                  )}
                  {score !== null && (
                    <>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {feedbackFor(score, locale === "pt" ? "pt" : "en")}
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="bg-gradient-sunset h-full transition-all"
                          style={{ width: `${Math.round(score * 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "quiz" && (
            <div className="glass rounded-3xl p-8 shadow-card">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {locale === "pt" ? "Pergunta 1 de 5" : "Question 1 of 5"}
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold">
                {locale === "pt"
                  ? "Como você pede a conta educadamente em inglês?"
                  : "How do you politely ask for the bill in English?"}
              </h3>
              <div className="mt-6 space-y-3">
                {[
                  { text: "Give me the bill!", correct: false },
                  { text: "Could I have the bill, please?", correct: true },
                  { text: "Bill now.", correct: false },
                  { text: "Where is money?", correct: false },
                ].map((o, i) => {
                  const chosen = answer === i;
                  const showState = answer !== null;
                  const isRight = o.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(i)}
                      disabled={showState}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                        showState && isRight
                          ? "border-emerald-500 bg-emerald-500/10"
                          : showState && chosen && !isRight
                          ? "border-destructive bg-destructive/10"
                          : chosen
                          ? "border-sunset bg-sunset/10"
                          : "border-border bg-background/60 hover:border-magenta/50"
                      }`}
                    >
                      <span className="font-medium">{o.text}</span>
                      {showState && isRight && <Check className="h-5 w-5 text-emerald-600" />}
                      {showState && chosen && !isRight && <X className="h-5 w-5 text-destructive" />}
                    </button>
                  );
                })}
              </div>

              {answer !== null && (
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-aurora p-5 text-white">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6" />
                    <div>
                      <div className="font-bold">+25 XP</div>
                      <div className="text-sm text-white/80">
                        {locale === "pt" ? "Muito bem! Próxima pergunta." : "Great job! Next question."}
                      </div>
                    </div>
                  </div>
                  <Button className="bg-white text-violet hover:bg-white/90">
                    {locale === "pt" ? "Próxima" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
