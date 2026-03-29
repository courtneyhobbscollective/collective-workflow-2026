import type { BriefPriority, BriefStatus, ClientStatus, ScopeStatus } from "@prisma/client";
import { getBriefStatusMeta, getClientStatusMeta, getScopeStatusMeta } from "@/lib/workflow/status-meta";
import { Pill } from "@/components/workflow/pill";

export function StatusPill({ status }: { status: BriefStatus }) {
  const meta = getBriefStatusMeta(status);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function ScopePill({ scopeStatus }: { scopeStatus: ScopeStatus }) {
  const meta = getScopeStatusMeta(scopeStatus);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function ClientStatusPill({ status }: { status: ClientStatus }) {
  const meta = getClientStatusMeta(status);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function PriorityPill({ priority }: { priority: BriefPriority }) {
  switch (priority) {
    case "low":
      return <Pill tone="default">Low</Pill>;
    case "medium":
      return <Pill tone="info">Medium</Pill>;
    case "high":
      return <Pill tone="warning">High</Pill>;
    case "urgent":
      return <Pill tone="danger">Urgent</Pill>;
    default:
      return <Pill tone="default">{priority}</Pill>;
  }
}

