import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <section className="bg-primary pb-16 pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary-muted">
              Legal
            </p>
            <h1 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground sm:text-6xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-primary-muted">Last updated: June 2026</p>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="space-y-10 text-muted-foreground">
              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
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

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
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

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
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

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
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

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
                  Limitation of Liability
                </h2>
                <p className="leading-relaxed">
                  Ikigai provides the platform on an "as is" basis. We
                  do not guarantee that the service will be uninterrupted or
                  error-free. To the maximum extent permitted by law, Ikigai
                  Digital shall not be liable for any indirect, incidental, or
                  consequential damages arising from your use of the platform.
                </p>
              </div>

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
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
