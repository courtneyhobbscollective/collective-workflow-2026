import { HelpHint } from "@/components/help/help-hint";

export function HelpSubtitle({
  text,
  articleId,
  helpBasePath = "/help",
}: {
  text: string;
  articleId: string;
  helpBasePath?: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {text}
      <HelpHint articleId={articleId} helpBasePath={helpBasePath} />
    </span>
  );
}
