"use client";

import { useEffect } from "react";

export function LiteModeInit() {
  useEffect(() => {
    const lite = localStorage.getItem("liteMode") === "true";
    document.documentElement.setAttribute("data-lite", String(lite));
  }, []);

  return null;
}
