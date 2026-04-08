import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { FeedbackForm } from "@/components/workflow/feedback-form";
import { requireRole } from "@/lib/auth";

export default async function InternalFeedbackPage() {
  await requireRole(["admin", "team_member"]);
  return (
    <PageShell
      title="Report bug or feedback"
      subtitle="Share issues, bugs, and suggestions so we can refine the system."
    >
      <Section title="Feedback form" subtitle="Tickets go straight to the admin feedback inbox">
        <FeedbackForm />
      </Section>
    </PageShell>
  );
}

