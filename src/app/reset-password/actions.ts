"use server";

import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/password-reset-token";

export type ResetPasswordState = { error: string } | null;

export async function completePasswordReset(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const rawToken = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!rawToken) {
    return { error: "Missing reset token." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const tokenHash = hashResetToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return {
      error: "This reset link is invalid or has expired. Request a new one from the login page.",
    };
  }

  const newHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=1");
}
