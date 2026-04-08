import { AppShell } from "@/components/app-shell";
import { InternalAiChatWidget } from "@/components/workflow/internal-ai-chat-widget";
import { requireRole } from "@/lib/auth";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const role = await requireRole(["admin", "team_member"]);
  return (
    <AppShell isAdmin={role === "admin"} isTeamMember={role === "team_member"}>
      {children}
      <InternalAiChatWidget />
    </AppShell>
  );
}
