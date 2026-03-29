import { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function Section(
  props: PropsWithChildren<{
    title: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
  }>
) {
  return (
    <Card className={cn("p-5", props.className)}>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-zinc-900">{props.title}</h2>
          {props.subtitle ? <p className="mt-1 text-sm text-zinc-500">{props.subtitle}</p> : null}
        </div>
        {props.action ? <div className="sm:pt-0.5">{props.action}</div> : null}
      </div>
      {props.children}
    </Card>
  );
}

