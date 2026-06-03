interface InstallCtaProps {
  headline: string;
  body: string;
}

export function InstallCta({ headline, body }: InstallCtaProps) {
  const appUrl = `https://${process.env.NEXT_PUBLIC_APP_HOSTNAME ?? "app.ikigai.app"}`;

  return (
    <section className="bg-[#1C1C1A] py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display mb-5 text-4xl font-black text-[#FAFAF7] sm:text-5xl">
          {headline}
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#A8A59F]">
          {body}
        </p>
        <a
          href={appUrl}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-semibold text-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Install the App — Free
        </a>
      </div>
    </section>
  );
}
