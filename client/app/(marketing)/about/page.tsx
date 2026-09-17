import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { MoreLink } from "@/components/marketing/cards";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import {
  Overline,
  SectionHeading,
} from "@/components/marketing/section-heading";
import { buttonClass } from "@/components/system/button";
import { IkigaiDiagram } from "@/components/system/ikigai-diagram";
import { getCopy, getImpactStats, getTeam } from "@/lib/cms";

// Server-rendered per request so CMS edits appear immediately; see lib/cms.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "About",
  description:
    "Ikigai is a youth-led organization helping young people in Sierra Leone discover purpose, build skills, and lead change.",
  alternates: { canonical: "/about" },
};

// What the name means. "Ikigai" and its meaning are fixed brand facts
// (docs/PRODUCT.md); the four questions are the method the site describes.
const QUESTIONS = [
  {
    dot: "bg-(--w-orange)",
    title: "What you love",
    body: "Journaling helps young people notice what lights them up.",
  },
  {
    dot: "bg-(--w-teal)",
    title: "What you're good at",
    body: "Milestones turn small wins into real confidence.",
  },
  {
    dot: "bg-(--w-leaf)",
    title: "What the world needs",
    body: "Clubs and projects point those strengths at their community.",
  },
  {
    dot: "bg-(--w-sun)",
    title: "What sustains you",
    body: "Mentors and a Purpose Book help turn it into a path.",
  },
];

