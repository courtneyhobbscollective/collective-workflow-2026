import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export async function getAdminUser(): Promise<User | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role !== "admin") return null;
  return user;
}
