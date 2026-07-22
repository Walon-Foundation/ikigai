import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { getProgrammes } from "@/lib/cms";
import { GetInvolvedForms } from "./forms";

export const metadata = {
  title: "Get Involved · Ikigai",
  description:
    "Join a programme, volunteer, mentor, or partner with Ikigai in Sierra Leone.",
};

export default async function GetInvolvedPage() {
  const programmes = await getProgrammes();
  const programmeNames = programmes.map((p) => p.name);

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
            <GetInvolvedForms programmes={programmeNames} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
