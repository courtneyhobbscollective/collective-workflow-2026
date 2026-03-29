import { StatusPill } from "@/components/workflow/status-pill";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PortalCompletedPage() {
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const briefs = await prisma.brief.findMany({ where: { status: "completed", clientId: user?.clientId ?? "" } });
  return (
    <PageShell title="Completed" subtitle="Work that has been marked complete">
      <Section title="Completed briefs">
        {briefs.length ? (
          <div className="space-y-2">
            {briefs.map((b) => (
              <div key={b.id} className="rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{b.title}</p>
                  </div>
                  <StatusPill status={b.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No completed briefs yet.</p>
        )}
      </Section>
    </PageShell>
  );
}
