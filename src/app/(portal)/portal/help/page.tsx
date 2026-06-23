import { PageShell } from "@/components/workflow/page-shell";
import { HelpCenter } from "@/components/help/help-center";

export default function PortalHelpPage() {
  return (
    <PageShell
      title="Help"
      subtitle="How to use your client portal — briefs, messages, and delivery updates"
    >
      <HelpCenter audience="client" />
    </PageShell>
  );
}
