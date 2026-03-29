import { notFound } from "next/navigation";
import { sendTeamChannelMessage } from "@/app/actions";
import { ChatComposer } from "@/components/workflow/chat-composer";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureViewerInChannel } from "@/lib/team-chat";
import { TeamChatMessageList } from "../../team-chat-message-list";

export default async function TeamChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const userId = await getSessionUserId();
  if (!userId) return notFound();

  await ensureViewerInChannel(channelId, userId);

  const channel = await prisma.teamChannel.findUnique({
    where: { id: channelId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 300,
        include: { sender: { select: { fullName: true, avatarUrl: true } } },
      },
    },
  });
  if (!channel) return notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
        <header className="border-b border-zinc-200 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            <span className="text-zinc-400">#</span> {channel.name}
          </h2>
          <p className="text-xs text-zinc-500">
            {channel.clientId
              ? "Client channel — whole team"
              : "Workspace-wide — all admins and team members"}
          </p>
        </header>
        <TeamChatMessageList messages={channel.messages} />
      </div>
      <ChatComposer action={sendTeamChannelMessage} channelId={channelId} placeholder={`Message #${channel.name}…`} />
    </div>
  );
}
