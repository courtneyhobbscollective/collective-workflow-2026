import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function isDevAuthBypass() {
  return process.env.DEV_BYPASS_AUTH === "true";
}

export async function getSessionRole() {
  if (isDevAuthBypass()) return "admin";
  const role = (await cookies()).get("workflow_role")?.value as UserRole | undefined;
  return role ?? null;
}

export async function getSessionUserId() {
  if (isDevAuthBypass()) {
    return process.env.DEV_BYPASS_USER_ID?.trim() ?? null;
  }
  return (await cookies()).get("workflow_user_id")?.value ?? null;
}

export async function requireRole(allowed: UserRole[]) {
  const role = await getSessionRole();
  if (!role || !allowed.includes(role)) {
    redirect("/login");
  }
  return role;
}

/** For admin-only pages: signed-in team members are sent to the dashboard instead of login. */
export async function requireAdmin() {
  const role = await getSessionRole();
  if (!role) redirect("/login");
  if (role !== "admin") redirect("/dashboard");
}
