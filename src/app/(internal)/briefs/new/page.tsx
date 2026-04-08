import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { BriefForm } from "./brief-form";

export default async function NewBriefPage() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true } });
  return (
    <PageShell title="New brief" subtitle="Create a production brief and assign your internal team">
      <Section title="Brief details">
        <BriefForm clients={clients} scopes={[]} />
      </Section>
    </PageShell>
  );
}
