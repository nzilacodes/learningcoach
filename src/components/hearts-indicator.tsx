import { Heart, Infinity as InfinityIcon } from "lucide-react";
import { useHearts } from "@/lib/hearts";

/** Duolingo-style hearts badge — mounted in the lesson header. Premium users
 * (unlimited === true) get an infinity glyph instead of a countdown, mirroring
 * how the backend never deducts hearts for an active subscription. */
export function HeartsIndicator({ locale }: { locale: "pt" | "en" }) {
  const { data } = useHearts();
  if (!data) return null;

  if (data.unlimited) {
    return (
      <div
        className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600"
        title={locale === "pt" ? "Premium — corações ilimitados" : "Premium — unlimited hearts"}
      >
        <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
        <InfinityIcon className="h-3.5 w-3.5" />
      </div>
    );
  }

  const hearts = data.hearts ?? 0;
  const max = data.maxHearts ?? 5;
  const title =
    hearts < max && data.nextRegenAt
      ? locale === "pt"
        ? `Próximo coração às ${new Date(data.nextRegenAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
        : `Next heart at ${new Date(data.nextRegenAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
      : undefined;

  return (
    <div
      className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600"
      title={title}
    >
      <Heart className={`h-4 w-4 ${hearts > 0 ? "fill-rose-500 text-rose-500" : "text-rose-200"}`} />
      {hearts}/{max}
    </div>
  );
}
