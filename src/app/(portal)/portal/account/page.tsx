import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";

export default async function PortalAccountPage() {
  return (
    <PageShell title="Account" subtitle="Client profile settings">
      <Section title="Profile" subtitle="Placeholder for MVP settings">
        <p className="text-sm text-zinc-600">Client profile settings placeholder for MVP.</p>
      </Section>
    </PageShell>
  );
}
