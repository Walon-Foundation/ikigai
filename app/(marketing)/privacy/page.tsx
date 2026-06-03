import { Footer } from "@/components/marketing/footer";
import { Nav } from "@/components/marketing/nav";

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-4 text-primary-muted">Last updated: June 2026</p>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="space-y-10 text-muted-foreground">
              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
                  What We Collect
                </h2>
                <p className="leading-relaxed">
                  We collect information you provide when creating an account,
                  completing the Ikigai assessment, communicating with mentors,
                  or contacting us. This includes your name, email address, date
                  of birth, location, and responses to the purpose and
                  personality assessments. We also collect usage data such as
                  pages visited, features used, and session duration to improve
                  the platform.
                </p>
              </div>

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
                  How We Use It
                </h2>
                <p className="leading-relaxed">
                  We use your information to provide and improve the Ikigai
                  platform, match you with suitable mentors, track your progress
                  through the developmental roadmap, send you relevant
                  notifications and updates, ensure the safety of all users
                  through content moderation, and comply with our legal
                  obligations. We do not sell your personal data to third
                  parties.
                </p>
              </div>

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
                  Data Storage
                </h2>
                <p className="leading-relaxed">
                  Your data is stored securely using industry-standard
                  encryption. We use trusted cloud infrastructure providers.
                  Journal entries and personal assessments are stored in
                  encrypted databases and are accessible only to you and, where
                  you choose to share them, your assigned mentor. We retain your
                  data for as long as your account is active or as required by
                  law.
                </p>
              </div>

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
                  Your Rights
                </h2>
                <p className="leading-relaxed">
                  You have the right to access, correct, or delete your personal
                  data at any time by contacting us or through your account
                  settings. You may withdraw consent for non-essential data
                  processing at any time. If you are under 18, a parent or
                  guardian may exercise these rights on your behalf. To request
                  data deletion or export, contact us at the address below.
                </p>
              </div>

              <div>
                <h2 className="font-display mb-3 text-2xl font-bold text-foreground">
                  Contact
                </h2>
                <p className="leading-relaxed">
                  For privacy-related questions or requests, contact us at{" "}
                  <a
                    href="mailto:hello@ikigai.app"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    hello@ikigai.app
                  </a>
                  . We will respond within 30 days.
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
