"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createUser(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = formData.get("role") as UserRole;
  const clientIdRaw = formData.get("clientId");
  const clientId = typeof clientIdRaw === "string" && clientIdRaw ? clientIdRaw : null;

  if (!email || !fullName) return { ok: false, error: "Email and name are required" };
  if (!["admin", "team_member", "client"].includes(role)) return { ok: false, error: "Invalid role" };
  if (role === "client" && !clientId) return { ok: false, error: "Client users must be linked to a company" };

  try {
    await prisma.user.create({
      data: {
        email,
        fullName,
        role,
        clientId: role === "client" ? clientId : null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That email is already in use" };
    }
    return { ok: false, error: "Could not create user" };
  }
  revalidatePath("/settings/users");
  revalidatePath("/login");
  return { ok: true };
}

export async function updateUserRoleFromForm(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role") as UserRole;
  const clientIdRaw = formData.get("clientId");
  const clientId = typeof clientIdRaw === "string" && clientIdRaw ? clientIdRaw : null;

  if (!userId) return { ok: false, error: "Missing user" };
  if (!["admin", "team_member", "client"].includes(role)) return { ok: false, error: "Invalid role" };
  if (role === "client" && !clientId) return { ok: false, error: "Choose a company for client users" };

  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const sessionId = await getSessionUserId();
  if (sessionId === userId) return { ok: false, error: "You cannot change your own role here" };

  await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      clientId: role === "client" ? clientId : null,
    },
  });
  revalidatePath("/settings/users");
  revalidatePath("/login");
  return { ok: true };
}

export async function deleteUserFromForm(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { ok: false, error: "Missing user" };

  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const sessionId = await getSessionUserId();
  if (sessionId === userId) return { ok: false, error: "You cannot delete your own account here" };

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return {
        ok: false,
        error:
          "This user has linked records and cannot be deleted yet. Reassign/remove related records first.",
      };
    }
    return { ok: false, error: "Could not delete user" };
  }

  revalidatePath("/settings/users");
  revalidatePath("/login");
  return { ok: true };
}
