import { Badge, Card } from "@/components/ui";
import { PageShell } from "@/components/workflow/page-shell";
import { HeaderMessagesIndicator } from "@/components/workflow/header-messages-indicator";
import { UserHeaderBadge } from "@/components/workflow/user-header-badge";
import {
  countUnreadNotifications,
  getDashboardFeedForViewer,
} from "@/lib/dashboard-feed";
import { DashboardFeedCollapsed } from "@/components/workflow/dashboard-feed-collapsed";
import { DashboardAssignedWorkCollapsed } from "@/components/workflow/dashboard-assigned-work-collapsed";
import { DashboardCalendarSnapshotCollapsed } from "@/components/workflow/dashboard-calendar-snapshot-collapsed";
import { ClearNotificationsButton } from "@/components/workflow/dashboard-notification-actions";
import { getSessionRole, getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIVE_WORK_PAGE_STATUSES } from "@/lib/workflow/live-work-page-statuses";
import { ensureLeadFollowUpReminders } from "@/lib/crm/lead-follow-up-reminders";
import { ensureRelationshipContactReminders } from "@/lib/crm/relationship-reminders";
import { cn } from "@/lib/utils";
import { Building2, CalendarClock, ClipboardList, Layers, UserPlus, Users } from "lucide-react";
import Link from "next/link";

type AdminCrmStanding = {
  openLeadsCount: number;
  activeClientsCount: number;
  leadsPreview: { id: string; name: string; companyName: string | null }[];
  clientsPreview: { id: string; name: string }[];
  checkInsPreview: { id: string; name: string; nextRelationshipContactDueAt: Date | null }[];
};

type AdminPendingOnboarding = {
  count: number;
  preview: { id: string; companyName: string; fullName: string; createdAt: Date }[];
} | null;

const ACTIVE_LIVE_WORK_STATUSES = LIVE_WORK_PAGE_STATUSES.filter((s) => s !== "completed");

