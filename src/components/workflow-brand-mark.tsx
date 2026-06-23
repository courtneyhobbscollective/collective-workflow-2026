import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Defaults to `/login`. Pass `null` to render a non-link brand row. */
  href?: string | null;
  /** Text colour for “Workflow” */
  variant?: "stone" | "zinc";
  className?: string;
  /** Icon-only mark for collapsed sidebar */
  compact?: boolean;
};

export function WorkflowBrandMark({ href = "/login", variant = "stone", className, compact = false }: Props) {
  const textClass = variant === "zinc" ? "text-zinc-900" : "text-stone-900";

  const inner = (
    <>
      <Image
        src="/c-badge.svg"
        alt=""
        width={40}
        height={40}
        className={compact ? "h-9 w-9 shrink-0 object-contain" : "h-10 w-10 shrink-0 object-contain"}
        unoptimized
      />
      {compact ? null : (
        <span className={`text-[15px] font-semibold tracking-tight ${textClass}`}>Workflow</span>
      )}
    </>
  );

  const wrapClass = compact
    ? `inline-flex items-center justify-center rounded-lg p-1 transition hover:opacity-90 ${className ?? ""}`
    : `group inline-flex items-center gap-2.5 rounded-lg px-1 py-1 transition hover:opacity-90 ${className ?? ""}`;

  if (href != null) {
    return (
      <Link href={href} className={wrapClass}>
        {inner}
      </Link>
    );
  }

  return <div className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>{inner}</div>;
}
