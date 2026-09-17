import { cn } from "@/lib/utils";

/**
 * The four ikigai questions as thin overlapping circles, for dark green
 * grounds. Inline SVG, decorative: the questions it names are also in the
 * page's text, so it is hidden from assistive tech and from Lite Mode.
 */
export function IkigaiDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 340"
      aria-hidden
      data-decorative
      className={cn("h-auto w-full", className)}
    >
      <g fill="none" stroke="#A9C4B2" strokeOpacity="0.55" strokeWidth="1.2">
        <circle cx="160" cy="135" r="100" />
        <circle cx="240" cy="135" r="100" />
        <circle cx="160" cy="205" r="100" />
        <circle cx="240" cy="205" r="100" />
      </g>
      <g
        fill="#A9C4B2"
        fontFamily="var(--font-dm-sans), system-ui, sans-serif"
        fontSize="10.5"
        fontWeight="600"
        letterSpacing="1.4"
        textAnchor="middle"
      >
        <text x="96" y="16">
          WHAT YOU LOVE
        </text>
        <text x="304" y="16">
          WHAT YOU&apos;RE GOOD AT
        </text>
        <text x="96" y="332">
          WHAT SUSTAINS YOU
        </text>
        <text x="304" y="332">
          WHAT THE WORLD NEEDS
        </text>
      </g>
      <circle cx="200" cy="158" r="5" fill="#FAC613" />
      <text
        x="200"
        y="192"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="var(--font-fraunces), Georgia, serif"
        fontSize="20"
        fontWeight="600"
      >
        Ikigai
      </text>
    </svg>
  );
}
