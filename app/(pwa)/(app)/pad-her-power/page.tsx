import { ExternalLink, Heart, MapPin } from "lucide-react";
import { after } from "next/server";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { milestones } from "@/db/schema";
import { PAD_HER_POWER_RESOURCES } from "@/lib/constants";
import { requireRole } from "@/lib/db-user";
import { PAD_HER_POWER_LINKS } from "@/lib/resource-links";
import { ResourceMapClient } from "./resource-map-client";

const CATEGORIES = [
  "Menstrual Health",
  "Contraception",
  "Safety",
  "Nutrition",
  "Mental Health",
];

export default async function PadHerPowerPage() {
  const user = await requireRole(["mentee"]);
  // This page is otherwise fully static; deferring the milestone write past
  // the response means it no longer blocks render on every visit.
  after(async () => {
    await db
      .insert(milestones)
      .values({ userId: user.id, type: "pad_her_power" })
      .onConflictDoNothing();
  });
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    resources: PAD_HER_POWER_RESOURCES.filter((r) => r.category === cat),
  })).filter((g) => g.resources.length > 0);

  return (
    <>
      <PageHeader title="Pad Her Power" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Hero */}
        <div className="mb-6 rounded-2xl bg-earth p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="size-5 text-earth-light" />
            <span className="text-sm font-semibold text-earth-light uppercase tracking-wider">
              Pad Her Power
            </span>
          </div>
          <h1 className="font-display text-2xl font-black mb-2">
            Reproductive Health Resources
          </h1>
          <p className="text-sm text-earth-light/80">
            Evidence-based health information for young women in Sierra Leone.
            Everything here is private and for you.
          </p>
        </div>

        {/* Resource Map */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resource Map
            </p>
          </div>
          <ResourceMapClient />
          <p className="mt-2 text-xs text-muted-foreground">
            Health centres and support services in Freetown &amp; Western Rural
            Area. Tap a pin for contact details.
          </p>
        </div>

        {/* Resources by category */}
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.category}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </p>
              <div className="space-y-3">
                {group.resources.map((res) => (
                  <div
                    key={res.id}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <h3 className="font-semibold text-foreground">
                      {res.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {res.desc}
                    </p>
                    {PAD_HER_POWER_LINKS[res.id] && (
                      <a
                        href={PAD_HER_POWER_LINKS[res.id].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-earth px-4 py-1.5 text-xs font-semibold text-earth transition-colors hover:bg-earth-light/10"
                      >
                        Read more on {PAD_HER_POWER_LINKS[res.id].source}
                        <ExternalLink className="size-3" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
