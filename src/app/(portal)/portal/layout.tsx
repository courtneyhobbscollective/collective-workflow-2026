import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["client"]);
  return <AppShell portal>{children}</AppShell>;
}
