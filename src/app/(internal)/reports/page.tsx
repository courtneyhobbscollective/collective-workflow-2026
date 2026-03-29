import { Badge } from "@/components/ui";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const [completed, hours] = await Promise.all([
    prisma.brief.count({ where: { status: "completed" } }),
    prisma.timeLog.aggregate({ _sum: { hoursSpent: true } })
  ]);
  return (
    <PageShell title="Reports" subtitle="A lightweight view into delivery performance">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title="Completed briefs" subtitle="Overall completion count">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-3xl font-semibold tracking-tight text-zinc-900">{completed}</p>
            <Badge>Completed</Badge>
          </div>
        </Section>
        <Section title="Logged hours" subtitle="Total hours from time logs">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-3xl font-semibold tracking-tight text-zinc-900">{hours._sum.hoursSpent ?? 0}</p>
            <Badge>Hours</Badge>
          </div>
        </Section>
      </div>
    </PageShell>
  );
}
