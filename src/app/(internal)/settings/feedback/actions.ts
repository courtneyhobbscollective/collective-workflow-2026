"use server";

import { FeedbackTicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { updateFeedbackTicketStatusById } from "@/lib/prisma-feedback-ticket";

export async function updateFeedbackTicketStatus(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "Not authorized" };

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as FeedbackTicketStatus;
  if (!id) return { ok: false, error: "Missing ticket" };
  if (!["new", "in_review", "resolved", "rejected"].includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const ok = await updateFeedbackTicketStatusById(id, status);
  if (!ok) return { ok: false, error: "Feedback tickets are not ready yet. Restart dev server and retry." };
  revalidatePath("/settings/feedback");
  return { ok: true };
}

