import { prisma } from "@/lib/prisma";
import { notifyAllAdmins } from "@/lib/notify-admins";

/**
 * Creates admin notifications for pipeline leads whose follow-up date is due and
 * who have not yet been reminded for this cycle (`followUpReminderNotifiedAt` is null).
 */
export async function ensureLeadFollowUpReminders() {
  const now = new Date();

  const leads = await prisma.lead.findMany({
    where: {
      status: { in: ["active", "contacted", "quoted"] },
      nextFollowUpDueAt: { lte: now },
      followUpReminderNotifiedAt: null,
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      nextFollowUpDueAt: true,
    },
  });

  for (const lead of leads) {
    await notifyAllAdmins({
      title: "Lead follow-up due",
      body: `${lead.name}${lead.companyName ? ` (${lead.companyName})` : ""} is due for follow-up.`,
      href: `/crm/leads/${lead.id}`,
    });
    await prisma.lead.update({
      where: { id: lead.id },
      data: { followUpReminderNotifiedAt: now },
    });
  }
}
