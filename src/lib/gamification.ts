import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

export type ActivitySource =
  | "watch_video"
  | "lesson_complete"
  | "exercise"
  | "reading"
  | "speaking"
  | "listening"
  | "daily_study"
  | "diagnostic_complete";

export type AwardResult = {
  xp: number;
  gained: number;
  level: number;
  level_up: boolean;
  streak: number;
  coins_gained: number;
};

/**
 * Award XP + coins to the current user. Shows toast + optional level-up
 * animation. The reward amount per source is decided server-side (see
 * learningcoachbackEnd's gamification module) — this used to accept
 * xp/coins overrides that the award_activity RPC trusted verbatim, which
 * let any authenticated caller inflate their own XP arbitrarily.
 */
export async function awardActivity(
  source: ActivitySource,
  overrides: { meta?: Record<string, unknown>; silent?: boolean } = {},
): Promise<AwardResult | null> {
  let r: AwardResult;
  try {
    r = await apiFetch<AwardResult>("/v1/xp/events", {
      method: "POST",
      body: JSON.stringify({ source, meta: overrides.meta ?? {} }),
    });
  } catch (e) {
    if (!overrides.silent) console.error("awardActivity", e instanceof Error ? e.message : e);
    return null;
  }
  if (!overrides.silent && r) {
    if (r.level_up) {
      toast.success(`🎉 Nível ${r.level} desbloqueado!`, {
        description: `+${r.gained} XP · +${r.coins_gained} 🪙`,
        duration: 5000,
      });
      celebrate();
    } else {
      toast(`+${r.gained} XP · +${r.coins_gained} 🪙`, {
        description: `Streak: ${r.streak} dias 🔥`,
      });
    }
  }
  return r;
}

/** Simple confetti-like burst (no dependency). */
export function celebrate() {
  if (typeof document === "undefined") return;
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);
  const colors = ["#f97316", "#ec4899", "#8b5cf6", "#22c55e", "#eab308"];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 8;
    p.style.cssText = `position:absolute;top:50%;left:50%;width:${size}px;height:${size}px;background:${colors[i % colors.length]};border-radius:2px;opacity:1;transition:transform 1.2s cubic-bezier(.2,.8,.3,1),opacity 1.2s ease-out`;
    container.appendChild(p);
    requestAnimationFrame(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 260;
      const rot = Math.random() * 720 - 360;
      p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 200}px) rotate(${rot}deg)`;
      p.style.opacity = "0";
    });
  }
  setTimeout(() => container.remove(), 1500);
}

export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}
export function levelProgress(xp: number, level: number) {
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { cur, next, pct: Math.min(100, Math.max(0, ((xp - cur) / (next - cur)) * 100)) };
}
