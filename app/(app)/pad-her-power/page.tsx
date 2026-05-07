import { Heart, MapPin } from "lucide-react";
import { PAD_HER_POWER_RESOURCES } from "@/lib/mock-data";

const CATEGORIES = [
  "Menstrual Health",
  "Contraception",
  "Safety",
  "Nutrition",
  "Mental Health",
];

export default function PadHerPowerPage() {
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    resources: PAD_HER_POWER_RESOURCES.filter((r) => r.category === cat),
  })).filter((g) => g.resources.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
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

      {/* Resource Map placeholder */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="size-4 text-primary" />
          <p className="font-semibold text-foreground">Nearby Health Clinics</p>
        </div>
        <div className="flex h-40 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
          Map view — Freetown & Western Rural Area
          <br />
          <span className="text-xs">(Leaflet.js integration coming soon)</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Showing government health centres and reproductive health clinics near
          you.
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
                  <h3 className="font-semibold text-foreground">{res.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {res.desc}
                  </p>
                  <button className="mt-3 rounded-full border border-earth px-4 py-1.5 text-xs font-semibold text-earth hover:bg-earth-light/10 transition-colors">
                    Read more
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
