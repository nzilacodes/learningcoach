import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Volume2, Gauge, Mic, Square, Loader2, Sparkles, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { speak, startRecording, transcribe, describeTranscriptionRejection, type Recorder } from "@/lib/voice";
import { describeGetUserMediaError } from "@/lib/media-devices";
import { uploadMedia } from "@/lib/media";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n";
import { useNotification } from "@/lib/notifications/notification-provider";
import { normalizeApiError, type NormalizedError } from "@/lib/errors/normalize-api-error";
import { InlineStatusFromError } from "@/components/feedback/inline-status";
import { StagedLoader } from "@/components/feedback/staged-loader";

type Props = {
  word: string;
  lessonId?: string | null;
  showTranslation?: boolean;
};

type WordEntry = {
  word: string;
  ipa_uk: string;
  ipa_us: string;
  part_of_speech: string;
  example: string;
  translation_pt: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  phrasal_verbs: string[];
  expressions: string[];
};

type PronScore = {
  pronunciation: number;
  fluency: number;
  intonation: number;
  rhythm: number;
  clarity: number;
  overall: number;
  phoneme_issues: Array<{ sound: string; tip: string }>;
  feedback: string;
};

export function WordCard({ word, lessonId = null, showTranslation = true }: Props) {
  const { locale } = useLocale();
  const notify = useNotification();
  const [data, setData] = useState<WordEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzeError, setAnalyzeError] = useState<NormalizedError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [practiceOpen, setPracticeOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setAnalyzeError(null);
    apiFetch<WordEntry>(`/v1/dictionary/${encodeURIComponent(word)}`)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setAnalyzeError(normalizeApiError(e, locale)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reloadKey deliberately forces a refetch without changing `word`
  }, [word, reloadKey, locale]);

  const play = (accent: "us" | "uk", slow = false) =>
    speak(word, { accent, speed: slow ? 0.7 : 1 }).catch(() =>
      notify.warning(locale === "pt" ? "Áudio indisponível" : "Audio unavailable", {
        dedupeKey: "word-card:play",
      }),
    );

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="text-2xl font-semibold">{word}</h3>
          {data?.part_of_speech && <Badge variant="secondary">{data.part_of_speech}</Badge>}
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Inline, not a toast — a disappearing toast would lose context on
            which word's analysis actually failed. */}
        {analyzeError && !loading && (
          <InlineStatusFromError
            error={analyzeError}
            action={{
              label: locale === "pt" ? "Tentar novamente" : "Try again",
              onClick: () => setReloadKey((k) => k + 1),
            }}
          />
        )}

        {data && (
          <div className="grid gap-2 text-sm">
            <div className="flex flex-wrap gap-4">
              {data.ipa_uk && (
                <span>
                  <Flag className="inline w-3 h-3 mr-1" /> UK <code>/{data.ipa_uk}/</code>
                </span>
              )}
              {data.ipa_us && (
                <span>
                  <Flag className="inline w-3 h-3 mr-1" /> US <code>/{data.ipa_us}/</code>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => play("us")}>
                <Volume2 className="w-4 h-4 mr-1" /> US
              </Button>
              <Button size="sm" variant="outline" onClick={() => play("uk")}>
                <Volume2 className="w-4 h-4 mr-1" /> UK
              </Button>
              <Button size="sm" variant="outline" onClick={() => play("us", true)}>
                <Gauge className="w-4 h-4 mr-1" /> Slow US
              </Button>
              <Button size="sm" variant="outline" onClick={() => play("uk", true)}>
                <Gauge className="w-4 h-4 mr-1" /> Slow UK
              </Button>
              <Button size="sm" onClick={() => setPracticeOpen(true)}>
                <Mic className="w-4 h-4 mr-1" /> Practice Pronunciation
              </Button>
            </div>

            {data.example && <p className="italic text-muted-foreground">"{data.example}"</p>}
            {showTranslation && data.translation_pt && (
              <p className="text-xs text-muted-foreground">PT: {data.translation_pt}</p>
            )}

            <WordLists data={data} />
          </div>
        )}
      </CardContent>

      <PracticeDialog
        open={practiceOpen}
        onOpenChange={setPracticeOpen}
        word={word}
        ipa={data?.ipa_us || data?.ipa_uk || ""}
        lessonId={lessonId}
      />
    </Card>
  );
}

