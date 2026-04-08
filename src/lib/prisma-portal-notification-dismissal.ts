import { prisma } from "@/lib/prisma";

export async function findPortalNotificationDismissalKeys(userId: string): Promise<string[]> {
  const rows = await prisma.portalNotificationDismissal.findMany({
    where: { userId },
    select: { key: true },
  });
  return rows.map((r) => r.key);
}
