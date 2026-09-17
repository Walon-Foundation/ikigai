import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/system/button";
import { cn } from "@/lib/utils";

/**
 * What a list shows when the CMS has nothing in it yet. Several public lists
 * are empty in production (stories, gallery, partners, team), so this is a
 * designed state, not an afterthought: an icon, one sentence, one next step.
 * It never stands in for content with placeholder people or quotes.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-16 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-(--w-leaf-soft) text-primary">
        <Icon aria-hidden className="size-6" strokeWidth={1.6} />
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold text-(--w-green-deep)">
        {title}
      </h2>
      <p className="mt-2 max-w-[44ch] text-[15.5px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action && (
        <Link
          href={action.href}
          className={buttonClass("outline", { size: "sm", className: "mt-6" })}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
