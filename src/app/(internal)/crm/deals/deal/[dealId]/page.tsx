import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { DealBillingStatusPill } from "@/components/deals/deal-billing-status-pill";
import { DealStagePill } from "@/components/deals/deal-stage-pill";
import { DealUpdatesPanel } from "@/components/deals/deal-updates-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      board: true,
      client: { select: { id: true, name: true } },
      owner: { select: { fullName: true } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!deal) return notFound();

  const updates = deal.updates.map((u) => ({
    id: u.id,
    authorName: u.authorName,
    body: u.body,
    createdAtIso: u.createdAt.toISOString(),
  }));

  return (
    <PageShell
      title={deal.name}
      subtitle={`${deal.board.label} · Deal board`}
      action={
        <Link href={`/crm/deals/${deal.boardId}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          Back to board
        </Link>
      }
      headerExtra={
        <div className="flex flex-wrap items-center gap-2">
          <DealStagePill stage={deal.stage} />
          <DealBillingStatusPill status={deal.billingStatus} />
          {deal.dealValue != null ? (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-sm font-medium tabular-nums text-zinc-800">
              {deal.dealValue.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}
            </span>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Section title="Details">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Account</dt>
                <dd className="font-medium text-zinc-900">
                  {deal.client ? (
                    <Link href={`/clients/${deal.client.id}`} className="text-sky-700 hover:underline">
                      {deal.client.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Contact</dt>
                <dd className="text-zinc-800">{deal.contactName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Owner</dt>
                <dd className="text-zinc-800">{deal.owner?.fullName ?? "—"}</dd>
              </div>
              {deal.notes ? (
                <div>
                  <dt className="text-xs text-zinc-500">Notes</dt>
                  <dd className="whitespace-pre-wrap text-zinc-700">{deal.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Section>
        </div>
        <div className="lg:col-span-8">
          <Section title="Updates" subtitle="POs, invoice notes, and handover — visible to the whole team">
            <DealUpdatesPanel dealId={deal.id} updates={updates} />
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
