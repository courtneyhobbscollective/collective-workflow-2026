"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import { ClientStatusPill } from "@/components/workflow/status-pill";
import { Table, TableBody, TableCell, TableHeadCell, TableHeader, TableRow } from "@/components/ui/table";
import type { ClientEngagementType, ClientStatus } from "@prisma/client";

export type ClientListItem = {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  engagementType: ClientEngagementType;
  status: ClientStatus;
  createdAtIso: string;
  contactLine: string;
  searchText: string;
};

function matchesQuery(item: ClientListItem, query: string) {
  if (!query) return true;
  return item.searchText.includes(query);
}

export function ClientsList({ clients }: { clients: ClientListItem[] }) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () => clients.filter((c) => matchesQuery(c, normalizedQuery)),
    [clients, normalizedQuery]
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clients, contacts, email, or phone…"
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          aria-label="Search clients"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-10 text-center text-sm text-zinc-600">
          No clients match &ldquo;{query.trim()}&rdquo;. Try a different name, company, or email.
        </p>
      ) : (
        <>
          {normalizedQuery ? (
            <p className="text-xs text-zinc-500">
              Showing {filtered.length} of {clients.length} client{clients.length === 1 ? "" : "s"}
            </p>
          ) : null}
          <Table>
          <TableHeader>
            <div className="flex gap-3 py-3">
              <TableHeadCell className="flex-[2]">Client</TableHeadCell>
              <TableHeadCell className="flex-[1.4]">Primary contact</TableHeadCell>
              <TableHeadCell className="flex-[0.8]">Engagement</TableHeadCell>
              <TableHeadCell className="flex-[0.8]">Status</TableHeadCell>
              <TableHeadCell className="flex-[0.8]">Created</TableHeadCell>
              <TableHeadCell className="flex-[0.5]" />
            </div>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`} className="block">
                <TableRow className="transition-colors hover:bg-zinc-50">
                  <TableCell className="flex-[2] min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">{c.name}</div>
                  </TableCell>
                  <TableCell className="flex-[1.4] min-w-0">
                    <div className="truncate text-xs text-zinc-600">{c.contactLine}</div>
                  </TableCell>
                  <TableCell className="flex-[0.8]">
                    <Badge className={c.engagementType === "retainer" ? "bg-violet-100 text-violet-900" : ""}>
                      {c.engagementType === "retainer" ? "Retainer" : "Project"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex-[0.8]">
                    <ClientStatusPill status={c.status} />
                  </TableCell>
                  <TableCell className="flex-[0.8]">
                    <div className="text-sm text-zinc-900">
                      {new Date(c.createdAtIso).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="flex-[0.5] text-right text-sm text-zinc-600">View</TableCell>
                </TableRow>
              </Link>
            ))}
          </TableBody>
        </Table>
        </>
      )}
    </div>
  );
}
