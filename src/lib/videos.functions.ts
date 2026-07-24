import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

const StudyPackSchema = z.object({
  transcript_excerpt: z.string(),
  summary: z.string(),
  key_vocabulary: z.array(
    z.object({ word: z.string(), pt: z.string(), example: z.string() }),
  ),
  quiz: z.array(
    z.object({ q: z.string(), opts: z.array(z.string()).length(4), a: z.number().min(0).max(3) }),
  ),
  listening_activities: z.array(z.string()),
  speaking_activities: z.array(z.string()),
  vocabulary_activities: z.array(z.string()),
});
export type StudyPack = z.infer<typeof StudyPackSchema>;

const GenerateInput = z.object({
  videoId: z.string().min(6),
  videoUrl: z.string().url(),
  title: z.string().default(""),
  channel: z.string().default(""),
  topic: z.string().default(""),
  level: z.string().default("A2"),
  ageGroup: z.enum(["kids", "teens", "adults"]).default("adults"),
});

async function callAI(system: string, user: string): Promise<StudyPack> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  return StudyPackSchema.parse(parsed);
}

export const generateVideoStudyPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1. Return cached pack if exists
    const { data: cached } = await supabase
      .from("video_study_packs")
      .select("*")
      .eq("video_id", data.videoId)
      .maybeSingle();
    if (cached) return cached.pack as StudyPack;

    // 2. Generate via AI
    const system =
      "You are an English teacher. Produce a JSON study pack for an English lesson built around a YouTube video. " +
      "All learner-facing text must be in English EXCEPT the `pt` field of vocabulary which is Portuguese (pt-PT). " +
      "Keep everything CEFR-aligned to the given level. Return ONLY valid JSON matching this schema: " +
      '{"transcript_excerpt": string (~120 words simulated excerpt of the likely transcript, faithful to the video topic; not the full transcript), ' +
      '"summary": string (4-6 sentences summarizing the likely video content), ' +
      '"key_vocabulary": [{"word": string, "pt": string, "example": string}] (8 items), ' +
      '"quiz": [{"q": string, "opts": [4 strings], "a": index 0-3}] (5 items, comprehension + grammar + vocab), ' +
      '"listening_activities": [string] (4 short tasks such as "Listen and identify..."), ' +
      '"speaking_activities": [string] (4 short prompts: role-plays, describe, discuss), ' +
      '"vocabulary_activities": [string] (4 short tasks: matching, fill-the-blank, categorize)}';

    const user = JSON.stringify({
      videoTitle: data.title,
      channel: data.channel,
      videoUrl: data.videoUrl,
      topic: data.topic,
      cefr_level: data.level,
      age_group: data.ageGroup,
      instruction:
        "Base the transcript excerpt and summary on the plausible content given the title, channel, and topic. If uncertain, keep it generic to the topic and level. Do not invent facts about specific people.",
    });

    let pack: StudyPack;
    try {
      pack = await callAI(system, user);
    } catch (err) {
      // Graceful fallback so the page still works
      pack = {
        transcript_excerpt:
          "Transcript is being prepared. In the meantime, watch the video and take notes of new words.",
        summary:
          "This video introduces vocabulary and expressions related to the lesson topic. Watch carefully and try to catch the main ideas.",
        key_vocabulary: [],
        quiz: [],
        listening_activities: [
          "Listen once without subtitles and note 3 words you recognize.",
          "Listen a second time with subtitles and write down 3 new words.",
          "Pause at 1:00 and summarize what you heard in one sentence.",
          "Listen again and count how many times the topic keyword appears.",
        ],
        speaking_activities: [
          "Summarize the video out loud in 60 seconds.",
          "Describe your opinion about the topic in 3 sentences.",
          "Role-play a short dialogue using vocabulary from the video.",
          "Record yourself reading the summary aloud.",
        ],
        vocabulary_activities: [
          "Write 5 new words from the video with translations.",
          "Create one example sentence for each new word.",
          "Group the new words by category (verbs, nouns, adjectives).",
          "Use 3 words in a short paragraph.",
        ],
      };
      // Do not cache the fallback; return without insert so a retry can generate a real one.
      return pack;
    }

    // 3. Cache via service role (bypasses RLS write restriction)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("video_study_packs").upsert({
      video_id: data.videoId,
      video_url: data.videoUrl,
      title: data.title,
      channel: data.channel,
      topic: data.topic,
      level: data.level,
      age_group: data.ageGroup,
      pack,
    });

    return pack;
  });
