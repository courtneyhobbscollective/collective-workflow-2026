import type { BriefStatus } from "@prisma/client";

/**
 * Admin must explicitly confirm contract (and use the onboarding promote flow when applicable)
 * when moving a brief into `in_progress` from pre-live statuses.
 */
export function requiresAdminContractConfirmationForInProgress(
  from: BriefStatus,
  to: BriefStatus
): boolean {
  if (to !== "in_progress") return false;
  return from === "draft" || from === "awaiting_internal_start";
}
