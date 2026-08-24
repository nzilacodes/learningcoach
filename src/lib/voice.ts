/** Client helpers for TTS playback and STT recording. */
import { apiFetch, apiFetchFormData, ApiError } from "@/lib/api/client";
import { createLevelMeter } from "@/lib/audio-level-meter";
import { assertRecordingIsUsable, RecordingRejectedError } from "@/lib/recording-guard";
export { RecordingRejectedError } from "@/lib/recording-guard";

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let currentAbort: AbortController | null = null;

// Stops whatever's currently playing/in-flight and releases its blob URL.
// Shared by a fresh speak() call and by anything that just wants silence.
function stopCurrentPlayback() {
  currentAbort?.abort();
  currentAbort = null;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export type SpeakOpts = {
  voice?: string;
  accent?: "us" | "uk";
  speed?: number;
  instructions?: string;
};

export async function speak(text: string, opts: SpeakOpts | string = {}): Promise<void> {
  const o: SpeakOpts = typeof opts === "string" ? { voice: opts } : opts;
  const voice = o.voice ?? (o.accent === "uk" ? "fable" : o.accent === "us" ? "alloy" : "alloy");
  const instructions =
    o.instructions ??
    (o.accent === "uk"
      ? "Speak with a clear, natural British Received Pronunciation accent."
      : o.accent === "us"
        ? "Speak with a clear, natural General American English accent."
        : undefined);
  stopCurrentPlayback();
  const abort = new AbortController();
  currentAbort = abort;
  try {
    const blob = await apiFetch<Blob>("/v1/audio/speech", {
      method: "POST",
      body: JSON.stringify({ text, voice, instructions, speed: o.speed }),
      signal: abort.signal,
    });
    // A newer speak() call superseded this one while the request was in
    // flight (e.g. rapid US/UK/slow button taps on word-card.tsx) — let that
    // one own playback instead of two accents overlapping/racing.
    if (abort.signal.aborted) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    currentUrl = url;
    currentAbort = null;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentUrl === url) currentUrl = null;
      if (currentAudio === audio) currentAudio = null;
    };
    await audio.play();
  } catch (e) {
    if (abort.signal.aborted) return;
    console.error("speak failed", e);
    throw e;
  }
}

export type Recorder = {
  stop: () => Promise<Blob>;
};

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported("audio/webm")
    ? "audio/webm"
    : MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "";
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const startedAt = Date.now();
  const meter = createLevelMeter(stream);
  let peakLevel = 0;
  const levelTimer = window.setInterval(() => {
    peakLevel = Math.max(peakLevel, meter.getLevel());
  }, 100);
  rec.start();
  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          window.clearInterval(levelTimer);
          meter.stop();
          try {
            assertRecordingIsUsable(Date.now() - startedAt, peakLevel);
          } catch (e) {
            reject(e);
            return;
          }
          resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        };
        rec.stop();
      }),
  };
}

export async function transcribe(blob: Blob, opts: { language?: "en" | "pt" } = {}): Promise<string> {
  const form = new FormData();
  // "language" must come before "file": @fastify/multipart parses parts in
  // stream order, so a field appended after the file part isn't guaranteed
  // to be readable by the backend when it reads the file part.
  if (opts.language) form.append("language", opts.language);
  form.append("file", blob, "recording.webm");
  const data = await apiFetchFormData<{ text: string }>("/v1/audio/transcriptions", form);
  return data.text ?? "";
}

/** Normalize for comparison: lowercase, strip punctuation, collapse spaces. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word-level similarity 0..1 using Levenshtein over word tokens. */
export function scorePronunciation(expected: string, actual: string): number {
  const a = normalize(expected).split(" ").filter(Boolean);
  const b = normalize(actual).split(" ").filter(Boolean);
  if (!a.length) return 0;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const dist = dp[m][n];
  return Math.max(0, 1 - dist / Math.max(m, n));
}

/** Shared copy for every recording entry point when no usable speech was
 * captured — either rejected client-side before upload (too short/silent) or
 * server-side after a low-confidence/no-speech STT result. Returns null for
 * any other error so callers fall back to their normal error handling
 * (notify.fromError). Never surfaces a hallucinated transcript like "you". */
export function describeTranscriptionRejection(
  e: unknown,
  locale: "pt" | "en",
): { title: string; description: string } | null {
  if (e instanceof RecordingRejectedError) {
    return e.reason === "too_short"
      ? {
          title: locale === "pt" ? "Gravação muito curta" : "Recording too short",
          description:
            locale === "pt"
              ? "Grave por pelo menos meio segundo e tente novamente."
              : "Record for at least half a second and try again.",
        }
      : {
          title: locale === "pt" ? "Não detetámos voz" : "We didn't detect any speech",
          description:
            locale === "pt"
              ? "Fale mais perto do microfone e tente novamente."
              : "Speak closer to the mic and try again.",
        };
  }
  if (e instanceof ApiError && e.code === "AUDIO_NO_SPEECH_DETECTED") {
    return {
      title: locale === "pt" ? "Não conseguimos ouvir claramente" : "We couldn't hear you clearly",
      description:
        locale === "pt" ? "Fale mais alto e tente novamente." : "Please speak louder and try again.",
    };
  }
  return null;
}

export function feedbackFor(score: number, locale: "pt" | "en"): string {
  const pct = Math.round(score * 100);
  if (score >= 0.9)
    return locale === "pt"
      ? `Excelente pronúncia! Precisão: ${pct}%.`
      : `Excellent pronunciation! Accuracy: ${pct}%.`;
  if (score >= 0.7)
    return locale === "pt"
      ? `Muito bom! Tente enfatizar cada palavra. Precisão: ${pct}%.`
      : `Great! Try emphasizing each word. Accuracy: ${pct}%.`;
  if (score >= 0.4)
    return locale === "pt"
      ? `Quase lá. Fale mais devagar e articule bem. Precisão: ${pct}%.`
      : `Almost there. Speak slower and articulate. Accuracy: ${pct}%.`;
  return locale === "pt"
    ? `Vamos tentar de novo — ouça o áudio e repita. Precisão: ${pct}%.`
    : `Let's try again — listen and repeat. Accuracy: ${pct}%.`;
}
