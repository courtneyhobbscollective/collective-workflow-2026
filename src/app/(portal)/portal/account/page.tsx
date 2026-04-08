import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { PortalProfileEditForm } from "./profile-edit-form";

export default async function PortalAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true, phoneNumber: true, avatarUrl: true, role: true },
  });
  if (!user || user.role !== "client") return notFound();
  const sp = await searchParams;

  return (
    <PageShell title="Profile" subtitle="Your details and profile photo">
      <Section title="Profile details" subtitle="Used in your portal and message threads">
        {sp.saved === "1" ? (
          <div
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            role="status"
          >
            Profile saved.
          </div>
        ) : null}
        <PortalProfileEditForm
          key={`${user.email}-${user.avatarUrl ?? "none"}`}
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
