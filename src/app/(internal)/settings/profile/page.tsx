import { Section } from "@/components/workflow/section";
import { PageShell } from "@/components/workflow/page-shell";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ProfileEditForm } from "./profile-edit-form";

export default async function TeamProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return notFound();
  }
  const sp = await searchParams;

  return (
    <PageShell title="Your profile" subtitle="Name, contact details, and profile photo">
      <Section title="Profile details" subtitle="Visible to your team where your name appears">
        {sp.saved === "1" ? (
          <div
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            role="status"
          >
            Profile saved.
          </div>
        ) : null}
        <ProfileEditForm
          key={user.updatedAt.toISOString()}
          user={{
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            avatarUrl: user.avatarUrl,
          }}
        />
      </Section>
    </PageShell>
  );
}
