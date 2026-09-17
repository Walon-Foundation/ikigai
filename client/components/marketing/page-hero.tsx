import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Overline } from "./section-heading";

/**
 * The header of an inner marketing page: overline, Fraunces title, lede, on
 * the page ground. Inner pages do not get the home page's green hero block
 * (docs/05-design-guide.md). The top padding clears the fixed nav.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  narrow,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Extra content under the lede, such as meta or buttons. */
  children?: ReactNode;
  /** Cap the header to reading width, for article-like pages. */
  narrow?: boolean;
}) {
  return (
    <section className="border-b border-border pb-14 pt-32 sm:pb-16 sm:pt-36">
      <div className={cn("mx-auto px-6", narrow ? "max-w-3xl" : "max-w-7xl")}>
        {eyebrow && (
          <Overline rule className="web-rise">
            {eyebrow}
          </Overline>
        )}
        <h1 className="web-rise font-display text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.04] tracking-[-0.015em] text-(--w-green-deep) [max-width:22ch]">
          {title}
        </h1>
        {lede && (
          <p className="web-rise mt-5 max-w-[60ch] text-[18.5px] leading-relaxed text-muted-foreground">
            {lede}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
