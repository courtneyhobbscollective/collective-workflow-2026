"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { getPrisma } from "@/lib/prisma";

export async function approvePendingSignup(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getPrisma();
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing request" };

  const pending = await db.pendingClientSignup.findUnique({ where: { id } });
  if (!pending || pending.status !== "pending") {
    return { ok: false, error: "This request is no longer pending" };
  }

  const existingUser = await db.user.findUnique({ where: { email: pending.email } });
  if (existingUser) {
    return { ok: false, error: "A user with this email already exists" };
  }

  try {
    await db.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: pending.companyName,
          email: pending.email,
          phoneNumber: pending.phoneNumber,
          status: "active",
          engagementType: "project",
        },
      });
      const user = await tx.user.create({
        data: {
          email: pending.email,
          fullName: pending.fullName,
          phoneNumber: pending.phoneNumber,
          role: "client",
          clientId: client.id,
          passwordHash: pending.passwordHash,
        },
      });
      await tx.pendingClientSignup.update({
        where: { id: pending.id },
        data: {
          status: "approved",
          reviewedAt: new Date(),
          reviewedById: admin.id,
          createdUserId: user.id,
        },
      });
    });
  } catch {
    return { ok: false, error: "Could not approve this request" };
  }

  revalidatePath("/settings/signup-requests");
  revalidatePath("/settings/users");
  revalidatePath("/dashboard");
  revalidatePath("/login");
  return { ok: true };
}

export async function rejectPendingSignup(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getPrisma();
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) return { ok: false, error: "Missing request" };

  const pending = await db.pendingClientSignup.findUnique({ where: { id } });
  if (!pending || pending.status !== "pending") {
    return { ok: false, error: "This request is no longer pending" };
  }

  await db.pendingClientSignup.update({
    where: { id },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedById: admin.id,
      rejectionReason: reason || null,
    },
  });

  revalidatePath("/settings/signup-requests");
  revalidatePath("/settings/users");
  revalidatePath("/dashboard");
  return { ok: true };
}
