"use client";

import { useEffect, useRef } from "react";

const RESOURCE_MARKERS = [
  { pos: [8.4897, -13.2319] as [number, number], name: "Connaught Hospital", type: "Reproductive Health", phone: "+232 22 222 401" },
  { pos: [8.4789, -13.2556] as [number, number], name: "Rainbo Initiative", type: "Sexual Violence Support", phone: "+232 76 625 525" },
  { pos: [8.4723, -13.2345] as [number, number], name: "Aberdeen Women's Centre", type: "Maternal Health", phone: "+232 76 000 123" },
  { pos: [8.4601, -13.2298] as [number, number], name: "UNFPA Sierra Leone", type: "Family Planning", phone: "+232 22 237 701" },
  { pos: [8.4812, -13.2201] as [number, number], name: "Police Family Support Unit", type: "GBV Support", phone: "+232 76 644 401" },
];

export default function ResourceMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current || !mapRef.current) return;
    initialised.current = true;

    let mapInstance: ReturnType<typeof import("leaflet")["map"]> | null = null;

    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      // Fix default icon path broken by webpack/turbopack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;
      mapInstance = L.map(mapRef.current).setView([8.4657, -13.2317], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(mapInstance);

      RESOURCE_MARKERS.forEach(({ pos, name, type, phone }) => {
        L.marker(pos)
          .addTo(mapInstance!)
          .bindPopup(
            `<strong style="font-size:13px">${name}</strong><br/><span style="color:#5C5A55">${type}</span><br/><a href="tel:${phone}" style="color:#1A5C3A">${phone}</a>`
          );
      });
    });

    return () => {
      mapInstance?.remove();
      initialised.current = false;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: "300px" }}
      className="rounded-2xl overflow-hidden border border-border"
    />
  );
}
