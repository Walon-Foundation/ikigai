import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Get in Touch
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Contact Us
            </h1>
          </div>
        </section>

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
