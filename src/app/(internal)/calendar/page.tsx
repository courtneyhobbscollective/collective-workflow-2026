import { CalendarHeaderActions, type CalendarScheduleItem } from "@/components/workflow/calendar-header-actions";
import { CalendarMonthGrid, type CalendarBookingLite } from "@/components/workflow/calendar-month-grid";
import { PageShell } from "@/components/workflow/page-shell";
import { Card } from "@/components/ui";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage() {
  const viewerId = await getSessionUserId();
  const bookings = await prisma.calendarBooking.findMany({
    include: {
      user: { select: { fullName: true, avatarUrl: true } },
      client: { select: { name: true } },
      brief: {
        select: {
          id: true,
          title: true,
          description: true,
          briefType: true,
          priority: true,
          status: true,
          scopeStatus: true,
          deadline: true,
          internalDeliveryDate: true,
          clientDeliveryDate: true,
          reviewLink: true,
          client: { select: { name: true } },
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });
  const mine = viewerId ? bookings.filter((b) => b.userId === viewerId) : [];

  const gridBookings: CalendarBookingLite[] = bookings.map((b) => ({
    id: b.id,
    title: b.title,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    bookingType: b.bookingType,
    briefId: b.briefId,
    visibleToClient: b.visibleToClient,
    userName: b.user?.fullName ?? null,
    assigneeAvatarUrl: b.user?.avatarUrl ?? null,
    isMine: Boolean(viewerId && b.userId === viewerId),
    brief: b.brief
      ? {
          id: b.brief.id,
          title: b.brief.title,
          description: b.brief.description,
          briefType: b.brief.briefType,
          priority: b.brief.priority,
          status: b.brief.status,
          scopeStatus: b.brief.scopeStatus,
          deadline: b.brief.deadline.toISOString(),
          internalDeliveryDate: b.brief.internalDeliveryDate?.toISOString() ?? null,
          clientDeliveryDate: b.brief.clientDeliveryDate?.toISOString() ?? null,
          reviewLink: b.brief.reviewLink,
          clientName: b.brief.client.name,
        }
      : null,
    standaloneClientName: !b.brief && b.client ? b.client.name : null,
  }));

  const schedule: CalendarScheduleItem[] = mine.map((b) => ({
    id: b.id,
    title: b.title,
    startsAt: b.startsAt.toISOString(),
    visibleToClient: b.visibleToClient,
  }));

  return (
    <PageShell
      title="Calendar"
      subtitle="Month view with team bookings — use the buttons to add entries or open your schedule"
      action={<CalendarHeaderActions viewerId={viewerId} schedule={schedule} />}
    >
      <Card className="p-5 sm:p-6">
        <CalendarMonthGrid bookings={gridBookings} viewerId={viewerId} />
      </Card>
    </PageShell>
  );
}
