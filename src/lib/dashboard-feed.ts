import type { BriefStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findDashboardFeedDismissalsForUser } from "@/lib/prisma-dashboard-feed-dismissal";

export type DashboardFeedItem = {
  id: string;
  createdAt: Date;
  title: string;
  body: string;
  href: string | null;
  /** Derived for styling / filters */
  kind: "personal" | "team";
  /** Semantic category for consistent dashboard colors. */
  category: "calendar" | "crm" | "brief" | "comms" | "system";
  /** Mark notification read (personal rows). */
  notificationId?: string;
  /** Hide team row for this viewer only. */
  activityLogId?: string;
};

function formatBriefStatus(status: string) {
  return status.replace(/_/g, " ");
}

function categoryFromNotification(n: { title: string; body: string; href: string | null }): DashboardFeedItem["category"] {
  const hay = `${n.title} ${n.body}`.toLowerCase();
  const href = n.href ?? "";
  if (href.startsWith("/calendar") || /\bcalendar\b|\bbooking\b|\bschedule\b/.test(hay)) return "calendar";
  if (
    href.startsWith("/crm") ||
    href.startsWith("/clients") ||
    /\blead\b|\bfollow[\s-]?up\b|\bcrm\b|\bcheck[-\s]?in\b|\bclient request\b/.test(hay)
  ) {
    return "crm";
  }
  if (href.startsWith("/messages") || /\bdm\b|\bmention\b|\bmessage\b|\bchat\b/.test(hay)) return "comms";
  if (href.startsWith("/briefs") || /\bbrief\b|\bdeliverable\b|\breview\b|\bamends?\b/.test(hay)) return "brief";
  return "system";
}

function activityToFeedItem(log: {
  id: string;
  createdAt: Date;
  action: string;
  metadata: unknown;
  user: { fullName: string };
  brief: { id: string; title: string } | null;
}): DashboardFeedItem | null {
  const actor = log.user.fullName;
  const briefTitle = log.brief?.title ?? "Brief";
  const briefHref = log.brief ? `/briefs/${log.brief.id}` : null;
  const meta = log.metadata && typeof log.metadata === "object" ? (log.metadata as Record<string, unknown>) : {};

  const base = {
    id: `activity-${log.id}`,
    activityLogId: log.id,
    createdAt: log.createdAt,
    kind: "team" as const,
    category: "brief" as const,
  };

  switch (log.action) {
    case "brief_created":
      return {
        ...base,
        title: "New brief",
        body: `${actor} created “${briefTitle}”.`,
        href: briefHref,
      };
    case "brief_status_changed": {
      const from = typeof meta.from === "string" ? (meta.from as BriefStatus) : "";
      const to = typeof meta.to === "string" ? (meta.to as BriefStatus) : "";
      return {
        ...base,
        title: "Brief status updated",
        body: `${actor} moved “${briefTitle}” from ${formatBriefStatus(from)} to ${formatBriefStatus(to)}.`,
        href: briefHref,
      };
    }
    case "brief_assigned": {
      const role = typeof meta.role === "string" ? meta.role : "team";
      const assignee = typeof meta.assigneeName === "string" ? meta.assigneeName : "Someone";
      return {
        ...base,
        title: "Brief assignment",
        body: `${actor} assigned ${assignee} as ${role.replace(/_/g, " ")} on “${briefTitle}”.`,
        href: briefHref,
      };
    }
    case "brief_completed":
      return {
        ...base,
        title: "Brief completed",
        body: `${actor} marked “${briefTitle}” complete.`,
        href: briefHref,
      };
    case "deliverable_added": {
      const title = typeof meta.title === "string" ? meta.title : "Deliverable";
      return {
        ...base,
        title: "Deliverable added",
        body: `${actor} added “${title}” on “${briefTitle}”.`,
        href: briefHref,
      };
    }
    case "deliverable_removed": {
      const title = typeof meta.title === "string" ? meta.title : "Deliverable";
      return {
        ...base,
        title: "Deliverable removed",
        body: `${actor} removed “${title}” from “${briefTitle}”.`,
        href: briefHref,
      };
    }
    case "brief_update_posted": {
      const visible = meta.visibleToClient === true ? " (client-visible)" : " (internal)";
      return {
        ...base,
        title: "Brief update",
        body: `${actor} posted an update on “${briefTitle}”${visible}.`,
        href: briefHref,
      };
    }
    default:
      return {
        ...base,
        title: "Activity",
        body: `${actor} ${log.action.replace(/_/g, " ")}${log.brief ? ` · ${briefTitle}` : ""}.`,
        href: briefHref,
      };
  }
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/** Merged unread personal notifications + org-wide brief activity for the internal dashboard. */
export async function getDashboardFeedForViewer(userId: string | null, take = 20): Promise<DashboardFeedItem[]> {
  const [notifications, activitiesRaw, dismissedRows] = await Promise.all([
    userId
      ? prisma.notification.findMany({
          where: { userId, readAt: null },
          orderBy: { createdAt: "desc" },
          take: 35,
          select: { id: true, title: true, body: true, href: true, createdAt: true },
        })
      : Promise.resolve([]),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { fullName: true } },
        brief: { select: { id: true, title: true } },
      },
    }),
    userId ? findDashboardFeedDismissalsForUser(userId) : Promise.resolve([]),
  ]);

  const dismissedActivityIds = new Set(dismissedRows.map((d) => d.activityLogId));
  const activities = activitiesRaw.filter((log) => !dismissedActivityIds.has(log.id));

  const fromNotifications: DashboardFeedItem[] = notifications.map((n) => ({
    id: `notif-${n.id}`,
    notificationId: n.id,
    createdAt: n.createdAt,
    title: n.title,
    body: n.body,
    href: n.href ?? null,
    kind: "personal",
    category: categoryFromNotification({ title: n.title, body: n.body, href: n.href ?? null }),
  }));

  const fromActivity: DashboardFeedItem[] = [];
  for (const log of activities) {
    const item = activityToFeedItem(log);
    if (item) fromActivity.push(item);
  }

  const merged = [...fromNotifications, ...fromActivity].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return merged.slice(0, take);
}
