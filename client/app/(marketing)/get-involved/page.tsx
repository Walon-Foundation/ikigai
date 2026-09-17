import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import {
  getActiveEventsForVolunteer,
  getActiveProgrammesForVolunteer,
  getProgrammes,
} from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";
import { GetInvolvedForms } from "./forms";

export const metadata = pageMetadata({
  title: "Get Involved",
  description:
    "Join a programme, volunteer, mentor, or partner with Ikigai in Sierra Leone.",
  path: "/get-involved",
});

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
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero
          eyebrow="Get involved"
          title="There's a place for you."
          lede="Whether you're a young person looking to grow, someone with time to give, or an organization that wants to help — start here."
        />

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
