"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ChannelRow = { id: string; name: string; clientId?: string | null };
type TeammateRow = { id: string; fullName: string };

export function TeamChatSidebar(props: {
  workspaceChannels: ChannelRow[];
  clientChannelCount: number;
  teammates: TeammateRow[];
  currentUserId: string;
  dmThreadByPartnerId: Record<string, string>;
}) {
  const pathname = usePathname();
  const dmTeammates = props.teammates.filter((t) => t.id !== props.currentUserId);

  const [clientsExpanded, setClientsExpanded] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [clientChannels, setClientChannels] = useState<ChannelRow[]>([]);
  const [clientChannelsLoading, setClientChannelsLoading] = useState(false);
  const [clientChannelsLoaded, setClientChannelsLoaded] = useState(false);

  const activeClientChannelId = pathname.startsWith("/messages/channel/")
    ? pathname.replace("/messages/channel/", "")
    : null;
  const activeClientChannel = Boolean(
    activeClientChannelId && !props.workspaceChannels.some((c) => c.id === activeClientChannelId)
  );

  const activeDmPartnerId = useMemo(() => {
    const withMatch = pathname.match(/^\/messages\/dm\/with\/([^/]+)$/);
    if (withMatch) return withMatch[1];
    const threadMatch = pathname.match(/^\/messages\/dm\/([^/]+)$/);
    if (!threadMatch || threadMatch[1] === "with") return null;
    const threadId = threadMatch[1];
    for (const [partnerId, id] of Object.entries(props.dmThreadByPartnerId ?? {})) {
      if (id === threadId) return partnerId;
    }
    return null;
  }, [pathname, props.dmThreadByPartnerId]);

  const loadClientChannels = useCallback(async () => {
    if (clientChannelsLoaded || clientChannelsLoading) return;
    setClientChannelsLoading(true);
    try {
      const res = await fetch("/api/team-chat/client-channels", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as ChannelRow[];
        setClientChannels(data);
        setClientChannelsLoaded(true);
      }
    } finally {
      setClientChannelsLoading(false);
    }
  }, [clientChannelsLoaded, clientChannelsLoading]);

  useEffect(() => {
    if (clientsExpanded || activeClientChannel) {
      void loadClientChannels();
    }
  }, [clientsExpanded, activeClientChannel, loadClientChannels]);

  useEffect(() => {
    if (activeClientChannel) setClientsExpanded(true);
  }, [activeClientChannel]);

  const filteredClientChannels = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clientChannels;
    return clientChannels.filter((c) => c.name.toLowerCase().includes(q));
  }, [clientChannels, clientQuery]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-zinc-100 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Workspace</p>
        </div>
        <nav className="p-2">
          {props.workspaceChannels.length === 0 ? (
            <p className="px-2 py-2 text-xs text-zinc-500">No workspace channels yet.</p>
          ) : (
            props.workspaceChannels.map((c) => (
              <ChannelLink
                key={c.id}
                href={`/messages/channel/${c.id}`}
                name={c.name}
                active={pathname === `/messages/channel/${c.id}`}
              />
            ))
          )}
        </nav>

        <div className="border-t border-zinc-100 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Direct messages</p>
        </div>
        <nav className="p-2 pb-3">
          {dmTeammates.length === 0 ? (
            <p className="px-2 py-2 text-xs text-zinc-500">No teammates yet.</p>
          ) : (
            dmTeammates.map((t) => {
              const threadId = props.dmThreadByPartnerId?.[t.id];
              const href = threadId ? `/messages/dm/${threadId}` : `/messages/dm/with/${t.id}`;
              const active = activeDmPartnerId === t.id;
              return (
                <Link
                  key={t.id}
                  href={href}
                  prefetch={false}
                  scroll={false}
                  className={cn(
                    "mb-0.5 flex items-center gap-2 truncate rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                    )}
                    aria-hidden
                  >
                    {initials(t.fullName)}
                  </span>
                  <span className="truncate">{t.fullName}</span>
                </Link>
              );
            })
          )}
        </nav>
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-zinc-100 bg-white",
          clientsExpanded && "flex max-h-[min(50vh,20rem)] min-h-0 flex-col shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
        )}
      >
        <button
          type="button"
          onClick={() => setClientsExpanded((v) => !v)}
          aria-expanded={clientsExpanded}
          className="flex w-full shrink-0 items-center gap-2 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:bg-zinc-50"
        >
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform", clientsExpanded && "rotate-180")}
          />
          <span className="flex-1">Clients</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-600">
            {props.clientChannelCount}
          </span>
        </button>

        {clientsExpanded ? (
          <>
            <div className="relative shrink-0 px-2 pb-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder="Search clients…"
                aria-label="Search client channels"
                className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {clientChannelsLoading && !clientChannelsLoaded ? (
                <p className="px-2 py-2 text-xs text-zinc-500">Loading client channels…</p>
              ) : filteredClientChannels.length === 0 ? (
                <p className="px-2 py-2 text-xs text-zinc-500">
                  {clientQuery.trim() ? `No clients match “${clientQuery.trim()}”.` : "No client channels yet."}
                </p>
              ) : (
                filteredClientChannels.map((c) => (
                  <ChannelLink
                    key={c.id}
                    href={`/messages/channel/${c.id}`}
                    name={c.name}
                    active={pathname === `/messages/channel/${c.id}`}
                  />
                ))
              )}
            </nav>
          </>
        ) : null}
      </div>
    </aside>
  );
}

function ChannelLink({ href, name, active }: { href: string; name: string; active: boolean }) {
  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      className={cn(
        "mb-0.5 block truncate rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
      )}
    >
      <span className={active ? "text-white/60" : "text-zinc-400"}>#</span> {name}
    </Link>
  );
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
