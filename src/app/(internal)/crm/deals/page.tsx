import Link from "next/link";
import { PageShell } from "@/components/workflow/page-shell";
import { Card } from "@/components/ui";
import { loadDealBoardsIndex } from "@/lib/deals-index-data";
import { monthLabel } from "@/lib/deals/config";

export default async function DealBoardsIndexPage() {
  const boards = await loadDealBoardsIndex();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const current =
    boards.find((b) => b.year === currentYear && b.month === currentMonth) ?? boards[0] ?? null;

  return (
    <PageShell
      title="Deal boards"
      subtitle="Monthly project boards — like Monday.com — with stage, billing status, and team updates"
      action={
        current ? (
          <Link
            href={`/crm/deals/${current.id}`}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Open {current.label}
          </Link>
        ) : null
      }
    >
      {boards.length === 0 ? (
        <Card className="p-8 text-center text-sm text-zinc-500">
          No deal boards yet. Run the Monday YTD import or add boards from tooling.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/crm/deals/${board.id}`}
              className="block rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-zinc-300 hover:bg-zinc-50/50"
            >
              <p className="text-lg font-semibold text-zinc-900">{board.label}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {board.dealCount} deal{board.dealCount === 1 ? "" : "s"}
              </p>
              <p className="mt-2 text-sm font-medium tabular-nums text-zinc-800">
                {board.totalValue.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}
              </p>
              {board.year === currentYear && board.month === currentMonth ? (
                <span className="mt-3 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                  Current month
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-zinc-500">
        Tip: boards are organised as {monthLabel(currentYear, currentMonth)} style — one board per calendar month.
      </p>
    </PageShell>
  );
}
