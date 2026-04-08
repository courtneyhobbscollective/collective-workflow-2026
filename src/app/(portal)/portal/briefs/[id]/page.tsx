import { notFound } from "next/navigation";
import { addMessage } from "@/app/actions";
import { Badge } from "@/components/ui";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { PortalMessageUsButton } from "@/components/workflow/portal-message-us-button";
import { Section } from "@/components/workflow/section";
import { PriorityPill, ScopePill, StatusPill } from "@/components/workflow/status-pill";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

function formatBriefTypeLabel(briefType: string): string {
  switch (briefType) {
    case "web_design_dev":
      return "Web design & development";
    case "app_dev":
      return "App development";
    case "video":
      return "Video";
    case "photo":
      return "Photo";
    case "design":
      return "Design";
    case "content":
      return "Content";
    default:
      return briefType.replace(/_/g, " ");
  }
}

function formatDateTime(d: Date) {
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function typeDetailsLines(raw: unknown): string[] {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v == null || v === "") continue;
    const label = k.replace(/_/g, " ");
    if (typeof v === "object") {
      out.push(`${label}: ${JSON.stringify(v)}`);
    } else {
      out.push(`${label}: ${String(v)}`);
    }
  }
  return out;
}

export default async function PortalBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const brief = await prisma.brief.findFirst({
    where: { id, clientId: user?.clientId ?? "" },
    include: {
      client: { select: { name: true } },
      serviceProduct: { select: { name: true } },
      deliverables: { orderBy: { deliveryDate: "asc" } },
      updates: {
        where: { visibleToClient: true },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { fullName: true } } },
      },
      messageThreads: {
        where: { threadType: "client" },
        include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!brief) return notFound();
  const clientThread = brief.messageThreads.find((t) => t.threadType === "client");
  const typeLines = typeDetailsLines(brief.typeDetails);

  return (
    <PageShell
      title={brief.title}
      subtitle={
        <span className="text-sm text-zinc-600">
          {brief.client.name}
          <span className="mx-2 text-zinc-300">·</span>
          Due {formatDateOnly(new Date(brief.deadline))}
        </span>
      }
      action={<PortalMessageUsButton scrollToId="portal-brief-message-thread" />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
          <Section title="Brief details" subtitle="Scope, timeline, and delivery dates">
            <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white">
              <div className="p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{brief.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill status={brief.status} />
                  <ScopePill scopeStatus={brief.scopeStatus} />
                  <PriorityPill priority={brief.priority} />
                  <Badge className="bg-zinc-100 capitalize text-zinc-700">{formatBriefTypeLabel(brief.briefType)}</Badge>
                </div>

                {brief.serviceProduct ? (
                  <p className="mt-3 text-sm text-zinc-600">
                    Service: <span className="font-medium text-zinc-900">{brief.serviceProduct.name}</span>
                  </p>
                ) : null}

                {typeLines.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Brief specifics</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-zinc-700">
                      {typeLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <dl className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                    <dt className="shrink-0 font-medium text-zinc-500">Project deadline</dt>
                    <dd className="text-zinc-900">{formatDateTime(new Date(brief.deadline))}</dd>
                  </div>
                  {brief.clientDeliveryDate ? (
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                      <dt className="shrink-0 font-medium text-zinc-500">Agreed client delivery</dt>
                      <dd className="text-zinc-900">{formatDateOnly(new Date(brief.clientDeliveryDate))}</dd>
                    </div>
                  ) : null}
                  {brief.internalDeliveryDate ? (
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                      <dt className="shrink-0 font-medium text-zinc-500">Internal delivery milestone</dt>
                      <dd className="text-zinc-900">{formatDateOnly(new Date(brief.internalDeliveryDate))}</dd>
                    </div>
                  ) : null}
                  {brief.completedAt ? (
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                      <dt className="shrink-0 font-medium text-zinc-500">Completed</dt>
                      <dd className="text-zinc-900">{formatDateTime(new Date(brief.completedAt))}</dd>
                    </div>
                  ) : null}
                </dl>

                {brief.reviewLink ? (
                  <div className="mt-4 border-t border-zinc-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Review link</p>
                    <Link
                      href={brief.reviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-900"
                    >
                      Open review
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </Section>

          <Section title="Deliverables" subtitle="Items and their delivery dates">
            {brief.deliverables.length ? (
              <div className="space-y-2">
                {brief.deliverables.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-1 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-medium text-zinc-900 ${d.completed ? "line-through opacity-70" : ""}`}>
                        {d.title}
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-zinc-500">{d.deliverableType.replace(/_/g, " ")}</p>
                    </div>
                    <div className="shrink-0 text-sm text-zinc-700">
                      <span className="font-medium">Delivery:</span> {formatDateOnly(new Date(d.deliveryDate))}
                      {d.completed ? (
                        <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                          Done
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No deliverables listed yet.</p>
            )}
          </Section>
        </div>

        {brief.updates.length > 0 ? (
          <Section title="Updates" subtitle="Notes from your team">
            <div className="space-y-2">
              {brief.updates.map((u) => (
                <div key={u.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    {u.author.fullName} · {formatDateTime(new Date(u.createdAt))}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{u.content}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        <div id="portal-brief-message-thread" className="scroll-mt-24">
          <Section title="Message thread" subtitle="Shared conversation with your agency">
            <div className="max-h-72 space-y-2 overflow-auto">
              {(clientThread?.messages ?? []).map((m) => {
                const isTeam = m.sender.role === "admin" || m.sender.role === "team_member";
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isTeam
                        ? "border-sky-200/90 bg-sky-50"
                        : "border-zinc-100 bg-zinc-50"
                    }`}
                  >
                    <p className={`font-medium ${isTeam ? "text-sky-950" : "text-zinc-900"}`}>{m.sender.fullName}</p>
                    <p className={`mt-1 whitespace-pre-wrap ${isTeam ? "text-sky-950" : "text-zinc-800"}`}>{m.body}</p>
                    <p className={`mt-1 text-xs ${isTeam ? "text-sky-700/80" : "text-zinc-500"}`}>
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
              {(clientThread?.messages?.length ?? 0) === 0 ? <p className="text-sm text-zinc-500">No messages yet.</p> : null}
            </div>
            {clientThread && userId ? (
              <form action={addMessage} className="mt-4 space-y-3">
                <input type="hidden" name="briefId" value={brief.id} />
                <input type="hidden" name="threadId" value={clientThread.id} />
                <input type="hidden" name="senderId" value={userId} />
                <textarea
                  name="body"
                  className="min-h-24 w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
                  placeholder="Reply here"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Send message
                </button>
              </form>
            ) : null}
          </Section>
        </div>
      </div>
    </PageShell>
  );
}
