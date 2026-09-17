import { buttonClass } from "@/components/system/button";
import { clientEnv } from "@/lib/env.client";

interface InstallCtaProps {
  headline: string;
  body: string;
}

export function InstallCta({ headline, body }: InstallCtaProps) {
  return (
    <section className="pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-8 rounded-2xl bg-(--w-green-deep) px-8 py-12 text-white sm:px-14 sm:py-14 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.01em]">
              {headline}
            </h2>
            <p className="mt-3 max-w-[52ch] text-[16.5px] leading-relaxed text-(--w-on-deep)">
              {body}
            </p>
          </div>
          <a href={clientEnv.appDownloadUrl} className={buttonClass("light")}>
            Download the app, free
          </a>
        </div>
      </div>
    </section>
  );
}
