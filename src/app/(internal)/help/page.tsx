import { PageShell } from "@/components/workflow/page-shell";
import { HelpCenter } from "@/components/help/help-center";

export default function HelpPage() {
  return (
    <PageShell
      title="Help & guides"
      subtitle="Searchable documentation for how Workflow works — share links to specific sections with your team"
    >
      <HelpCenter audience="staff" />
    </PageShell>
  );
}
