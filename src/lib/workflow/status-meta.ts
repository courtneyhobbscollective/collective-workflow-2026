import type { BriefStatus, ClientStatus, ScopeStatus } from "@prisma/client";

export type PillTone = "default" | "info" | "success" | "warning" | "danger";

export function getBriefStatusMeta(status: BriefStatus) {
  switch (status) {
    case "draft":
      return { tone: "default" as const, label: "Draft" };
    case "awaiting_internal_start":
      return { tone: "warning" as const, label: "Awaiting internal start" };
    case "scheduled":
      return { tone: "default" as const, label: "Scheduled" };
    case "in_progress":
      return { tone: "success" as const, label: "In progress" };
    case "awaiting_client_review":
      return { tone: "warning" as const, label: "Awaiting client review" };
    case "amends_requested":
      return { tone: "warning" as const, label: "Amends requested" };
    case "first_round_amends":
      return { tone: "warning" as const, label: "First round of amends" };
    case "second_round_amends":
      return { tone: "warning" as const, label: "Second round of amends" };
    case "approved":
      return { tone: "success" as const, label: "Approved" };
    case "completed":
      return { tone: "success" as const, label: "Completed" };
    case "archived":
      return { tone: "danger" as const, label: "Archived" };
    default:
      return { tone: "default" as const, label: status };
  }
}

export function getScopeStatusMeta(scopeStatus: ScopeStatus) {
  switch (scopeStatus) {
    case "in_scope":
      return { tone: "success" as const, label: "In scope" };
    case "watch_scope":
      return { tone: "warning" as const, label: "Watch scope" };
    case "out_of_scope":
      return { tone: "danger" as const, label: "Out of scope" };
    case "awaiting_admin_review":
      return { tone: "warning" as const, label: "Awaiting admin review" };
    default:
      return { tone: "default" as const, label: scopeStatus };
  }
}

export function getClientStatusMeta(clientStatus: ClientStatus) {
  switch (clientStatus) {
    case "active":
      return { tone: "success" as const, label: "Active" };
    case "paused":
      return { tone: "warning" as const, label: "Paused" };
    case "archived":
      return { tone: "danger" as const, label: "Archived" };
    default:
      return { tone: "default" as const, label: clientStatus };
  }
}

