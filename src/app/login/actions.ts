"use server";

import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session-cookie";

/** Sets a signed session cookie for an existing user. Throws if the user does not exist. */
async function establishSessionForUser(userId: string): Promise<{ role: UserRole }> {
  const cookieStore = await cookies();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  const token = await createSessionToken(user.id, user.role);
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  cookieStore.delete("workflow_role");
  cookieStore.delete("workflow_user_id");
  return { role: user.role };
}

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    redirect("/login?error=password");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    redirect("/login?error=password");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    redirect("/login?error=password");
  }

  try {
    await establishSessionForUser(user.id);
  } catch {
    redirect("/login?error=password");
  }

  if (user.role === "client") {
    redirect("/portal");
  }
  redirect("/dashboard");
}
