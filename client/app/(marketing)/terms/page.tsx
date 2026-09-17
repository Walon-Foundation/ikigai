import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "Terms of Service for the Ikigai platform — rules for mentorship, community conduct, and accounts for youth and mentors in Sierra Leone.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav />
      <main>
        <PageHero eyebrow="Legal" title="Terms of Service">
          <p className="text-sm text-muted-foreground">
            Last updated: June 2026
          </p>
        </PageHero>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20">
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-28">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  On this page
                </p>
                <ol className="text-sm">
                  <li>
                    <a
                      href="#acceptance"
                      className="block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-(--w-green-deep)"
                    >
                      Acceptance
                    </a>
                  </li>
                  <li>
                    <a
                      href="#use-of-service"
                      className="block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-(--w-green-deep)"
                    >
                      Use of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="#user-conduct"
                      className="block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-(--w-green-deep)"
                    >
                      User Conduct
                    </a>
                  </li>
                  <li>
                    <a
                      href="#accounts"
                      className="block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-(--w-green-deep)"
                    >
                      Accounts
                    </a>
                  </li>
                  <li>
                    <a
                      href="#limitation-of-liability"
                      className="block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-(--w-green-deep)"
                    >
                      Limitation of Liability
                    </a>
                  </li>
                  <li>
                    <a
                      href="#governing-law"
                      className="block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground transition-colors hover:border-primary hover:text-(--w-green-deep)"
                    >
                      Governing Law
                    </a>
                  </li>
                </ol>
              </div>
            </nav>
            <div className="legal-doc max-w-[68ch] space-y-12 text-[16.5px] leading-relaxed text-muted-foreground">
              <div id="acceptance" className="scroll-mt-28">
                <h2 className="font-display mb-3 text-2xl font-semibold text-(--w-green-deep)">
                  Acceptance
                </h2>
                <p className="leading-relaxed">
                  By installing or using the Ikigai platform, you agree to be
                  bound by these Terms of Service. If you do not agree to these
                  terms, do not use the platform. These terms apply to all users
                  including mentees, mentors, parents, and school
                  administrators.
                </p>
              </div>

              <div id="use-of-service" className="scroll-mt-28">
                <h2 className="font-display mb-3 text-2xl font-semibold text-(--w-green-deep)">
                  Use of Service
                </h2>
                <p className="leading-relaxed">
                  Ikigai is a mentorship and personal development platform
                  designed for youth in Sierra Leone. You may use the platform
                  only for its intended purpose — personal growth, mentorship,
                  and community engagement. You must be at least 13 years old to
                  create an account. Users under 18 require parental or guardian
                  consent.
                </p>
              </div>

              <div id="user-conduct" className="scroll-mt-28">
                <h2 className="font-display mb-3 text-2xl font-semibold text-(--w-green-deep)">
                  User Conduct
                </h2>
                <p className="leading-relaxed">
                  You agree not to harass, bully, or abuse other users. You
                  agree not to share inappropriate, offensive, or harmful
                  content. You agree not to impersonate other individuals or
                  misrepresent your credentials as a mentor. Violations may
                  result in immediate suspension or permanent removal from the
                  platform. All reported content is reviewed by our
                  administration team.
                </p>
              </div>

              <div id="accounts" className="scroll-mt-28">
                <h2 className="font-display mb-3 text-2xl font-semibold text-(--w-green-deep)">
                  Accounts
                </h2>
                <p className="leading-relaxed">
                  You are responsible for maintaining the confidentiality of
                  your account credentials and for all activity that occurs
                  under your account. Notify us immediately of any unauthorised
                  use of your account. Mentor accounts are subject to
                  verification before access to mentorship features is granted.
                </p>
              </div>

              <div id="limitation-of-liability" className="scroll-mt-28">
                <h2 className="font-display mb-3 text-2xl font-semibold text-(--w-green-deep)">
                  Limitation of Liability
                </h2>
                <p className="leading-relaxed">
                  Ikigai provides the platform on an "as is" basis. We do not
                  guarantee that the service will be uninterrupted or
                  error-free. To the maximum extent permitted by law, Ikigai
                  Digital shall not be liable for any indirect, incidental, or
                  consequential damages arising from your use of the platform.
                </p>
              </div>

              <div id="governing-law" className="scroll-mt-28">
                <h2 className="font-display mb-3 text-2xl font-semibold text-(--w-green-deep)">
                  Governing Law
                </h2>
                <p className="leading-relaxed">
                  These terms are governed by the laws of Sierra Leone. Any
                  disputes arising from the use of Ikigai shall be subject to
                  the jurisdiction of the courts of Sierra Leone. For questions
                  about these terms, contact us at{" "}
                  <a
                    href="mailto:hello@ikigai.app"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    hello@ikigai.app
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
