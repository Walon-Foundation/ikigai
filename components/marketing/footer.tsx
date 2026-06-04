import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Col 1 — Brand */}
          <div className="max-w-xs">
            <div className="mb-4 flex flex-col leading-none">
              <span className="font-display text-2xl font-black tracking-tight text-foreground">
                Ikigai
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-muted">
                Digital
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Empowering youth to discover purpose, build confidence, and
              prioritise mental wellness. Built for Sierra Leone.
            </p>
          </div>

          {/* Col 2 — Platform */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
              Platform
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/how-it-works"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Contact
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Col 3 — Legal */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ikigai Digital. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
