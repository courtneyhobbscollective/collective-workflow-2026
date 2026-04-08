import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Card } from "@/components/ui";

export default async function CrmClientsCheckInsPage() {
  const now = new Date();
  const clients = await prisma.client.findMany({
    where: {
      status: "active",
      relationshipContactFrequencyDays: { not: null, gt: 0 },
    },
    orderBy: [{ nextRelationshipContactDueAt: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      relationshipContactFrequencyDays: true,
      nextRelationshipContactDueAt: true,
      lastRelationshipContactAt: true,
    },
  });

  const dueNow = clients.filter((c) => c.nextRelationshipContactDueAt && c.nextRelationshipContactDueAt <= now);
  const upcoming = clients.filter((c) => !c.nextRelationshipContactDueAt || c.nextRelationshipContactDueAt > now);

  return (
    <PageShell
      title="CRM check-ins"
      subtitle="Clients with a relationship cadence"
      action={
        <Link href="/crm" className="text-sm font-medium text-sky-700 hover:text-sky-900">
          CRM home
        </Link>
      }
    >
      {clients.length === 0 ? (
        <Card className="p-8 text-center text-sm text-zinc-500">
          No clients have a check-in cadence yet. Set cadence on a{" "}
          <Link href="/clients" className="font-medium text-sky-700 underline">
            client profile
          </Link>
          .
        </Card>
      ) : (
        <div className="space-y-6">
          {dueNow.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Due or overdue</h2>
              <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/40">
                {dueNow.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm transition hover:bg-amber-50/90"
                    >
                      <span className="font-medium text-zinc-900">{c.name}</span>
                      <span className="text-xs tabular-nums text-amber-900">
                        Due {c.nextRelationshipContactDueAt?.toLocaleDateString("en-GB") ?? "—"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">All cadence clients</h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Every (days)</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Last contact</th>
                    <th className="px-4 py-3">Next due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {[...dueNow, ...upcoming.filter((u) => !dueNow.some((d) => d.id === u.id))].map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/60">
                      <td className="px-4 py-3">
                        <Link href={`/clients/${c.id}`} className="font-medium text-zinc-900 hover:text-sky-800 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-700">{c.relationshipContactFrequencyDays}</td>
                      <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell">
                        {c.lastRelationshipContactAt ? c.lastRelationshipContactAt.toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {c.nextRelationshipContactDueAt ? c.nextRelationshipContactDueAt.toLocaleDateString("en-GB") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
