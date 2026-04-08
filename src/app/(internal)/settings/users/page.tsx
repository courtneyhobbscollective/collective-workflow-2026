import { Section } from "@/components/workflow/section";
import { PageShell } from "@/components/workflow/page-shell";
import { getSessionUserId, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateUserForm } from "./create-user-form";
import { UserRoleRow } from "./user-role-row";
import { PendingRequestRow } from "../signup-requests/pending-request-row";

export default async function TeamUsersPage() {
  await requireAdmin();

  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) redirect("/login");

  const [users, clients, portalSignups, pendingOnboarding] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: { client: { select: { name: true } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.pendingClientSignup.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        companyName: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
        createdUser: { select: { email: true } },
      },
    }),
    prisma.pendingClientSignup.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        companyName: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
      },
    }),
  ]);

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    clientId: u.clientId,
    clientName: u.client?.name ?? null,
  }));

  return (
    <PageShell
      title="Users"
      subtitle="Add people to the platform and assign admin, team, or client access"
    >
      <Section
        title="Invite user"
        subtitle="Creates a user for an existing company. They can set a password via Forgot password on the login page (or scripts/set-user-password.ts on the server). New companies use /join; approve them under Client requests."
      >
        <CreateUserForm clients={clientOptions} />
      </Section>

      <Section title="All users" subtitle="Change roles or which company a client user belongs to">
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="px-3 py-2 font-medium text-zinc-700">Person</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Company</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Role &amp; access</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <UserRoleRow key={u.id} user={u} clients={clientOptions} currentUserId={sessionUserId} />
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Pending client onboarding"
        subtitle="New client signups wait here until an admin approves or rejects them"
      >
        {pendingOnboarding.length === 0 ? (
          <p className="text-sm text-zinc-500">No pending onboarding requests.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-3 py-2 font-medium text-zinc-700">Company</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Contact</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOnboarding.map((row) => (
                  <PendingRequestRow
                    key={row.id}
                    row={{
                      ...row,
                      createdAtLabel: row.createdAt.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Portal signups" subtitle="Clients who have registered for portal access">
        {portalSignups.length === 0 ? (
          <p className="text-sm text-zinc-500">No portal signups yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-3 py-2 font-medium text-zinc-700">Company</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Contact</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Status</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Created user</th>
                </tr>
              </thead>
              <tbody>
                {portalSignups.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-100">
                    <td className="px-3 py-3 text-sm font-medium text-zinc-900">{s.companyName}</td>
                    <td className="px-3 py-3 text-sm text-zinc-600">
                      <div>{s.fullName}</div>
                      <div className="text-xs text-zinc-500">{s.email}</div>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 capitalize">
                        {s.status}
                      </span>
                      <div className="mt-1 text-[11px] text-zinc-400">
                        {s.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-zinc-600">{s.createdUser?.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </PageShell>
  );
}
