import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { PriorityPill, ScopePill, StatusPill } from "@/components/workflow/status-pill";
import { Table, TableBody, TableHeadCell, TableHeader, TableRow, TableCell } from "@/components/ui/table";

export default async function BriefsPage() {
  const briefs = await prisma.brief.findMany({ include: { client: true }, orderBy: { deadline: "asc" } });
  return (
    <PageShell
      title="Briefs"
      subtitle="Manage production briefs, assignments, deliverables, and delivery milestones"
      action={<Link href="/briefs/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">New brief</Link>}
    >
      {briefs.length === 0 ? (
        <EmptyState title="No briefs yet" body="Create a brief to start assigning your team and tracking delivery." ctaHref="/briefs/new" ctaLabel="Create brief" />
      ) : (
        <Section title="Active and upcoming" subtitle="Sorted by deadline">
          <Table>
            <TableHeader>
              <div className="flex gap-3 py-3">
                <TableHeadCell className="flex-[2]">Brief</TableHeadCell>
                <TableHeadCell className="flex-[1]">Deadline</TableHeadCell>
                <TableHeadCell className="flex-[0.8]">Urgency</TableHeadCell>
                <TableHeadCell className="flex-[1]">Status</TableHeadCell>
                <TableHeadCell className="flex-[1]">Delivery fit</TableHeadCell>
              </div>
            </TableHeader>
            <TableBody>
              {briefs.map((b) => (
                <Link key={b.id} href={`/briefs/${b.id}`} className="block">
                  <TableRow className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <TableCell className="flex-[2] min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-900">{b.title}</div>
                      <div className="mt-0.5 truncate text-xs text-zinc-500">{b.client.name}</div>
                    </TableCell>
                    <TableCell className="flex-[1]">
                      <div className="text-sm text-zinc-900">{new Date(b.deadline).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="flex-[0.8]">
                      <PriorityPill priority={b.priority} />
                    </TableCell>
                    <TableCell className="flex-[1]">
                      <StatusPill status={b.status} />
                    </TableCell>
                    <TableCell className="flex-[1]">
                      <ScopePill scopeStatus={b.scopeStatus} />
                    </TableCell>
                  </TableRow>
                </Link>
              ))}
            </TableBody>
          </Table>
        </Section>
      )}
    </PageShell>
  );
}
