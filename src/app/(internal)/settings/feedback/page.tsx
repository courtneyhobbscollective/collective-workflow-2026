import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { requireAdmin } from "@/lib/auth";
import { hasFeedbackTicketDelegate, listFeedbackTickets } from "@/lib/prisma-feedback-ticket";
import { FeedbackTicketRow } from "./feedback-ticket-row";

export default async function FeedbackTicketsPage() {
  await requireAdmin();

  const tickets = await listFeedbackTickets(200);

  return (
    <PageShell
      title="Feedback tickets"
      subtitle="Bugs, issues, and suggestions submitted from the in-app beta banner."
    >
      <Section title="Inbox" subtitle="Newest first">
        {!hasFeedbackTicketDelegate() ? (
          <p className="mb-3 text-sm text-amber-700">
            Feedback ticket model not loaded in this running Prisma client. Run `npx prisma generate`, sync DB, and
            restart the dev server.
          </p>
        ) : null}
        {tickets.length === 0 ? (
          <p className="text-sm text-zinc-500">No feedback tickets yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-sm">
                  <th className="px-3 py-2 font-medium text-zinc-700">Ticket</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">From</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <FeedbackTicketRow
                    key={t.id}
                    ticket={{
                      ...t,
                      createdAtLabel: t.createdAt.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </PageShell>
  );
}

