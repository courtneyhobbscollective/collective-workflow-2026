import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireRoleApi } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

const loadClientChannels = unstable_cache(
  async () =>
    prisma.teamChannel.findMany({
      where: { clientId: { not: null } },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ["client-channels-nav-v1"],
  { revalidate: 180, tags: [CACHE_TAGS.clientChannels] }
);

export async function GET() {
  const role = await requireRoleApi(["admin", "team_member"]);
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const channels = await loadClientChannels();
  return NextResponse.json(channels);
}
