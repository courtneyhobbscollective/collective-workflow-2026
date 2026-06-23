import { NextResponse } from "next/server";
import { getVerifiedSessionUserId, requireRoleApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const role = await requireRoleApi(["admin", "team_member"]);
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = await getVerifiedSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { threadId } = await params;
  const thread = await prisma.dmThread.findFirst({
    where: {
      id: threadId,
      OR: [{ lowUserId: userId }, { highUserId: userId }],
    },
    select: { id: true },
  });
  if (!thread) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const messages = await prisma.dmMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 400,
    include: { sender: { select: { fullName: true, avatarUrl: true } } },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      body: m.body,
      metadata: m.metadata,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender,
    }))
  );
}
