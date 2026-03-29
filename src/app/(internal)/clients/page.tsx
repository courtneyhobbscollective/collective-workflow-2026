import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { ClientStatusPill } from "@/components/workflow/status-pill";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <PageShell
      title="Clients"
      subtitle="Manage clients, contacts, and delivery scope"
      action={<Link href="/clients/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">New client</Link>}
    >
      {clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Create your first client to start scoping and briefing work." ctaHref="/clients/new" ctaLabel="Create client" />
      ) : (
        <Section title="All clients" subtitle="Most recent first">
          <Table>
            <TableHeader>
              <div className="flex gap-3 py-3">
                <TableHeadCell className="flex-[2]">Client</TableHeadCell>
                <TableHeadCell className="flex-[1]">Engagement</TableHeadCell>
                <TableHeadCell className="flex-[1]">Status</TableHeadCell>
                <TableHeadCell className="flex-[1]">Created</TableHeadCell>
                <TableHeadCell className="flex-[0.5]" />
              </div>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <Link key={c.id} href={`/clients/${c.id}`} className="block">
                  <TableRow className="hover:bg-zinc-50 transition-colors">
                    <TableCell className="flex-[2] min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-900">{c.name}</div>
                      <div className="mt-0.5 truncate text-xs text-zinc-500">{c.brandSummary ? c.brandSummary : "No summary yet."}</div>
                    </TableCell>
                    <TableCell className="flex-[1]">
                      <Badge className={c.engagementType === "retainer" ? "bg-violet-100 text-violet-900" : ""}>
                        {c.engagementType === "retainer" ? "Retainer" : "Project"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex-[1]">
                      <ClientStatusPill status={c.status} />
                    </TableCell>
                    <TableCell className="flex-[1]">
                      <div className="text-sm text-zinc-900">{new Date(c.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="flex-[0.5] text-right text-sm text-zinc-600">
                      View
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
