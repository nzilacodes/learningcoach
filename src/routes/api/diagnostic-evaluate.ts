import { createFileRoute } from "@tanstack/react-router";

// Compute Levenshtein-based similarity in [0..1].
function similarity(a: string, b: string): number {
  const s = a.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const t = b.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (!s && !t) return 1;
  if (!s || !t) return 0;
  const m = s.length, n = t.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const dist = dp[m][n];
  const maxLen = Math.max(m, n);
  return 1 - dist / maxLen;
}

type WritingSubmission = { id: string; prompt: string; text: string };
type SpeakingSubmission = { id: string; prompt: string; transcript: string };
type PronunciationSubmission = { id: string; expected: string; transcribed: string };

interface Body {
  scores: {
    grammar: number;
    vocabulary: number;
    reading: number;
    listening: number;
  };
  writing: WritingSubmission[];
  speaking: SpeakingSubmission[];
  pronunciation: PronunciationSubmission[];
  profile: { age?: number; native_language?: string; learning_goal?: string; interests?: string[] };
}

export const Route = createFileRoute("/api/diagnostic-evaluate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI not configured", { status: 500 });

        const body = (await request.json()) as Body;

        // 1) Pronunciation score = mean similarity across attempts * 100.
        const pronScores = body.pronunciation.map((p) =>
          Math.round(similarity(p.expected, p.transcribed || "") * 100),
        );
        const pronunciationScore = pronScores.length
          ? Math.round(pronScores.reduce((a, b) => a + b, 0) / pronScores.length)
          : 0;

        // 2) Ask the AI to score Writing + Speaking and generate the full report
        //    (strengths, weaknesses, feedback, learning plan) as one JSON payload.
        const systemPrompt = `You are an ESL examiner following CEFR standards.
You will:
1. Score each writing and speaking submission on a 0–100 scale (grammar, vocabulary, coherence).
2. Return an overall CEFR level (A1, A2, B1, B2, C1, or C2) based on ALL scores provided.
3. Identify 3 concrete strengths and 3 concrete weaknesses (short bullet phrases in Portuguese-PT).
4. Give one paragraph of feedback (Portuguese-PT, warm and encouraging, 2–4 sentences).
5. Produce a 4-week personalized learning plan tailored to the weaknesses. Each week has: title (PT), focus_skill (one of: grammar, vocabulary, reading, listening, writing, speaking, pronunciation), goals (2–4 short bullet phrases in PT), estimated_minutes (integer between 60 and 240).
Respond with a SINGLE JSON object matching this schema exactly, no extra keys or prose:
{
  "writing_score": number,
  "speaking_score": number,
  "cefr_level": "A1"|"A2"|"B1"|"B2"|"C1"|"C2",
  "strengths": string[],
  "weaknesses": string[],
  "feedback": string,
  "learning_plan": [{"week": number, "title": string, "focus_skill": string, "goals": string[], "estimated_minutes": number}]
}`;

        const userPrompt = JSON.stringify({
          objective_scores: {
            grammar: body.scores.grammar,
            vocabulary: body.scores.vocabulary,
            reading: body.scores.reading,
            listening: body.scores.listening,
            pronunciation: pronunciationScore,
          },
          writing_submissions: body.writing,
          speaking_submissions: body.speaking,
          learner_profile: body.profile,
        });

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (!aiRes.ok) {
          const msg = await aiRes.text().catch(() => "");
          return new Response(msg || "AI failed", { status: aiRes.status });
        }

        const aiJson = await aiRes.json();
        const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
        let parsed: {
          writing_score?: number;
          speaking_score?: number;
          cefr_level?: string;
          strengths?: string[];
          weaknesses?: string[];
          feedback?: string;
          learning_plan?: Array<{
            week: number;
            title: string;
            focus_skill: string;
            goals: string[];
            estimated_minutes: number;
          }>;
        } = {};
        try {
          parsed = JSON.parse(content);
        } catch {
          // Fall back to safe defaults
          parsed = {};
        }

        const writingScore = clamp(parsed.writing_score ?? 0);
        const speakingScore = clamp(parsed.speaking_score ?? 0);

        const overall = Math.round(
          (body.scores.grammar +
            body.scores.vocabulary +
            body.scores.reading +
            body.scores.listening +
            writingScore +
            speakingScore +
            pronunciationScore) /
            7,
        );

        return Response.json({
          scores: {
            grammar: body.scores.grammar,
            vocabulary: body.scores.vocabulary,
            reading: body.scores.reading,
            listening: body.scores.listening,
            writing: writingScore,
            speaking: speakingScore,
            pronunciation: pronunciationScore,
            overall,
          },
          cefr_level: parsed.cefr_level ?? "A1",
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : [],
          feedback: parsed.feedback ?? "",
          learning_plan: Array.isArray(parsed.learning_plan) ? parsed.learning_plan.slice(0, 8) : [],
        });
      },
    },
  },
});

function clamp(n: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
