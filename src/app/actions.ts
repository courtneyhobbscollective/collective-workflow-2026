"use server";

import {
  AssignmentRole,
  BriefPriority,
  BriefStatus,
  BriefType,
  ClientContactRole,
  ClientEngagementType,
  ClientStatus,
  DeliverableType,
  InternalNoteType,
  ScopeType,
  ServiceProductKind,
} from "@prisma/client";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId, requireRole } from "@/lib/auth";
import { requiresAdminContractConfirmationForInProgress } from "@/lib/workflow/contract-gate";
import {
  ensureClientChannelWithMembers,
  ensureViewerInChannel,
  notifyTeamChannelMentions,
  postAssignmentMentionInGeneralChannel,
  postTeamTaskSummary,
  syncTeamChannelName,
} from "@/lib/team-chat";
import { getOrCreateDmThread } from "@/lib/dm";
import { notifyAllAdmins } from "@/lib/notify-admins";
import { upsertDashboardFeedDismissal } from "@/lib/prisma-dashboard-feed-dismissal";
import { redirect } from "next/navigation";
import fs from "node:fs";
import path from "node:path";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function parseClientEngagementType(formData: FormData): ClientEngagementType {
  const raw = String(formData.get("engagementType") || "project");
  return raw === "retainer" ? "retainer" : "project";
}

async function actorDisplayName() {
  const id = await getSessionUserId();
  if (!id) return "Someone";
  const u = await prisma.user.findUnique({ where: { id }, select: { fullName: true } });
  return u?.fullName ?? "Someone";
}

export async function createClient(formData: FormData) {
  const role = await requireRole(["admin"]);
  if (role !== "admin") return;

  const name = String(formData.get("name") || "");
  const brandSummary = String(formData.get("brandSummary") || "");
  const email = String(formData.get("email") || "");
  const phoneNumber = String(formData.get("phoneNumber") || "");
  const status = (String(formData.get("status") || "active") as ClientStatus) ?? "active";
  const timezone = String(formData.get("timezone") || "Europe/London");
  const engagementType = parseClientEngagementType(formData);

  const pocName = String(formData.get("pocName") || "");
  const pocEmail = String(formData.get("pocEmail") || "");
  const pocTitle = String(formData.get("pocTitle") || "");

  const accountsName = String(formData.get("accountsName") || "");
  const accountsEmail = String(formData.get("accountsEmail") || "");
  const accountsTitle = String(formData.get("accountsTitle") || "");

  const contactsToCreate: Array<{
    name: string;
    email: string;
    title?: string | null;
    isPrimary: boolean;
    role: ClientContactRole;
  }> = [];

  if (pocName && pocEmail) {
    contactsToCreate.push({
      name: pocName,
      email: pocEmail,
      title: pocTitle || null,
      isPrimary: true,
      role: "point_of_contact",
    });
  }

  if (accountsName && accountsEmail) {
    contactsToCreate.push({
      name: accountsName,
      email: accountsEmail,
      title: accountsTitle || null,
      isPrimary: false,
      role: "accounts_contact",
    });
  }

  const created = await prisma.client.create({
    data: {
      name,
      brandSummary: brandSummary || null,
      email: email || null,
      phoneNumber: phoneNumber || null,
      status,
      timezone,
      engagementType,
      contacts: {
        create: contactsToCreate,
      },
    },
  });

  // Optional brand guideline uploads (local dev storage).
  // Files are stored under `public/uploads/clients/{clientId}/...`.
  const guidelinesFiles = formData.getAll("brandGuidelines");
  for (const f of guidelinesFiles) {
    const file = f as unknown as File | null;
    if (!file || typeof (file as any).arrayBuffer !== "function") continue;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const originalName = (file as any).name ? String((file as any).name) : "brand-guidelines";
    const mimeType = (file as any).type ? String((file as any).type) : null;

    const dir = path.join(process.cwd(), "public", "uploads", "clients", created.id);
    fs.mkdirSync(dir, { recursive: true });
    const stamped = `${Date.now()}-${safeFileName(originalName)}`;
    const absPath = path.join(dir, stamped);
    fs.writeFileSync(absPath, bytes);

    const url = `/uploads/clients/${created.id}/${stamped}`;
    await prisma.clientAsset.create({
      data: {
        clientId: created.id,
        type: "brand_guidelines",
        fileName: stamped,
        mimeType,
        url,
      },
    });
  }
  await ensureClientChannelWithMembers(created.id);
  await postTeamTaskSummary(
    created.id,
    `New workspace channel for ${created.name}. Task activity for this client will be summarized here.`
  );
  const creator = await actorDisplayName();
  await notifyAllAdmins({
    title: "New client",
    body: `${creator} added ${created.name}.`,
    href: `/clients/${created.id}`,
    clientId: created.id,
  });
  revalidatePath("/clients");
}

