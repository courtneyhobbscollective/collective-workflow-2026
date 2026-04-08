"use server";

import { BriefType } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionRole, getSessionUserId, requireRole } from "@/lib/auth";
import { ensureLeadFollowUpReminders } from "@/lib/crm/lead-follow-up-reminders";
import { ensureLeadsTeamChannel } from "@/lib/team-chat";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function parseFloatOrNull(raw: string) {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseReminderDays(raw: string): number | null {
  const n = Number(raw.trim());
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 7) return null;
  return n;
}

/** Existing CRM client when the lead was created with "Yes" (kept in JSON so Prisma client matches after hot reload). */
function getLeadLinkedExistingClientId(quoteSnapshot: unknown): string | null {
  if (!quoteSnapshot || typeof quoteSnapshot !== "object") return null;
  const v = (quoteSnapshot as Record<string, unknown>).linkedExistingClientId;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function mergeLeadSnapshot(quoteSnapshot: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base = quoteSnapshot && typeof quoteSnapshot === "object" && !Array.isArray(quoteSnapshot)
    ? ({ ...(quoteSnapshot as Record<string, unknown>) })
    : {};
  return { ...base, ...patch };
}

async function resolveLeadConversionTarget(leadId: string): Promise<{ ok: true; mode: "existing_client"; clientId: string } | { ok: true; mode: "new_client" } | { ok: false; error: string }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, status: true, quoteSnapshot: true },
  });
  if (!lead) return { ok: false, error: "not-found" };
  if (lead.status === "lost") return { ok: false, error: "already-closed" };

  const linkedCrmClientId = getLeadLinkedExistingClientId(lead.quoteSnapshot);
  if (linkedCrmClientId) return { ok: true, mode: "existing_client", clientId: linkedCrmClientId };

  const role = await getSessionRole();
  if (role !== "admin") return { ok: false, error: "admin-required-new-client" };
  return { ok: true, mode: "new_client" };
}

