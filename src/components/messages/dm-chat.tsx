"use client";

import { useCallback, useState } from "react";
import { sendDmMessage } from "@/app/actions";
import { ChatComposer } from "@/components/workflow/chat-composer";
import { DmMessageList } from "@/app/(internal)/messages/dm-message-list";

export type DmMessageRow = {
  id: string;
  body: string;
  metadata: unknown;
  createdAt: string;
  sender: { fullName: string; avatarUrl: string | null };
};

export function DmChat({
  threadId,
  otherName,
  initialMessages,
}: {
  threadId: string;
  otherName: string;
  initialMessages: DmMessageRow[];
}) {
  const [messages, setMessages] = useState(initialMessages);

  const refreshMessages = useCallback(async () => {
    const res = await fetch(`/api/team-chat/dm/${threadId}/messages`, { cache: "no-store" });
    if (!res.ok) return;
    const next = (await res.json()) as DmMessageRow[];
    setMessages(next);
  }, [threadId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
        <header className="border-b border-zinc-200 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">{otherName}</h2>
          <p className="text-xs text-zinc-500">Direct message</p>
        </header>
        <DmMessageList
          messages={messages.map((m) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }))}
        />
      </div>
      <ChatComposer
        action={sendDmMessage}
        threadId={threadId}
        placeholder={`Message ${otherName}…`}
        onSent={refreshMessages}
      />
    </div>
  );
}
