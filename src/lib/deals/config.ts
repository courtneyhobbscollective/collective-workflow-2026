import type { DealStage } from "@prisma/client";

export const DEAL_STAGE_OPTIONS: { value: DealStage; label: string; className: string }[] = [
  { value: "lead", label: "Lead", className: "bg-sky-500 text-white" },
  { value: "proposal", label: "Proposal", className: "bg-emerald-800 text-white" },
  { value: "negotiation", label: "Negotiation", className: "bg-violet-600 text-white" },
  { value: "contract_sent", label: "Contract Sent", className: "bg-rose-300 text-rose-950" },
  { value: "won", label: "Won", className: "bg-lime-500 text-lime-950" },
  { value: "quote_sent", label: "Quote Sent", className: "bg-lime-400 text-lime-950" },
  { value: "completed", label: "Completed", className: "bg-zinc-500 text-white" },
  { value: "in_production", label: "In Production", className: "bg-orange-500 text-white" },
  { value: "in_edits", label: "In Edits", className: "bg-amber-400 text-amber-950" },
  { value: "lost", label: "Lost", className: "bg-slate-400 text-slate-900" },
  { value: "ideation", label: "Ideation", className: "bg-pink-400 text-pink-950" },
];

export const DEAL_BILLING_STATUS_OPTIONS: { label: string; className: string }[] = [
  { label: "Invoiced", className: "bg-sky-300 text-sky-950" },
  { label: "50% invoiced", className: "bg-amber-300 text-amber-950" },
  { label: "30% invoiced", className: "bg-violet-400 text-violet-950" },
  { label: "PO Requested", className: "bg-orange-400 text-orange-950" },
  { label: "PO Received", className: "bg-blue-500 text-white" },
  { label: "Paid", className: "bg-lime-500 text-lime-950" },
  { label: "PAID", className: "bg-teal-500 text-white" },
  { label: "Can Be Invoiced", className: "bg-green-600 text-white" },
  { label: "Invoice Drafted", className: "bg-pink-300 text-pink-950" },
  { label: "Contract Sent", className: "bg-pink-400 text-pink-950" },
  { label: "Price negotiation", className: "bg-rose-400 text-rose-950" },
  { label: "Deposit invoiced", className: "bg-sky-400 text-sky-950" },
  { label: "50% Deposit Needed", className: "bg-violet-500 text-white" },
  { label: "HOLD ON THIS", className: "bg-red-400 text-red-950" },
];

const STAGE_BY_LABEL: Record<string, DealStage> = {
  lead: "lead",
  proposal: "proposal",
  negotiation: "negotiation",
  "contract sent": "contract_sent",
  won: "won",
  "quote sent": "quote_sent",
  completed: "completed",
  "in production": "in_production",
  "in edits": "in_edits",
  lost: "lost",
  ideation: "ideation",
};

export function parseDealStageLabel(raw: string): DealStage {
  const key = raw.trim().toLowerCase();
  return STAGE_BY_LABEL[key] ?? "lead";
}

export function dealStageMeta(stage: DealStage) {
  return DEAL_STAGE_OPTIONS.find((s) => s.value === stage) ?? DEAL_STAGE_OPTIONS[0];
}

export function billingStatusMeta(label: string | null | undefined) {
  if (!label) return { label: "—", className: "bg-zinc-100 text-zinc-500" };
  const exact = DEAL_BILLING_STATUS_OPTIONS.find((s) => s.label.toLowerCase() === label.toLowerCase());
  if (exact) return exact;
  return { label, className: "bg-zinc-200 text-zinc-800" };
}

export function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
}
