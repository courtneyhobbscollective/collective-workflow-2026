import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Badge, Card } from "@/components/ui";

export default async function CrmLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { convertedClient: { select: { id: true, name: true } } },
  });
  if (!lead) return notFound();

  const { potentialDealValue, workType } = extractLeadQuoteSnapshot(lead.quoteSnapshot);

  return (
    <PageShell
      title={lead.name}
      subtitle={lead.companyName ?? lead.email}
      action={
        <Link href="/crm/leads" className="text-sm font-medium text-sky-700 hover:text-sky-900">
          ← All leads
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Email</dt>
              <dd className="text-zinc-800">{lead.email}</dd>
            </div>
            {lead.phoneNumber ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500">Phone</dt>
                <dd className="text-zinc-800">{lead.phoneNumber}</dd>
              </div>
            ) : null}
            {lead.position ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500">Position</dt>
                <dd className="text-zinc-800">{lead.position}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Pipeline</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Status</dt>
              <dd className="mt-1">
                <Badge className="capitalize">{lead.status.replace(/_/g, " ")}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Last contacted</dt>
              <dd className="text-zinc-800">
                {lead.lastContactedAt ? lead.lastContactedAt.toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Next follow-up</dt>
              <dd className="text-zinc-800">
                {lead.nextFollowUpDueAt ? lead.nextFollowUpDueAt.toLocaleString() : "—"}
              </dd>
            </div>
            {typeof potentialDealValue === "number" ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500">Potential value</dt>
                <dd className="text-zinc-800">{potentialDealValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd>
              </div>
            ) : null}
            {typeof workType === "string" && workType.trim() ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500">Type of work</dt>
                <dd className="text-zinc-800">{workType}</dd>
              </div>
            ) : null}
            {lead.convertedClient ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500">Converted client</dt>
                <dd>
                  <Link href={`/clients/${lead.convertedClient.id}`} className="font-medium text-sky-700 hover:underline">
                    {lead.convertedClient.name}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>
      </div>
      {lead.notes ? (
        <Card className="mt-4 p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{lead.notes}</p>
        </Card>
      ) : null}
    </PageShell>
  );
}

function extractLeadQuoteSnapshot(
  quoteSnapshot: unknown
): { potentialDealValue: number | null; workType: string | null } {
  if (!quoteSnapshot || typeof quoteSnapshot !== "object") return { potentialDealValue: null, workType: null };
  const q = quoteSnapshot as Record<string, unknown>;

  const potential = q.potentialDealValue;
  const potentialDealValue =
    typeof potential === "number"
      ? potential
      : typeof potential === "string" && potential.trim()
        ? Number(potential)
        : null;

  const workType = typeof q.workType === "string" ? q.workType : null;
  return {
    potentialDealValue: potentialDealValue == null || !Number.isFinite(potentialDealValue) ? null : potentialDealValue,
    workType: workType && workType.trim() ? workType : null,
  };
}
