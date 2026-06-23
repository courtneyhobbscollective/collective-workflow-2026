import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

export type DealBoardIndexRow = {
  id: string;
  label: string;
  year: number;
  month: number;
  dealCount: number;
  totalValue: number;
};

async function fetchDealBoardsIndex(): Promise<DealBoardIndexRow[]> {
  const [boards, valueByBoard] = await Promise.all([
    prisma.dealBoard.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: {
        id: true,
        label: true,
        year: true,
        month: true,
        _count: { select: { deals: true } },
      },
    }),
    prisma.deal.groupBy({
      by: ["boardId"],
      _sum: { dealValue: true },
    }),
  ]);

  const totals = new Map(valueByBoard.map((row) => [row.boardId, row._sum.dealValue ?? 0]));

  return boards.map((b) => ({
    id: b.id,
    label: b.label,
    year: b.year,
    month: b.month,
    dealCount: b._count.deals,
    totalValue: totals.get(b.id) ?? 0,
  }));
}

export function loadDealBoardsIndex() {
  return unstable_cache(fetchDealBoardsIndex, ["deals-index-v1"], {
    revalidate: 60,
    tags: [CACHE_TAGS.dealsIndex],
  })();
}

export type DealBoardTab = { id: string; label: string };

async function fetchDealBoardTabs(): Promise<DealBoardTab[]> {
  return prisma.dealBoard.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { id: true, label: true },
  });
}

export function loadDealBoardTabs() {
  return unstable_cache(fetchDealBoardTabs, ["deal-board-tabs-v1"], {
    revalidate: 120,
    tags: [CACHE_TAGS.dealBoardTabs, CACHE_TAGS.dealsIndex],
  })();
}
