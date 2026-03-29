import { prisma } from "@/lib/prisma";
import { notifyAllAdmins } from "@/lib/notify-admins";

/**
 * Notifies admins when a client’s relationship check-in is due and we have not
 * yet notified for this cycle (`relationshipContactLastNotifiedAt` is null).
 */
export async function ensureRelationshipContactReminders() {
  const now = new Date();

  const clients = await prisma.client.findMany({
    where: {
      status: "active",
      relationshipContactFrequencyDays: { not: null },
      nextRelationshipContactDueAt: { lte: now },
      relationshipContactLastNotifiedAt: null,
    },
    select: {
      id: true,
      name: true,
      nextRelationshipContactDueAt: true,
    },
  });

  for (const client of clients) {
    await notifyAllAdmins({
      title: "Client check-in due",
      body: `Relationship contact is due for ${client.name}.`,
      href: `/clients/${client.id}`,
      clientId: client.id,
    });
    await prisma.client.update({
      where: { id: client.id },
      data: { relationshipContactLastNotifiedAt: now },
    });
  }
}
