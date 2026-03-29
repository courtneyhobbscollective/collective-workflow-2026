import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureTeamChannelsForAllClients, sortTeamChannelsForNav } from "@/lib/team-chat";
import { TeamChatEmpty } from "./team-chat-empty";

export default async function MessagesIndexPage() {
  await ensureTeamChannelsForAllClients();
  const rows = await prisma.teamChannel.findMany({
    select: { id: true, name: true, clientId: true },
  });
  const sorted = sortTeamChannelsForNav(rows);
  const first = sorted[0];
  if (first) redirect(`/messages/channel/${first.id}`);
  return <TeamChatEmpty />;
}
