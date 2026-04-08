"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { generateResetTokenParts } from "@/lib/password-reset-token";

const RESET_TTL_MS = 60 * 60 * 1000;

function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: true as const };
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const { raw, hash } = generateResetTokenParts();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt },
  });

  const resetUrl = `${appBaseUrl()}/reset-password?t=${encodeURIComponent(raw)}`;
  const result = await sendPasswordResetEmail({
    to: email,
    resetUrl,
    fullName: user.fullName,
  });

  if (!result.sent) {
    if (result.logMessage) console.warn(result.logMessage);
    return {
      ok: true as const,
      devResetUrl: result.devFallbackUrl,
    };
  }

  return { ok: true as const };
}
