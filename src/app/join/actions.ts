"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSessionRole } from "@/lib/auth";
import { notifyAllAdmins } from "@/lib/notify-admins";
import { hashPassword } from "@/lib/password";
import { getPrisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function registerClientSelfServe(formData: FormData): Promise<{ ok: false; error: string } | void> {
  const db = getPrisma();
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot.length > 0) {
    return { ok: false, error: "Something went wrong. Try again." };
  }

  const role = await getSessionRole();
  if (role === "admin" || role === "team_member") {
    return {
      ok: false,
      error: "Sign out of the team account first, or open this page in a private window, then submit the form.",
    };
  }
  if (role === "client") {
    return { ok: false, error: "You're already signed in. Sign out to submit a new company request." };
  }

  const companyName = String(formData.get("companyName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!companyName || companyName.length < 2) {
    return { ok: false, error: "Enter a company or project name (at least 2 characters)." };
  }
  if (!fullName) {
    return { ok: false, error: "Enter your full name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return { ok: false, error: "That email already has an account. Sign in on the login page." };
  }

  const prior = await db.pendingClientSignup.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (prior?.status === "pending") {
    return {
      ok: false,
      error: "We already have a pending request for this email. An admin will review it soon.",
    };
  }

  if (prior?.status === "approved") {
    return { ok: false, error: "This email was already approved. Sign in on the login page." };
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch {
    return { ok: false, error: "Could not process your password. Try again." };
  }

  let pendingIdForNotification: string | null = null;
  try {
    if (prior?.status === "rejected") {
      const updated = await db.pendingClientSignup.update({
        where: { id: prior.id },
        data: {
          companyName,
          fullName,
          phoneNumber,
          passwordHash,
          status: "pending",
          reviewedAt: null,
          reviewedById: null,
          rejectionReason: null,
        },
      });
      pendingIdForNotification = updated.id;
    } else {
      const created = await db.pendingClientSignup.create({
        data: {
          companyName,
          fullName,
          email,
          phoneNumber,
          passwordHash,
          status: "pending",
        },
      });
      pendingIdForNotification = created.id;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That email already has a request in progress." };
    }
    return { ok: false, error: "Could not submit your request. Try again in a moment." };
  }

  await notifyAllAdmins({
    title: "New client onboarding request",
    body: `${companyName} (${fullName}) requested portal access and is awaiting approval.`,
    href: "/settings/users",
  });

  if (pendingIdForNotification) {
    revalidatePath("/settings/users");
    revalidatePath("/dashboard");
  }
  revalidatePath("/settings/signup-requests");
  redirect("/join/thanks");
}
