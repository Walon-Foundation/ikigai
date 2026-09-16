import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import {
  getActiveEventsForVolunteer,
  getActiveProgrammesForVolunteer,
  getProgrammes,
} from "@/lib/cms";
import { GetInvolvedForms } from "./forms";

export const metadata = {
  title: "Get Involved · Ikigai",
  description:
    "Join a programme, volunteer, mentor, or partner with Ikigai in Sierra Leone.",
};

export const dynamic = "force-dynamic";

export default async function GetInvolvedPage() {
  // programmes for the "Join a programme" dropdown stays as all published
  // programmes (joining is gated on the detail page), while the volunteer
  // dropdown is filtered to only active (not past, allowVolunteer=true).
  const [programmes, activeProgrammes, activeEvents] = await Promise.all([
    getProgrammes(),
    getActiveProgrammesForVolunteer(),
    getActiveEventsForVolunteer(),
  ]);
  const programmeNames = programmes.map((p) => p.name);
  const volunteerOptions = [
    ...activeProgrammes.map((p) => `${p.name} — Programme`),
    ...activeEvents.map((e) => `${e.title} — Event`),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-20 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Get involved
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              There's a place for you.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-muted">
              Whether you're a young person looking to grow, someone with time
              to give, or an organization that wants to help — start here.
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <GetInvolvedForms
              programmes={programmeNames}
              volunteerOptions={volunteerOptions}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
