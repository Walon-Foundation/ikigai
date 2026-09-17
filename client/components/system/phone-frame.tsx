import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A real app screenshot in a phone. The guide's rule: screenshots are current
 * captures of the real app and never show demo people
 * (docs/05-design-guide.md, "Show the real product").
 *
 * The phone draws its own clean status bar (time, signal, battery, camera), so
 * screenshots are exported without the device's own, which shows personal
 * notification icons: crop a 720x1600 capture to 720x1540 from y=60. They are
 * served as-is (`unoptimized`): already small WebPs, and a second lossy pass
 * through the optimiser made the app's text soft. Give each new export a new
 * filename, so no cached copy of an old one is served.
 */
export function PhoneFrame({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        // 8px bezel + 26px status bar + a 720:1540 screen, at 250px wide.
        "relative aspect-[250/543] w-[250px] rounded-[44px] bg-[#101813] p-[8px] shadow-[0_40px_80px_-20px_rgb(0_0_0/0.45),0_0_0_1px_rgb(255_255_255/0.14)]",
        className,
      )}
    >
      {/* Side buttons */}
      <span
        aria-hidden
        className="absolute top-[22%] -right-[2px] h-[12%] w-[3px] rounded-r bg-[#101813]"
      />
      <span
        aria-hidden
        className="absolute top-[38%] -right-[2px] h-[6%] w-[3px] rounded-r bg-[#101813]"
      />

      <div className="flex h-full w-full flex-col overflow-hidden rounded-[36px] bg-[#F6FBF4]">
        {/* Status bar */}
        <div
          aria-hidden
          className="relative flex h-[26px] shrink-0 items-center justify-between px-[22px] pt-[3px] text-[9.5px] font-semibold text-[#1C1F1B]"
        >
          <span className="tabular-nums">9:41</span>
          <span className="absolute top-[8px] left-1/2 size-[10px] -translate-x-1/2 rounded-full bg-[#101813]" />
          <span className="flex items-center gap-[4px]">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 12"
              className="h-[8px] w-auto"
              fill="currentColor"
            >
              <rect x="0" y="8" width="3" height="4" rx="0.6" />
              <rect x="4.3" y="5.5" width="3" height="6.5" rx="0.6" />
              <rect x="8.6" y="3" width="3" height="9" rx="0.6" />
              <rect x="12.9" y="0" width="3" height="12" rx="0.6" />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 12"
              className="h-[8px] w-auto"
            >
              <rect
                x="0.75"
                y="0.75"
                width="19.5"
                height="10.5"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              <rect
                x="2.5"
                y="2.5"
                width="13"
                height="7"
                rx="1.6"
                fill="currentColor"
              />
              <rect
                x="21.5"
                y="4"
                width="1.8"
                height="4"
                rx="0.9"
                fill="currentColor"
                fillOpacity="0.45"
              />
            </svg>
          </span>
        </div>

        {/* Screen */}
        <div className="relative min-h-0 flex-1">
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            priority={priority}
            className="object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}
