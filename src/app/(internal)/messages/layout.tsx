import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { ensureTeamChannelsForAllClients, sortTeamChannelsForNav } from "@/lib/team-chat";
import { TeamChatSidebar } from "./team-chat-sidebar";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  await ensureTeamChannelsForAllClients();
  const userId = await getSessionUserId();

  const [channels, teammates, dmRaw] = await Promise.all([
    prisma.teamChannel
      .findMany({
        select: { id: true, name: true, clientId: true },
      })
      .then(sortTeamChannelsForNav),
    prisma.user.findMany({
      where: { role: { in: ["admin", "team_member"] } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    userId
      ? prisma.dmThread.findMany({
          where: { OR: [{ lowUserId: userId }, { highUserId: userId }] },
          orderBy: { updatedAt: "desc" },
          include: {
            lowUser: { select: { id: true, fullName: true } },
            highUser: { select: { id: true, fullName: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const dmThreads = dmRaw.map((t) => ({
    id: t.id,
    label: t.lowUserId === userId ? t.highUser.fullName : t.lowUser.fullName,
  }));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Team chat</h1>
        <p className="mt-1 text-sm text-zinc-500">
          General chat and a channel per client for the team; DMs for 1:1. Emoji picker + GIF search (needs{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">GIPHY_API_KEY</code>).
        </p>
      </div>
      <div className="flex h-[calc(100dvh-10rem)] min-h-[22rem] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:h-[calc(100dvh-7.25rem)]">
        <TeamChatSidebar
          channels={channels}
          dmThreads={dmThreads}
          teammates={teammates}
          currentUserId={userId ?? ""}
        />
        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[1fr_auto] bg-[#f4f4f5]">{children}</div>
      </div>
    </div>
  );
}
