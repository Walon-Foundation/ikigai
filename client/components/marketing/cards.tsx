import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Unified lifecycle helpers live in lib/cms.ts; cards keep a tiny inline
// copy to stay server-renderable without an extra import cycle, but the
// rule is identical: effectiveEnd = endsAt ?? startsAt, ongoing = started && not ended.

// Reusable cards for the public site. Kept presentational and server-rendered —
// they take plain row data and render links. Images go through next/image so
// the campaign photography arrives resized rather than as multi-megabyte
// originals (see next.config.ts remotePatterns).

const CATEGORY_LABEL: Record<string, string> = {
  participant: "Participant story",
  volunteer: "Volunteer story",
  partner: "Partner story",
  impact: "Impact story",
};

export function ProgrammeCard({
  programme,
  pillarName,
}: {
  programme: {
    slug: string;
    name: string;
    summary: string | null;
    heroImageUrl: string | null;
    impactValue: string | null;
    impactLabel: string | null;
  };
  pillarName?: string | null;
}) {
  return (
    <Link
      href={`/programmes/${programme.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,box-shadow] hover:border-primary hover:shadow-(--w-lift)"
    >
      {/* Real CMS photography only. No image means a text-led card, never a
          placeholder letter or stock art. */}
      {programme.heroImageUrl && (
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          <Image
            src={programme.heroImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            quality={60}
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2.5 p-6">
        {pillarName && (
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {pillarName}
          </p>
        )}
        <h3 className="font-display text-[23px] font-semibold leading-tight text-(--w-green-deep)">
          {programme.name}
        </h3>
        {programme.summary && (
          <p className="line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
            {programme.summary}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-4 pt-3">
          {programme.impactValue ? (
            <span className="text-sm text-muted-foreground">
              <span className="font-display text-lg font-semibold text-(--w-green-deep)">
                {programme.impactValue}
              </span>{" "}
              {programme.impactLabel}
            </span>
          ) : (
            <span />
          )}
          <MoreLink />
        </div>
      </div>
    </Link>
  );
}

export function EventCard({
  event,
}: {
  event: {
    id: string;
    slug: string | null;
    title: string;
    location: string | null;
    imageUrl: string | null;
    startsAt: Date | null;
    endsAt?: Date | null;
  };
}) {
  const now = Date.now();
  const ends =
    (event as { endsAt?: Date | null }).endsAt?.getTime() ??
    event.startsAt?.getTime() ??
    0;
  const ongoing = event.startsAt
    ? event.startsAt.getTime() <= now && ends >= now
    : false;

  return (
    <Link
      href={`/events/${event.slug ?? event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,box-shadow] hover:border-primary hover:shadow-(--w-lift)"
    >
      {event.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            quality={60}
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 gap-5 p-6">
        {event.startsAt && (
          <div className="flex w-14 shrink-0 flex-col items-center border-r border-border pr-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              {event.startsAt.toLocaleDateString("en-GB", { month: "short" })}
            </span>
            <span className="font-display text-3xl font-semibold leading-none text-(--w-green-deep)">
              {event.startsAt.getDate()}
            </span>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          {ongoing && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-(--w-leaf-soft) px-2.5 py-0.5 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-(--w-leaf)" />
              Happening now
            </span>
          )}
          <h3 className="font-display text-xl font-semibold leading-snug text-(--w-green-deep)">
            {event.title}
          </h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {event.startsAt && (
              <span className="flex items-center gap-2">
                <CalendarDays className="size-3.5 shrink-0" />
                {event.startsAt.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0" />
                {event.location}
              </span>
            )}
          </div>
          <MoreLink className="mt-auto pt-2" />
        </div>
      </div>
    </Link>
  );
}

export function StoryCard({
  story,
}: {
  story: {
    slug: string;
    title: string;
    category: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    authorName: string | null;
  };
}) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,box-shadow] hover:border-primary hover:shadow-(--w-lift)"
    >
      {story.coverImageUrl && (
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          <Image
            src={story.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            quality={60}
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-(--w-orange-ink)">
          {CATEGORY_LABEL[story.category] ?? story.category}
        </p>
        <h3 className="font-display text-[23px] font-semibold leading-tight text-(--w-green-deep)">
          {story.title}
        </h3>
        {story.excerpt && (
          <p className="line-clamp-3 font-display text-[16px] italic leading-relaxed text-muted-foreground">
            {story.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-4 pt-3">
          <span className="text-sm text-muted-foreground">
            {story.authorName ? `By ${story.authorName}` : ""}
          </span>
          <MoreLink label="Read" />
        </div>
      </div>
    </Link>
  );
}

export function PartnerLogo({
  partner,
}: {
  partner: {
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
  };
}) {
  const inner = partner.logoUrl ? (
    <Image
      src={partner.logoUrl}
      alt={partner.name}
      width={120}
      height={60}
      className="max-h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
    />
  ) : (
    <span className="font-display text-lg font-semibold text-muted-foreground">
      {partner.name}
    </span>
  );

  return partner.websiteUrl ? (
    <a
      href={partner.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center"
    >
      {inner}
    </a>
  ) : (
    <div className="flex items-center justify-center">{inner}</div>
  );
}

/** "Learn more →", with the arrow sliding when its card is hovered. */
export function MoreLink({
  label = "Learn more",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-primary ${className ?? ""}`}
    >
      {label}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
    </span>
  );
}
