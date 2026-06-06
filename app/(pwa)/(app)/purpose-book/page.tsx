import {
  Compass,
  Heart,
  Lightbulb,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/db-user";
import { LifeVisionEditor } from "./purpose-book-client";

type Assessment = {
  love?: string[];
  loveText?: string;
  skills?: string[];
  skillsText?: string;
  community?: string[];
  communityText?: string;
  opportunity?: string[];
  opportunityText?: string;
};

type OnboardingData = {
  assessment?: Assessment;
  valuesRanking?: string[];
  personality?: {
    introvertExtrovert: number;
    structuredFlexible: number;
    creativeAnalytical: number;
    independentCollaborative: number;
  };
  purposeProfile?: { statement?: string; personalityLabel?: string };
  lifeVision?: string;
};

function axis(value: number | undefined, low: string, high: string): string {
  if (value == null) return "Balanced";
  if (value <= 2) return low;
  if (value >= 4) return high;
  return "Balanced";
}

export default async function PurposeBookPage() {
  const user = await requireRole(["mentee"]);
  const data = (user.onboardingData as OnboardingData | null) ?? {};
  const a = data.assessment ?? {};
  const values = data.valuesRanking ?? [];
  const p = data.personality;
  const statement = data.purposeProfile?.statement;

  const whoAmI = p
    ? [
        axis(p.introvertExtrovert, "Introverted", "Extroverted"),
        axis(p.structuredFlexible, "Structured", "Flexible"),
        axis(p.creativeAnalytical, "Creative", "Analytical"),
        axis(p.independentCollaborative, "Independent", "Collaborative"),
      ]
    : [];

  return (
    <>
      <PageHeader title="Purpose Book" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {statement && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-primary">
                My Purpose Statement
              </h2>
            </div>
            <p className="text-lg font-medium leading-relaxed text-foreground">
              {statement}
            </p>
          </div>
        )}

        <Module icon={Users} title="Who Am I?">
          {whoAmI.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {whoAmI.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              {values.slice(0, 3).map((v) => (
                <Tag key={v}>{v}</Tag>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Module>

        <Module icon={Heart} title="What Do I Love?">
          <TagsOrText tags={a.love} text={a.loveText} />
        </Module>

        <Module icon={Target} title="What Am I Good At?">
          <TagsOrText tags={a.skills} text={a.skillsText} />
        </Module>

        <Module icon={Compass} title="What Does The World Need?">
          <TagsOrText tags={a.community} text={a.communityText} />
        </Module>

        <Module icon={Lightbulb} title="What Opportunities Exist For Me?">
          <TagsOrText tags={a.opportunity} text={a.opportunityText} />
        </Module>

        <Module icon={Sparkles} title="My Life Vision">
          <LifeVisionEditor initial={data.lifeVision ?? ""} />
        </Module>
      </div>
    </>
  );
}

function Module({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="font-display text-base font-bold text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function TagsOrText({ tags, text }: { tags?: string[]; text?: string }) {
  if ((!tags || tags.length === 0) && !text) return <Empty />;
  return (
    <div className="space-y-3">
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
      {children}
    </span>
  );
}

function Empty() {
  return (
    <p className="text-sm text-muted-foreground">
      Complete your discovery assessment to fill this in.
    </p>
  );
}
