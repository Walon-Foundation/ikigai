import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { IkigaiRings } from "@/components/system/ikigai-diagram";
import { cn } from "@/lib/utils";
import { Overline } from "./section-heading";

/**
 * The header of an inner marketing page: overline, Fraunces title, lede, on
 * the page ground. Inner pages do not get the home page's green hero block
 * (docs/05-design-guide.md). The top padding clears the fixed nav.
 */
export function PageHero({
  eyebrow,
  eyebrowHref,
  back,
  title,
  lede,
  children,
  narrow,
}: {
  eyebrow?: ReactNode;
  /** Make the overline a link, e.g. to a programme's pillar. */
  eyebrowHref?: string;
  /** A "← All events" link above the title, for detail pages. */
  back?: { href: string; label: string };
  title: ReactNode;
  lede?: ReactNode;
  /** Extra content under the lede, such as meta or buttons. */
  children?: ReactNode;
  /** Cap the header to reading width, for article-like pages. */
  narrow?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border pb-14 pt-32 sm:pb-16 sm:pt-36">
      {/* The one flourish on inner pages: the ikigai circles, faint, bleeding
          off the header's right edge. Decorative, desktop only. */}
      <IkigaiRings
        tone="light"
        className="pointer-events-none absolute -top-10 -right-24 hidden w-[520px] max-w-none md:block"
      />
      <div
        className={cn(
          "relative mx-auto px-6",
          narrow ? "max-w-3xl" : "max-w-7xl",
        )}
      >
        {back && (
          <Link
            href={back.href}
            className="group mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 motion-reduce:transition-none" />
            {back.label}
          </Link>
        )}
        {eyebrow && (
          <Overline rule className="web-rise">
            {eyebrowHref ? (
              <Link href={eyebrowHref} className="hover:underline">
                {eyebrow}
              </Link>
            ) : (
              eyebrow
            )}
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
