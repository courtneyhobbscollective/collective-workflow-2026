import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { UserRole } from "@prisma/client";
import {
  addDeliverable,
  addMessage,
  removeDeliverable,
  updateBriefReviewLink,
} from "@/app/actions";
import { Badge, EmptyState } from "@/components/ui";
import { getSessionRole, getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { BriefStatusForm } from "@/components/workflow/brief-status-form";
import { PriorityPill, ScopePill, StatusPill } from "@/components/workflow/status-pill";
import { BriefAddedToast } from "@/components/workflow/brief-added-toast";
import { BriefClientSectionScroll } from "@/components/workflow/brief-client-section-scroll";

function assigneeInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default async function BriefDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const prefillRaw = sp.prefill;
  const prefillContent =
    typeof prefillRaw === "string" ? prefillRaw : Array.isArray(prefillRaw) ? prefillRaw[0] ?? "" : "";
  const [currentUserId, viewerRole] = await Promise.all([getSessionUserId(), getSessionRole()]);
  const [brief, users] = await Promise.all([
    prisma.brief.findUnique({
      where: { id },
      include: {
        client: true,
        assignments: { include: { user: true } },
        deliverables: true,
        messageThreads: {
          where: { threadType: "client" },
          include: { messages: { include: { sender: true }, orderBy: { createdAt: "asc" } } },
        },
      }
    }),
    prisma.user.findMany({ where: { role: { in: ["admin", "team_member"] } } })
  ]);
  if (!brief) return notFound();

  const catalogProduct =
    brief.serviceProductId != null
      ? await prisma.serviceProduct.findUnique({ where: { id: brief.serviceProductId } })
      : null;
  const clientThread = brief.messageThreads.find((t) => t.threadType === "client") ?? null;

  const actingUserId = currentUserId ?? users[0]?.id;
  if (!actingUserId) {
    return <EmptyState title="No active user" body="Please sign in again." />;
  }

  const deliverablesSorted = brief.deliverables
    .slice()
    .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

  return (
    <PageShell
      title={brief.title}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-2">
          <span>{brief.client.name}</span>
          <StatusPill status={brief.status} />
        </span>
      }
    >
      <Suspense fallback={null}>
        <BriefClientSectionScroll />
      </Suspense>
      <BriefAddedToast />
      <div className="space-y-4">
          <Section
            title="Overview"
            subtitle="Brief details and status"
            action={
              brief.assignments.length > 0 ? (
                <div className="flex w-full flex-wrap items-center justify-end gap-4 sm:w-auto">
                  {brief.assignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 text-right">
                      {a.user.avatarUrl ? (
                        <Image
                          src={a.user.avatarUrl}
                          alt=""
                          width={36}
                          height={36}
                          unoptimized
                          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-zinc-100"
                        />
                      ) : (
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 ring-2 ring-zinc-100"
                          aria-hidden
                        >
                          {assigneeInitials(a.user.fullName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">{a.user.fullName}</p>
                        <p className="text-xs capitalize text-zinc-500">{a.role.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null
            }
          >
            <div className="mt-1 overflow-hidden rounded-xl border border-zinc-200/80">
              <div className="bg-white p-4">
                <p className="text-sm text-zinc-700">{brief.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill status={brief.status} />
                  <ScopePill scopeStatus={brief.scopeStatus} />
                  <PriorityPill priority={brief.priority} />
                  <Badge className="bg-zinc-100 text-zinc-700">{brief.briefType}</Badge>
                </div>
                {catalogProduct ? (
                  <p className="mt-3 text-sm text-zinc-600">
                    Catalog service:{" "}
                    <span className="font-medium text-zinc-900">{catalogProduct.name}</span>
                  </p>
                ) : null}
                <div className="mt-3 space-y-1 text-sm text-zinc-600">
                  <p>
                    Deadline:{" "}
                    <span className="font-medium text-zinc-900">{new Date(brief.deadline).toLocaleString()}</span>
                  </p>
                  {brief.internalDeliveryDate ? (
                    <p>
                      Internal delivery:{" "}
                      <span className="font-medium text-zinc-900">
                        {new Date(brief.internalDeliveryDate).toLocaleDateString()}
                      </span>
                    </p>
                  ) : null}
                  {brief.clientDeliveryDate ? (
                    <p>
                      Client delivery:{" "}
                      <span className="font-medium text-zinc-900">
                        {new Date(brief.clientDeliveryDate).toLocaleDateString()}
                      </span>
                    </p>
                  ) : null}
                </div>
                <BriefStatusForm
                  briefId={brief.id}
                  currentStatus={brief.status}
                  actingUserId={actingUserId}
                  viewerRole={viewerRole ?? "team_member"}
                  teamUsers={users.map((u) => ({ id: u.id, fullName: u.fullName }))}
                />
                <form action={updateBriefReviewLink} className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
                  <input type="hidden" name="briefId" value={brief.id} />
                  <label htmlFor="brief-review-link" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Review link
                  </label>
                  <p className="text-xs text-zinc-500">For review rounds, Frame.io, docs, or any client review URL.</p>
                  <input
                    id="brief-review-link"
                    name="reviewLink"
                    type="url"
                    defaultValue={brief.reviewLink ?? ""}
                    placeholder="https://…"
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Save review link
                  </button>
                </form>
              </div>
            </div>
          </Section>

          <Section title="Deliverables" subtitle="Add deliverables and track what’s scheduled">
            <div className="mt-1 grid overflow-hidden rounded-xl border border-zinc-200/80 lg:grid-cols-[minmax(13rem,28%)_1fr]">
              <div className="border-b border-zinc-200/70 bg-white p-4 lg:border-b-0 lg:border-r">
                <form action={addDeliverable} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input type="hidden" name="briefId" value={brief.id} />
                  <input
                    name="title"
                    placeholder="Deliverable title"
                    className="rounded-lg border border-zinc-200 bg-white p-2 text-sm sm:col-span-3"
                  />
                  <select
                    name="deliverableType"
                    className="rounded-lg border border-zinc-200 bg-white p-2 text-sm"
                    defaultValue="other"
                  >
                    <option value="video">video</option>
                    <option value="image">image</option>
                    <option value="design">design</option>
                    <option value="web">web</option>
                    <option value="strategy">strategy</option>
                    <option value="other">other</option>
                  </select>
                  <input name="deliveryDate" type="date" className="rounded-lg border border-zinc-200 bg-white p-2 text-sm sm:col-span-2" />
                  <button
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 sm:col-span-3"
                    type="submit"
                  >
                    Add deliverable
                  </button>
                </form>
              </div>
              <div className="bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Current deliverables</p>
                {deliverablesSorted.length ? (
                  <ul className="mt-3 flex flex-col gap-2">
                    {deliverablesSorted.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-lg bg-white/80 p-3 text-xs ring-1 ring-zinc-200/80"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 font-medium leading-snug text-zinc-900">{d.title}</p>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge
                              className={
                                d.completed ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"
                              }
                            >
                              {d.completed ? "Done" : "Planned"}
                            </Badge>
                            <form action={removeDeliverable}>
                              <input type="hidden" name="deliverableId" value={d.id} />
                              <button
                                type="submit"
                                className="text-[11px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </form>
                          </div>
                        </div>
                        <p className="mt-1.5 text-zinc-600">
                          {d.deliverableType}
                          <span className="text-zinc-400"> · </span>
                          {new Date(d.deliveryDate).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">None yet — add one on the left.</p>
                )}
              </div>
            </div>
          </Section>

          <Section title="Client thread" subtitle="Single shared thread with the client">
            <div className="max-h-80 space-y-3 overflow-auto rounded-xl border border-zinc-200/80 bg-white p-3">
              {(clientThread?.messages ?? []).length ? (
                (clientThread?.messages ?? []).map((m) => (
                  <div key={m.id} className="rounded-xl border border-zinc-100 bg-zinc-50/90 px-3 py-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">{m.sender.fullName}</p>
                      <span className="text-xs text-zinc-500">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-800">{m.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No messages yet.</p>
              )}
            </div>
            {clientThread ? (
              <form action={addMessage} className="mt-4 space-y-3">
                <input type="hidden" name="briefId" value={brief.id} />
                <input type="hidden" name="threadId" value={clientThread.id} />
                <input type="hidden" name="senderId" value={actingUserId} />
                <textarea
                  name="body"
                  defaultValue={prefillContent}
                  className="w-full min-h-24 rounded-lg border border-zinc-200 bg-white p-2 text-sm"
                  placeholder="Write a message to the client"
                />
                <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800" type="submit">
                  Send message
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Client thread is unavailable for this brief.</p>
            )}
          </Section>
      </div>
    </PageShell>
  );
}
