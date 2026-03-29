import { prisma } from "@/lib/prisma";

export async function getCurrentUserForRole(role: "admin" | "team_member" | "client") {
  return prisma.user.findFirst({ where: { role } });
}
