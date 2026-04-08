import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { requireAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { PendingRequestRow } from "./pending-request-row";

export default async function SignupRequestsPage() {
  await requireAdmin();

  const db = getPrisma();
  const pending = await db.pendingClientSignup.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      companyName: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      createdAt: true,
    },
  });

  const recent = await db.pendingClientSignup.findMany({
    where: { status: { in: ["approved", "rejected"] } },
    orderBy: { reviewedAt: "desc" },
    take: 15,
    select: {
      companyName: true,
      fullName: true,
      email: true,
      status: true,
      reviewedAt: true,
      rejectionReason: true,
    },
  });

  return (
    <PageShell
      title="Client signup requests"
      subtitle="Approve new client companies after they submit the public form. Approved users can sign in with email and password."
    >
      <Section title="Pending">
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-3 py-2 font-medium text-zinc-700">Company</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Contact</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((row) => (
                  <PendingRequestRow
                    key={row.id}
                    row={{
                      ...row,
                      createdAtLabel: row.createdAt.toLocaleString("en-GB", {
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

      {recent.length > 0 ? (
        <Section title="Recent decisions" subtitle="Last 15 reviewed requests">
          <ul className="space-y-2 text-sm">
            {recent.map((r, i) => (
              <li key={i} className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
                <span className="font-medium text-zinc-900">{r.companyName}</span>
                <span className="text-zinc-600"> — {r.fullName} ({r.email})</span>
                <span
                  className={
                    r.status === "approved" ? " ml-2 text-emerald-700" : " ml-2 text-zinc-500"
                  }
                >
                  {r.status}
                </span>
                {r.reviewedAt ? (
                  <span className="ml-2 text-xs text-zinc-400">
                    {r.reviewedAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </span>
                ) : null}
                {r.status === "rejected" && r.rejectionReason ? (
                  <p className="mt-1 text-xs text-zinc-500">Reason: {r.rejectionReason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </PageShell>
  );
}
