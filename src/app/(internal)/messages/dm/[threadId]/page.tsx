import { notFound } from "next/navigation";
import { DmChat } from "@/components/messages/dm-chat";
import { requireVerifiedSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DmThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const userId = await requireVerifiedSessionUserId();

  const thread = await prisma.dmThread.findFirst({
    where: {
      id: threadId,
      OR: [{ lowUserId: userId }, { highUserId: userId }],
    },
    include: {
      lowUser: { select: { id: true, fullName: true } },
      highUser: { select: { id: true, fullName: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 400,
        include: { sender: { select: { fullName: true, avatarUrl: true } } },
      },
    },
  });
  if (!thread) return notFound();

  const otherName = thread.lowUserId === userId ? thread.highUser.fullName : thread.lowUser.fullName;
  const initialMessages = thread.messages.map((m) => ({
    id: m.id,
    body: m.body,
    metadata: m.metadata,
    createdAt: m.createdAt.toISOString(),
    sender: m.sender,
  }));

  return <DmChat threadId={threadId} otherName={otherName} initialMessages={initialMessages} />;
}
