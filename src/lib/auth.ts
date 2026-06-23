import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/session-cookie";

function isDevAuthBypass() {
  return process.env.DEV_BYPASS_AUTH === "true";
}

async function readSession() {
  if (isDevAuthBypass()) {
    return {
      userId: process.env.DEV_BYPASS_USER_ID?.trim() ?? "dev-bypass",
      role: "admin" as UserRole,
    };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await parseSessionToken(token);
  if (!session) return null;
  return { userId: session.userId, role: session.role };
}

export async function getSessionRole() {
  const session = await readSession();
  return session?.role ?? null;
}

export async function getSessionUserId() {
  const session = await readSession();
  return session?.userId ?? null;
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Call from server actions only — clears a stale session cookie. */
export async function clearSessionInAction() {
  await clearSessionCookie();
}

/** Session user id only when that user row exists (guards stale cookies after DB changes). */
export async function getVerifiedSessionUserId() {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function requireVerifiedSessionUserId() {
  const userId = await getVerifiedSessionUserId();
  if (!userId) {
    redirect("/login?error=session");
  }
  return userId;
}

export async function requireRole(allowed: UserRole[]) {
  const role = await getSessionRole();
  if (!role || !allowed.includes(role)) {
    redirect("/login");
  }
  return role;
}

/** For API routes: returns null instead of redirecting. */
export async function requireRoleApi(allowed: UserRole[]) {
  const role = await getSessionRole();
  if (!role || !allowed.includes(role)) return null;
  return role;
}

/** For admin-only pages: signed-in team members are sent to the dashboard instead of login. */
export async function requireAdmin() {
  const role = await getSessionRole();
  if (!role) redirect("/login");
  if (role !== "admin") redirect("/dashboard");
}
