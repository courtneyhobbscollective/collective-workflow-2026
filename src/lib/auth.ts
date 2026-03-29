import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getSessionRole() {
  const role = (await cookies()).get("workflow_role")?.value as UserRole | undefined;
  return role ?? null;
}

export async function getSessionUserId() {
  return (await cookies()).get("workflow_user_id")?.value ?? null;
}

export async function requireRole(allowed: UserRole[]) {
  const role = await getSessionRole();
  if (!role || !allowed.includes(role)) {
    redirect("/login");
  }
  return role;
}
