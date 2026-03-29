import { StatusPill } from "@/components/workflow/status-pill";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PortalMessagesPage() {
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const threads = await prisma.messageThread.findMany({ where: { threadType: "client", brief: { clientId: user?.clientId ?? "" } }, include: { messages: true, brief: true } });
  return (
    <PageShell title="Messages" subtitle="Brief-specific communication threads">
      <Section title="Threads">
        {threads.length ? (
          <div className="space-y-2">
            {threads.map((t) => (
              <div key={t.id} className="rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{t.brief.title}</p>
                    <p className="mt-1 text-xs text-zinc-600">{t.messages.length} message{t.messages.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusPill status={t.brief.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No message threads yet.</p>
        )}
      </Section>
    </PageShell>
  );
}
