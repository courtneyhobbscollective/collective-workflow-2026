import { notFound, redirect } from "next/navigation";
import { requireRole, requireVerifiedSessionUserId } from "@/lib/auth";
import { getOrCreateDmThread } from "@/lib/dm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Opens (or creates) a 1:1 DM with a teammate and redirects to the thread. */
export default async function OpenDmWithUserPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireRole(["admin", "team_member"]);
  const selfId = await requireVerifiedSessionUserId();

  const { userId: partnerId } = await params;
  if (partnerId === selfId) redirect("/messages");

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: { in: ["admin", "team_member"] } },
    select: { id: true },
  });
  if (!partner) return notFound();

  const thread = await getOrCreateDmThread(selfId, partnerId);
  redirect(`/messages/dm/${thread.id}`);
}