export async function updateClient(formData: FormData) {
  await requireRole(["admin"]);

  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return;

  const name = String(formData.get("name") || "");
  const brandSummary = String(formData.get("brandSummary") || "");
  const email = String(formData.get("email") || "");
  const phoneNumber = String(formData.get("phoneNumber") || "");
  const status = (String(formData.get("status") || "active") as ClientStatus) ?? "active";
  const timezone = String(formData.get("timezone") || "Europe/London");
  const engagementType = parseClientEngagementType(formData);

  const pocName = String(formData.get("pocName") || "");
  const pocEmail = String(formData.get("pocEmail") || "");
  const pocTitle = String(formData.get("pocTitle") || "");

  const accountsName = String(formData.get("accountsName") || "");
  const accountsEmail = String(formData.get("accountsEmail") || "");
  const accountsTitle = String(formData.get("accountsTitle") || "");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      brandSummary: brandSummary || null,
      email: email || null,
      phoneNumber: phoneNumber || null,
      status,
      timezone,
      engagementType,
    },
  });
  await syncTeamChannelName(clientId, name);

  async function upsertContact(role: ClientContactRole, payload: { name: string; email: string; title: string | null; isPrimary: boolean }) {
    const existing = await prisma.clientContact.findFirst({ where: { clientId, role } });
    if (payload.name && payload.email) {
      if (existing) {
        await prisma.clientContact.update({
          where: { id: existing.id },
          data: {
            name: payload.name,
            email: payload.email,
            title: payload.title,
            isPrimary: payload.isPrimary,
          },
        });
      } else {
        await prisma.clientContact.create({
          data: {
            clientId,
            name: payload.name,
            email: payload.email,
            title: payload.title,
            isPrimary: payload.isPrimary,
            role,
          },
        });
      }
    } else if (existing) {
      // If user clears the contact fields, remove that role contact.
      await prisma.clientContact.delete({ where: { id: existing.id } });
    }
  }

  await upsertContact("point_of_contact", {
    name: pocName,
    email: pocEmail,
    title: pocTitle || null,
    isPrimary: true,
  });

  await upsertContact("accounts_contact", {
    name: accountsName,
    email: accountsEmail,
    title: accountsTitle || null,
    isPrimary: false,
  });

  const guidelinesFiles = formData.getAll("brandGuidelines");
  for (const f of guidelinesFiles) {
    const file = f as unknown as File | null;
    if (!file || typeof (file as any).arrayBuffer !== "function") continue;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const originalName = (file as any).name ? String((file as any).name) : "brand-guidelines";
    const mimeType = (file as any).type ? String((file as any).type) : null;

    const dir = path.join(process.cwd(), "public", "uploads", "clients", clientId);
    fs.mkdirSync(dir, { recursive: true });
    const stamped = `${Date.now()}-${safeFileName(originalName)}`;
    const absPath = path.join(dir, stamped);
    fs.writeFileSync(absPath, bytes);

    const url = `/uploads/clients/${clientId}/${stamped}`;
    await prisma.clientAsset.create({
      data: {
        clientId,
        type: "brand_guidelines",
        fileName: stamped,
        mimeType,
        url,
      },
    });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
}

