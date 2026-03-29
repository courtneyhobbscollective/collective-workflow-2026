import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import type { PillTone } from "@/lib/workflow/status-meta";

export function Pill(props: PropsWithChildren<{ tone?: PillTone; className?: string }>) {
  const tone = props.tone ?? "default";
  const variants: Record<PillTone, string> = {
    default: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80",
    info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
    danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", variants[tone], props.className)}>
      {props.children}
    </span>
  );
}

