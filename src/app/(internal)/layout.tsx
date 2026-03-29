import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "team_member"]);
  return <AppShell>{children}</AppShell>;
}
