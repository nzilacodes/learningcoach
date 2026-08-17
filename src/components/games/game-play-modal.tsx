import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, Volume2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import {
  speak,
  startRecording,
  transcribe,
  scorePronunciation,
  feedbackFor,
  type Recorder,
} from "@/lib/voice";
import { describeGetUserMediaError } from "@/lib/media-devices";
import type { AgeTrack } from "@/lib/age-tracks";
import { useNotification } from "@/lib/notifications/notification-provider";

type GameEntry = AgeTrack["games"][number];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type XpResult = {
  xp: number;
  gained: number;
  level: number;
  level_up: boolean;
  coins_gained: number;
};

async function awardGameXp(gameId: string): Promise<XpResult> {
  return apiFetch<XpResult>("/v1/xp/events", {
    method: "POST",
    body: JSON.stringify({ source: "game", meta: { gameId } }),
  });
}

function ResultBanner({ result, locale }: { result: XpResult; locale: "pt" | "en" }) {
  return (
    <div className="rounded-2xl bg-gradient-aurora p-5 text-white flex items-center gap-3">
      <Trophy className="h-6 w-6 shrink-0" />
      <div>
        <div className="font-bold">
          +{result.gained} XP{result.coins_gained ? ` · +${result.coins_gained} 🪙` : ""}
        </div>
        <div className="text-sm text-white/80">
          {result.level_up
            ? locale === "pt"
              ? `Subiu para o nível ${result.level}! 🎉`
              : `Leveled up to ${result.level}! 🎉`
            : locale === "pt"
              ? "Muito bem!"
              : "Nice work!"}
        </div>
      </div>
    </div>
  );
}

