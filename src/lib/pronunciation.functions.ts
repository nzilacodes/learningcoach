import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const WordSchema = z.object({
  word: z.string(),
  ipa_uk: z.string().default(""),
  ipa_us: z.string().default(""),
  part_of_speech: z.string().default(""),
  example: z.string().default(""),
  translation_pt: z.string().default(""),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  phrasal_verbs: z.array(z.string()).default([]),
  expressions: z.array(z.string()).default([]),
});
export type WordEntry = z.infer<typeof WordSchema>;

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
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return schema.parse(JSON.parse(data.choices?.[0]?.message?.content ?? "{}"));
}

// -- Word data ---------------------------------------------------------------
export const getWordData = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ word: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const word = data.word.trim().toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cached } = await supabaseAdmin
      .from("word_entries")
      .select("*")
      .eq("word", word)
      .maybeSingle();
    if (cached) return cached as unknown as WordEntry;

    const generated = await callAI(
      "You are an English lexicography expert. Return strict JSON with keys: word, ipa_uk, ipa_us, part_of_speech, example, translation_pt (European Portuguese), synonyms (array of strings, up to 6), antonyms (array, up to 6), collocations (array, up to 8), phrasal_verbs (array, up to 6, related), expressions (array, up to 6, idioms). IPA must use standard slash-free symbols (e.g. həˈloʊ).",
      `Word: "${word}"`,
      WordSchema,
    );

    const row = { ...generated, word };
    const { data: inserted } = await supabaseAdmin
      .from("word_entries")
      .upsert(row, { onConflict: "word" })
      .select("*")
      .single();
    return (inserted ?? row) as unknown as WordEntry;
  });

// -- Assessment --------------------------------------------------------------
const AssessSchema = z.object({
  pronunciation: z.number().min(0).max(100),
  fluency: z.number().min(0).max(100),
  intonation: z.number().min(0).max(100),
  rhythm: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  phoneme_issues: z
    .array(z.object({ sound: z.string(), tip: z.string() }))
    .default([]),
  feedback: z.string().default(""),
});
export type PronScore = z.infer<typeof AssessSchema>;

export const assessPronunciation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        word: z.string().min(1).max(120),
        transcribed: z.string().default(""),
        ipa: z.string().default(""),
        lessonId: z.string().uuid().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const score = await callAI(
      "You are an expert English pronunciation coach. Given the target word/phrase, its IPA (if provided) and the learner's ASR transcription, estimate scores 0-100 for: pronunciation, fluency, intonation, rhythm, clarity, overall. List up to 5 specific phoneme_issues each as { sound: '/θ/', tip: 'place tongue between teeth' } and short PT feedback. Be strict but fair; a very different transcription implies low scores. Return JSON only.",
      JSON.stringify({
        target: data.word,
        ipa: data.ipa,
        asr_transcription: data.transcribed,
      }),
      AssessSchema,
    );

    await supabase.from("pronunciation_assessments").insert({
      user_id: userId,
      word: data.word,
      expected_text: data.word,
      transcribed_text: data.transcribed,
      accuracy: score.pronunciation,
      fluency: score.fluency,
      intonation: score.intonation,
      rhythm: score.rhythm,
      clarity: score.clarity,
      overall: score.overall,
      phoneme_issues: score.phoneme_issues,
      feedback: score.feedback,
      lesson_id: data.lessonId ?? null,
    });

    return score;
  });

export const getPronunciationHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("pronunciation_assessments")
      .select(
        "id, word, expected_text, accuracy, fluency, intonation, rhythm, clarity, overall, phoneme_issues, feedback, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });
