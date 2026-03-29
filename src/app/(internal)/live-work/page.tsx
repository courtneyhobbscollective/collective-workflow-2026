import { PageShell } from "@/components/workflow/page-shell";
import { getSessionRole, getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIVE_WORK_PAGE_STATUSES } from "@/lib/workflow/live-work-page-statuses";
import { LiveWorkBoard } from "./live-work-board";

function dedupeAssigneesByUser<T extends { userId: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (seen.has(row.userId)) continue;
    seen.add(row.userId);
    out.push(row);
  }
  return out;
}

export default async function LiveWorkPage() {
  const [role, viewerUserId, briefs, clients] = await Promise.all([
    getSessionRole(),
    getSessionUserId(),
    prisma.brief.findMany({
      where: { status: { in: LIVE_WORK_PAGE_STATUSES } },
      include: {
        client: { select: { id: true, name: true } },
        assignments: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        deliverables: {
          select: { id: true, title: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ] as const);
  const viewerIsAdmin = role === "admin";

  const initialRows = briefs.map((b) => ({
    id: b.id,
    status: b.status,
    title: b.title,
    description: b.description,
    deadline: b.deadline.toISOString(),
    priority: b.priority,
    liveWorkOrder: b.liveWorkOrder,
    briefType: b.briefType,
    client: { id: b.client.id, name: b.client.name },
    assignees: dedupeAssigneesByUser(
      b.assignments.map((a) => ({
        userId: a.user.id,
        fullName: a.user.fullName,
        avatarUrl: a.user.avatarUrl,
      }))
    ),
    deliverables: b.deliverables.map((d) => ({ id: d.id, title: d.title })),
    reviewLink: b.reviewLink,
  }));

  return (
    <PageShell
      title="Live work"
      subtitle="Track active briefs by workflow stage — change status on each brief to move it between sections"
    >
      <LiveWorkBoard
        initialRows={initialRows}
        clients={clients}
        viewerIsAdmin={viewerIsAdmin}
        viewerUserId={viewerUserId}
      />
    </PageShell>
  );
}
