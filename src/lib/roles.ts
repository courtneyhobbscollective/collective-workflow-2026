import type { UserRole } from "@prisma/client";

/** Human-readable labels shown in Settings → Users. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Super Admin",
  team_member: "Staff",
  client: "Client",
};

export function roleLabel(role: UserRole) {
  return ROLE_LABELS[role];
}

/**
 * Internal URL prefixes blocked for Staff (`team_member`).
 * Super Admins (`admin`) can access everything.
 */
export const STAFF_RESTRICTED_PATH_PREFIXES = ["/crm", "/clients", "/services", "/reports"] as const;

export function isStaffRestrictedPath(pathname: string) {
  return STAFF_RESTRICTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
