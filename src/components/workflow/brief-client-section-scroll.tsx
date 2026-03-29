"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** When `?clientSection=1` is present, scroll to client-facing updates and focus the message field. */
export function BriefClientSectionScroll() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("clientSection") !== "1") return;
    const t = window.setTimeout(() => {
      document.getElementById("client-facing-updates")?.scrollIntoView({ behavior: "smooth", block: "start" });
      const ta = document.querySelector<HTMLTextAreaElement>(
        "#client-facing-updates textarea[name=\"content\"]"
      );
      ta?.focus();
      const len = ta?.value.length ?? 0;
      ta?.setSelectionRange(len, len);
    }, 150);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  return null;
}
