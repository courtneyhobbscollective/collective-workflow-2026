import { FeedbackTicketArea, FeedbackTicketStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FeedbackDelegate = {
  create(args: {
    data: {
      userId: string | null;
      role: UserRole;
      email: string;
      title: string;
      area: FeedbackTicketArea;
      message: string;
      pagePath: string | null;
      status: FeedbackTicketStatus;
    };
  }): Promise<unknown>;
  update(args: { where: { id: string }; data: { status: FeedbackTicketStatus } }): Promise<unknown>;
  findMany(args: {
    orderBy: { createdAt: "desc" };
    take: number;
    select: {
      id: true;
      title: true;
      message: true;
      area: true;
      email: true;
      role: true;
      pagePath: true;
      status: true;
      createdAt: true;
    };
  }): Promise<
    {
      id: string;
      title: string;
      message: string;
      area: FeedbackTicketArea;
      email: string;
      role: UserRole;
      pagePath: string | null;
      status: FeedbackTicketStatus;
      createdAt: Date;
    }[]
  >;
};

function feedbackDelegate(): FeedbackDelegate | undefined {
  return (prisma as unknown as { feedbackTicket?: FeedbackDelegate }).feedbackTicket;
}

export function hasFeedbackTicketDelegate(): boolean {
  return Boolean(feedbackDelegate());
}

export async function createFeedbackTicket(data: {
  userId: string | null;
  role: UserRole;
  email: string;
  title: string;
  area: FeedbackTicketArea;
  message: string;
  pagePath: string | null;
}): Promise<boolean> {
  const d = feedbackDelegate();
  if (!d) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[workflow] Prisma client has no `feedbackTicket`. Run `npx prisma generate`, restart dev server, and ensure DB schema is synced."
      );
    }
    return false;
  }
  await d.create({ data: { ...data, status: "new" } });
  return true;
}

export async function updateFeedbackTicketStatusById(id: string, status: FeedbackTicketStatus): Promise<boolean> {
  const d = feedbackDelegate();
  if (!d) return false;
  await d.update({ where: { id }, data: { status } });
  return true;
}

export async function listFeedbackTickets(limit = 200) {
  const d = feedbackDelegate();
  if (!d) return [];
  return d.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      area: true,
      email: true,
      role: true,
      pagePath: true,
      status: true,
      createdAt: true,
    },
  });
}

