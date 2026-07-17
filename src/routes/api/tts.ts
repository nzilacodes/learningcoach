import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, voice = "alloy", instructions, speed } = (await request.json()) as {
          text: string;
          voice?: string;
          instructions?: string;
          speed?: number;
        };
        if (!text || typeof text !== "string") {
          return new Response("Missing text", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI not configured", { status: 500 });

        const body: Record<string, unknown> = {
          model: "openai/gpt-4o-mini-tts",
          input: text,
          voice,
          response_format: "mp3",
        };
        if (instructions) body.instructions = instructions;
        if (typeof speed === "number" && speed >= 0.25 && speed <= 4) body.speed = speed;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!upstream.ok) {
          const msg = await upstream.text().catch(() => "");
          return new Response(msg || "TTS failed", { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "audio/mpeg" },
        });
      },
    },
  },
});
