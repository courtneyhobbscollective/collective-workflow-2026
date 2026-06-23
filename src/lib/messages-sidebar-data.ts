import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";
import { ensureMessagesTeamChatReady, sortTeamChannelsForNav } from "@/lib/team-chat";

export type MessagesSidebarData = {
  workspaceChannels: { id: string; name: string; clientId: string | null }[];
  clientChannelCount: number;
  teammates: { id: string; fullName: string }[];
  dmThreadByPartnerId: Record<string, string>;
};

async function fetchMessagesSidebarData(userId: string | null): Promise<MessagesSidebarData> {
  await ensureMessagesTeamChatReady(userId);

  const [workspaceChannels, clientChannelCount, teammates, dmRaw] = await Promise.all([
    prisma.teamChannel
      .findMany({
        where: { clientId: null },
        select: { id: true, name: true, clientId: true },
      })
      .then(sortTeamChannelsForNav),
    prisma.teamChannel.count({ where: { clientId: { not: null } } }),
    prisma.user.findMany({
      where: { role: { in: ["admin", "team_member"] } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    userId
      ? prisma.dmThread.findMany({
          where: { OR: [{ lowUserId: userId }, { highUserId: userId }] },
          orderBy: { updatedAt: "desc" },
          select: { id: true, lowUserId: true, highUserId: true },
        })
      : Promise.resolve([]),
  ]);

  const dmThreadByPartnerId: Record<string, string> = {};
  if (userId) {
    for (const t of dmRaw) {
      const partnerId = t.lowUserId === userId ? t.highUserId : t.lowUserId;
      dmThreadByPartnerId[partnerId] = t.id;
    }
  }

  return { workspaceChannels, clientChannelCount, teammates, dmThreadByPartnerId };
}

/** Workspace + DMs only — client channels load on demand when the user expands Clients. */
export function loadMessagesSidebarData(userId: string | null) {
  return unstable_cache(
    () => fetchMessagesSidebarData(userId),
    ["messages-sidebar-v2", userId ?? "anon"],
    { revalidate: 120, tags: [CACHE_TAGS.messagesSidebar] }
  )();
}
