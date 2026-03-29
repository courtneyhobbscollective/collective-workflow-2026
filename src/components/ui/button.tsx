import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export function Button(
  props: PropsWithChildren<{
    tone?: ButtonTone;
    className?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }>
) {
  const tone = props.tone ?? "primary";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-60 disabled:pointer-events-none";
  const variants: Record<ButtonTone, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50",
    ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 border border-transparent",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };

  return (
    <button type={props.type ?? "button"} className={cn(base, variants[tone], props.className)} disabled={props.disabled}>
      {props.children}
    </button>
  );
}

