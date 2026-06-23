import { getVerifiedSessionUserId } from "@/lib/auth";
import { loadMessagesSidebarData } from "@/lib/messages-sidebar-data";
import { TeamChatSidebar } from "./team-chat-sidebar";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const userId = await getVerifiedSessionUserId();
  const { workspaceChannels, clientChannelCount, teammates, dmThreadByPartnerId } = await loadMessagesSidebarData(userId);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Team chat</h1>
        <p className="mt-1 text-sm text-zinc-500">
          General chat and leads up top; message any teammate directly; expand Clients to search channels.
        </p>
      </div>
      <div className="flex h-[calc(100dvh-10rem)] min-h-[22rem] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:h-[calc(100dvh-7.25rem)]">
        <TeamChatSidebar
          workspaceChannels={workspaceChannels}
          clientChannelCount={clientChannelCount}
          teammates={teammates}
          currentUserId={userId ?? ""}
          dmThreadByPartnerId={dmThreadByPartnerId}
        />
        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[1fr_auto] bg-[#f4f4f5]">{children}</div>
      </div>
    </div>
  );
}
