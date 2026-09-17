import type { Metadata } from "next";
import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact · Ikigai",
  description:
    "Get in touch with Ikigai — questions, partnerships, or bringing Ikigai to your school in Sierra Leone.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <PageHero eyebrow="Get in touch" title="Contact us" />

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="mb-10">
              <p className="text-base leading-relaxed text-muted-foreground">
                Have a question, partnership enquiry, or want to bring Ikigai to
                your school? We would love to hear from you.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Or email us directly at{" "}
                <a
                  href="mailto:hello@ikigai.app"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  hello@ikigai.app
                </a>
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
