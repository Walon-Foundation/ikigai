import { cn } from "@/lib/utils";

// Derive up to two initials from a display name. Falls back to "?" for empty.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Shared avatar: renders the uploaded photo when present, otherwise the
// person's initials on a tinted circle. Centralises the initials-avatar
// pattern that was duplicated across mentor/mentee/marketplace views.
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const dimension = { width: size, height: size };
  if (src) {
    return (
      // biome-ignore lint/performance/noImgElement: tiny avatars from arbitrary hosts (UploadThing, Clerk) — plain <img> avoids per-host next/image config.
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        style={dimension}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={dimension}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary",
        className,
      )}
    >
      <span style={{ fontSize: Math.round(size * 0.4) }}>
        {initialsOf(name)}
      </span>
    </div>
  );
}
