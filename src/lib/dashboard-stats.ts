import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

/** Org-wide counts — safe to cache briefly; not user-specific. */
export const getDashboardOrgStats = unstable_cache(
  async () => {
    const [briefCount, catalogBriefCount, clientCount] = await Promise.all([
      prisma.brief.count({ where: { status: { not: "completed" } } }),
      prisma.brief.count({ where: { serviceProductId: { not: null } } }),
      prisma.client.count(),
    ]);
    return { briefCount, catalogBriefCount, clientCount };
  },
  ["dashboard-org-stats-v1"],
  { revalidate: 45, tags: [CACHE_TAGS.dashboardOrgStats] }
);

export async function getCrmCheckInsDueCount() {
  const now = new Date();
  return prisma.client.count({
    where: {
      status: "active",
      relationshipContactFrequencyDays: { not: null, gt: 0 },
      nextRelationshipContactDueAt: { lte: now },
    },
  });
}

export async function loadAdminDashboardBundle(now: Date) {
  return loadAdminDashboardBundleCached(now.toISOString().slice(0, 13));
}

const loadAdminDashboardBundleCached = unstable_cache(
  async (_hourKey: string) => {
    const now = new Date();
    const [
      openLeadsCount,
      activeClientsCount,
      leadsPreview,
      clientsPreview,
      checkInsPreview,
      crmCheckInsDue,
      onboardingCount,
      onboardingPreview,
    ] = await Promise.all([
      prisma.lead.count({
        where: { convertedClientId: null, status: { notIn: ["won", "lost"] } },
      }),
      prisma.client.count({ where: { status: "active" } }),
      prisma.lead.findMany({
        where: { convertedClientId: null, status: { notIn: ["won", "lost"] } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, companyName: true },
      }),
      prisma.client.findMany({
        where: { status: "active" },
        orderBy: { name: "asc" },
        take: 5,
        select: { id: true, name: true },
      }),
      prisma.client.findMany({
        where: {
          status: "active",
          relationshipContactFrequencyDays: { not: null, gt: 0 },
          nextRelationshipContactDueAt: { lte: now },
        },
        orderBy: { nextRelationshipContactDueAt: "asc" },
        take: 5,
        select: { id: true, name: true, nextRelationshipContactDueAt: true },
      }),
      prisma.client.count({
        where: {
          status: "active",
          relationshipContactFrequencyDays: { not: null, gt: 0 },
          nextRelationshipContactDueAt: { lte: now },
        },
      }),
      prisma.pendingClientSignup.count({ where: { status: "pending" } }),
      prisma.pendingClientSignup.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: 3,
        select: { id: true, companyName: true, fullName: true, createdAt: true },
      }),
    ]);

    return {
      crmStanding: {
        openLeadsCount,
        activeClientsCount,
        leadsPreview,
        clientsPreview,
        checkInsPreview,
      },
      crmCheckInsDue,
      pendingOnboarding: { count: onboardingCount, preview: onboardingPreview },
    };
  },
  ["admin-dashboard-bundle-v1"],
  { revalidate: 30, tags: [CACHE_TAGS.adminDashboardBundle] }
);
