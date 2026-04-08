import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Badge, Card } from "@/components/ui";
import { AddLeadForm } from "./add-lead-form";
import { LeadRowActions } from "./lead-row-actions";

export default async function CrmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; new?: string }>;
}) {
  const sp = await searchParams;
  const showNewLeadForm = sp.new === "1" || Boolean(sp.error);
  const leadSelect = {
    id: true,
    name: true,
    email: true,
    companyName: true,
    status: true,
    nextFollowUpDueAt: true,
    lastContactedAt: true,
    quoteSnapshot: true,
      wonAt: true,
      lostAt: true,
    } as const;

  const leads = await prisma.lead.findMany({
    where: { convertedClientId: null, status: { notIn: ["won", "lost"] } },
    orderBy: { updatedAt: "desc" },
    select: leadSelect,
  });

  const wonLeads = await prisma.lead.findMany({
    where: { status: "won" },
    orderBy: { wonAt: "desc" },
    select: leadSelect,
  });

  const lostLeads = await prisma.lead.findMany({
    where: { status: "lost" },
    orderBy: { lostAt: "desc" },
    select: leadSelect,
  });
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const pipelineTotal = leads.reduce((sum, lead) => {
    const value = extractPotentialDealValue(lead.quoteSnapshot);
    return sum + (typeof value === "number" ? value : 0);
  }, 0);

  return (
    <PageShell
      title="Leads"
      subtitle="Open pipeline (not won or lost)"
      action={
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700">
            Pipeline total:{" "}
            <span className="ml-1 text-zinc-900">
              {pipelineTotal.toLocaleString("en-GB", {
                style: "currency",
                currency: "GBP",
                maximumFractionDigits: 2,
              })}
            </span>
          </span>
          {showNewLeadForm ? (
            <Link
              href="/crm/leads"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Close form
            </Link>
          ) : (
            <Link
              href="/crm/leads?new=1"
              className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Add new lead
            </Link>
          )}
        </div>
      }
    >
      {showNewLeadForm ? (
        <Card className="p-5">
          <AddLeadForm clients={clients} error={sp.error} />
        </Card>
      ) : null}

      {leads.length === 0 ? (
        <Card className="p-8 text-center text-sm text-zinc-500">No open leads.</Card>
      ) : (
        <LeadsTable leads={leads} mode="open" />
      )}

      <h2 className="mt-10 text-lg font-semibold text-zinc-900">Won leads</h2>
      <p className="mt-1 text-sm text-zinc-500">Closed-won opportunities (most recent first).</p>
      {wonLeads.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-sm text-zinc-500">No won leads yet.</Card>
      ) : (
        <div className="mt-4">
          <LeadsTable leads={wonLeads} mode="won" />
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-zinc-900">Lost leads</h2>
      <p className="mt-1 text-sm text-zinc-500">Closed-lost opportunities.</p>
      {lostLeads.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-sm text-zinc-500">No lost leads.</Card>
      ) : (
        <div className="mt-4">
          <LeadsTable leads={lostLeads} mode="closed" />
        </div>
      )}
    </PageShell>
  );
}

type LeadRow = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  status: string;
  nextFollowUpDueAt: Date | null;
  lastContactedAt: Date | null;
  quoteSnapshot: unknown;
  wonAt: Date | null;
  lostAt: Date | null;
};

function LeadsTable(props: { leads: LeadRow[]; mode: "open" | "won" | "closed" }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="hidden px-4 py-3 sm:table-cell">Last contact</th>
            <th className="hidden px-4 py-3 md:table-cell">Potential value</th>
            <th className="hidden px-4 py-3 md:table-cell">
              {props.mode === "open" ? "Follow-up due" : "Closed"}
            </th>
            {props.mode === "open" ? <th className="px-4 py-3 text-right">Outcome</th> : null}
            {props.mode === "won" ? <th className="px-4 py-3">Conversion</th> : null}
            {props.mode === "won" ? <th className="px-4 py-3 text-right">Action</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {props.leads.map((l) => {
            const potentialDealValue = extractPotentialDealValue(l.quoteSnapshot);
            const href = `/crm/leads/${l.id}`;
            const closedLabel = l.wonAt
              ? `Won ${l.wonAt.toLocaleDateString("en-GB")}`
              : l.lostAt
                ? `Lost ${l.lostAt.toLocaleDateString("en-GB")}`
                : "—";
            return (
              <tr key={l.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3">
                  <Link href={href} className="block font-medium text-zinc-900 hover:text-sky-800 hover:underline">
                    {l.name}
                    {l.companyName ? <span className="block text-xs text-zinc-500">{l.companyName}</span> : null}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={href} className="block">
                    <Badge className="capitalize">{l.status.replace(/_/g, " ")}</Badge>
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell">
                  <Link href={href} className="block">
                    {l.lastContactedAt ? l.lastContactedAt.toLocaleDateString("en-GB") : "—"}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">
                  <Link href={href} className="block">
                    {typeof potentialDealValue === "number"
                      ? potentialDealValue.toLocaleString("en-GB", {
                          style: "currency",
                          currency: "GBP",
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">
                  <Link href={href} className="block">
                    {props.mode === "open"
                      ? l.nextFollowUpDueAt
                        ? l.nextFollowUpDueAt.toLocaleDateString("en-GB")
                        : "—"
                      : closedLabel}
                  </Link>
                </td>
                {props.mode === "open" ? (
                  <td className="px-4 py-3">
                    <LeadRowActions leadId={l.id} mode="open" />
                  </td>
                ) : null}
                {props.mode === "won" ? (
                  <td className="px-4 py-3 text-zinc-600">
                    {formatLeadConversionStatus(l.quoteSnapshot)}
                  </td>
                ) : null}
                {props.mode === "won" ? (
                  <td className="px-4 py-3">
                    {needsLeadConversion(l.quoteSnapshot) ? <LeadRowActions leadId={l.id} mode="won" /> : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


function getLeadConvertedAt(quoteSnapshot: unknown): Date | null {
  if (!quoteSnapshot || typeof quoteSnapshot !== "object") return null;
  const raw = (quoteSnapshot as Record<string, unknown>).convertedAt;
  if (typeof raw !== "string" || !raw.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function needsLeadConversion(quoteSnapshot: unknown): boolean {
  return getLeadConvertedAt(quoteSnapshot) == null;
}

function formatLeadConversionStatus(quoteSnapshot: unknown): string {
  const convertedAt = getLeadConvertedAt(quoteSnapshot);
  return convertedAt ? "Converted " + convertedAt.toLocaleDateString("en-GB") : "Needs conversion";
}

function extractPotentialDealValue(quoteSnapshot: unknown): number | null {
  if (!quoteSnapshot || typeof quoteSnapshot !== "object") return null;
  const q = quoteSnapshot as Record<string, unknown>;
  const value = q.potentialDealValue;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

