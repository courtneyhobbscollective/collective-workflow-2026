/**
 * Import Monday.com YTD deal boards (2025–2026) + updates.
 *
 *   npx tsx scripts/import-monday-deals.ts /path/to/YTD.xlsx
 *   npx tsx scripts/import-monday-deals.ts /path/to/YTD.xlsx --apply
 */

import { PrismaClient } from "@prisma/client";
import { loadDatabaseUrlFromEnvFiles } from "../src/lib/load-database-url";
import { parseYtdDealsFromWorkbook, parseYtdUpdatesFromWorkbook } from "../src/lib/deals/parse-ytd-xlsx";

loadDatabaseUrlFromEnvFiles();

function normKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  const filePath = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-monday-deals.ts /path/to/YTD.xlsx [--apply]");
    process.exit(1);
  }

  const deals = parseYtdDealsFromWorkbook(filePath, [2025, 2026]);
  const updates = parseYtdUpdatesFromWorkbook(filePath);

  const byBoard: Record<string, number> = {};
  for (const d of deals) byBoard[d.boardLabel] = (byBoard[d.boardLabel] || 0) + 1;

  console.log(`Parsed ${deals.length} deals across ${Object.keys(byBoard).length} boards (2025–2026).`);
  console.log(`Parsed ${updates.length} updates.`);
  console.log(apply ? "MODE: apply" : "MODE: dry run");

  const prisma = new PrismaClient();
  let boardsCreated = 0;
  let dealsCreated = 0;
  let dealsSkipped = 0;
  let updatesCreated = 0;

  try {
    const clients = await prisma.client.findMany({ select: { id: true, name: true } });
    const clientByName = new Map(clients.map((c) => [normKey(c.name), c.id]));

    const boardCache = new Map<string, string>();

    for (const row of deals) {
      const boardKey = `${row.year}-${row.month}`;
      let boardId = boardCache.get(boardKey);

      if (!boardId) {
        const existing = await prisma.dealBoard.findUnique({
          where: { year_month: { year: row.year, month: row.month } },
        });
        if (existing) {
          boardId = existing.id;
        } else if (apply) {
          const board = await prisma.dealBoard.create({
            data: { label: row.boardLabel, year: row.year, month: row.month },
          });
          boardId = board.id;
          boardsCreated++;
        } else {
          boardsCreated++;
          boardId = `dry-${boardKey}`;
        }
        boardCache.set(boardKey, boardId);
      }

      if (row.mondayItemId && apply) {
        const dup = await prisma.deal.findUnique({ where: { mondayItemId: row.mondayItemId } });
        if (dup) {
          dealsSkipped++;
          continue;
        }
      }

      const clientId = row.account ? clientByName.get(normKey(row.account)) ?? null : null;

      if (!apply) {
        dealsCreated++;
        continue;
      }

      await prisma.deal.create({
        data: {
          boardId,
          name: row.name,
          clientId,
          contactName: row.contact,
          stage: row.stage,
          billingStatus: row.billingStatus,
          dealValue: row.dealValue,
          notes: row.notes,
          mondayItemId: row.mondayItemId,
          sortOrder: dealsCreated,
        },
      });
      dealsCreated++;
    }

    if (apply) {
      const dealByMondayId = new Map(
        (
          await prisma.deal.findMany({
            where: { mondayItemId: { not: null } },
            select: { id: true, mondayItemId: true },
          })
        ).map((d) => [d.mondayItemId!, d.id])
      );

      for (const u of updates) {
        const dealId = dealByMondayId.get(u.mondayItemId);
        if (!dealId) continue;
        if (u.mondayPostId) {
          const exists = await prisma.dealUpdate.findFirst({ where: { mondayPostId: u.mondayPostId } });
          if (exists) continue;
        }
        await prisma.dealUpdate.create({
          data: {
            dealId,
            authorName: u.authorName,
            body: u.body,
            createdAt: u.createdAt,
            mondayPostId: u.mondayPostId,
          },
        });
        updatesCreated++;
      }
    } else {
      updatesCreated = updates.length;
    }

    console.log("\n---");
    console.log({ boardsCreated, dealsCreated, dealsSkipped, updatesCreated });
  } finally {
    await prisma.$disconnect();
  }
}

void main();