export async function updateClientRelationshipCadence(formData: FormData) {
  await requireRole(["admin"]);

  const clientId = String(formData.get("clientId") || "").trim();
  if (!clientId) return;

  const raw = String(formData.get("relationshipContactFrequencyDays") || "").trim();
  const parsed = raw ? Number(raw) : null;

  if (parsed == null || Number.isNaN(parsed)) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        relationshipContactFrequencyDays: null,
        nextRelationshipContactDueAt: null,
      },
    });
  } else {
    const frequency = Math.max(1, Math.min(365, Math.floor(parsed)));
    const existing = await prisma.client.findUnique({
      where: { id: clientId },
      select: { lastRelationshipContactAt: true },
    });
    if (!existing) return;

    const anchor = existing.lastRelationshipContactAt ?? new Date();
    await prisma.client.update({
      where: { id: clientId },
      data: {
        relationshipContactFrequencyDays: frequency,
        nextRelationshipContactDueAt: addDays(anchor, frequency),
      },
    });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function recordClientRelationshipContact(formData: FormData) {
  await requireRole(["admin", "team_member"]);

  const clientId = String(formData.get("clientId") || "").trim();
  if (!clientId) return;

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { relationshipContactFrequencyDays: true },
  });
  if (!existing) return;

  const now = new Date();
  await prisma.client.update({
    where: { id: clientId },
    data: {
      lastRelationshipContactAt: now,
      nextRelationshipContactDueAt:
        existing.relationshipContactFrequencyDays && existing.relationshipContactFrequencyDays > 0
          ? addDays(now, existing.relationshipContactFrequencyDays)
          : null,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function createServiceProduct(formData: FormData) {
  await requireRole(["admin"]);

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const kind = (String(formData.get("kind") || "fixed_package") as ServiceProductKind) ?? "fixed_package";
  const scopeType = (String(formData.get("scopeType") || "project") as ScopeType) ?? "project";
  const description = String(formData.get("description") || "").trim() || null;
  const defaultDeadlineDays = Math.max(1, Math.min(365, Number(formData.get("defaultDeadlineDays")) || 30));

  const serviceTypeRaw = String(formData.get("serviceType") || "");
  const serviceType = serviceTypeRaw ? (serviceTypeRaw as BriefType) : null;

  let serviceDetails: unknown = null;
  const rawSd = String(formData.get("serviceDetails") || "");
  if (rawSd) {
    try {
      serviceDetails = JSON.parse(rawSd);
    } catch {
      serviceDetails = null;
    }
  }

  const monthlyRaw = String(formData.get("monthlyRetainer") || "").trim();
  const monthlyRetainer = monthlyRaw ? Number(monthlyRaw) : null;
  const budgetRaw = String(formData.get("projectBudget") || "").trim();
  const projectBudget = budgetRaw ? Number(budgetRaw) : null;

  const lines: Array<{ title: string; deliverableType: DeliverableType; daysFromStart: number }> = [];
  if (kind === "fixed_package") {
    const rawLines = String(formData.get("deliverableTemplates") || "");
    if (rawLines) {
      try {
        const parsed = JSON.parse(rawLines) as unknown;
        if (Array.isArray(parsed)) {
          for (const row of parsed) {
            if (!row || typeof row !== "object") continue;
            const title = String((row as { title?: string }).title || "").trim();
            if (!title) continue;
            const deliverableType = (String((row as { deliverableType?: string }).deliverableType) ||
              "other") as DeliverableType;
            const daysFromStart = Math.max(
              0,
              Number((row as { daysFromStart?: number }).daysFromStart) || 7
            );
            lines.push({ title, deliverableType, daysFromStart });
          }
        }
      } catch {
        // ignore invalid JSON
      }
    }
  }

  const product = await prisma.serviceProduct.create({
    data: {
      name,
      description,
      kind,
      scopeType,
      serviceType: serviceType as never,
      serviceDetails: serviceDetails as never,
      monthlyRetainer: Number.isFinite(monthlyRetainer as number) ? monthlyRetainer : null,
      projectBudget: Number.isFinite(projectBudget as number) ? projectBudget : null,
      defaultDeadlineDays,
      deliverableTemplates:
        lines.length > 0
          ? {
              create: lines.map((line, i) => ({
                sortOrder: i,
                title: line.title.slice(0, 240),
                deliverableType: line.deliverableType,
                daysFromStart: line.daysFromStart,
              })),
            }
          : undefined,
    },
  });
  await notifyAllAdmins({
    title: "Service catalog: new product",
    body: `“${name}” was added (${kind === "fixed_package" ? "fixed package" : "retainer template"}).`,
    href: `/services/${product.id}`,
  });
  revalidatePath("/services");
  redirect("/services");
}

export async function updateServiceProduct(formData: FormData) {
  await requireRole(["admin"]);

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const existing = await prisma.serviceProduct.findUnique({ where: { id } });
  if (!existing) return;

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const kind = (String(formData.get("kind") || "fixed_package") as ServiceProductKind) ?? "fixed_package";
  const scopeType = (String(formData.get("scopeType") || "project") as ScopeType) ?? "project";
  const description = String(formData.get("description") || "").trim() || null;

  const defaultDeadlineDays =
    kind === "fixed_package"
      ? Math.max(1, Math.min(365, Number(formData.get("defaultDeadlineDays")) || 30))
      : Math.max(1, Math.min(365, Number(formData.get("defaultDeadlineDays")) || existing.defaultDeadlineDays));

  const serviceTypeRaw = String(formData.get("serviceType") || "");
  const serviceType = serviceTypeRaw ? (serviceTypeRaw as BriefType) : null;

  let serviceDetails: unknown = null;
  const rawSd = String(formData.get("serviceDetails") || "");
  if (rawSd) {
    try {
      serviceDetails = JSON.parse(rawSd);
    } catch {
      serviceDetails = null;
    }
  }

  const monthlyRaw = String(formData.get("monthlyRetainer") || "").trim();
  const monthlyRetainer = monthlyRaw ? Number(monthlyRaw) : null;
  const budgetRaw = String(formData.get("projectBudget") || "").trim();
  const projectBudget = budgetRaw ? Number(budgetRaw) : null;

  const lines: Array<{ title: string; deliverableType: DeliverableType; daysFromStart: number }> = [];
  if (kind === "fixed_package") {
    const rawLines = String(formData.get("deliverableTemplates") || "");
    if (rawLines) {
      try {
        const parsed = JSON.parse(rawLines) as unknown;
        if (Array.isArray(parsed)) {
          for (const row of parsed) {
            if (!row || typeof row !== "object") continue;
            const title = String((row as { title?: string }).title || "").trim();
            if (!title) continue;
            const deliverableType = (String((row as { deliverableType?: string }).deliverableType) ||
              "other") as DeliverableType;
            const daysFromStart = Math.max(
              0,
              Number((row as { daysFromStart?: number }).daysFromStart) || 7
            );
            lines.push({ title, deliverableType, daysFromStart });
          }
        }
      } catch {
        // ignore invalid JSON
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceProductDeliverableTemplate.deleteMany({ where: { serviceProductId: id } });
    await tx.serviceProduct.update({
      where: { id },
      data: {
        name,
        description,
        kind,
        scopeType,
        serviceType: serviceType as never,
        serviceDetails: serviceDetails as never,
        monthlyRetainer: Number.isFinite(monthlyRetainer as number) ? monthlyRetainer : null,
        projectBudget: Number.isFinite(projectBudget as number) ? projectBudget : null,
        defaultDeadlineDays,
        deliverableTemplates:
          kind === "fixed_package" && lines.length > 0
            ? {
                create: lines.map((line, i) => ({
                  sortOrder: i,
                  title: line.title.slice(0, 240),
                  deliverableType: line.deliverableType,
                  daysFromStart: line.daysFromStart,
                })),
              }
            : undefined,
      },
    });
  });

  await notifyAllAdmins({
    title: "Service catalog: product updated",
    body: `“${name}” was updated.`,
    href: `/services/${id}`,
  });

  revalidatePath("/services");
  revalidatePath(`/services/${id}`);
  redirect("/services");
}

export async function deleteServiceProduct(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") || "");
  if (!id) return;
  const existing = await prisma.serviceProduct.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!existing) return;
  await prisma.serviceProduct.delete({ where: { id } });
  await notifyAllAdmins({
    title: "Service catalog: product removed",
    body: `“${existing.name}” was deleted.`,
    href: "/services",
  });
  revalidatePath("/services");
}

export async function createBrief(formData: FormData) {
  await requireRole(["admin", "team_member"]);

  const serviceProductIdRaw = String(formData.get("serviceProductId") || "").trim();

  let briefType: BriefType = "content";
  let typeDetails: unknown = null;
  let packageDeliverableRows: Array<{
    title: string;
    deliverableType: DeliverableType;
    daysFromStart: number;
  }> = [];

  if (serviceProductIdRaw) {
    const product = await prisma.serviceProduct.findUnique({
      where: { id: serviceProductIdRaw },
      include: { deliverableTemplates: { orderBy: { sortOrder: "asc" } } },
    });
    if (product) {
      briefType = (product.serviceType ?? "content") as BriefType;
      typeDetails = product.serviceDetails ?? null;
      if (product.kind === "fixed_package" && product.deliverableTemplates.length > 0) {
        packageDeliverableRows = product.deliverableTemplates.map((t) => ({
          title: t.title,
          deliverableType: t.deliverableType,
          daysFromStart: t.daysFromStart,
        }));
      }
    }
  }

  const brief = await prisma.brief.create({
    data: {
      clientId: String(formData.get("clientId") || ""),
      serviceProductId: serviceProductIdRaw || null,
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      briefType,
      typeDetails: typeDetails as never,
      priority: (String(formData.get("priority")) || "medium") as BriefPriority,
      status: "awaiting_internal_start",
      scopeStatus: "in_scope",
      deadline: new Date(String(formData.get("deadline") || new Date().toISOString()))
    }
  });
  await prisma.messageThread.create({ data: { briefId: brief.id, threadType: "client", title: "Client brief thread" } });
  await prisma.messageThread.create({ data: { briefId: brief.id, threadType: "internal", title: "Internal thread" } });

  if (packageDeliverableRows.length > 0) {
    const start = new Date();
    await prisma.deliverable.createMany({
      data: packageDeliverableRows.map((t) => ({
        briefId: brief.id,
        title: t.title,
        deliverableType: t.deliverableType,
        deliveryDate: addDays(start, t.daysFromStart),
      })),
    });
  }

  const creatorId = await getSessionUserId();
  if (creatorId) {
    await prisma.activityLog.create({
      data: {
        userId: creatorId,
        briefId: brief.id,
        action: "brief_created",
        metadata: serviceProductIdRaw ? { fromServiceProductId: serviceProductIdRaw } : {},
      },
    });
  }
  revalidatePath("/briefs");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${brief.clientId}`);
  const creator = await actorDisplayName();
  const clientRow = await prisma.client.findUnique({ where: { id: brief.clientId }, select: { name: true } });
  await postTeamTaskSummary(
    brief.clientId,
    `Task · ${brief.title}\n${creator} created this brief (client: ${clientRow?.name ?? "—"}).`
  );
  await notifyAllAdmins({
    title: "New brief",
    body: `${creator} created “${brief.title}” for ${clientRow?.name ?? "a client"}.`,
    href: `/briefs/${brief.id}`,
    clientId: brief.clientId,
  });
  redirect(`/briefs/${brief.id}?created=1`);
}

export async function addAssignment(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const briefId = String(formData.get("briefId"));
  const userId = String(formData.get("userId"));
  const role = (String(formData.get("role")) || "producer") as AssignmentRole;
  await prisma.briefAssignment.create({
    data: {
      briefId,
      userId,
      role,
    }
  });
  const brief = await prisma.brief.findUnique({ where: { id: briefId }, include: { client: true } });
  const assignee = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
  const actor = await actorDisplayName();
  const actorId = await getSessionUserId();
  if (actorId && brief) {
    await prisma.activityLog.create({
      data: {
        userId: actorId,
        briefId,
        action: "brief_assigned",
        metadata: { assigneeName: assignee?.fullName ?? "Someone", role },
      },
    });
  }
  if (brief) {
    const assignmentBody =
      actorId && userId === actorId
        ? `You added yourself to “${brief.title}” as ${role.replace(/_/g, " ")}.`
        : `${actor} added you to “${brief.title}” as ${role.replace(/_/g, " ")}.`;
    await prisma.notification.create({
      data: {
        userId,
        clientId: brief.clientId,
        title: "Brief assignment",
        body: assignmentBody,
        href: `/briefs/${briefId}`,
      },
    });
  }
  if (brief) {
    await postTeamTaskSummary(
      brief.clientId,
      `Task · ${brief.title}\n${actor} assigned ${assignee?.fullName ?? "someone"} as ${role}.`
    );
  }
  if (brief && actorId && assignee?.fullName) {
    await postAssignmentMentionInGeneralChannel({
      senderId: actorId,
      assignee: { id: userId, fullName: assignee.fullName },
      briefTitle: brief.title,
      briefId,
      roleLabel: role.replace(/_/g, " "),
      internalDeliveryDate: brief.internalDeliveryDate,
      clientDeliveryDate: brief.clientDeliveryDate,
    });
  }
  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/dashboard");
  revalidatePath("/live-work");
  revalidatePath("/calendar");
}

export async function addDeliverable(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const briefId = String(formData.get("briefId"));
  const title = String(formData.get("title"));
  const deliverableType = (String(formData.get("deliverableType")) || "other") as DeliverableType;
  await prisma.deliverable.create({
    data: {
      briefId,
      title,
      deliverableType,
      deliveryDate: new Date(String(formData.get("deliveryDate") || new Date().toISOString()))
    }
  });
  const brief = await prisma.brief.findUnique({ where: { id: briefId }, include: { client: true } });
  const actor = await actorDisplayName();
  const actorId = await getSessionUserId();
  if (actorId && brief) {
    await prisma.activityLog.create({
      data: {
        userId: actorId,
        briefId,
        action: "deliverable_added",
        metadata: { title, deliverableType },
      },
    });
  }
  if (brief) {
    await postTeamTaskSummary(
      brief.clientId,
      `Task · ${brief.title}\n${actor} added deliverable “${title}” (${deliverableType}).`
    );
  }
  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/dashboard");
}

export async function removeDeliverable(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const deliverableId = String(formData.get("deliverableId") || "");
  if (!deliverableId) return;

  const existing = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { brief: { include: { client: true } } },
  });
  if (!existing) return;

  await prisma.deliverable.delete({ where: { id: deliverableId } });

  const actor = await actorDisplayName();
  const actorId = await getSessionUserId();
  if (actorId) {
    await prisma.activityLog.create({
      data: {
        userId: actorId,
        briefId: existing.briefId,
        action: "deliverable_removed",
        metadata: { title: existing.title },
      },
    });
  }
  await postTeamTaskSummary(
    existing.brief.clientId,
    `Task · ${existing.brief.title}\n${actor} removed deliverable “${existing.title}”.`
  );
  revalidatePath(`/briefs/${existing.briefId}`);
  revalidatePath("/dashboard");
}

export type UpdateBriefStatusResult = { error?: "CONTRACT_REQUIRED" };

export async function updateBriefStatus(
  formData: FormData
): Promise<UpdateBriefStatusResult | void> {
  const role = await requireRole(["admin", "team_member"]);
  const briefId = String(formData.get("briefId") || "");
  const status = String(formData.get("status") || "") as BriefStatus;
  if (!briefId) return;
  if (!status) return;

  const before = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { completedAt: true, status: true },
  });
  if (!before) return;

  if (
    role === "admin" &&
    requiresAdminContractConfirmationForInProgress(before.status, status)
  ) {
    const confirmed = String(formData.get("contractConfirmed") || "") === "true";
    if (!confirmed) {
      return { error: "CONTRACT_REQUIRED" };
    }
  }

  const revertingToPreLive = status === "draft" || status === "awaiting_internal_start";

  const brief = await prisma.$transaction(async (tx) => {
    if (revertingToPreLive) {
      await tx.briefAssignment.deleteMany({ where: { briefId } });
      await tx.calendarBooking.deleteMany({ where: { briefId } });
    }
    return tx.brief.update({
      where: { id: briefId },
      data: {
        status,
        completedAt: status === "completed" ? before.completedAt ?? new Date() : null,
        ...(revertingToPreLive
          ? { internalDeliveryDate: null, clientDeliveryDate: null }
          : {}),
      },
      include: { client: true },
    });
  });

  const actor = await actorDisplayName();
  const actorId = await getSessionUserId();
  if (actorId && before.status !== status) {
    await prisma.activityLog.create({
      data: {
        userId: actorId,
        briefId,
        action: "brief_status_changed",
        metadata: { from: before.status, to: status },
      },
    });
  }
  const statusLine = `${actor} changed status to ${status.replace(/_/g, " ")}.`;
  const revertLine = revertingToPreLive
    ? " Team assignments and related calendar bookings were removed."
    : "";
  await postTeamTaskSummary(brief.clientId, `Task · ${brief.title}\n${statusLine}${revertLine}`);

  if (status === "completed" && before.status !== "completed") {
    await notifyAllAdmins({
      title: "Brief completed",
      body: `“${brief.title}” (${brief.client.name}) was marked complete.`,
      href: `/briefs/${briefId}`,
      clientId: brief.clientId,
    });
  }

  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/briefs");
  revalidatePath("/live-work");
  revalidatePath("/dashboard");
  if (revertingToPreLive) {
    revalidatePath("/calendar");
    revalidatePath("/portal/calendar");
  }
}

export type PromoteBriefToInProgressResult = {
  error?: "INVALID" | "NOT_FOUND" | "INVALID_TRANSITION" | "ASSIGNMENT_EXISTS" | "INTERNAL";
  /** Set when error is INTERNAL (e.g. DB schema); safe to show in UI for debugging. */
  message?: string;
};

/** Admin-only: contract confirmed + delivery dates + assignee → in progress, notify, calendar entries. */
export async function promoteBriefToInProgressWithOnboarding(
  formData: FormData
): Promise<PromoteBriefToInProgressResult | void> {
  await requireRole(["admin"]);

  try {
    const briefId = String(formData.get("briefId") || "");
    const contractConfirmed = String(formData.get("contractConfirmed") || "") === "true";
    const internalRaw = String(formData.get("internalDeliveryDate") || "").trim();
    const clientRaw = String(formData.get("clientDeliveryDate") || "").trim();
    const assigneeUserId = String(formData.get("assigneeUserId") || "").trim();
    const assignmentRole = (String(formData.get("assignmentRole")) || "producer") as AssignmentRole;

    if (!briefId || !contractConfirmed || !internalRaw || !clientRaw || !assigneeUserId) {
      return { error: "INVALID" };
    }

    const before = await prisma.brief.findUnique({
      where: { id: briefId },
      include: { client: true },
    });
    if (!before) {
      return { error: "NOT_FOUND" };
    }

    if (!requiresAdminContractConfirmationForInProgress(before.status, "in_progress")) {
      return { error: "INVALID_TRANSITION" };
    }

    const parseDay = (s: string): Date | null => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      if (!m) return null;
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
      return Number.isNaN(dt.getTime()) ? null : dt;
    };

    const bookingWindow = (s: string): { startsAt: Date; endsAt: Date } | null => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
      if (!m) return null;
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const startsAt = new Date(Date.UTC(y, mo - 1, d, 9, 0, 0));
      const endsAt = new Date(Date.UTC(y, mo - 1, d, 10, 0, 0));
      return Number.isNaN(startsAt.getTime()) ? null : { startsAt, endsAt };
    };

    const internalDeliveryDate = parseDay(internalRaw);
    const clientDeliveryDate = parseDay(clientRaw);
    if (!internalDeliveryDate || !clientDeliveryDate) {
      return { error: "INVALID" };
    }

    const winInternal = bookingWindow(internalRaw);
    const winClient = bookingWindow(clientRaw);
    if (!winInternal || !winClient) {
      return { error: "INVALID" };
    }

    const actor = await actorDisplayName();
    const actorId = await getSessionUserId();
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeUserId },
      select: { fullName: true },
    });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.brief.update({
          where: { id: briefId },
          data: {
            status: "in_progress",
            completedAt: null,
            deadline: clientDeliveryDate,
            internalDeliveryDate,
            clientDeliveryDate,
          },
        });

        await tx.briefAssignment.create({
          data: {
            briefId,
            userId: assigneeUserId,
            role: assignmentRole,
          },
        });

        await tx.calendarBooking.create({
          data: {
            briefId,
            clientId: before.clientId,
            userId: assigneeUserId,
            bookingType: "internal",
            title: `Internal delivery · ${before.title}`,
            startsAt: winInternal.startsAt,
            endsAt: winInternal.endsAt,
            visibleToClient: false,
          },
        });

        await tx.calendarBooking.create({
          data: {
            briefId,
            clientId: before.clientId,
            userId: assigneeUserId,
            bookingType: "delivery",
            title: `Client delivery · ${before.title}`,
            startsAt: winClient.startsAt,
            endsAt: winClient.endsAt,
            visibleToClient: true,
          },
        });

        const assignmentBody =
          actorId && assigneeUserId === actorId
            ? `You added yourself to “${before.title}” as ${assignmentRole.replace(/_/g, " ")}.`
            : `${actor} added you to “${before.title}” as ${assignmentRole.replace(/_/g, " ")}.`;

        await tx.notification.create({
          data: {
            userId: assigneeUserId,
            clientId: before.clientId,
            title: "Brief assignment",
            body: assignmentBody,
            href: `/briefs/${briefId}`,
          },
        });

        if (actorId) {
          await tx.activityLog.create({
            data: {
              userId: actorId,
              briefId,
              action: "brief_status_changed",
              metadata: { from: before.status, to: "in_progress" },
            },
          });
          await tx.activityLog.create({
            data: {
              userId: actorId,
              briefId,
              action: "brief_assigned",
              metadata: { assigneeName: assignee?.fullName ?? "Someone", role: assignmentRole },
            },
          });
        }
      });
    } catch (e: unknown) {
      const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
      if (code === "P2002") {
        return { error: "ASSIGNMENT_EXISTS" };
      }
      const msg = e instanceof Error ? e.message : String(e);
      console.error("promoteBriefToInProgressWithOnboarding transaction", e);
      return { error: "INTERNAL", message: msg };
    }

    await postTeamTaskSummary(
      before.clientId,
      `Task · ${before.title}\n${actor} moved the brief to in progress, set delivery dates, and assigned ${assignee?.fullName ?? "a teammate"}.`
    );

    if (actorId && assignee?.fullName) {
      await postAssignmentMentionInGeneralChannel({
        senderId: actorId,
        assignee: { id: assigneeUserId, fullName: assignee.fullName },
        briefTitle: before.title,
        briefId,
        roleLabel: assignmentRole.replace(/_/g, " "),
        internalDeliveryDate,
        clientDeliveryDate,
      });
    }

    revalidatePath(`/briefs/${briefId}`);
    revalidatePath("/briefs");
    revalidatePath("/live-work");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    revalidatePath("/portal/calendar");
  } catch (e: unknown) {
    const digest =
      typeof e === "object" && e !== null && "digest" in e
        ? String((e as { digest?: unknown }).digest)
        : "";
    if (digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("promoteBriefToInProgressWithOnboarding", e);
    return { error: "INTERNAL", message: msg };
  }
}

export async function updateBriefReviewLink(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const briefId = String(formData.get("briefId") || "");
  const raw = String(formData.get("reviewLink") || "").trim();
  if (!briefId) return;

  let reviewLink: string | null = null;
  if (raw) {
    try {
      const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return;
      }
      reviewLink = u.href;
    } catch {
      return;
    }
  }

  await prisma.brief.update({
    where: { id: briefId },
    data: { reviewLink },
  });
  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/live-work");
}

export async function addBriefUpdate(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const briefId = String(formData.get("briefId"));
  const visibleToClient = formData.get("visibleToClient") === "on";
  await prisma.briefUpdate.create({
    data: {
      briefId,
      authorId: String(formData.get("authorId")),
      content: String(formData.get("content")),
      visibleToClient
    }
  });
  const brief = await prisma.brief.findUnique({ where: { id: briefId }, include: { client: true } });
  const actor = await actorDisplayName();
  const authorId = String(formData.get("authorId"));
  if (brief) {
    await prisma.activityLog.create({
      data: {
        userId: authorId,
        briefId,
        action: "brief_update_posted",
        metadata: { visibleToClient },
      },
    });
    const content = String(formData.get("content") || "");
    const snippet = content.slice(0, 200);
    await postTeamTaskSummary(
      brief.clientId,
      `Task · ${brief.title}\n${actor} posted an update${visibleToClient ? " (client-visible)" : " (internal)"}.${snippet ? `\n\n${snippet}${content.length > 200 ? "…" : ""}` : ""}`
    );
  }
  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/dashboard");
}

export async function addInternalNote(formData: FormData) {
  await prisma.internalNote.create({
    data: {
      briefId: String(formData.get("briefId")),
      authorId: String(formData.get("authorId")),
      noteType: (String(formData.get("noteType")) || "general") as InternalNoteType,
      content: String(formData.get("content"))
    }
  });
  revalidatePath(`/briefs/${String(formData.get("briefId"))}`);
}

export async function addMessage(formData: FormData) {
  await prisma.message.create({
    data: {
      threadId: String(formData.get("threadId")),
      senderId: String(formData.get("senderId")),
      body: String(formData.get("body"))
    }
  });
  revalidatePath(`/briefs/${String(formData.get("briefId"))}`);
}

export async function createBooking(formData: FormData) {
  await prisma.calendarBooking.create({
    data: {
      briefId: String(formData.get("briefId")) || null,
      clientId: String(formData.get("clientId")) || null,
      bookingType: "internal",
      title: String(formData.get("title")),
      startsAt: new Date(String(formData.get("startsAt"))),
      endsAt: new Date(String(formData.get("endsAt"))),
      visibleToClient: formData.get("visibleToClient") === "on"
    }
  });
  revalidatePath("/calendar");
}

export async function completeBriefWithTimeLog(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const briefId = String(formData.get("briefId"));
  const userId = String(formData.get("userId"));
  const hoursSpent = Number(formData.get("hoursSpent"));
  if (!hoursSpent || hoursSpent <= 0) return;
  const briefBefore = await prisma.brief.findUnique({ where: { id: briefId }, include: { client: true } });
  await prisma.timeLog.create({
    data: {
      briefId,
      userId,
      daysSpent: Number(formData.get("daysSpent")) || 0,
      hoursSpent,
      notes: String(formData.get("notes") || "")
    }
  });
  await prisma.brief.update({ data: { status: BriefStatus.completed, completedAt: new Date() }, where: { id: briefId } });
  await prisma.notification.create({
    data: {
      userId,
      title: "Brief completed",
      body: "Brief was marked complete with time log.",
      href: `/briefs/${briefId}`,
    },
  });
  const sessionActor = await getSessionUserId();
  await prisma.activityLog.create({
    data: {
      userId: sessionActor ?? userId,
      briefId,
      action: "brief_completed",
      metadata: { hoursSpent },
    },
  });
  const actor = await actorDisplayName();
  if (briefBefore) {
    await postTeamTaskSummary(
      briefBefore.clientId,
      `Task · ${briefBefore.title}\n${actor} marked the brief complete (${hoursSpent}h logged).`
    );
    await notifyAllAdmins({
      title: "Brief completed",
      body: `${actor} marked “${briefBefore.title}” complete (${hoursSpent}h logged).`,
      href: `/briefs/${briefId}`,
      clientId: briefBefore.clientId,
    });
  }
  revalidatePath(`/briefs/${briefId}`);
  revalidatePath("/briefs");
  revalidatePath("/live-work");
  revalidatePath("/dashboard");
}

export async function sendTeamChannelMessage(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const channelId = String(formData.get("channelId") || "");
  const body = String(formData.get("body") || "").trim();
  let metadata: Record<string, unknown> | null = null;
  const rawMeta = String(formData.get("metadata") || "");
  if (rawMeta) {
    try {
      metadata = JSON.parse(rawMeta) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }
  const gifUrl = typeof metadata?.gifUrl === "string" ? metadata.gifUrl : null;
  if (!channelId || (!body && !gifUrl)) return;
  const userId = await getSessionUserId();
  if (!userId) return;
  const ok = await ensureViewerInChannel(channelId, userId);
  if (!ok) return;
  await prisma.teamChannelMessage.create({
    data: {
      channelId,
      senderId: userId,
      kind: "user",
      body: body || (gifUrl ? " " : ""),
      metadata: metadata && Object.keys(metadata).length ? (metadata as object) : undefined,
    },
  });

  await notifyTeamChannelMentions({
    channelId,
    body,
    senderId: userId,
    gifUrl,
  });

  revalidatePath(`/messages/channel/${channelId}`);
  revalidatePath("/messages");
  revalidatePath("/dashboard");
}

export async function sendDmMessage(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const threadId = String(formData.get("threadId") || "");
  const body = String(formData.get("body") || "").trim();
  let metadata: Record<string, unknown> | null = null;
  const rawMeta = String(formData.get("metadata") || "");
  if (rawMeta) {
    try {
      metadata = JSON.parse(rawMeta) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }
  const gifUrl = typeof metadata?.gifUrl === "string" ? metadata.gifUrl : null;
  if (!threadId || (!body && !gifUrl)) return;
  const userId = await getSessionUserId();
  if (!userId) return;
  const thread = await prisma.dmThread.findFirst({
    where: { id: threadId, OR: [{ lowUserId: userId }, { highUserId: userId }] },
  });
  if (!thread) return;
  await prisma.dmMessage.create({
    data: {
      threadId,
      senderId: userId,
      body: body || (gifUrl ? " " : ""),
      metadata: metadata && Object.keys(metadata).length ? (metadata as object) : undefined,
    },
  });
  await prisma.dmThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

  const otherUserId = thread.lowUserId === userId ? thread.highUserId : thread.lowUserId;
  const sender = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
  const preview =
    (body || (gifUrl ? "Sent a GIF" : "")).replace(/\s+/g, " ").trim().slice(0, 160) || "New message";
  await prisma.notification.create({
    data: {
      userId: otherUserId,
      title: `Message from ${sender?.fullName ?? "Teammate"}`,
      body: preview,
      href: `/messages/dm/${threadId}`,
    },
  });

  revalidatePath(`/messages/dm/${threadId}`);
  revalidatePath("/messages");
  revalidatePath("/dashboard");
}

export async function startDmWithUser(formData: FormData) {
  await requireRole(["admin", "team_member"]);
  const partnerId = String(formData.get("partnerId") || "");
  const selfId = await getSessionUserId();
  if (!selfId || !partnerId || partnerId === selfId) return;
  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: { in: ["admin", "team_member"] } },
    select: { id: true },
  });
  if (!partner) return;
  const thread = await getOrCreateDmThread(selfId, partnerId);
  redirect(`/messages/dm/${thread.id}`);
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UpdateTeamProfileResult = { ok: true } | { ok: false; error: string };

export async function updateTeamProfile(formData: FormData): Promise<UpdateTeamProfileResult> {
  await requireRole(["admin", "team_member"]);
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Not signed in." };
  }

  const fullName = String(formData.get("fullName") || "").trim();
  const emailRaw = String(formData.get("email") || "").trim();
  const email = emailRaw.toLowerCase();
  const phoneNumber = String(formData.get("phoneNumber") || "").trim() || null;

  if (!fullName) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!email) {
    return { ok: false, error: "Please enter your email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  });
  if (emailTaken) {
    return { ok: false, error: "That email is already used by another account." };
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });
  if (!existing) {
    return { ok: false, error: "Account not found." };
  }

  let nextAvatarUrl: string | undefined;

  const file = formData.get("avatar");
  if (file && typeof (file as File).arrayBuffer === "function") {
    const f = file as File;
    if (f.size > 0) {
      if (f.size > MAX_AVATAR_BYTES) {
        return { ok: false, error: "Image must be 2MB or smaller." };
      }
      const mime = f.type || "";
      if (!ALLOWED_AVATAR_MIME.has(mime)) {
        return { ok: false, error: "Use a JPEG, PNG, WebP, or GIF image." };
      }

      const ext =
        mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "gif";

      const dir = path.join(process.cwd(), "public", "uploads", "users", userId);
      fs.mkdirSync(dir, { recursive: true });
      const fileName = `avatar-${Date.now()}.${ext}`;
      const absPath = path.join(dir, fileName);
      const bytes = Buffer.from(await f.arrayBuffer());
      fs.writeFileSync(absPath, bytes);
      nextAvatarUrl = `/uploads/users/${userId}/${fileName}`;

      if (existing.avatarUrl?.startsWith(`/uploads/users/${userId}/`)) {
        const oldRel = existing.avatarUrl.replace(/^\//, "");
        const oldPath = path.join(process.cwd(), "public", oldRel);
        try {
          if (fs.existsSync(oldPath) && oldPath !== absPath) {
            fs.unlinkSync(oldPath);
          }
        } catch {
          /* ignore */
        }
      }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName,
      email,
      phoneNumber,
      ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings/profile");
  return { ok: true };
}

export async function dismissAllNotifications() {
  await requireRole(["admin", "team_member"]);
  const userId = await getSessionUserId();
  if (!userId) return;
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function dismissNotificationById(notificationId: string) {
  await requireRole(["admin", "team_member"]);
  const userId = await getSessionUserId();
  if (!userId || !notificationId) return;
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
}

export async function dismissDashboardActivityFromFeed(activityLogId: string) {
  await requireRole(["admin", "team_member"]);
  const userId = await getSessionUserId();
  if (!userId || !activityLogId) return;
  const ok = await upsertDashboardFeedDismissal(userId, activityLogId);
  if (ok) {
    revalidatePath("/dashboard");
  }
}

