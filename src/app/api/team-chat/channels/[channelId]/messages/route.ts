import { NextResponse } from "next/server";
import { getVerifiedSessionUserId, requireRoleApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureViewerInChannel } from "@/lib/team-chat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const role = await requireRoleApi(["admin", "team_member"]);
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = await getVerifiedSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { channelId } = await params;
  const ok = await ensureViewerInChannel(channelId, userId);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const messages = await prisma.teamChannelMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: "asc" },
    take: 300,
    include: { sender: { select: { fullName: true, avatarUrl: true } } },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      kind: m.kind,
      body: m.body,
      metadata: m.metadata,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender,
    }))
  );
}
