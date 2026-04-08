import { BriefType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { BriefForm, type BriefTypeUI } from "./brief-form";

const BRIEF_TYPES: BriefTypeUI[] = ["web_design_dev", "app_dev", "video", "photo", "design", "content"];

function workTypeFromQuoteSnapshot(snapshot: unknown): BriefType | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const w = (snapshot as Record<string, unknown>).workType;
  if (typeof w !== "string") return null;
  return (Object.values(BriefType) as string[]).includes(w) ? (w as BriefType) : null;
}

function toBriefTypeUI(t: BriefType | null): BriefTypeUI | null {
  if (!t) return null;
  return BRIEF_TYPES.includes(t as BriefTypeUI) ? (t as BriefTypeUI) : null;
}

export default async function NewBriefPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; fromWonLead?: string }>;
}) {
  const sp = await searchParams;
  const clientIdParam = String(sp.clientId ?? "").trim() || null;
  const fromWonLeadId = String(sp.fromWonLead ?? "").trim() || null;

  const wonLead = fromWonLeadId
    ? await prisma.lead.findUnique({
        where: { id: fromWonLeadId },
        select: {
          id: true,
          status: true,
          name: true,
          companyName: true,
          notes: true,
          quoteSnapshot: true,
        },
      })
    : null;

  const leadForPrefill = wonLead?.status === "won" ? wonLead : null;
  const workType = leadForPrefill ? workTypeFromQuoteSnapshot(leadForPrefill.quoteSnapshot) : null;
  const initialBriefType = toBriefTypeUI(workType);
  const label = leadForPrefill?.companyName?.trim() || leadForPrefill?.name || "Project";
  const initialTitle = leadForPrefill ? `${label} — production brief` : null;
  const initialDescription = leadForPrefill?.notes?.trim() || null;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });

  const initialClientId =
    clientIdParam && clients.some((c) => c.id === clientIdParam) ? clientIdParam : null;

  const scopes: { id: string; name: string; clientId: string }[] = [];
  return (
    <PageShell title="New brief" subtitle="Create a production brief and assign your internal team">
      {leadForPrefill && initialClientId ? (
        <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Brief for a <strong>won lead</strong>. The client below is pre-selected from your pipeline.
        </p>
      ) : null}
      <Section title="Brief details">
        <BriefForm
          clients={clients}
          scopes={scopes}
          initialClientId={initialClientId}
          fromWonLeadId={fromWonLeadId}
          initialBriefType={initialBriefType}
          initialTitle={initialTitle}
          initialDescription={initialDescription}
        />
      </Section>
    </PageShell>
  );
}
