import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sortTeamChannelsForNav } from "@/lib/team-chat";
import { TeamChatEmpty } from "./team-chat-empty";

export default async function MessagesIndexPage() {
  const rows = await prisma.teamChannel.findMany({
    where: { clientId: null },
    select: { id: true, name: true, clientId: true },
  });
  const first = sortTeamChannelsForNav(rows)[0];
  if (first) redirect(`/messages/channel/${first.id}`);
  return <TeamChatEmpty />;
}
