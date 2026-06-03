"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PwaGate() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (!isStandalone) router.replace("/install");
  }, [router]);

  return null;
}
