import { z } from "zod";
import { prisma } from "@/lib/prisma";

const lookupInput = z.object({
  clientNameOrId: z.string().min(1),
});

function summarizeBrief(brief: {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: Date;
  updatedAt: Date;
}) {
  return {
    id: brief.id,
    title: brief.title,
    status: brief.status,
    priority: brief.priority,
    deadline: brief.deadline.toISOString(),
    updatedAt: brief.updatedAt.toISOString(),
  };
}

export async function getClientLatest(input: unknown) {
  const parsed = lookupInput.parse(input);
  const query = parsed.clientNameOrId.trim();

  const client = await prisma.client.findFirst({
    where: {
      OR: [{ id: query }, { name: { contains: query, mode: "insensitive" } }],
    },
    select: {
      id: true,
      name: true,
      status: true,
      engagementType: true,
      updatedAt: true,
      briefs: {
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, priority: true, deadline: true, updatedAt: true },
      },
    },
  });

  if (!client) {
    return { found: false, query, message: "No client found." };
  }

  return {
    found: true,
    client: {
      id: client.id,
      name: client.name,
      status: client.status,
      engagementType: client.engagementType,
      updatedAt: client.updatedAt.toISOString(),
    },
    recentBriefs: client.briefs.map(summarizeBrief),
  };
}

export async function getClientOpenBriefs(input: unknown) {
  const parsed = lookupInput.parse(input);
  const query = parsed.clientNameOrId.trim();

  const client = await prisma.client.findFirst({
    where: {
      OR: [{ id: query }, { name: { contains: query, mode: "insensitive" } }],
    },
    select: { id: true, name: true },
  });

  if (!client) {
    return { found: false, query, message: "No client found." };
  }

  const briefs = await prisma.brief.findMany({
    where: {
      clientId: client.id,
      NOT: [{ status: "completed" }, { status: "archived" }],
    },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    take: 12,
    select: { id: true, title: true, status: true, priority: true, deadline: true, updatedAt: true },
  });

  return {
    found: true,
    client,
    openBriefs: briefs.map(summarizeBrief),
  };
}

export async function getClientRisksAndDeadlines(input: unknown) {
  const parsed = lookupInput.parse(input);
  const query = parsed.clientNameOrId.trim();

  const client = await prisma.client.findFirst({
    where: {
      OR: [{ id: query }, { name: { contains: query, mode: "insensitive" } }],
    },
    select: { id: true, name: true },
  });

  if (!client) {
    return { found: false, query, message: "No client found." };
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const riskBriefs = await prisma.brief.findMany({
    where: {
      clientId: client.id,
      OR: [
        { scopeStatus: "out_of_scope" },
        { scopeStatus: "awaiting_admin_review" },
        { deadline: { lte: in7Days } },
      ],
      NOT: [{ status: "completed" }, { status: "archived" }],
    },
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    take: 12,
    select: { id: true, title: true, status: true, scopeStatus: true, deadline: true, updatedAt: true },
  });

  return {
    found: true,
    client,
    riskItems: riskBriefs.map((brief) => ({
      id: brief.id,
      title: brief.title,
      status: brief.status,
      scopeStatus: brief.scopeStatus,
      deadline: brief.deadline.toISOString(),
      updatedAt: brief.updatedAt.toISOString(),
    })),
  };
}

export async function getRecentClientMessages(input: unknown) {
  const parsed = lookupInput.parse(input);
  const query = parsed.clientNameOrId.trim();

  const client = await prisma.client.findFirst({
    where: {
      OR: [{ id: query }, { name: { contains: query, mode: "insensitive" } }],
    },
    select: { id: true, name: true, teamChannel: { select: { id: true } } },
  });

  if (!client) {
    return { found: false, query, message: "No client found." };
  }

  const teamChannelMessages = client.teamChannel
    ? await prisma.teamChannelMessage.findMany({
        where: { channelId: client.teamChannel.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          body: true,
          createdAt: true,
          sender: { select: { fullName: true, role: true } },
        },
      })
    : [];

  return {
    found: true,
    client: { id: client.id, name: client.name },
    messages: teamChannelMessages.map((message) => ({
      id: message.id,
      body: message.body.slice(0, 280),
      createdAt: message.createdAt.toISOString(),
      senderName: message.sender?.fullName ?? "Unknown",
      senderRole: message.sender?.role ?? "unknown",
    })),
  };
}

export const clientIntelligenceTools = {
  getClientLatest,
  getClientOpenBriefs,
  getClientRisksAndDeadlines,
  getRecentClientMessages,
};

