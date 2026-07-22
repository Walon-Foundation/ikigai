"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type Photo = { id: string; imageUrl: string; caption: string | null };
type Album = { album: string; items: Photo[] };

// Album grids with a tap-to-enlarge lightbox. Images below the fold load lazily
// (next/image default) — the gallery is the heaviest page on the site, and on a
// metered connection nobody should pay to download a photo they scroll past.
export function GalleryGrid({ albums }: { albums: Album[] }) {
  const [active, setActive] = useState<Photo | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="space-y-16">
        {albums.map((album) => (
          <section key={album.album}>
            <h2 className="font-display mb-6 text-2xl font-bold text-foreground">
              {album.album}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {album.items.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActive(photo)}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-secondary"
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption ?? ""}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* A real button as the backdrop: clicking (or Enter/Space) closes,
              and Escape is handled above — so keyboard users have three ways
              out and the image on top is never itself interactive. */}
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute inset-0 size-full cursor-default bg-transparent"
          />
          <span className="pointer-events-none absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white">
            <X className="size-5" />
          </span>
          <div className="pointer-events-none relative max-h-[85vh] max-w-4xl">
            <Image
              src={active.imageUrl}
              alt={active.caption ?? ""}
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            {active.caption && (
              <p className="mt-3 text-center text-sm text-white/80">
                {active.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
