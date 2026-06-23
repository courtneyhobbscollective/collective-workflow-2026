import { HelpHint } from "@/components/help/help-hint";
import { PropsWithChildren, ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function Section(
  props: PropsWithChildren<{
    title: string;
    subtitle?: string;
    helpArticleId?: string;
    helpBasePath?: string;
    action?: ReactNode;
    className?: string;
  }>
) {
  return (
    <Card className={cn("p-5", props.className)}>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="inline-flex flex-wrap items-center gap-1.5 text-base font-medium text-zinc-900">
            {props.title}
            {props.helpArticleId ? (
              <HelpHint articleId={props.helpArticleId} helpBasePath={props.helpBasePath ?? "/help"} />
            ) : null}
          </h2>
          {props.subtitle ? <p className="mt-1 text-sm text-zinc-500">{props.subtitle}</p> : null}
        </div>
        {props.action ? <div className="sm:pt-0.5">{props.action}</div> : null}
      </div>
      {props.children}
    </Card>
  );
}

