import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { StatusPill } from "@/components/workflow/status-pill";

export default async function PortalPage() {
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const briefs = await prisma.brief.findMany({ where: { status: { not: "completed" }, clientId: user?.clientId ?? "" }, include: { client: true }, take: 5 });
  return (
    <PageShell title="Client portal" subtitle="Your active work and delivery updates">
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
    </PageShell>
  );
}
