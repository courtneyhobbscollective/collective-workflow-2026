import { prisma } from "@/lib/prisma";
import { notifyAllAdmins } from "@/lib/notify-admins";
import { ensureLeadsTeamChannel } from "@/lib/team-chat";

/**
 * Creates admin notifications for pipeline leads whose follow-up date is due and
 * who have not yet been reminded for this cycle (`followUpReminderNotifiedAt` is null).
 */
export async function ensureLeadFollowUpReminders() {
  const now = new Date();

  // `nextFollowUpDueAt` is stored as `timestamp without time zone`.
  // Prisma Date comparisons can treat it as if it were UTC, which breaks "due" checks.
  // Use DB time (`NOW()`) directly to keep comparisons correct.
  const leads = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      companyName: string | null;
      nextFollowUpDueAt: Date;
      quoteSnapshot: unknown;
    }>
  >`
    SELECT
      "id",
      "name",
      "companyName",
      "nextFollowUpDueAt",
      "quoteSnapshot"
    FROM "Lead"
    WHERE
      "status" IN ('active', 'contacted', 'quoted')
      AND "nextFollowUpDueAt" <= NOW()
      AND "followUpReminderNotifiedAt" IS NULL
  `;

  const leadsChannel = leads.length ? await ensureLeadsTeamChannel() : null;

  for (const lead of leads) {
    await notifyAllAdmins({
      title: "Lead follow-up due",
      body: `${lead.name}${lead.companyName ? ` (${lead.companyName})` : ""} is due for follow-up.`,
      href: `/crm/leads/${lead.id}`,
    });

    // Team chat (Leads channel) reminder post.
    if (leadsChannel) {
      const { potentialDealValue, workType } = extractLeadQuoteSnapshot(lead.quoteSnapshot);
      const dueAt = lead.nextFollowUpDueAt ?? now;
      const dueDate = dueAt.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const lines: string[] = [
        `Reminder due: ${lead.name}${lead.companyName ? ` (${lead.companyName})` : ""}`,
        `• Due: ${dueDate}`,
      ];
      if (typeof potentialDealValue === "number" && Number.isFinite(potentialDealValue)) {
        lines.push(`• Potential value: ${potentialDealValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      }
      if (typeof workType === "string" && workType.trim()) {
        lines.push(`• Type of work: ${workType}`);
      }
      lines.push(`• Open lead: /crm/leads/${lead.id}`);

      await prisma.teamChannelMessage.create({
        data: {
          channelId: leadsChannel.id,
          kind: "system",
          body: lines.join("\n"),
        },
      });
    }

    await prisma.lead.update({
      where: { id: lead.id },
      data: { followUpReminderNotifiedAt: now },
    });
  }
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
