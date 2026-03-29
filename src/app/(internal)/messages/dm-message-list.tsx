"use client";

import { ChatSenderAvatar } from "@/components/workflow/chat-sender-avatar";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type Row = {
  id: string;
  body: string;
  metadata: unknown;
  createdAt: Date;
  sender: { fullName: string; avatarUrl: string | null };
};

function gifFromMeta(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const g = (meta as { gifUrl?: unknown }).gifUrl;
  return typeof g === "string" ? g : null;
}

export function DmMessageList({ messages }: { messages: Row[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {messages.map((m) => {
        const gifUrl = gifFromMeta(m.metadata);
        const hasBody = Boolean(m.body.trim());
        const hasBubble = Boolean(gifUrl || hasBody);
        return (
          <div key={m.id} className="flex gap-2">
            <ChatSenderAvatar fullName={m.sender.fullName} avatarUrl={m.sender.avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <span className="text-sm font-semibold text-zinc-900">{m.sender.fullName}</span>
                <span className="text-[11px] text-zinc-400">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
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
