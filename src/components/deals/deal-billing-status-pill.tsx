"use client";

import { cn } from "@/lib/utils";
import { billingStatusMeta } from "@/lib/deals/config";

export function DealBillingStatusPill({ status, className }: { status: string | null | undefined; className?: string }) {
  const meta = billingStatusMeta(status);
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", meta.className, className)}>
      {meta.label}
    </span>
  );
}
