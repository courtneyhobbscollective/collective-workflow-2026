import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Stable pair key: two user ids always map to the same thread. */
export function orderedUserPair(a: string, b: string) {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

export async function getOrCreateDmThread(userIdA: string, userIdB: string) {
  const { low, high } = orderedUserPair(userIdA, userIdB);

  const users = await prisma.user.findMany({
    where: { id: { in: [low, high] } },
    select: { id: true },
  });
  const found = new Set(users.map((u) => u.id));
  if (!found.has(low) || !found.has(high)) {
    throw new Error("Could not open this conversation. Sign out and sign in again.");
  }

  const existing = await prisma.dmThread.findUnique({
    where: { lowUserId_highUserId: { lowUserId: low, highUserId: high } },
  });
  if (existing) return existing;

  try {
    return await prisma.dmThread.create({
      data: { lowUserId: low, highUserId: high },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await prisma.dmThread.findUnique({
        where: { lowUserId_highUserId: { lowUserId: low, highUserId: high } },
      });
      if (raced) return raced;
    }
    throw error;
  }
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
