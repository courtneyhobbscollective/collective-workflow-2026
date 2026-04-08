import { Card } from "@/components/ui";
import { PropsWithChildren, ReactNode } from "react";

export function PageShell(
  props: PropsWithChildren<{
    title: string;
    subtitle?: ReactNode;
    /** Renders under the subtitle without muted text styling (e.g. status controls). */
    headerExtra?: ReactNode;
    action?: ReactNode;
    /** When true, wraps the title row in a card (pipeline / detail headers). */
    headerCard?: boolean;
  }>
) {
  const header = (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{props.title}</h1>
          {props.subtitle ? <div className="mt-1 text-sm text-zinc-500">{props.subtitle}</div> : null}
        </div>
        {props.action ? <div className="flex shrink-0 items-center sm:pt-0.5">{props.action}</div> : null}
      </div>
      {props.headerExtra ? <div>{props.headerExtra}</div> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {props.headerCard ? (
        <Card className="p-5 sm:p-6">{header}</Card>
      ) : (
        header
      )}
      {props.children}
    </div>
  );
}

