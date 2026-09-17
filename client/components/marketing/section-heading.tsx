import { cn } from "@/lib/utils";

// Shared overline + heading block used across the marketing sections, so the
// vertical rhythm and the small uppercase overline stay identical everywhere.
export function SectionHeading({
  eyebrow,
  title,
  intro,
  center,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-[62ch]",
        center && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && <Overline>{eyebrow}</Overline>}
      <h2 className="font-display text-[clamp(2rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-(--w-green-deep)">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-[17.5px] leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
    </div>
  );
}

/** Small uppercase label that introduces a section. */
export function Overline({
  children,
  onDeep,
  rule,
  className,
}: {
  children: React.ReactNode;
  /** On a green-deep ground. */
  onDeep?: boolean;
  /** Follow the label with a short rule. */
  rule?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em]",
        onDeep ? "text-(--w-on-deep)" : "text-primary",
        rule &&
          "after:h-px after:w-12 after:content-[''] " +
            (onDeep
              ? "after:bg-(--w-on-deep)/40"
              : "after:bg-(--w-line-strong)"),
        className,
      )}
    >
      {children}
    </p>
  );
}
