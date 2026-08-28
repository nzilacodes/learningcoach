import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title: ReactNode;
  /** Heading level for `title`. Defaults to h1 — override to h2 only when
   * this header sits inside a shell that already renders the page's h1
   * elsewhere (see community.tsx's CommunityShell). */
  titleLevel?: "h1" | "h2";
  titleClassName?: string;
  /** Rendered before the title inside the same flex row (icon, emoji, badge). */
  leftExtra?: ReactNode;
  /** Rendered after the title, still in the left flex row but outside the heading tag (a widget, not a caption). */
  titleExtra?: ReactNode;
  /** Right-side content. Omit entirely for a title-only header (profile, settings). */
  actions?: ReactNode;
  borderClassName?: string;
  /** Frosted variant used by the dashboards (bg-white/80 + backdrop-blur) instead of solid bg-white. */
  blur?: boolean;
  className?: string;
};

export function AppHeader({
  title,
  titleLevel = "h1",
  titleClassName,
  leftExtra,
  titleExtra,
  actions,
  borderClassName = "border-gray-100",
  blur = false,
  className,
}: AppHeaderProps) {
  const Title = titleLevel as ElementType;
  return (
    <header
      className={cn(
        "h-16 flex items-center px-4 md:px-6 shrink-0 z-10 border-b",
        actions && "justify-between",
        blur ? "bg-white/80 backdrop-blur-xl" : "bg-white",
        borderClassName,
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {leftExtra}
        <Title className={titleClassName ?? "font-display text-xl font-bold text-ink truncate"}>
          {title}
        </Title>
        {titleExtra}
      </div>
      {actions && <div className="flex items-center gap-2 md:gap-3">{actions}</div>}
    </header>
  );
}
