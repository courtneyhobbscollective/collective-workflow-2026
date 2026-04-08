import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Defaults to `/login`. Pass `null` to render a non-link brand row. */
  href?: string | null;
  /** Text colour for “Workflow” */
  variant?: "stone" | "zinc";
  className?: string;
};

export function WorkflowBrandMark({ href = "/login", variant = "stone", className }: Props) {
  const textClass = variant === "zinc" ? "text-zinc-900" : "text-stone-900";

  const inner = (
    <>
      <Image
        src="/c-badge.svg"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 object-contain"
        unoptimized
      />
      <span className={`text-[15px] font-semibold tracking-tight ${textClass}`}>Workflow</span>
    </>
  );

  const wrapClass = `group inline-flex items-center gap-2.5 rounded-lg px-1 py-1 transition hover:opacity-90 ${className ?? ""}`;

  if (href != null) {
    return (
      <Link href={href} className={wrapClass}>
        {inner}
      </Link>
    );
  }

  return <div className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>{inner}</div>;
}
