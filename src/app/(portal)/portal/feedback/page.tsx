import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { FeedbackForm } from "@/components/workflow/feedback-form";

export default function PortalFeedbackPage() {
  return (
    <PageShell
      title="Report bug or feedback"
      subtitle="Share issues, bugs, and suggestions with the team."
    >
      <Section title="Feedback form" subtitle="Your report is sent to the admin feedback inbox">
        <FeedbackForm />
      </Section>
    </PageShell>
  );
}

