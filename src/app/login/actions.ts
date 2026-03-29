"use server";

import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function loginAsRole(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set("workflow_role", role, { httpOnly: true, path: "/" });

  // Login should not fail if the DB is temporarily unreachable.
  // Downstream pages will still require a working DB for data.
  try {
    const user = await prisma.user.findFirst({ where: { role } });
    if (user) cookieStore.set("workflow_user_id", user.id, { httpOnly: true, path: "/" });
  } catch {
    // Intentionally swallow to avoid crashing login when Postgres isn't up/migrated yet.
  }

  if (role === "client") {
    redirect("/portal");
  }
  redirect("/dashboard");
}
