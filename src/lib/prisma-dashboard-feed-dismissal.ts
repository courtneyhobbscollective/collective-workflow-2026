import { prisma } from "@/lib/prisma";

type DismissalDelegate = {
  findMany(args: {
    where: { userId: string };
    select: { activityLogId: true };
  }): Promise<{ activityLogId: string }[]>;
  upsert(args: {
    where: { userId_activityLogId: { userId: string; activityLogId: string } };
    create: { userId: string; activityLogId: string };
    update: Record<string, never>;
  }): Promise<unknown>;
};

function dismissalDelegate(): DismissalDelegate | undefined {
  return (prisma as unknown as { dashboardFeedDismissal?: DismissalDelegate }).dashboardFeedDismissal;
}

/**
 * After `npx prisma generate`, a running dev server can still hold an old PrismaClient without
 * `dashboardFeedDismissal`. Avoid crashing the dashboard; treat as “nothing dismissed yet”.
 */
export async function findDashboardFeedDismissalsForUser(userId: string): Promise<{ activityLogId: string }[]> {
  const d = dismissalDelegate();
  if (!d) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[workflow] Prisma client has no `dashboardFeedDismissal`. Run `npx prisma generate` and restart `npm run dev`."
      );
    }
    return [];
  }
  return d.findMany({
    where: { userId },
    select: { activityLogId: true },
  });
}

/** Returns false if the delegate is missing (stale client). */
export async function upsertDashboardFeedDismissal(userId: string, activityLogId: string): Promise<boolean> {
  const d = dismissalDelegate();
  if (!d) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[workflow] Cannot dismiss team activity: regenerate Prisma client and restart dev (`npx prisma generate`, then `npm run dev`)."
      );
    }
    return false;
  }
  await d.upsert({
    where: { userId_activityLogId: { userId, activityLogId } },
    create: { userId, activityLogId },
    update: {},
  });
  return true;
}
