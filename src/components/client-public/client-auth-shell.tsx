import type { ReactNode } from "react";
import { WorkflowBrandMark } from "@/components/workflow-brand-mark";

/**
 * Full-page layout for client-facing auth-style flows (/join, /join/thanks).
 * Card and type styles align with the /login page.
 */
export function ClientAuthShell(props: {
  /** Renders above the title (e.g. success icon). */
  headerExtra?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="relative mx-auto max-w-md">
        <div className="mb-8 flex flex-col items-center sm:mb-10">
          <WorkflowBrandMark href="/login" variant="zinc" />
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-6">
          {props.headerExtra ? <div className="mb-6">{props.headerExtra}</div> : null}

          {props.eyebrow ? (
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{props.eyebrow}</p>
          ) : null}

          <h1
            className={`text-center text-2xl font-semibold text-zinc-900 ${props.eyebrow ? "mt-2" : ""}`}
          >
            {props.title}
          </h1>

          {props.subtitle ? (
            <div className="mt-1 text-center text-sm text-zinc-500">{props.subtitle}</div>
          ) : null}

          <div className={props.subtitle || props.eyebrow || props.headerExtra ? "mt-5" : "mt-0"}>{props.children}</div>

          {props.footer ? (
            <div className="mt-8 border-t border-zinc-100 pt-6 text-center sm:text-left">{props.footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
