import type { BriefStatus } from "@prisma/client";

/** Single-column sections below the in-progress kanban. */
export const LIVE_WORK_FLAT_SECTIONS = [
  "awaiting_client_review",
  "amends_requested",
  "first_round_amends",
  "second_round_amends",
  "approved",
  "completed",
] as const satisfies readonly BriefStatus[];

export type LiveWorkFlatSection = (typeof LIVE_WORK_FLAT_SECTIONS)[number];

export function isInProgressLaneStatus(status: BriefStatus): boolean {
  return status === "in_progress" || status === "scheduled";
}

export const LIVE_WORK_SECTION_LABELS: Record<LiveWorkFlatSection, string> = {
  awaiting_client_review: "Awaiting client review",
  amends_requested: "Amends requested",
  first_round_amends: "First round of amends",
  second_round_amends: "Second round of amends",
  approved: "Approved",
  completed: "Completed",
};