export default async function DashboardPage() {
  const [userId, role] = await Promise.all([getSessionUserId(), getSessionRole()]);
  await ensureRelationshipContactReminders();
  await ensureLeadFollowUpReminders();

  const now = new Date();
  const [
    briefCount,
    clientCount,
    catalogBriefCount,
    crmCheckInsDue,
    feed,
    sessionUser,
    unreadNotificationCount,
    unreadChatCount,
    assignedLiveWorkBriefs,
    myUpcomingBookings,
  ] = await Promise.all([
    prisma.brief.count({ where: { status: { not: "completed" } } }),
    prisma.client.count(),
    prisma.brief.count({ where: { serviceProductId: { not: null } } }),
    prisma.client.count({
      where: {
        status: "active",
        relationshipContactFrequencyDays: { not: null, gt: 0 },
        nextRelationshipContactDueAt: { lte: now },
      },
    }),
    getDashboardFeedForViewer(userId, 20),
    userId ? prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, avatarUrl: true } }) : null,
    userId ? countUnreadNotifications(userId) : Promise.resolve(0),
    userId
      ? prisma.notification.count({
          where: {
            userId,
            readAt: null,
            href: { contains: "/messages" },
          },
        })
      : Promise.resolve(0),
    userId
      ? prisma.briefAssignment.findMany({
          where: {
            userId,
            brief: { status: { in: ACTIVE_LIVE_WORK_STATUSES } },
          },
          orderBy: { brief: { deadline: "asc" } },
          take: 25,
          select: {
            brief: {
              select: {
                id: true,
                title: true,
                deadline: true,
                status: true,
                client: { select: { name: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    userId
      ? prisma.calendarBooking.findMany({
          where: { userId, endsAt: { gte: now } },
          orderBy: { startsAt: "asc" },
          take: 25,
          select: {
            id: true,
            title: true,
            bookingType: true,
            startsAt: true,
            endsAt: true,
            brief: { select: { id: true, title: true } },
            client: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  let adminCrmStanding: AdminCrmStanding | null = null;
  let adminPendingOnboarding: AdminPendingOnboarding = null;
  if (role === "admin") {
    const [openLeadsCount, activeClientsCount, leadsPreview, clientsPreview, checkInsPreview, onboardingCount, onboardingPreview] =
      await Promise.all([
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
        prisma.pendingClientSignup.count({ where: { status: "pending" } }),
        prisma.pendingClientSignup.findMany({
          where: { status: "pending" },
          orderBy: { createdAt: "asc" },
          take: 3,
          select: { id: true, companyName: true, fullName: true, createdAt: true },
        }),
      ]);
    adminCrmStanding = {
      openLeadsCount,
      activeClientsCount,
      leadsPreview,
      clientsPreview,
      checkInsPreview,
    };
    adminPendingOnboarding = { count: onboardingCount, preview: onboardingPreview };
  }

  const feedItems = feed.map((item) => ({
    id: item.id,
    createdAtIso: item.createdAt.toISOString(),
    title: item.title,
    body: item.body,
    href: item.href,
    kind: item.kind,
    category: item.category,
    notificationId: item.notificationId,
    activityLogId: item.activityLogId,
  }));
  const feedShownCount = Math.min(feedItems.length, 3);
  const assignedWorkItems = assignedLiveWorkBriefs.map((row) => ({
    id: row.brief.id,
    title: row.brief.title,
    clientName: row.brief.client.name,
    deadlineIso: row.brief.deadline.toISOString(),
    href: `/briefs/${row.brief.id}`,
    status: row.brief.status,
  }));
  const calendarSnapshotItems = myUpcomingBookings.map((b) => ({
    id: b.id,
    title: b.title,
    context: b.brief?.title ?? b.client?.name ?? "General booking",
    startsAtIso: b.startsAt.toISOString(),
    bookingType: b.bookingType,
  }));

  return (
    <PageShell
      title="Dashboard"
      subtitle="Production work management at a glance"
      action={
        sessionUser ? (
          <div className="flex items-center gap-2">
            <HeaderMessagesIndicator href="/messages" unreadCount={unreadChatCount} />
            <UserHeaderBadge fullName={sessionUser.fullName} avatarUrl={sessionUser.avatarUrl} />
          </div>
        ) : null
      }
    >
      {adminPendingOnboarding && adminPendingOnboarding.count > 0 ? (
        <Card className="border-amber-200/90 bg-amber-50/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {adminPendingOnboarding.count} pending client onboarding request
                {adminPendingOnboarding.count > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xs text-amber-800/90">
                Review and approve/reject from Users → Pending client onboarding.
              </p>
              {adminPendingOnboarding.preview.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
                  {adminPendingOnboarding.preview.map((r) => (
                    <li key={r.id}>
                      {r.companyName} · {r.fullName} · {r.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Link
              href="/settings/users"
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100/60"
            >
              Open users
            </Link>
          </div>
        </Card>
      ) : null}

      {adminCrmStanding ? (
        <Card className="overflow-hidden border-zinc-200/90 p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-500" aria-hidden />
              <h2 className="text-sm font-semibold text-zinc-900">CRM</h2>
              <span className="text-xs text-zinc-500">Admin overview</span>
            </div>
            <Link
              href="/crm"
              className="text-xs font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
            >
              CRM home
            </Link>
          </div>
          <div className="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="min-w-0 px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <UserPlus className="h-3.5 w-3.5 text-violet-600" aria-hidden />
                  Open leads
                </div>
                <span className="text-lg font-semibold tabular-nums text-zinc-900">
                  {adminCrmStanding.openLeadsCount}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {adminCrmStanding.leadsPreview.length === 0 ? (
                  <li className="text-xs text-zinc-500">No open leads</li>
                ) : (
                  adminCrmStanding.leadsPreview.map((l) => (
                    <li key={l.id} className="min-w-0">
                      <Link
                        href={`/crm/leads/${l.id}`}
                        className="block truncate text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        {l.name}
                        {l.companyName ? (
                          <span className="text-zinc-500"> · {l.companyName}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
              <Link
                href="/crm/leads"
                className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                All leads →
              </Link>
            </div>
            <div className="min-w-0 px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Users className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  Active clients
                </div>
                <span className="text-lg font-semibold tabular-nums text-zinc-900">
                  {adminCrmStanding.activeClientsCount}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {adminCrmStanding.clientsPreview.length === 0 ? (
                  <li className="text-xs text-zinc-500">No active clients</li>
                ) : (
                  adminCrmStanding.clientsPreview.map((c) => (
                    <li key={c.id} className="min-w-0">
                      <Link
                        href={`/clients/${c.id}`}
                        className="block truncate text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
              <Link
                href="/clients"
                className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                All clients →
              </Link>
            </div>
            <div className="min-w-0 px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <CalendarClock className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                  Check-ins due
                </div>
                <span className="text-lg font-semibold tabular-nums text-zinc-900">{crmCheckInsDue}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {adminCrmStanding.checkInsPreview.length === 0 ? (
                  <li className="text-xs text-zinc-500">None due</li>
                ) : (
                  adminCrmStanding.checkInsPreview.map((c) => (
                    <li key={c.id} className="min-w-0">
                      <Link
                        href={`/clients/${c.id}`}
                        className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-sm text-zinc-700 hover:text-zinc-900 hover:underline"
                      >
                        <span className="min-w-0 truncate font-medium">{c.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-amber-800">
                          {c.nextRelationshipContactDueAt
                            ? c.nextRelationshipContactDueAt.toLocaleDateString("en-GB")
                            : "—"}
                        </span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
              <Link
                href="/crm/clients"
                className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                CRM check-ins →
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden border-zinc-200/90 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-zinc-500" aria-hidden />
            <h2 className="text-sm font-semibold text-zinc-900">Live production work</h2>
            <span className="text-xs text-zinc-500">At a glance</span>
          </div>
        </div>
        <div
          className={cn(
            "grid grid-cols-1 divide-y divide-zinc-100",
            role === "admin" ? "sm:grid-cols-3 sm:divide-x sm:divide-y-0" : "sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0"
          )}
        >
          <div className="min-w-0 px-4 py-3 sm:px-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <ClipboardList className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                Active briefs
              </div>
              <span className="text-lg font-semibold tabular-nums text-zinc-900">{briefCount}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">In progress (not completed)</p>
            <Link
              href="/briefs"
              className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              All briefs →
            </Link>
          </div>
          <div className="min-w-0 px-4 py-3 sm:px-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Users className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                Clients
              </div>
              <span className="text-lg font-semibold tabular-nums text-zinc-900">{clientCount}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">Total client records</p>
            <Link
              href="/clients"
              className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              All clients →
            </Link>
          </div>
          <div className="min-w-0 px-4 py-3 sm:px-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Layers className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
                Catalog briefs
              </div>
              <span className="text-lg font-semibold tabular-nums text-zinc-900">{catalogBriefCount}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">Briefs linked to a service product</p>
            <Link
              href="/briefs"
              className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              All briefs →
            </Link>
          </div>
          {role !== "admin" ? (
            <div className="min-w-0 px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <CalendarClock className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                  Check-ins due
                </div>
                <span className="text-lg font-semibold tabular-nums text-zinc-900">{crmCheckInsDue}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">Relationship cadence (CRM)</p>
              <Link
                href="/crm/clients"
                className="mt-2 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                CRM check-ins →
              </Link>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-medium text-zinc-900">Activity & notifications</h2>
              <Badge className="bg-zinc-100 text-zinc-700">
                {feedShownCount} shown · {feedItems.length} total
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="min-w-0 flex-1 text-sm leading-snug text-zinc-500">
                Brief updates for the team, plus DMs, mentions, and alerts for you
              </p>
              {unreadNotificationCount > 0 ? <ClearNotificationsButton /> : null}
            </div>
          </div>
          {feed.length ? (
            <DashboardFeedCollapsed items={feedItems} />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-10 text-center">
              <p className="text-sm text-zinc-600">
                No activity yet. Brief moves, assignments, and messages will show here.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="text-base font-medium text-zinc-900">Calendar snapshot</h2>
            <p className="mt-1 text-sm text-zinc-500">Your upcoming bookings and current assigned work.</p>
          </div>

          <div className="mt-4">
            <DashboardCalendarSnapshotCollapsed items={calendarSnapshotItems} />
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Assigned Work</h3>
              <DashboardAssignedWorkCollapsed items={assignedWorkItems} />
            </div>
            <p className="mt-4 text-sm text-zinc-600">
              <Link
                href="/calendar"
                className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950"
              >
                Open full calendar
              </Link>
              <span className="text-zinc-300"> · </span>
              <Link
                href="/live-work"
                className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950"
              >
                Open live work
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
