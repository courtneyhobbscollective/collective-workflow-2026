import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";

export default async function PortalCalendarPage() {
  const userId = await getSessionUserId();
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const bookings = await prisma.calendarBooking.findMany({ where: { visibleToClient: true, clientId: user?.clientId ?? "" }, orderBy: { startsAt: "asc" } });
  return (
    <PageShell title="Calendar" subtitle="Client-visible schedule">
      <Section title="Upcoming" subtitle="Visible bookings only">
        {bookings.length ? (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
                <p className="text-sm font-medium text-zinc-900">{b.title}</p>
                <p className="mt-1 text-xs text-zinc-600">{new Date(b.startsAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No visible bookings yet.</p>
        )}
      </Section>
    </PageShell>
  );
}
