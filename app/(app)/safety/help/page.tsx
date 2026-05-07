import { Phone, MessageCircle, Heart } from "lucide-react";
import { SAFETY_RESOURCES } from "@/lib/mock-data";

export default function CrisisHelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-earth p-6 text-white">
        <Heart className="mb-3 size-8 text-earth-light" />
        <h1 className="font-display text-2xl font-black">
          You are not alone.
        </h1>
        <p className="mt-2 text-sm text-earth-light">
          Reaching out takes courage. These services are free, confidential, and
          available 24/7.
        </p>
      </div>

      {/* WhatsApp CTA */}
      <a
        href="https://wa.me/23276000000"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 flex items-center gap-4 rounded-2xl bg-[#25D366] p-5 text-white"
      >
        <MessageCircle className="size-8" />
        <div>
          <p className="font-semibold">Talk to Someone at Ikigai</p>
          <p className="text-sm opacity-90">
            Chat with our team on WhatsApp — we listen
          </p>
        </div>
      </a>

      {/* Helplines */}
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Emergency Helplines — Sierra Leone
        </p>
        <div className="space-y-3">
          {SAFETY_RESOURCES.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <p className="font-semibold text-foreground">{r.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{r.desc}</p>
              <a
                href={`tel:${r.phone.replace(/\s/g, "")}`}
                className="mt-3 flex items-center gap-2 rounded-full bg-earth px-5 py-2.5 text-sm font-semibold text-white w-fit"
              >
                <Phone className="size-4" />
                {r.phone}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Grounding text */}
      <div className="rounded-2xl border border-primary-muted/40 bg-primary-muted/10 p-5">
        <p className="font-semibold text-primary mb-2">
          If you are in immediate danger
        </p>
        <p className="text-sm text-muted-foreground">
          Call 999 for police emergency services or go to your nearest health
          centre. Your safety comes first.
        </p>
      </div>
    </div>
  );
}
