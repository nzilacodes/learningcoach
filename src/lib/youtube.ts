export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export const youtubeThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

export const buildEmbedUrl = (id: string, startSeconds = 0) => {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    cc_load_policy: "1", // captions on
    enablejsapi: "1",
  });
  if (startSeconds > 0) params.set("start", String(Math.floor(startSeconds)));
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
};

export interface VideoRef {
  videoId: string;
  url: string;
  title: string;
  channel: string;
  level: string;
  topic?: string;
  ageGroup: "kids" | "teens" | "adults";
}

import { AGE_TRACKS, type AgeGroup } from "@/lib/age-tracks";

/** Build a lightweight pool of ready-to-play videos per age group from the age-tracks data. */
export function videoPoolForAge(age: AgeGroup, locale: "pt" | "en" = "pt"): VideoRef[] {
  return AGE_TRACKS[age].videos
    .map((v) => {
      const id = extractYouTubeId(v.url);
      if (!id) return null;
      return {
        videoId: id,
        url: v.url,
        title: v.title[locale],
        channel: v.channel,
        level: v.level,
        ageGroup: age,
      } as VideoRef;
    })
    .filter(Boolean) as VideoRef[];
}
