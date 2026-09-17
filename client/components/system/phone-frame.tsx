import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A real app screenshot in a phone bezel. The guide's rule: screenshots are
 * current captures of the real app and never show demo people
 * (docs/05-design-guide.md, "Show the real product").
 *
 * Export screenshots at 360:770 with the phone's status bar removed, a clean
 * top band (56px at 720 wide) and 16px side margins in the app's background
 * colour, so the header clears the frame's rounded corners.
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
        "relative aspect-[360/770] w-[250px] rounded-[42px] bg-[#0B1510] p-[9px] shadow-[0_30px_60px_rgb(0_0_0/0.3),0_0_0_1px_rgb(255_255_255/0.08)]",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#F5F7F2]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="250px"
          priority={priority}
          className="object-cover object-top"
        />
        {/* Front camera. The screenshots are exported with a clean band above
            the app's header for it, so no app content sits under the curve. */}
        <span
          aria-hidden
          className="absolute top-[7px] left-1/2 size-[9px] -translate-x-1/2 rounded-full bg-[#0B1510]"
        />
      </div>
    </div>
  );
}
