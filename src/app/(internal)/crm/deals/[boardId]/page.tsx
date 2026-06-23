import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/workflow/page-shell";
import { Card } from "@/components/ui";
import { DealBoardTable } from "@/components/deals/deal-board-table";
import { DEAL_BILLING_STATUS_OPTIONS, DEAL_STAGE_OPTIONS } from "@/lib/deals/config";
import { loadDealBoardTabs } from "@/lib/deals-index-data";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/auth";
import { createDeal } from "@/app/(internal)/crm/deals/actions";

export default async function DealBoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const role = await getSessionRole();
  const isAdmin = role === "admin";

  const [board, boards] = await Promise.all([
    prisma.dealBoard.findUnique({
      where: { id: boardId },
      include: {
        deals: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            client: { select: { name: true } },
            _count: { select: { updates: true } },
          },
        },
      },
    }),
    loadDealBoardTabs(),
  ]);
  if (!board) return notFound();

  const rows = board.deals.map((d) => ({
    id: d.id,
    name: d.name,
    stage: d.stage,
    billingStatus: d.billingStatus,
    dealValue: d.dealValue,
    contactName: d.contactName,
    clientName: d.client?.name ?? null,
    updateCount: d._count.updates,
  }));

  return (
    <PageShell
      title={board.label}
      subtitle="Monthly deal board — stage tracks production, status tracks billing"
      action={
        <Link href="/crm/deals" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          All boards
        </Link>
      }
      headerExtra={
        <div className="flex flex-wrap gap-2">
          {boards.map((b) => (
            <Link
              key={b.id}
              href={`/crm/deals/${b.id}`}
              className={
                b.id === board.id
                  ? "rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white"
                  : "rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              }
            >
              {b.label}
            </Link>
          ))}
        </div>
      }
    >
      <Card className="overflow-hidden p-0">
        <DealBoardTable boardId={board.id} deals={rows} canEdit={isAdmin} />
      </Card>

      {isAdmin ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Add deal</h2>
          <form action={createDeal.bind(null, board.id)} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input name="name" required placeholder="Deal name" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <input name="contactName" placeholder="Contact" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <input name="dealValue" placeholder="Value (£)" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" />
            <select name="stage" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" defaultValue="lead">
              {DEAL_STAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select name="billingStatus" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm" defaultValue="">
              <option value="">Billing status</option>
              {DEAL_BILLING_STATUS_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 sm:col-span-2 lg:col-span-1">
              Add deal
            </button>
          </form>
        </Card>
      ) : null}
    </PageShell>
  );
}
