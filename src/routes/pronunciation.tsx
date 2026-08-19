import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WordCard } from "@/components/word-card";
import { apiFetch } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n";
import { normalizeApiError } from "@/lib/errors/normalize-api-error";
import { InlineStatusFromError } from "@/components/feedback/inline-status";
import { useNotification } from "@/lib/notifications/notification-provider";

function PronunciationRouteError({ error }: { error: Error }) {
  const { locale } = useLocale();
  return (
    <div className="p-8 max-w-lg mx-auto">
      <InlineStatusFromError error={normalizeApiError(error, locale)} />
    </div>
  );
}

export const Route = createFileRoute("/pronunciation")({
  component: PronunciationPage,
  head: () => ({
    meta: [
      { title: "Pronúncia & Speaking — CoachSpeak" },
      {
        name: "description",
        content:
          "Pratique pronúncia com IPA, áudio britânico e americano, gravação, avaliação por IA e gráficos de evolução.",
      },
    ],
  }),
  errorComponent: ({ error }) => <PronunciationRouteError error={error} />,
  notFoundComponent: () => <div className="p-8">Página não encontrada.</div>,
});

type Row = {
  id: string;
  word: string | null;
  expected_text: string;
  accuracy: number | null;
  fluency: number | null;
  intonation: number | null;
  rhythm: number | null;
  clarity: number | null;
  overall: number | null;
  phoneme_issues: Array<{ sound: string; tip: string }> | null;
  feedback: string | null;
  created_at: string;
};

function PronunciationPage() {
  const notify = useNotification();
  const [word, setWord] = useState("hello");
  const [current, setCurrent] = useState("hello");
  const [history, setHistory] = useState<Row[]>([]);

  useEffect(() => {
    apiFetch<Row[]>("/v1/me/pronunciation-history")
      .then((r) => setHistory(r ?? []))
      // A fetch failure here used to render identically to "no history yet"
      // (an empty array either way), so a network hiccup looked like lost
      // progress with no indication anything went wrong.
      .catch((e) => notify.fromError(e, { dedupeKey: "pronunciation:history" }));
  }, []);

  const chartData = useMemo(
    () =>
      [...history].reverse().map((r, i) => ({
        i: i + 1,
        date: new Date(r.created_at).toLocaleDateString(),
        Pronúncia: Number(r.accuracy ?? 0),
        Fluência: Number(r.fluency ?? 0),
        Entoação: Number(r.intonation ?? 0),
        Ritmo: Number(r.rhythm ?? 0),
        Clareza: Number(r.clarity ?? 0),
        Global: Number(r.overall ?? 0),
      })),
    [history],
  );

  const avg = useMemo(() => {
    if (!history.length) return 0;
    const s = history.reduce((a, r) => a + Number(r.overall ?? 0), 0);
    return Math.round(s / history.length);
  }, [history]);

  return (
    <main className="container max-w-5xl py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Pronúncia & Speaking</h1>
        <p className="text-muted-foreground">
          Ouve, repete, grava e recebe avaliação profissional em segundos.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Explorar palavra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setCurrent(word.trim().toLowerCase());
            }}
          >
            <Label htmlFor="pronunciation-word" className="sr-only">
              Palavra
            </Label>
            <Input
              id="pronunciation-word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="ex: pronunciation"
            />
            <Button type="submit">Analisar</Button>
          </form>
          {current && <WordCard word={current} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-baseline justify-between">
          <CardTitle>Evolução</CardTitle>
          <span className="text-sm text-muted-foreground">
            Média global: <b>{avg}</b> · {history.length} tentativas
          </span>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda sem dados — pratique acima para começar a acompanhar a evolução.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="i" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Global" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="Pronúncia" stroke="#16a34a" />
                  <Line type="monotone" dataKey="Fluência" stroke="#f59e0b" />
                  <Line type="monotone" dataKey="Entoação" stroke="#db2777" />
                  <Line type="monotone" dataKey="Ritmo" stroke="#9333ea" />
                  <Line type="monotone" dataKey="Clareza" stroke="#0891b2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico recente</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem tentativas ainda.</p>
          ) : (
            <ul className="divide-y">
              {history.slice(0, 20).map((r) => (
                <li key={r.id} className="py-2 text-sm flex justify-between gap-4">
                  <div>
                    <div className="font-medium">{r.word ?? r.expected_text}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{Math.round(Number(r.overall ?? 0))}/100</div>
                    {r.phoneme_issues && r.phoneme_issues.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {r.phoneme_issues.map((p) => p.sound).join(" ")}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