/** Vocabulary/grammar/mixed: N-round multiple choice using the track's word bank. */
function MultipleChoiceGame({
  track,
  game,
  locale,
  onFinish,
}: {
  track: AgeTrack;
  game: GameEntry;
  locale: "pt" | "en";
  onFinish: (result: XpResult) => void;
}) {
  const rounds = useMemo(() => {
    const pool = track.vocabulary;
    const count = Math.min(5, pool.length);
    return shuffle(pool)
      .slice(0, count)
      .map((correct) => ({
        correct,
        options: shuffle([
          correct,
          ...shuffle(pool.filter((v) => v.word !== correct.word)).slice(0, 3),
        ]),
      }));
  }, [track]);

  const notify = useNotification();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const round = rounds[step];

  const choose = (word: string) => {
    if (picked) return;
    setPicked(word);
    if (word === round.correct.word) setScore((s) => s + 1);
  };

  const next = async () => {
    if (step + 1 < rounds.length) {
      setStep(step + 1);
      setPicked(null);
      return;
    }
    setFinishing(true);
    try {
      onFinish(await awardGameXp(game.id));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "game:xp" });
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {locale === "pt"
          ? `Pergunta ${step + 1} de ${rounds.length}`
          : `Question ${step + 1} of ${rounds.length}`}
      </div>
      <div className="text-center py-6">
        <span className="text-5xl" aria-hidden>
          {round.correct.emoji}
        </span>
        <h3 className="mt-3 font-display text-2xl font-bold">{round.correct.word}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {round.options.map((o) => {
          const isCorrect = o.word === round.correct.word;
          const chosen = picked === o.word;
          const show = picked !== null;
          return (
            <button
              key={o.word}
              onClick={() => choose(o.word)}
              disabled={show}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
                show && isCorrect
                  ? "border-emerald-500 bg-emerald-50"
                  : show && chosen
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 hover:border-primary/50"
              }`}
            >
              {o.pt}
            </button>
          );
        })}
      </div>
      {picked && (
        <Button onClick={next} disabled={finishing} className="w-full">
          {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {step + 1 < rounds.length
            ? locale === "pt"
              ? "Próxima"
              : "Next"
            : locale === "pt"
              ? "Concluir"
              : "Finish"}
        </Button>
      )}
      <div className="text-center text-xs text-gray-400">
        {locale === "pt" ? "Acertos" : "Correct"}: {score}/{rounds.length}
      </div>
    </div>
  );
}

/** Listening: plays a word via TTS, learner picks which word they heard. */
function ListeningGame({
  track,
  game,
  locale,
  onFinish,
}: {
  track: AgeTrack;
  game: GameEntry;
  locale: "pt" | "en";
  onFinish: (result: XpResult) => void;
}) {
  const rounds = useMemo(() => {
    const pool = track.vocabulary;
    const count = Math.min(5, pool.length);
    return shuffle(pool)
      .slice(0, count)
      .map((correct) => ({
        correct,
        options: shuffle([
          correct,
          ...shuffle(pool.filter((v) => v.word !== correct.word)).slice(0, 3),
        ]),
      }));
  }, [track]);

  const notify = useNotification();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const round = rounds[step];

  const play = async () => {
    setPlaying(true);
    try {
      await speak(round.correct.word);
    } catch (e) {
      notify.fromError(e, { dedupeKey: "game:play-audio" });
    } finally {
      setPlaying(false);
    }
  };

  const choose = (word: string) => {
    if (picked) return;
    setPicked(word);
    if (word === round.correct.word) setScore((s) => s + 1);
  };

  const next = async () => {
    if (step + 1 < rounds.length) {
      setStep(step + 1);
      setPicked(null);
      return;
    }
    setFinishing(true);
    try {
      onFinish(await awardGameXp(game.id));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "game:xp" });
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {locale === "pt"
          ? `Pergunta ${step + 1} de ${rounds.length}`
          : `Question ${step + 1} of ${rounds.length}`}
      </div>
      <div className="flex justify-center py-6">
        <button
          onClick={play}
          disabled={playing}
          className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:opacity-90 disabled:opacity-60"
        >
          {playing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Volume2 className="h-8 w-8" />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {round.options.map((o) => {
          const isCorrect = o.word === round.correct.word;
          const chosen = picked === o.word;
          const show = picked !== null;
          return (
            <button
              key={o.word}
              onClick={() => choose(o.word)}
              disabled={show}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
                show && isCorrect
                  ? "border-emerald-500 bg-emerald-50"
                  : show && chosen
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 hover:border-primary/50"
              }`}
            >
              {o.word}
            </button>
          );
        })}
      </div>
      {picked && (
        <Button onClick={next} disabled={finishing} className="w-full">
          {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {step + 1 < rounds.length
            ? locale === "pt"
              ? "Próxima"
              : "Next"
            : locale === "pt"
              ? "Concluir"
              : "Finish"}
        </Button>
      )}
      <div className="text-center text-xs text-gray-400">
        {locale === "pt" ? "Acertos" : "Correct"}: {score}/{rounds.length}
      </div>
    </div>
  );
}

