import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const AssessSchema = z.object({
  pronunciation: z.number().min(0).max(100),
  fluency: z.number().min(0).max(100),
  intonation: z.number().min(0).max(100),
  rhythm: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  pauses: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  mispronounced: z
    .array(
      z.object({
        word: z.string(),
        expected_ipa: z.string().default(""),
        heard: z.string().default(""),
        tip: z.string().default(""),
      }),
    )
    .default([]),
  feedback: z.string().default(""),
});
export type ReadingReport = z.infer<typeof AssessSchema>;

/** Normalize for word diff. */
function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** Returns list of expected words missing/wrong in transcript. */
function diffWords(expected: string, actual: string): string[] {
  const exp = normalize(expected);
  const act = new Set(normalize(actual));
  const missing: string[] = [];
  for (const w of exp) if (!act.has(w) && !missing.includes(w)) missing.push(w);
  return missing.slice(0, 30);
}

async function callAI<T>(system: string, user: string, schema: z.ZodType<T>): Promise<T> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw new Error("Muitas solicitações. Tenta novamente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados. Adiciona créditos para continuar.");
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return schema.parse(JSON.parse(data.choices?.[0]?.message?.content ?? "{}"));
}

export const assessReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        passageKey: z.string().min(1).max(80),
        passage: z.string().min(10).max(4000),
        transcript: z.string().max(6000).default(""),
        durationSeconds: z.number().int().min(1).max(1800),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const missing = diffWords(data.passage, data.transcript);
    const wordCount = data.passage.split(/\s+/).filter(Boolean).length;
    const wpm = Math.round((wordCount / data.durationSeconds) * 60);

    const report = await callAI(
      "You are an English speaking coach. Analyse a learner's read-aloud attempt and grade it 0-100 on pronunciation, fluency, intonation, rhythm, clarity and pauses. Return strict JSON only.",
      JSON.stringify({
        target_passage: data.passage,
        student_transcript: data.transcript,
        approximate_wpm: wpm,
        likely_missed_or_mispronounced_words: missing,
        instructions:
          "For 'mispronounced' return up to 8 words the learner likely said wrong with expected_ipa (British), heard (best guess phonetic), and a short tip. 'feedback' is one short paragraph in Portuguese.",
        response_shape: {
          pronunciation: 0,
          fluency: 0,
          intonation: 0,
          rhythm: 0,
          clarity: 0,
          pauses: 0,
          overall: 0,
          mispronounced: [{ word: "", expected_ipa: "", heard: "", tip: "" }],
          feedback: "",
        },
      }),
      AssessSchema,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("reading_assessments").insert({
      user_id: context.userId,
      passage_key: data.passageKey,
      passage: data.passage,
      transcript: data.transcript,
      wpm,
      duration_seconds: data.durationSeconds,
      accuracy: Math.max(0, 1 - missing.length / Math.max(1, wordCount)),
      pronunciation: report.pronunciation,
      fluency: report.fluency,
      intonation: report.intonation,
      rhythm: report.rhythm,
      clarity: report.clarity,
      pauses: report.pauses,
      overall: report.overall,
      feedback: report.feedback,
      mispronounced: report.mispronounced,
    });

    return { ...report, wpm, missing };
  });

export const getReadingHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ passageKey: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("reading_assessments")
      .select("id,created_at,wpm,overall,pronunciation,fluency,intonation,rhythm,clarity,pauses,passage_key")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(50);
    if (data.passageKey) q = q.eq("passage_key", data.passageKey);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