export default async function AboutPage() {
  const [mission, vision, values, team, stats] = await Promise.all([
    getCopy("mission"),
    getCopy("vision"),
    getCopy("values"),
    getTeam(),
    getImpactStats(),
  ]);

  const missionText =
    (mission?.body as string) ??
    "To help young people discover who they are, develop their abilities, improve their wellbeing, and become leaders who transform their communities.";
  const visionText =
    (vision?.body as string) ??
    "A Sierra Leone where every young person knows their purpose and has the support, skills and confidence to pursue it.";
  const valueItems = Array.isArray(values?.items)
    ? (values.items as string[])
    : ["Purpose", "Growth", "Community", "Inclusion", "Empowerment"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        {/* Opening: the one inner page that gets a green panel, because it
            carries the organisation's identity rather than a list. */}
        <section className="mx-2 mt-[72px] overflow-hidden rounded-[18px] bg-(--w-green-deep) text-white sm:mx-4 sm:rounded-3xl">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <Overline onDeep rule className="web-rise">
                About Ikigai
              </Overline>
              <h1 className="web-rise mt-5 font-display text-[clamp(2.6rem,5.4vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
                A youth movement built on{" "}
                <em className="text-(--w-sun)">purpose</em>.
              </h1>
              <p className="web-rise mt-6 max-w-[48ch] text-[18.5px] leading-relaxed text-(--w-on-deep-strong)">
                We are a youth-led organization helping young people in Sierra
                Leone discover purpose, build skills, and lead change.
              </p>
            </div>
            <div className="mx-auto w-full max-w-md">
              <IkigaiDiagram />
            </div>
          </div>
        </section>

        {/* The name */}
        <section className="pt-28 sm:pt-36">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <Overline rule>Why &ldquo;Ikigai&rdquo;</Overline>
              <p className="mt-5 font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.08] tracking-[-0.015em] text-(--w-green-deep)">
                Ikigai means{" "}
                <em className="text-primary">a reason for being</em>.
              </p>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted-foreground">
                Ikigai is a Japanese idea: the place where what you love, what
                you&apos;re good at, what the world needs and what sustains you
                meet. We named the organisation after it because that is the
                work: helping young people find that place for themselves.
              </p>
            </div>
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {QUESTIONS.map((q) => (
                <div
                  key={q.title}
                  className="flex flex-col gap-3 border-t border-(--w-green-deep) pt-6"
                >
                  <span className={`size-2.5 rounded-full ${q.dot}`} />
                  <h2 className="font-display text-[22px] font-semibold text-(--w-green-deep)">
                    {q.title}
                  </h2>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {q.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & vision */}
        <section className="pt-28 sm:pt-36">
          <div className="mx-auto grid max-w-7xl border-y border-(--w-line-strong) px-6 md:grid-cols-2">
            <div className="py-12 md:pr-12">
              <Overline>Our mission</Overline>
              <p className="mt-3 font-display text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.25] text-(--w-green-deep)">
                {missionText}
              </p>
            </div>
            <div className="border-t border-border py-12 md:border-t-0 md:border-l md:pl-12">
              <Overline className="text-(--w-orange-ink)">Our vision</Overline>
              <p className="mt-3 font-display text-[clamp(1.5rem,2.6vw,2rem)] font-semibold italic leading-[1.25] text-(--w-green-deep)">
                {visionText}
              </p>
            </div>
          </div>
        </section>

        {/* Impact */}
        {stats.length > 0 && (
          <section className="pt-20 sm:pt-24">
            <div className="mx-auto max-w-7xl px-6">
              <Overline>Our impact so far</Overline>
              <dl className="mt-4 grid grid-cols-2 lg:grid-cols-4">
                {stats.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex flex-col-reverse gap-1 py-6 pr-4 ${i % 2 ? "border-l border-border pl-5 lg:pl-7" : ""} ${i >= 2 ? "border-t border-border lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-7" : ""}`}
                  >
                    <dt className="text-[14.5px] text-muted-foreground">
                      {s.label}
                    </dt>
                    <dd className="font-display text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-none text-(--w-green-deep) tabular-nums">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* Values */}
        <section className="pt-28 sm:pt-36">
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-2xl bg-(--w-green-deep) px-8 py-14 text-center sm:px-14 sm:py-20">
              <Overline onDeep className="justify-center">
                What we stand for
              </Overline>
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:gap-x-7">
                {valueItems.map((v, i) => (
                  <li
                    key={v}
                    className="flex items-center gap-5 font-display text-[clamp(1.9rem,4.2vw,3.4rem)] font-semibold leading-tight text-white sm:gap-7"
                  >
                    {i > 0 && (
                      <span
                        aria-hidden
                        className="size-2 rounded-full bg-(--w-sun) sm:size-2.5"
                      />
                    )}
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Where we work */}
        <section className="pt-28 sm:pt-36">
          <div className="mx-auto grid max-w-7xl items-end gap-8 px-6 md:grid-cols-[1fr_auto]">
            <SectionHeading
              eyebrow="Where we work"
              title="Freetown and the Western Rural Area, Sierra Leone."
              intro="Our programmes, clubs and mentors are rooted in the communities our young people live in, and built for the connections and phones they actually have."
              className="mb-0"
            />
            <Link
              href="/what-we-do"
              className="group inline-flex text-sm font-semibold"
            >
              <MoreLink label="See what we do" />
            </Link>
          </div>
        </section>

        {/* Team preview — links to the /team page. Hidden until real
            team members are published. */}
        {team.length > 0 && (
          <section className="pt-28 sm:pt-36">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <SectionHeading
                  eyebrow="Our people"
                  title="The team."
                  className="mb-0"
                />
                <Link href="/team" className="group inline-flex">
                  <MoreLink label="Meet the full team" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {team.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="flex gap-4 rounded-xl border border-border bg-card p-6"
                  >
                    <Avatar name={m.name} src={m.photoUrl} size={64} />
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-(--w-green-deep)">
                        {m.name}
                      </h3>
                      {m.role && (
                        <p className="text-sm font-medium text-primary">
                          {m.role}
                        </p>
                      )}
                      {m.bio && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {m.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Close */}
        <section className="pt-28 sm:pt-36">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-8 rounded-2xl border border-border bg-card px-8 py-12 sm:px-14 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em] text-(--w-green-deep)">
                  Be part of it.
                </h2>
                <p className="mt-3 max-w-[52ch] text-[16.5px] text-muted-foreground">
                  Join a programme, give your time, or partner with us.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/get-involved" className={buttonClass("primary")}>
                  Get involved
                </Link>
                <Link
                  href="/get-involved#partner"
                  className={buttonClass("outline")}
                >
                  Partner with us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
