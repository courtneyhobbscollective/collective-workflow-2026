import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { userIdsMentionedInText } from "@/lib/team-mentions";

/** Workspace-wide channel; not tied to a client (`clientId` is null). */
export const GENERAL_TEAM_CHANNEL_NAME = "🚀 General Chat";

export type TeamChannelNavRow = { id: string; name: string; clientId: string | null };

/** General channel first, then client channels A–Z. */
export function sortTeamChannelsForNav<T extends { clientId: string | null; name: string }>(channels: T[]): T[] {
  return [...channels].sort((a, b) => {
    const rank = (c: T) => (c.clientId === null ? 0 : 1);
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return a.name.localeCompare(b.name);
  });
}

async function syncInternalUsersToChannel(channelId: string) {
  const internalUsers = await prisma.user.findMany({
    where: { role: { in: ["admin", "team_member"] } },
    select: { id: true },
  });

  for (const { id: userId } of internalUsers) {
    await prisma.teamChannelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: {},
    });
  }
}

/** Merge extra `clientId: null` channels into the oldest (messages + members), then delete duplicates. */
async function mergeDuplicateGeneralTeamChannels() {
  const allGeneral = await prisma.teamChannel.findMany({
    where: { clientId: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (allGeneral.length <= 1) return;

  const keepId = allGeneral[0].id;
  const removeIds = allGeneral.slice(1).map((c) => c.id);

  await prisma.$transaction(async (tx) => {
    for (const rid of removeIds) {
      await tx.teamChannelMessage.updateMany({
        where: { channelId: rid },
        data: { channelId: keepId },
      });

      const orphanedMembers = await tx.teamChannelMember.findMany({
        where: { channelId: rid },
        select: { userId: true },
      });
      for (const { userId } of orphanedMembers) {
        await tx.teamChannelMember.upsert({
          where: { channelId_userId: { channelId: keepId, userId } },
          create: { channelId: keepId, userId },
          update: {},
        });
      }
      await tx.teamChannelMember.deleteMany({ where: { channelId: rid } });
      await tx.teamChannel.delete({ where: { id: rid } });
    }
  });
}

/** Single org-wide channel with `clientId: null`; all internal users are members. */
export async function ensureGeneralTeamChannel() {
  await mergeDuplicateGeneralTeamChannels();

  let channel = await prisma.teamChannel.findFirst({
    where: { clientId: null },
    orderBy: { createdAt: "asc" },
  });

  if (!channel) {
    channel = await prisma.teamChannel.create({
      data: { name: GENERAL_TEAM_CHANNEL_NAME, clientId: null },
    });
  } else if (channel.name !== GENERAL_TEAM_CHANNEL_NAME) {
    channel = await prisma.teamChannel.update({
      where: { id: channel.id },
      data: { name: GENERAL_TEAM_CHANNEL_NAME },
    });
  }

  await syncInternalUsersToChannel(channel.id);
  return channel;
}

/** Ensure the general channel exists, every client has a team channel, and all internal users are members everywhere. */
export async function ensureTeamChannelsForAllClients() {
  await ensureGeneralTeamChannel();
  const clients = await prisma.client.findMany({ select: { id: true } });
  for (const c of clients) {
    await ensureClientChannelWithMembers(c.id);
  }
}

/** Create channel named like the client (if missing) and add all internal users as members. */
export async function ensureClientChannelWithMembers(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return null;

  let channel = await prisma.teamChannel.findUnique({ where: { clientId } });
  if (!channel) {
    channel = await prisma.teamChannel.create({
      data: { name: client.name, clientId: client.id },
    });
  } else if (channel.name !== client.name) {
    channel = await prisma.teamChannel.update({
      where: { id: channel.id },
      data: { name: client.name },
    });
  }

  await syncInternalUsersToChannel(channel.id);

  return channel;
}

export async function syncTeamChannelName(clientId: string, name: string) {
  await prisma.teamChannel.updateMany({
    where: { clientId },
    data: { name },
  });
}

/** Create in-app notifications for @Full Name mentions in a team channel message body. */
export async function notifyTeamChannelMentions(params: {
  channelId: string;
  body: string;
  senderId: string;
  gifUrl?: string | null;
}) {
  const internalUsers = await prisma.user.findMany({
    where: { role: { in: ["admin", "team_member"] } },
    select: { id: true, fullName: true },
  });
  const textForMentions = params.body || (params.gifUrl ? "Sent a GIF" : "");
  const mentioned = userIdsMentionedInText(textForMentions, internalUsers, params.senderId);
  if (!mentioned.length) return;

  const [channel, sender] = await Promise.all([
    prisma.teamChannel.findUnique({ where: { id: params.channelId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: params.senderId }, select: { fullName: true } }),
  ]);
  const preview = textForMentions.slice(0, 160);
  const senderName = sender?.fullName ?? "Someone";
  const chName = channel?.name ?? "channel";
  for (const uid of mentioned) {
    await prisma.notification.create({
      data: {
        userId: uid,
        title: `${senderName} mentioned you in #${chName}`,
        body: preview,
        href: `/messages/channel/${params.channelId}`,
      },
    });
  }
}

/**
 * Post an assignment notice to the org-wide general channel with @assignee so they get a mention notification.
 */
export async function postAssignmentMentionInGeneralChannel(opts: {
  senderId: string;
  assignee: { id: string; fullName: string };
  briefTitle: string;
  briefId: string;
  roleLabel: string;
  internalDeliveryDate?: Date | null;
  clientDeliveryDate?: Date | null;
}) {
  const channel = await ensureGeneralTeamChannel();
  const { senderId, assignee, briefTitle, briefId, roleLabel, internalDeliveryDate, clientDeliveryDate } = opts;

  const mention = `@${assignee.fullName}`;
  const lines: string[] = [
    `${mention} — You’ve been assigned to “${briefTitle}” as ${roleLabel}.`,
  ];

  if (internalDeliveryDate != null) {
    lines.push(`• Internal delivery: ${internalDeliveryDate.toLocaleDateString()}`);
  }
  if (clientDeliveryDate != null) {
    lines.push(`• Client delivery: ${clientDeliveryDate.toLocaleDateString()}`);
  }

  const body = lines.join("\n");

  await prisma.teamChannelMessage.create({
    data: {
      channelId: channel.id,
      senderId,
      kind: "user",
      body,
      metadata: { briefCta: true, briefId },
    },
  });

  await notifyTeamChannelMentions({ channelId: channel.id, body, senderId });
  revalidatePath("/messages");
  revalidatePath(`/messages/channel/${channel.id}`);
  revalidatePath("/dashboard");
}

/** System line (task activity) posted to the client’s internal team channel. */
export async function postTeamTaskSummary(clientId: string, body: string) {
  let channel = await prisma.teamChannel.findUnique({ where: { clientId } });
  if (!channel) {
    await ensureClientChannelWithMembers(clientId);
    channel = await prisma.teamChannel.findUnique({ where: { clientId } });
  }
  if (!channel) return;

  await prisma.teamChannelMessage.create({
    data: {
      channelId: channel.id,
      kind: "system",
      body: body.trim(),
    },
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/channel/${channel.id}`);
}

/** If a new internal user was added, join them to all existing client channels. */
export async function ensureUserInAllTeamChannels(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "admin" && user.role !== "team_member")) return;

  const channels = await prisma.teamChannel.findMany({ select: { id: true } });
  for (const ch of channels) {
    await prisma.teamChannelMember.upsert({
      where: { channelId_userId: { channelId: ch.id, userId } },
      create: { channelId: ch.id, userId },
      update: {},
    });
  }
}

export async function ensureViewerInChannel(channelId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "admin" && user.role !== "team_member")) return false;

  await prisma.teamChannelMember.upsert({
    where: { channelId_userId: { channelId, userId } },
    create: { channelId, userId },
    update: {},
  });
  return true;
}