export async function createLead(formData: FormData) {
  await requireRole(["admin", "team_member"]);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const existingClientAnswer = String(formData.get("existingClientAnswer") ?? "").trim().toLowerCase();
  const existingClientId = String(formData.get("existingClientId") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const companyNameFromForm = String(formData.get("companyName") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const potentialDealValue = parseFloatOrNull(String(formData.get("potentialDealValue") ?? ""));
  const workTypeRaw = String(formData.get("workType") ?? "").trim();
  const workType = workTypeRaw ? (workTypeRaw as BriefType) : null;
  const notes = String(formData.get("notes") ?? "").trim();
  const reminderDays = parseReminderDays(String(formData.get("reminderDays") ?? ""));

  const now = new Date();
  const nextFollowUpDueAt =
    reminderDays == null
      ? null
      : new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000);

  if (!name) return redirect("/crm/leads?error=missing-name");
  if (!email || !isValidEmail(email)) return redirect("/crm/leads?error=invalid-email");
  if (!position) return redirect("/crm/leads?error=missing-position");
  if (!phoneNumber) return redirect("/crm/leads?error=missing-telephone");
  if (potentialDealValue == null) return redirect("/crm/leads?error=missing-deal-value");
  if (!workType) return redirect("/crm/leads?error=missing-work-type");
  if (reminderDays == null) return redirect("/crm/leads?error=missing-reminder-days");

  let companyName = companyNameFromForm;
  let calendarClientId: string | undefined;
  if (existingClientAnswer === "yes") {
    if (!existingClientId) return redirect("/crm/leads?error=missing-existing-client");
    const existingClient = await prisma.client.findUnique({
      where: { id: existingClientId },
      select: { id: true, name: true },
    });
    if (!existingClient) return redirect("/crm/leads?error=missing-existing-client");
    companyName = existingClient.name;
    calendarClientId = existingClient.id;
  } else {
    if (!companyName) return redirect("/crm/leads?error=missing-company");
  }

  const sessionUserId = await getSessionUserId();
  let created: { id: string; nextFollowUpDueAt: Date | null };
  try {
    created = await prisma.lead.create({
      data: {
        name,
        email,
        position,
        companyName,
        phoneNumber,
        status: "active",
        nextFollowUpDueAt,
        notes: notes || null,
        quoteSnapshot: {
          potentialDealValue,
          workType,
          ...(calendarClientId ? { linkedExistingClientId: calendarClientId } : {}),
        },
      },
      select: { id: true, nextFollowUpDueAt: true },
    });
  } catch (error) {
    console.error("createLead: lead insert failed", error);
    return redirect("/crm/leads?error=could-not-create");
  }

  try {
    if (created.nextFollowUpDueAt) {
      const start = created.nextFollowUpDueAt;
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      await prisma.calendarBooking.create({
        data: {
          bookingType: "other",
          title: `Lead follow-up · ${name}${companyName ? ` (${companyName})` : ""}`,
          startsAt: start,
          endsAt: end,
          visibleToClient: false,
          userId: sessionUserId ?? undefined,
          clientId: calendarClientId,
        },
      });
    }

    // If the follow-up is due immediately (or in the past), ensure reminders fire right away.
    // This will create admin notifications + a system message in the Leads team channel.
    await ensureLeadFollowUpReminders();

    // Refresh relevant pages/feeds.
    revalidatePath("/crm/leads");
    revalidatePath("/dashboard");
    revalidatePath("/messages");
    revalidatePath("/calendar");

    if (created.nextFollowUpDueAt) {
      const leadsChannel = await ensureLeadsTeamChannel();
      revalidatePath(`/messages/channel/${leadsChannel.id}`);
    }
  } catch (error) {
    // Lead was created; don't show a blocking form error if follow-on reminders/calendar fail.
    // Log details so we can investigate environment/schema drift.
    console.error("createLead: post-create side effects failed", error);
  }

  return redirect("/crm/leads");
}

export type FinalizeLeadWonResult =
  | { ok: true; convertToBrief: false }
  | { ok: true; convertToBrief: true; mode: "existing_client"; clientId: string }
  | { ok: true; convertToBrief: true; mode: "new_client" }
  | { ok: false; error: string };

/** Marks the lead won. If converting to a brief, links the client record when safe and returns where to go next. */
export async function finalizeLeadWon(leadId: string, convertToBrief: boolean): Promise<FinalizeLeadWonResult> {
  await requireRole(["admin", "team_member"]);

  const id = String(leadId ?? "").trim();
  if (!id) return { ok: false, error: "missing-lead" };

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, status: true, quoteSnapshot: true },
  });
  if (!lead) return { ok: false, error: "not-found" };
  if (lead.status === "won" || lead.status === "lost") return { ok: false, error: "already-closed" };

  const resolved = await resolveLeadConversionTarget(id);
  if (!resolved.ok && convertToBrief) return resolved;
  const linkedCrmClientId = resolved.ok && resolved.mode === "existing_client" ? resolved.clientId : null;
  const now = new Date();

  if (!convertToBrief) {
    await prisma.lead.update({
      where: { id },
      data: {
        status: "won",
        wonAt: now,
        lostAt: null,
        lostReason: null,
      },
    });
    revalidatePath("/crm/leads");
    revalidatePath("/dashboard");
    return { ok: true, convertToBrief: false };
  }

  if (linkedCrmClientId) {
    const taken = await prisma.lead.findFirst({
      where: { convertedClientId: linkedCrmClientId, NOT: { id } },
      select: { id: true },
    });
    await prisma.lead.update({
      where: { id },
      data: {
        status: "won",
        wonAt: now,
        lostAt: null,
        lostReason: null,
        ...(taken ? {} : { convertedClientId: linkedCrmClientId }),
      },
    });
    revalidatePath("/crm/leads");
    revalidatePath("/dashboard");
    return { ok: true, convertToBrief: true, mode: "existing_client", clientId: linkedCrmClientId };
  }

  await prisma.lead.update({
    where: { id },
    data: {
      status: "won",
      wonAt: now,
      lostAt: null,
      lostReason: null,
    },
  });
  revalidatePath("/crm/leads");
  revalidatePath("/dashboard");
  return { ok: true, convertToBrief: true, mode: "new_client" };
}

export type BeginWonLeadConversionResult =
  | { ok: true; mode: "existing_client"; clientId: string }
  | { ok: true; mode: "new_client" }
  | { ok: false; error: string };

export async function beginWonLeadConversion(leadId: string): Promise<BeginWonLeadConversionResult> {
  await requireRole(["admin", "team_member"]);
  const id = String(leadId ?? "").trim();
  if (!id) return { ok: false, error: "missing-lead" };

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!lead) return { ok: false, error: "not-found" };
  if (lead.status !== "won") return { ok: false, error: "not-won" };

  const resolved = await resolveLeadConversionTarget(id);
  if (!resolved.ok) return resolved;
  return resolved;
}

export async function markLeadLost(leadId: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["admin", "team_member"]);

  const id = String(leadId ?? "").trim();
  if (!id) return { ok: false, error: "missing-lead" };

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!lead) return { ok: false, error: "not-found" };
  if (lead.status === "won" || lead.status === "lost") return { ok: false, error: "already-closed" };

  await prisma.lead.update({
    where: { id },
    data: {
      status: "lost",
      lostAt: new Date(),
      wonAt: null,
    },
  });
  revalidatePath("/crm/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}

