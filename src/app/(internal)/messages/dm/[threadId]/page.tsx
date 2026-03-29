import { notFound } from "next/navigation";
import { sendDmMessage } from "@/app/actions";
import { ChatComposer } from "@/components/workflow/chat-composer";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DmMessageList } from "../../dm-message-list";

export default async function DmThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const userId = await getSessionUserId();
  if (!userId) return notFound();

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
        <header className="border-b border-zinc-200 bg-white px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">{otherName}</h2>
          <p className="text-xs text-zinc-500">Direct message</p>
        </header>
        <DmMessageList messages={thread.messages} />
      </div>
      <ChatComposer action={sendDmMessage} threadId={threadId} placeholder={`Message ${otherName}…`} />
    </div>
  );
}
