import { notFound } from "next/navigation";
import { TeamChannelChat } from "@/components/messages/team-channel-chat";
import { requireVerifiedSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureViewerInChannel } from "@/lib/team-chat";

export const dynamic = "force-dynamic";

export default async function TeamChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const userId = await requireVerifiedSessionUserId();

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

  const initialMessages = channel.messages.map((m) => ({
    id: m.id,
    kind: m.kind,
    body: m.body,
    metadata: m.metadata,
    createdAt: m.createdAt.toISOString(),
    sender: m.sender,
  }));

  return (
    <TeamChannelChat
      channelId={channelId}
      channelName={channel.name}
      clientId={channel.clientId}
      initialMessages={initialMessages}
    />
  );
}
