import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {programme.heroImageUrl ? (
          <Image
            src={programme.heroImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-4xl font-black text-border">
              {programme.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {pillarName && (
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-primary">
            {pillarName}
          </p>
        )}
        <h3 className="font-display mb-2 text-lg font-bold text-foreground">
          {programme.name}
        </h3>
        {programme.summary && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {programme.summary}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          {programme.impactValue ? (
            <span className="text-sm font-semibold text-foreground">
              {programme.impactValue}{" "}
              <span className="font-normal text-muted-foreground">
                {programme.impactLabel}
              </span>
            </span>
          ) : (
            <span />
          )}
          <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export function EventCard({
  event,
}: {
  event: {
    slug: string | null;
    title: string;
    location: string | null;
    imageUrl: string | null;
    startsAt: Date | null;
  };
}) {
  const dateLabel = event.startsAt
    ? event.startsAt.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const inner = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays className="size-10 text-border" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display mb-2 text-lg font-bold text-foreground">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {dateLabel && (
            <span className="flex items-center gap-2">
              <CalendarDays className="size-3.5 shrink-0" />
              {dateLabel}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className =
    "group block h-full overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg";

  return event.slug ? (
    <Link href={`/events/${event.slug}`} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {story.coverImageUrl ? (
          <Image
            src={story.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-accent">
          {CATEGORY_LABEL[story.category] ?? story.category}
        </p>
        <h3 className="font-display mb-2 text-lg font-bold text-foreground">
          {story.title}
        </h3>
        {story.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {story.excerpt}
          </p>
        )}
        {story.authorName && (
          <p className="mt-4 text-xs text-muted-foreground">
            By {story.authorName}
          </p>
        )}
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
      className="max-h-14 w-auto object-contain opacity-80 transition-opacity hover:opacity-100"
    />
  ) : (
    <span className="font-display text-lg font-bold text-muted-foreground">
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

export function ImpactCounter({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl font-black text-primary-foreground sm:text-5xl">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-primary-muted">{label}</div>
    </div>
  );
}
