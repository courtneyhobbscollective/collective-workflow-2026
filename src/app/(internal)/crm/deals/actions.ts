"use server";

import type { DealStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, requireRole } from "@/lib/auth";
import { revalidateDealsCaches } from "@/lib/revalidate-caches";

async function actorName() {
  const userId = await getSessionUserId();
  if (!userId) return "Team";
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
  return u?.fullName ?? "Team";
}

export async function updateDealStage(dealId: string, stage: DealStage) {
  await requireRole(["admin"]);
  await prisma.deal.update({ where: { id: dealId }, data: { stage } });
  await revalidateDealPaths(dealId);
}

export async function updateDealBillingStatus(dealId: string, billingStatus: string) {
  await requireRole(["admin"]);
  await prisma.deal.update({
    where: { id: dealId },
    data: { billingStatus: billingStatus.trim() || null },
  });
  await revalidateDealPaths(dealId);
}

export async function addDealUpdate(dealId: string, body: string) {
  await requireRole(["admin", "team_member"]);
  const sessionUserId = await getSessionUserId();
  const trimmed = body.trim();
  if (!trimmed) return;

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { id: true } });
  if (!deal) {
    throw new Error("This deal could not be found. Refresh the page and try again.");
  }

  // Session cookies can outlive a DB reset; only link authorUserId when the user row exists.
  let authorUserId: string | null = sessionUserId;
  if (sessionUserId) {
    const user = await prisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true } });
    if (!user) authorUserId = null;
  }

  await prisma.dealUpdate.create({
    data: {
      dealId,
      authorUserId,
      authorName: await actorName(),
      body: trimmed,
    },
  });
  await revalidateDealPaths(dealId);
}

export async function createDeal(boardId: string, formData: FormData) {
  await requireRole(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const maxSort = await prisma.deal.aggregate({
    where: { boardId },
    _max: { sortOrder: true },
  });

  const deal = await prisma.deal.create({
    data: {
      boardId,
      name,
      contactName: String(formData.get("contactName") ?? "").trim() || null,
      dealValue: parseOptionalNumber(formData.get("dealValue")),
      stage: (String(formData.get("stage") ?? "lead") as DealStage) || "lead",
      billingStatus: String(formData.get("billingStatus") ?? "").trim() || null,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/crm/deals");
  revalidatePath(`/crm/deals/${boardId}`);
  revalidatePath(`/crm/deals/deal/${deal.id}`);
  revalidateDealsCaches();
}

function parseOptionalNumber(raw: FormDataEntryValue | null) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/[£,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function revalidateDealPaths(dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { boardId: true } });
  revalidatePath("/crm/deals");
  revalidateDealsCaches();
  if (deal) {
    revalidatePath(`/crm/deals/${deal.boardId}`);
    revalidatePath(`/crm/deals/deal/${dealId}`);
  }
}
