import { prisma } from "@/lib/prisma";

/** Stable pair key: two user ids always map to the same thread. */
export function orderedUserPair(a: string, b: string) {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

export async function getOrCreateDmThread(userIdA: string, userIdB: string) {
  const { low, high } = orderedUserPair(userIdA, userIdB);
  return prisma.dmThread.upsert({
    where: {
      lowUserId_highUserId: {
        lowUserId: low,
        highUserId: high,
      },
    },
    create: { lowUserId: low, highUserId: high },
    update: {},
  });
}

export async function otherDmParticipantName(threadId: string, viewerId: string) {
  const t = await prisma.dmThread.findUnique({
    where: { id: threadId },
    include: { lowUser: true, highUser: true },
  });
  if (!t) return null;
  if (t.lowUserId === viewerId) return t.highUser.fullName;
  if (t.highUserId === viewerId) return t.lowUser.fullName;
  return null;
}
