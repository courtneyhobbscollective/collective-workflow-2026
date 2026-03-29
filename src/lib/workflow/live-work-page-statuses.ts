import { BriefStatus } from "@prisma/client";

/**
 * Statuses included on the Live work page (for Prisma filters).
 * Use `BriefStatus.*` members so runtime validation always matches the generated client.
 */
export const LIVE_WORK_PAGE_STATUSES: BriefStatus[] = [
  BriefStatus.scheduled,
  BriefStatus.in_progress,
  BriefStatus.awaiting_client_review,
  BriefStatus.amends_requested,
  BriefStatus.first_round_amends,
  BriefStatus.second_round_amends,
  BriefStatus.approved,
  BriefStatus.completed,
];

export type LiveWorkPageStatus = (typeof LIVE_WORK_PAGE_STATUSES)[number];
