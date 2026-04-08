"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export async function updateClientRelationshipCadence(formData: FormData) {
  await requireRole(["admin"]);

  const clientId = String(formData.get("clientId") || "").trim();
  if (!clientId) return;

  const raw = formData.get("relationshipContactFrequencyDays");
  const str = raw == null ? "" : String(raw).trim();
  const n =
    str === "" ? null : Math.max(1, Math.min(365, Math.floor(Number(str)) || 0)) || null;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      relationshipContactFrequencyDays: n,
      nextRelationshipContactDueAt: n ? addDays(new Date(), n) : null,
      relationshipContactLastNotifiedAt: null,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/crm/clients");
  revalidatePath("/dashboard");
}

export async function recordClientRelationshipContact(formData: FormData) {
  await requireRole(["admin"]);

  const clientId = String(formData.get("clientId") || "").trim();
  if (!clientId) return;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { relationshipContactFrequencyDays: true, nextRelationshipContactDueAt: true },
  });
  if (!client) return;

  const now = new Date();
  const freq = client.relationshipContactFrequencyDays;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      lastRelationshipContactAt: now,
      relationshipContactLastNotifiedAt: null,
      nextRelationshipContactDueAt: freq ? addDays(now, freq) : null,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/crm/clients");
  revalidatePath("/dashboard");
}
