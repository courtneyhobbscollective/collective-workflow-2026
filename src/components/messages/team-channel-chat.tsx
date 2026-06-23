"use client";

import { useCallback, useState } from "react";
import type { TeamChannelMessageKind } from "@prisma/client";
import { sendTeamChannelMessage } from "@/app/actions";
import { HelpHint } from "@/components/help/help-hint";
import { ChatComposer } from "@/components/workflow/chat-composer";
import { TeamChatMessageList } from "@/app/(internal)/messages/team-chat-message-list";

export type TeamChannelMessageRow = {
  id: string;
  kind: TeamChannelMessageKind;
  body: string;
  metadata: unknown;
  createdAt: string;
  sender: { fullName: string; avatarUrl: string | null } | null;
};

export function TeamChannelChat({
  channelId,
  channelName,
  clientId,
  initialMessages,
}: {
  channelId: string;
  channelName: string;
  clientId: string | null;
  initialMessages: TeamChannelMessageRow[];
}) {
  const [messages, setMessages] = useState(initialMessages);

  const refreshMessages = useCallback(async () => {
    const res = await fetch(`/api/team-chat/channels/${channelId}/messages`, { cache: "no-store" });
    if (!res.ok) return;
    const next = (await res.json()) as TeamChannelMessageRow[];
    setMessages(next);
  }, [channelId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
        <header className="border-b border-zinc-200 bg-white px-4 py-3">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
            <span className="text-zinc-400">#</span> {channelName}
            <HelpHint articleId="team-chat" />
          </h2>
          <p className="text-xs text-zinc-500">
            {clientId ? "Client channel — whole team" : "Workspace-wide — all admins and team members"}
          </p>
        </header>
        <TeamChatMessageList
          messages={messages.map((m) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }))}
        />
      </div>
      <ChatComposer
        action={sendTeamChannelMessage}
        channelId={channelId}
        placeholder={`Message #${channelName}…`}
        onSent={refreshMessages}
      />
    </div>
  );
}
