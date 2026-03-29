import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

export function Table(props: PropsWithChildren<{ className?: string }>) {
  // Table is intentionally “lightweight” so it can be embedded inside cards/sections
  // without double borders/backgrounds.
  return <div className={cn("w-full overflow-auto", props.className)}>{props.children}</div>;
}

export function TableHeader(props: PropsWithChildren) {
  return <div className="min-w-[640px] border-b border-zinc-200">{props.children}</div>;
}

export function TableBody(props: PropsWithChildren) {
  return <div className="min-w-[640px]">{props.children}</div>;
}

export function TableRow(props: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("flex gap-3 py-3 text-sm items-center border-b border-zinc-100 last:border-b-0", props.className)}>{props.children}</div>;
}

export function TableHeadCell(props: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("flex-1 font-medium text-zinc-600", props.className)}>{props.children}</div>;
}

export function TableCell(props: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("flex-1 text-zinc-900", props.className)}>{props.children}</div>;
}

