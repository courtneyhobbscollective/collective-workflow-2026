import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { ScopePill, StatusPill } from "@/components/workflow/status-pill";

export default async function PortalBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const brief = await prisma.brief.findFirst({ where: { id, clientId: user?.clientId ?? "" }, include: { updates: { where: { visibleToClient: true } }, messageThreads: { where: { threadType: "client" }, include: { messages: true } } } });
  if (!brief) return notFound();
  const clientThread = brief.messageThreads.find((t) => t.threadType === "client");
  return (
    <PageShell title={brief.title} subtitle={`${brief.status} • Delivery deadline ${new Date(brief.deadline).toLocaleDateString()}`}>
      <div className="space-y-4">
        <Section title="Status" subtitle="Current delivery and scope state">
          <div className="flex flex-wrap gap-2">
            <StatusPill status={brief.status} />
            <ScopePill scopeStatus={brief.scopeStatus} />
            <Badge className="bg-zinc-100 text-zinc-700">{brief.priority}</Badge>
          </div>
        </Section>

        <Section title="Client updates">
          {brief.updates.length ? (
            <div className="space-y-3">
              {brief.updates.map((u) => (
                <div key={u.id} className="rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
                  <p className="text-sm font-medium text-zinc-900">{u.content}</p>
                  <p className="mt-1 text-xs text-zinc-600">{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No updates yet.</p>
          )}
        </Section>

        <Section title="Message thread" subtitle="Updates between your team and the production crew">
          <div className="max-h-72 overflow-auto space-y-2">
            {(clientThread?.messages ?? []).map((m) => (
              <div key={m.id} className="rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100 text-sm">
                {m.body}
              </div>
            ))}
            {(clientThread?.messages?.length ?? 0) === 0 ? <p className="text-sm text-zinc-500">No messages yet.</p> : null}
          </div>
        </Section>
      </div>
    </PageShell>
  );
}
