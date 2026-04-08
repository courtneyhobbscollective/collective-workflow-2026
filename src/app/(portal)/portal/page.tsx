import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findPortalNotificationDismissalKeys } from "@/lib/prisma-portal-notification-dismissal";
import { PageShell } from "@/components/workflow/page-shell";
import { HeaderMessagesIndicator } from "@/components/workflow/header-messages-indicator";
import {
  PortalClearAllNotificationsButton,
  PortalNotificationsList,
} from "@/components/workflow/portal-notifications";
import { Section } from "@/components/workflow/section";
import { StatusPill } from "@/components/workflow/status-pill";
import { UserHeaderBadge } from "@/components/workflow/user-header-badge";

type PortalNotification = {
  id: string;
  createdAt: Date;
  title: string;
  body: string;
  href: string;
};

function formatWhen(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function activityLabel(action: string): string | null {
  switch (action) {
    case "brief_status_changed":
      return "Brief status changed";
    case "brief_created":
      return "Brief created";
    case "deliverable_added":
      return "New deliverable added";
    case "deliverable_removed":
      return "Deliverable removed";
    case "brief_completed":
      return "Brief completed";
    default:
      return null;
  }
}

export default async function PortalPage() {
  const userId = await getSessionUserId();
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, avatarUrl: true, clientId: true },
      })
    : null;
  const clientId = user?.clientId ?? "";
  const [briefs, clientMessages, briefActivity, dismissedKeys, unreadChatCount] = await Promise.all([
    prisma.brief.findMany({
      where: { status: { not: "completed" }, clientId },
      include: { client: true },
      take: 5,
    }),
    prisma.message.findMany({
      where: {
        thread: { brief: { clientId }, threadType: "client" },
        sender: { role: { in: ["admin", "team_member"] } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        body: true,
        createdAt: true,
        sender: { select: { fullName: true } },
        thread: { select: { brief: { select: { id: true, title: true } } } },
      },
    }),
    prisma.activityLog.findMany({
      where: {
        brief: { clientId },
        action: { in: ["brief_status_changed", "brief_created", "deliverable_added", "deliverable_removed", "brief_completed"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        createdAt: true,
        brief: { select: { id: true, title: true } },
      },
    }),
    userId ? findPortalNotificationDismissalKeys(userId) : Promise.resolve([] as string[]),
    userId
      ? prisma.notification.count({
          where: {
            userId,
            readAt: null,
            href: { contains: "/portal/messages" },
          },
        })
      : Promise.resolve(0),
  ]);

  const dismissed = new Set(dismissedKeys);

  const notifications: PortalNotification[] = [
    ...clientMessages.map((m) => ({
      id: `msg-${m.id}`,
      createdAt: m.createdAt,
      title: `New message in ${m.thread.brief.title}`,
      body: `${m.sender.fullName}: ${m.body.slice(0, 140)}${m.body.length > 140 ? "..." : ""}`,
      href: `/portal/briefs/${m.thread.brief.id}`,
    })),
    ...briefActivity
      .map((a) => {
        const label = activityLabel(a.action);
        if (!label || !a.brief) return null;
        return {
          id: `act-${a.id}`,
          createdAt: a.createdAt,
          title: label,
          body: a.brief.title,
          href: `/portal/briefs/${a.brief.id}`,
        } satisfies PortalNotification;
      })
      .filter((n): n is PortalNotification => n != null),
  ]
    .filter((n) => !dismissed.has(n.id))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const notificationRows = notifications.map((n) => ({
    id: n.id,
    whenLabel: formatWhen(n.createdAt),
    title: n.title,
    body: n.body,
    href: n.href,
  }));

  return (
    <PageShell
      title="Client portal"
      subtitle="Your active work and delivery updates"
      action={
        user ? (
          <div className="flex items-center gap-2">
            <HeaderMessagesIndicator href="/portal/messages" unreadCount={unreadChatCount} />
            <UserHeaderBadge fullName={user.fullName} avatarUrl={user.avatarUrl} href="/portal/account" />
          </div>
        ) : null
      }
      headerExtra={
        <div className="relative overflow-hidden rounded-2xl border border-red-300/50 bg-gradient-to-r from-[#d92f2f] via-[#f03838] to-[#f25151] px-6 py-5 text-white shadow-[0_8px_20px_rgba(176,20,20,0.18)]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-red-200/35 blur-2xl" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">Welcome</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Welcome to Collective</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/90">
            Track active briefs, share feedback in message threads, and stay aligned with your delivery timeline.
          </p>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <Section title="Active briefs" subtitle="Sorted by most recently created">
          {briefs.length ? (
            <div className="space-y-2">
              {briefs.map((b) => (
                <Link
                  key={b.id}
                  href={`/portal/briefs/${b.id}`}
                  className="block rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100 hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{b.title}</p>
                      <p className="mt-1 text-xs text-zinc-600">Due {new Date(b.deadline).toLocaleDateString()}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusPill status={b.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No active briefs yet.</p>
          )}
        </Section>

        <Section
          title="Notifications"
          subtitle="Recent brief activity for your team"
          action={
            notificationRows.length > 0 ? (
              <PortalClearAllNotificationsButton keys={notificationRows.map((r) => r.id)} />
            ) : null
          }
        >
          <PortalNotificationsList items={notificationRows} />
        </Section>
      </div>
    </PageShell>
  );
}
