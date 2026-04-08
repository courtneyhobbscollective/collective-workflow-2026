"use client";

import Link from "next/link";
import { ChatSenderAvatar } from "@/components/workflow/chat-sender-avatar";
import { cn } from "@/lib/utils";
import { TeamChannelMessageKind } from "@prisma/client";
import { useEffect, useRef } from "react";

type Row = {
  id: string;
  kind: TeamChannelMessageKind;
  body: string;
  metadata: unknown;
  createdAt: Date;
  sender: { fullName: string; avatarUrl: string | null } | null;
};

function gifFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const g = (meta as { gifUrl?: unknown }).gifUrl;
  return typeof g === "string" ? g : null;
}

function briefCtaFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const o = meta as { briefCta?: unknown; briefId?: unknown };
  if (o.briefCta !== true || typeof o.briefId !== "string" || !o.briefId.trim()) return null;
  return o.briefId;
}

function formatChatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
}

function formatChatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
}

export function TeamChatMessageList({ messages }: { messages: Row[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((m) => {
        if (m.kind === "system") {
          return (
            <div
              key={m.id}
              className="rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2.5 text-sm text-indigo-950 shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600/90">Activity</p>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-indigo-950">{m.body}</pre>
              <p className="mt-2 text-[11px] text-indigo-600/80">{formatChatDateTime(new Date(m.createdAt))}</p>
            </div>
          );
        }
        const gifUrl = gifFromMeta(m.metadata);
        const briefCtaId = briefCtaFromMeta(m.metadata);
        const senderName = m.sender?.fullName ?? "Unknown";
        const hasBody = Boolean(m.body.trim());
        const hasBubble = Boolean(gifUrl || hasBody || briefCtaId);
        return (
          <div key={m.id} className="flex gap-2">
            <ChatSenderAvatar fullName={senderName} avatarUrl={m.sender?.avatarUrl ?? null} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <span className="text-sm font-semibold text-zinc-900">{senderName}</span>
                <span className="text-[11px] text-zinc-400">{formatChatTime(new Date(m.createdAt))}</span>
              </div>
              {hasBubble ? (
                <div className="mt-1.5 w-fit max-w-[min(100%,28rem)] rounded-2xl rounded-tl-md border border-zinc-200/90 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  {gifUrl ? (
                    <div
                      className={cn(
                        "-mx-1 -mt-1 overflow-hidden rounded-xl",
                        hasBody && "mb-2"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gifUrl} alt="" className="max-h-64 w-full object-cover" />
                    </div>
                  ) : null}
                  {hasBody ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">{m.body}</p>
                  ) : null}
                  {briefCtaId ? (
                    <Link
                      href={`/briefs/${briefCtaId}`}
                      className="mt-2 inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800"
                    >
                      Open this brief
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