/** Speaking: repeat a target sentence, scored the same way as the lesson speak tab. */
function SpeakingGame({
  track,
  game,
  locale,
  onFinish,
}: {
  track: AgeTrack;
  game: GameEntry;
  locale: "pt" | "en";
  onFinish: (result: XpResult) => void;
}) {
  const notify = useNotification();
  const target = useMemo(() => shuffle(track.examples)[0], [track]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);

  // If the modal is closed (Escape, overlay click, etc.) while still
  // recording, this component unmounts without handleMic's stop branch ever
  // running — without this, the getUserMedia stream (and the mic indicator)
  // stays live indefinitely.
  useEffect(() => {
    return () => {
      recorderRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleMic = async () => {
    if (processing) return;
    if (!recording) {
      try {
        recorderRef.current = await startRecording();
        setRecording(true);
        setTranscript("");
        setScore(null);
      } catch (e) {
        const { title, description } = describeGetUserMediaError(e, locale);
        notify.error(title, { description, dedupeKey: "game:mic-permission" });
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
      setScore(scorePronunciation(target.en, text));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "game:transcribe" });
    } finally {
      setProcessing(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      onFinish(await awardGameXp(game.id));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "game:xp" });
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-5 text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {locale === "pt" ? "Repita esta frase" : "Repeat this sentence"}
      </div>
      <div className="font-display text-xl font-bold">"{target.en}"</div>
      <div className="text-sm text-gray-400">{target.pt}</div>
      <button
        onClick={handleMic}
        disabled={processing}
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform disabled:opacity-70 ${
          recording ? "scale-110 animate-pulse" : ""
        }`}
      >
        {processing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Mic className="h-8 w-8" />}
      </button>
      <div className="text-xs text-gray-400">
        {processing
          ? locale === "pt"
            ? "Analisando..."
            : "Analyzing..."
          : recording
            ? locale === "pt"
              ? "Gravando... toque para parar"
              : "Recording... tap to stop"
            : locale === "pt"
              ? "Toque para gravar"
              : "Tap to record"}
      </div>
      {score !== null && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-left">
          <div className="text-sm">
            <span className="font-semibold">{locale === "pt" ? "Você disse: " : "You said: "}</span>
            <span className="text-gray-500">"{transcript}"</span>
          </div>
          <div className="mt-2 text-sm text-gray-500">{feedbackFor(score, locale)}</div>
        </div>
      )}
      {score !== null && (
        <Button onClick={finish} disabled={finishing} className="w-full">
          {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {locale === "pt" ? "Concluir" : "Finish"}
        </Button>
      )}
    </div>
  );
}

/** Writing: a short free-response prompt built from the track's themes. */
function WritingGame({
  track,
  game,
  locale,
  onFinish,
}: {
  track: AgeTrack;
  game: GameEntry;
  locale: "pt" | "en";
  onFinish: (result: XpResult) => void;
}) {
  const notify = useNotification();
  const theme = useMemo(() => shuffle(track.themes)[0], [track]);
  const [text, setText] = useState("");
  const [finishing, setFinishing] = useState(false);
  const ready = text.trim().length >= 20;

  const finish = async () => {
    if (!ready) return;
    setFinishing(true);
    try {
      onFinish(await awardGameXp(game.id));
    } catch (e) {
      notify.fromError(e, { dedupeKey: "game:xp" });
      setFinishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {locale === "pt" ? "Prática de escrita" : "Writing practice"}
      </div>
      <p className="text-sm">
        {locale === "pt"
          ? `Escreva 2-3 frases em inglês sobre "${theme.pt}" ${theme.emoji}.`
          : `Write 2-3 sentences in English about "${theme.en}" ${theme.emoji}.`}
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={locale === "pt" ? "Escreva aqui..." : "Write here..."}
      />
      <p className="text-xs text-gray-400">
        {text.trim().length}/20 {locale === "pt" ? "caracteres mínimos" : "characters minimum"}
      </p>
      <Button onClick={finish} disabled={!ready || finishing} className="w-full">
        {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {locale === "pt" ? "Concluir" : "Finish"}
      </Button>
    </div>
  );
}

export function GamePlayModal({
  game,
  track,
  locale,
  onOpenChange,
  onCompleted,
}: {
  game: GameEntry | null;
  track: AgeTrack;
  locale: "pt" | "en";
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}) {
  const [result, setResult] = useState<XpResult | null>(null);

  useEffect(() => {
    setResult(null);
  }, [game?.id]);

  const finish = (r: XpResult) => {
    setResult(r);
    onCompleted();
  };

  return (
    <Dialog open={!!game} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {game && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span aria-hidden>{game.emoji}</span>
                {locale === "pt" ? game.pt : game.en}
              </DialogTitle>
            </DialogHeader>
            {result ? (
              <div className="space-y-4">
                <ResultBanner result={result} locale={locale} />
                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  {locale === "pt" ? "Fechar" : "Close"}
                </Button>
              </div>
            ) : game.cat === "listening" ? (
              <ListeningGame track={track} game={game} locale={locale} onFinish={finish} />
            ) : game.cat === "speaking" ? (
              <SpeakingGame track={track} game={game} locale={locale} onFinish={finish} />
            ) : game.cat === "writing" ? (
              <WritingGame track={track} game={game} locale={locale} onFinish={finish} />
            ) : (
              <MultipleChoiceGame track={track} game={game} locale={locale} onFinish={finish} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
