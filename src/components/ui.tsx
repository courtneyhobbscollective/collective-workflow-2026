import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

import Link from "next/link";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)}>{children}</div>;
}

export function Badge({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <span className={cn("rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700", className)}>{children}</span>;
}

export function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="flex min-h-40 flex-col items-center justify-center text-center">
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-zinc-500">{body}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </Card>
  );
}
