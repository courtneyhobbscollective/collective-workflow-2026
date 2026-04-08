"use server";

import { revalidatePath } from "next/cache";
import { getSessionRole, getSessionUserId, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFeedbackTicket } from "@/lib/prisma-feedback-ticket";
import type { FeedbackTicketArea } from "@prisma/client";

export async function submitFeedbackTicket(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(["admin", "team_member", "client"]);
  const userId = await getSessionUserId();
  const role = await getSessionRole();
  if (!userId || !role) return { ok: false, error: "Not signed in" };

  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "other").trim() as FeedbackTicketArea;
  const message = String(formData.get("message") ?? "").trim();
  const pagePathRaw = String(formData.get("pagePath") ?? "").trim();
  const pagePath = pagePathRaw || null;
  if (!title || !message) return { ok: false, error: "Title and details are required." };
  if (!["home", "sales", "delivery", "comms", "business", "settings", "portal", "other"].includes(area)) {
    return { ok: false, error: "Choose a valid app section." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return { ok: false, error: "User not found." };

  const ok = await createFeedbackTicket({
    userId,
    role,
    email: user.email,
    title,
    area,
    message,
    pagePath,
  });
  if (!ok) {
    return {
      ok: false,
      error:
        "Feedback storage is not ready yet. Please restart dev server after Prisma generate/db push and try again.",
    };
  }

  revalidatePath("/settings/feedback");
  revalidatePath("/dashboard");
  revalidatePath("/portal");
  return { ok: true };
}

