"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { StartDmForm } from "./start-dm-form";

export function TeamChatSidebar(props: {
  channels: { id: string; name: string; clientId?: string | null }[];
  dmThreads: { id: string; label: string }[];
  teammates: { id: string; fullName: string }[];
  currentUserId: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Channels</p>
        <p className="mt-0.5 text-xs text-zinc-400">General chat + Leads + one channel per client</p>
      </div>
      <nav className="max-h-52 overflow-y-auto p-2">
        {props.channels.length === 0 ? (
          <p className="px-2 py-2 text-xs text-zinc-500">No channels yet.</p>
        ) : (
          props.channels.map((c) => {
            const href = `/messages/channel/${c.id}`;
            const active = pathname === href;
            return (
              <Link
                key={c.id}
                href={href}
                className={cn(
                  "mb-0.5 block truncate rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                <span className="text-zinc-400">#</span> {c.name}
              </Link>
            );
          })
        )}
      </nav>

      <StartDmForm teammates={props.teammates} currentUserId={props.currentUserId} />

      <div className="border-b border-t border-zinc-100 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Direct messages</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {props.dmThreads.length === 0 ? (
          <p className="px-2 py-2 text-xs text-zinc-500">Start a DM with a teammate above.</p>
        ) : (
          props.dmThreads.map((d) => {
            const href = `/messages/dm/${d.id}`;
            const active = pathname === href;
            return (
              <Link
                key={d.id}
                href={href}
                className={cn(
                  "mb-0.5 block truncate rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                )}
              >
                {d.label}
              </Link>
            );
          })
        )}
      </nav>
    </aside>
  );
}
