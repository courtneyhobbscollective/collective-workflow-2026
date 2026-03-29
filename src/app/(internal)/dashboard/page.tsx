import { Card } from "@/components/ui";
import { PageShell } from "@/components/workflow/page-shell";
import { UserHeaderBadge } from "@/components/workflow/user-header-badge";
import { ScopePill } from "@/components/workflow/status-pill";
import {
  countUnreadNotifications,
  getDashboardFeedForViewer,
  type DashboardFeedItem,
} from "@/lib/dashboard-feed";
import { ClearNotificationsButton, DismissFeedItemButton } from "@/components/workflow/dashboard-notification-actions";
import { getSessionRole, getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PIPELINE_BRIEF_STATUS_FILTER,
  SCOPE_NEEDS_ATTENTION,
  SCOPE_STATUS_SUMMARY_ORDER,
} from "@/lib/workflow/scope-health";
import { ensureLeadFollowUpReminders } from "@/lib/crm/lead-follow-up-reminders";
import { ensureRelationshipContactReminders } from "@/lib/crm/relationship-reminders";
import type { ScopeStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Activity, Bell, Building2, CalendarClock, ChevronRight, ClipboardList, Layers, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function formatFeedTime(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DashboardFeedRow({ item, dismissSlot }: { item: DashboardFeedItem; dismissSlot: ReactNode }) {
  const isPersonal = item.kind === "personal";
  const mainClass = cn(
    "group flex min-w-0 flex-1 items-start gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4",
    item.href ? "transition-colors hover:bg-zinc-50/90" : ""
  );

  const mainInner = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          isPersonal
            ? "bg-sky-50 text-sky-700 ring-sky-200/60"
            : "bg-zinc-100 text-zinc-600 ring-zinc-200/80"
        )}
        aria-hidden
      >
        {isPersonal ? <Bell className="h-[18px] w-[18px]" strokeWidth={2} /> : <Activity className="h-[18px] w-[18px]" strokeWidth={2} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              isPersonal ? "bg-sky-100/90 text-sky-900" : "bg-zinc-200/70 text-zinc-700"
            )}
          >
            {isPersonal ? "For you" : "Team"}
          </span>
          <h3 className="text-sm font-semibold leading-snug text-zinc-900">{item.title}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{item.body}</p>
        <p className="mt-2 text-[11px] font-medium tabular-nums text-zinc-400">{formatFeedTime(item.createdAt)}</p>
      </div>
      {item.href ? (
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500"
          aria-hidden
        />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
    </>
  );

  return (
    <div className="flex items-stretch">
      {item.href ? (
        <Link href={item.href} className={mainClass} aria-label={`Open: ${item.title}`}>
          {mainInner}
        </Link>
      ) : (
        <div className={mainClass}>{mainInner}</div>
      )}
      <div className="flex shrink-0 items-start py-3 pr-2 pt-3.5 sm:py-4 sm:pr-3 sm:pt-4">{dismissSlot}</div>
    </div>
  );
}

type AdminCrmStanding = {
  openLeadsCount: number;
  activeClientsCount: number;
  leadsPreview: { id: string; name: string; companyName: string | null }[];
  clientsPreview: { id: string; name: string }[];
  checkInsPreview: { id: string; name: string; nextRelationshipContactDueAt: Date | null }[];
};

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
    scopeSummaryGroup,
    scopeAttentionBriefs,
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
    prisma.brief.groupBy({
      by: ["scopeStatus"],
      where: PIPELINE_BRIEF_STATUS_FILTER,
      _count: { _all: true },
    }),
    prisma.brief.findMany({
      where: {
        ...PIPELINE_BRIEF_STATUS_FILTER,
        scopeStatus: { in: SCOPE_NEEDS_ATTENTION },
      },
      orderBy: { deadline: "asc" },
      take: 8,
      select: {
        id: true,
        title: true,
        deadline: true,
        scopeStatus: true,
        client: { select: { name: true } },
      },
    }),
  ]);

  let adminCrmStanding: AdminCrmStanding | null = null;
  if (role === "admin") {
    const [openLeadsCount, activeClientsCount, leadsPreview, clientsPreview, checkInsPreview] =
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
      ]);
    adminCrmStanding = {
      openLeadsCount,
      activeClientsCount,
      leadsPreview,
      clientsPreview,
      checkInsPreview,
    };
  }

  const scopeCounts: Record<ScopeStatus, number> = {
    in_scope: 0,
    watch_scope: 0,
    out_of_scope: 0,
    awaiting_admin_review: 0,
  };
  for (const row of scopeSummaryGroup) {
    const c = row._count;
    const n =
      typeof c === "object" && c !== null && "_all" in c && typeof (c as { _all: unknown })._all === "number"
        ? (c as { _all: number })._all
        : 0;
    scopeCounts[row.scopeStatus] = n;
  }
  return (
    <PageShell
      title="Dashboard"
      subtitle="Production work management at a glance"
      action={
        sessionUser ? (
          <UserHeaderBadge fullName={sessionUser.fullName} avatarUrl={sessionUser.avatarUrl} />
        ) : null
      }
    >
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
            <h2 className="text-base font-medium text-zinc-900">Activity & notifications</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="min-w-0 flex-1 text-sm leading-snug text-zinc-500">
                Brief updates for the team, plus DMs, mentions, and alerts for you
              </p>
              {unreadNotificationCount > 0 ? <ClearNotificationsButton /> : null}
            </div>
          </div>
          {feed.length ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <ul className="divide-y divide-zinc-100">
                {feed.map((item) => (
                  <li key={item.id}>
                    <DashboardFeedRow
                      item={item}
                      dismissSlot={
                        <DismissFeedItemButton
                          notificationId={item.notificationId}
                          activityLogId={item.activityLogId}
                        />
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-10 text-center">
              <p className="text-sm text-zinc-600">
                No activity yet. Brief moves, assignments, and messages will show here.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-medium text-zinc-900">Scope health</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Counts are for active pipeline briefs only (excludes completed and archived). Advisory cues—not billing.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SCOPE_STATUS_SUMMARY_ORDER.map((status) => (
              <Link
                key={status}
                href={`/briefs?scope=${status}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-2 py-3 text-center transition-colors hover:border-zinc-300 hover:bg-zinc-100/90"
              >
                <span className="text-2xl font-semibold tabular-nums text-zinc-900">{scopeCounts[status]}</span>
                <ScopePill scopeStatus={status} />
              </Link>
            ))}
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Needs attention</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Watch scope, out of scope, or awaiting admin review — soonest deadlines first.
            </p>
            {scopeAttentionBriefs.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">Nothing flagged right now.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {scopeAttentionBriefs.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/briefs/${b.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-zinc-200 hover:bg-zinc-50/90"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">{b.title}</p>
                        <p className="truncate text-xs text-zinc-500">{b.client.name}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ScopePill scopeStatus={b.scopeStatus} />
                        <span className="text-[11px] tabular-nums text-zinc-400">
                          {new Date(b.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-zinc-600">
              <Link
                href="/briefs"
                className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950"
              >
                All briefs
              </Link>
              <span className="text-zinc-300"> · </span>
              <Link
                href="/briefs?scope=watch_scope"
                className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950"
              >
                Watch scope list
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
