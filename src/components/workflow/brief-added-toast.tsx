"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Avoids `useSearchParams()` here so we don't trigger Next.js CSR bailout / missing
 * Suspense issues on static or partially prerendered routes.
 */
export function BriefAddedToast() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("created") !== "1") return;

    setOpen(true);

    const t1 = window.setTimeout(() => setOpen(false), 2200);
    const t2 = window.setTimeout(() => {
      params.delete("created");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 2600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname, router]);

  const cls = useMemo(() => {
    return open
      ? "translate-y-0 opacity-100"
      : "translate-y-2 opacity-0 pointer-events-none";
  }, [open]);

  return (
    <div className={`fixed bottom-5 left-5 z-50 transition-all duration-300 ${cls}`}>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="success-check flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200/80">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-700" fill="none" aria-hidden="true">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900">Brief added</p>
          <p className="text-xs text-zinc-500">Ready for assignments and deliverables.</p>
        </div>
      </div>
    </div>
  );
}
