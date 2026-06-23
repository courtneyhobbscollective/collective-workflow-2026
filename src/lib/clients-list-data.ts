import { unstable_cache } from "next/cache";
import type { ClientEngagementType, ClientStatus } from "@prisma/client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

export type ClientListItemData = {
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

function contactLine(contacts: { name: string; email: string; phoneNumber: string | null; isPrimary: boolean }[]) {
  const primary = contacts.find((c) => c.isPrimary) ?? contacts[0];
  if (!primary) return "No contact on file";
  const bits = [primary.name, primary.email].filter(Boolean);
  if (primary.phoneNumber) bits.push(primary.phoneNumber);
  return bits.join(" · ");
}

function buildSearchText(
  client: {
    name: string;
    email: string | null;
    phoneNumber: string | null;
    brandSummary: string | null;
  },
  contacts: { name: string; email: string; phoneNumber: string | null }[]
) {
  return [client.name, client.email, client.phoneNumber, client.brandSummary, ...contacts.flatMap((c) => [c.name, c.email, c.phoneNumber])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

async function fetchClientsListItems(): Promise<ClientListItemData[]> {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      brandSummary: true,
      engagementType: true,
      status: true,
      createdAt: true,
      contacts: {
        select: { name: true, email: true, phoneNumber: true, isPrimary: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 2,
      },
    },
  });

  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phoneNumber: c.phoneNumber,
    engagementType: c.engagementType,
    status: c.status,
    createdAtIso: c.createdAt.toISOString(),
    contactLine: contactLine(c.contacts),
    searchText: buildSearchText(c, c.contacts),
  }));
}

export function loadClientsListItems() {
  return unstable_cache(fetchClientsListItems, ["clients-list-v1"], {
    revalidate: 60,
    tags: [CACHE_TAGS.clientsList],
  })();
}
