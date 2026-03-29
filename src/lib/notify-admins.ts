import { prisma } from "@/lib/prisma";

/** Creates the same in-app notification for every admin user. */
export async function notifyAllAdmins(params: {
  title: string;
  body: string;
  href?: string | null;
  clientId?: string | null;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });
  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: params.title,
      body: params.body,
      href: params.href ?? null,
      clientId: params.clientId ?? null,
    })),
  });
}
