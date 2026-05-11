import { Heart, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/db";
import { milestones } from "@/db/schema";
import { getDbUser } from "@/lib/db-user";
import { PAD_HER_POWER_RESOURCES } from "@/lib/mock-data";
import { ResourceMapClient } from "./resource-map-client";

const CATEGORIES = [
  "Menstrual Health",
  "Contraception",
  "Safety",
  "Nutrition",
  "Mental Health",
];

export default async function PadHerPowerPage() {
  const user = await getDbUser();
  if (user) {
    await db
      .insert(milestones)
      .values({ userId: user.id, type: "pad_her_power" })
      .onConflictDoNothing();
  }
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
                    <button
                      type="button"
                      className="mt-3 rounded-full border border-earth px-4 py-1.5 text-xs font-semibold text-earth hover:bg-earth-light/10 transition-colors"
                    >
                      Read more
                    </button>
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
