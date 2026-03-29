import type { Prisma, ScopeStatus } from "@prisma/client";

/** Briefs that are still in the delivery pipeline (scope health is meaningful). */
export const PIPELINE_BRIEF_STATUS_FILTER: Prisma.BriefWhereInput = {
  status: { notIn: ["completed", "archived"] },
};

/** Scope states that should surface on the dashboard “needs attention” list. */
export const SCOPE_NEEDS_ATTENTION: ScopeStatus[] = [
  "watch_scope",
  "out_of_scope",
  "awaiting_admin_review",
];

/** Display order for the scope summary tiles on the dashboard. */
export const SCOPE_STATUS_SUMMARY_ORDER: ScopeStatus[] = [
  "watch_scope",
  "out_of_scope",
  "awaiting_admin_review",
  "in_scope",
];

const SCOPE_SET = new Set<string>([
  "in_scope",
  "watch_scope",
  "out_of_scope",
  "awaiting_admin_review",
]);

export function parseBriefScopeFilterParam(raw: string | undefined): ScopeStatus | undefined {
  if (!raw || !SCOPE_SET.has(raw)) return undefined;
  return raw as ScopeStatus;
}
