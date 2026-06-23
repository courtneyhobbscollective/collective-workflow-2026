"use client";

import type { DealStage } from "@prisma/client";
import { cn } from "@/lib/utils";
import { dealStageMeta } from "@/lib/deals/config";

export function DealStagePill({ stage, className }: { stage: DealStage; className?: string }) {
  const meta = dealStageMeta(stage);
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", meta.className, className)}>
      {meta.label}
    </span>
  );
}