function WordLists({ data }: { data: WordEntry }) {
  const groups: Array<[string, string[]]> = [
    ["Sinónimos", data.synonyms ?? []],
    ["Antónimos", data.antonyms ?? []],
    ["Collocations", data.collocations ?? []],
    ["Phrasal verbs", data.phrasal_verbs ?? []],
    ["Expressões", data.expressions ?? []],
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-2 pt-2">
      {groups
        .filter(([, arr]) => arr.length > 0)
        .map(([label, arr]) => (
          <div key={label}>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
            <div className="flex flex-wrap gap-1">
              {arr.map((t) => (
                <Badge key={t} variant="outline" className="font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function PracticeDialog({
  open,
  onOpenChange,
  word,
  ipa,
  lessonId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  word: string;
  ipa: string;
  lessonId: string | null;
}) {
  const { locale } = useLocale();
  const notify = useNotification();
  const navigate = useNavigate();
  const [recorder, setRecorder] = useState<Recorder | null>(null);
  const [stage, setStage] = useState<"transcribing" | "assessing" | null>(null);
  const [result, setResult] = useState<PronScore | null>(null);

  useEffect(() => {
    if (!open) {
      setRecorder(null);
      setResult(null);
      setStage(null);
    }
  }, [open]);

  const startRec = async () => {
    try {
      const r = await startRecording();
      setRecorder(r);
      setResult(null);
    } catch (e) {
      const { title, description } = describeGetUserMediaError(e, locale);
      notify.error(title, { description, dedupeKey: "word-card:mic-permission" });
    }
  };

  const stopRec = async () => {
    if (!recorder) return;
    setStage("transcribing");
    try {
      const blob = await recorder.stop();
      setRecorder(null);
      // Uploading the recording is best-effort and never blocks assessment —
      // if it fails (rate limit, size, offline), scoring still works exactly
      // as before, just without a saved "Speaking Attempt" media asset.
      const [transcribed, mediaAsset] = await Promise.all([
        transcribe(blob, { language: "en" }),
        uploadMedia(blob, { filename: "pronuncia.webm" }).catch(() => null),
      ]);
      setStage("assessing");
      const score = await apiFetch<PronScore>("/v1/pronunciation/assess", {
        method: "POST",
        body: JSON.stringify({
          word,
          transcribed,
          ipa,
          lessonId,
          mediaAssetId: mediaAsset?.id ?? null,
        }),
      });
      setResult({
        ...score,
        phoneme_issues: score.phoneme_issues ?? [],
        feedback: score.feedback ?? "",
      });
    } catch (e) {
      const rejection = describeTranscriptionRejection(e, locale);
      if (rejection) {
        notify.warning(rejection.title, { description: rejection.description, dedupeKey: "word-card:no-speech" });
      } else {
        // Consolidates what used to be a bespoke 402 branch here — any
        // PAYMENT_REQUIRED error now gets the "Ver planos" CTA centrally.
        notify.fromError(e, {
          dedupeKey: "word-card:assess",
          onUpgrade: () => navigate({ to: "/pricing" }),
        });
      }
    } finally {
      setStage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Practice: {word}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Ouve a palavra (US/UK).</li>
            <li>Repete em voz alta.</li>
            <li>Grava a tua voz.</li>
            <li>Recebe avaliação instantânea.</li>
          </ol>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => speak(word, { accent: "us" })}>
              <Volume2 className="w-4 h-4 mr-1" /> US
            </Button>
            <Button size="sm" variant="outline" onClick={() => speak(word, { accent: "uk" })}>
              <Volume2 className="w-4 h-4 mr-1" /> UK
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => speak(word, { accent: "us", speed: 0.65 })}
            >
              <Gauge className="w-4 h-4 mr-1" /> Slow
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {!recorder ? (
              <Button onClick={startRec} disabled={stage !== null}>
                <Mic className="w-4 h-4 mr-1" /> Gravar
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopRec}>
                <Square className="w-4 h-4 mr-1" /> Parar e avaliar
              </Button>
            )}
          </div>

          {stage && (
            <StagedLoader
              stages={
                locale === "pt"
                  ? ["A transcrever…", "A analisar pronúncia…"]
                  : ["Transcribing…", "Analyzing pronunciation…"]
              }
              currentStage={stage === "transcribing" ? 0 : 1}
              status="running"
            />
          )}

          {result && <ScorePanel score={result} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScorePanel({ score }: { score: PronScore }) {
  const rows: Array<[string, number]> = [
    ["Pronúncia", score.pronunciation],
    ["Fluência", score.fluency],
    ["Entoação", score.intonation],
    ["Ritmo", score.rhythm],
    ["Clareza", score.clarity],
  ];
  return (
    <div className="space-y-3 border rounded-md p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">Pontuação global</span>
        <span className="text-3xl font-bold">{Math.round(score.overall)}</span>
      </div>
      <div className="space-y-1">
        {rows.map(([l, v]) => (
          <div key={l} className="text-xs">
            <div className="flex justify-between">
              <span>{l}</span>
              <span className="font-mono">{Math.round(v)}</span>
            </div>
            <Progress value={v} className="h-1.5" />
          </div>
        ))}
      </div>
      {score.phoneme_issues.length > 0 && (
        <div>
          <p className="text-xs font-semibold flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3" /> Sons a melhorar
          </p>
          <ul className="text-xs space-y-1">
            {score.phoneme_issues.map((p, i) => (
              <li key={i}>
                <code>{p.sound}</code> — {p.tip}
              </li>
            ))}
          </ul>
        </div>
      )}
      {score.feedback && <p className="text-xs italic">{score.feedback}</p>}
    </div>
  );
}
