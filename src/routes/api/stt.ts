import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI not configured", { status: 500 });

        const form = await request.formData();
        const file = form.get("file") as unknown as Blob | null;
        if (!file || typeof (file as Blob).arrayBuffer !== "function") {
          return new Response("Missing audio file", { status: 400 });
        }

        const upstream = new FormData();
        const type = (file as Blob).type || "audio/webm";
        const ext =
          type.includes("wav") ? "wav" :
          type.includes("mp4") ? "mp4" :
          type.includes("mpeg") ? "mp3" :
          type.includes("ogg") ? "ogg" :
          "webm";
        upstream.append("file", file, `recording.${ext}`);
        upstream.append("model", "openai/gpt-4o-mini-transcribe");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          return new Response(msg || "STT failed", { status: res.status });
        }
        const data = await res.json();
        return Response.json({ text: data.text ?? "" });
      },
    },
  },
});
