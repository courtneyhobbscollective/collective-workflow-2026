import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";
import { ClientStatusPill } from "@/components/workflow/status-pill";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/auth";
import { recordClientRelationshipContact, updateClient, updateClientRelationshipCadence } from "@/app/actions";
import { Badge } from "@/components/ui";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id }, include: { briefs: true, contacts: true, assets: true } });
  if (!client) return notFound();

  const role = await getSessionRole();
  const isAdmin = role === "admin";
  const isInternalTeam = role === "admin" || role === "team_member";

  const catalogBriefCount = client.briefs.filter((b) => b.serviceProductId != null).length;

  const poc = client.contacts.find((c) => c.role === "point_of_contact") ?? client.contacts.find((c) => c.isPrimary) ?? null;
  const accounts = client.contacts.find((c) => c.role === "accounts_contact") ?? null;
  const brandAssets = (client.assets ?? []).filter((a) => a.type === "brand_guidelines");

  return (
    <PageShell title={client.name} subtitle="Client record overview">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Section title="Profile" subtitle="Brand positioning used for brief context">
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <ClientStatusPill status={client.status} />
              <Badge className={client.engagementType === "retainer" ? "bg-violet-100 text-violet-900" : ""}>
                {client.engagementType === "retainer" ? "Retainer" : "Project / one-off"}
              </Badge>
              {client.phoneNumber ? <Badge>{client.phoneNumber}</Badge> : null}
              {client.timezone ? <Badge>{client.timezone}</Badge> : null}
            </div>

            {isAdmin ? (
              <form action={updateClient} className="space-y-4">
                <input type="hidden" name="clientId" value={client.id} />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input name="name" defaultValue={client.name} required placeholder="Client name" className="w-full" />
                  <input name="email" defaultValue={client.email ?? ""} placeholder="Client email" className="w-full" />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input name="phoneNumber" defaultValue={client.phoneNumber ?? ""} placeholder="Phone number" className="w-full" />
                  <select name="status" defaultValue={client.status} className="w-full">
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="archived">archived</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="engagementType" className="text-sm font-medium text-zinc-900">
                    Engagement type
                  </label>
                  <select id="engagementType" name="engagementType" defaultValue={client.engagementType} className="w-full">
                    <option value="project">Project / one-off</option>
                    <option value="retainer">Retainer</option>
                  </select>
                </div>

                <input name="timezone" defaultValue={client.timezone} placeholder="Timezone (e.g. Europe/London)" className="w-full" />

                <textarea name="brandSummary" defaultValue={client.brandSummary ?? ""} placeholder="Brand summary" className="w-full min-h-28 resize-none" />

                <div className="space-y-2 pt-2 border-t border-zinc-200/70">
                  <p className="text-sm font-medium text-zinc-900">Brand guidelines</p>
                  <p className="text-xs text-zinc-500">Upload PDFs, images, or ZIPs. Stored locally in dev.</p>

                  <div className="space-y-2">
                    {brandAssets.length ? (
                      brandAssets.map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                        >
                          {a.fileName}
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500">No brand guideline files yet.</p>
                    )}
                  </div>

                  <input
                    type="file"
                    name="brandGuidelines"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.zip"
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2 border-t border-zinc-200/70">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-900">Point of contact</p>
                    <input name="pocName" defaultValue={poc?.name ?? ""} placeholder="Name" required className="w-full" />
                    <input name="pocEmail" defaultValue={poc?.email ?? ""} placeholder="Email" required className="w-full" />
                    <input name="pocTitle" defaultValue={poc?.title ?? ""} placeholder="Title (optional)" className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-900">Accounts contact</p>
                    <input name="accountsName" defaultValue={accounts?.name ?? ""} placeholder="Name" className="w-full" />
                    <input name="accountsEmail" defaultValue={accounts?.email ?? ""} placeholder="Email" className="w-full" />
                    <input name="accountsTitle" defaultValue={accounts?.title ?? ""} placeholder="Title (optional)" className="w-full" />
                  </div>
                </div>

                <button className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800" type="submit">
                  Save changes
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-700">{client.brandSummary || "No summary yet."}</p>
                <div className="space-y-2 pt-2 border-t border-zinc-200/70">
                  <p className="text-xs font-medium text-zinc-600">Brand guidelines</p>
                  {brandAssets.length ? (
                    <div className="space-y-2">
                      {brandAssets.map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-zinc-100 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                        >
                          {a.fileName}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">No brand guideline files yet.</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-zinc-50 px-4 py-3 border border-zinc-100">
                    <p className="text-xs text-zinc-600">Point of contact</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{poc?.name ?? "—"}</p>
                    <p className="text-xs text-zinc-600">{poc?.email ?? ""}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-4 py-3 border border-zinc-100">
                    <p className="text-xs text-zinc-600">Accounts contact</p>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{accounts?.name ?? "—"}</p>
                    <p className="text-xs text-zinc-600">{accounts?.email ?? ""}</p>
                  </div>
                </div>
              </div>
            )}
          </Section>
          <Section title="Delivery" subtitle="How much work is already in motion">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
                <p className="text-xs text-zinc-600">Catalog-linked briefs</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{catalogBriefCount}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-100">
                <p className="text-xs text-zinc-600">Total briefs</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{client.briefs.length}</p>
              </div>
            </div>
            {isInternalTeam ? (
              <p className="mt-3 text-sm text-zinc-600">
                <Link
                  href={`/briefs/new?clientId=${encodeURIComponent(client.id)}`}
                  className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
                >
                  New brief for this client
                </Link>{" "}
                — attach an optional catalog service on the brief form.
              </p>
            ) : null}
          </Section>

          {isInternalTeam ? (
            <Section
              title="Relationship check-ins"
              subtitle="Admins are notified when the next contact date is due. Log contact to reset the clock."
            >
              <div className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                  <p className="text-xs text-zinc-500">Cadence</p>
                  <p className="font-medium text-zinc-900">
                    {client.relationshipContactFrequencyDays != null
                      ? `Every ${client.relationshipContactFrequencyDays} days`
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                  <p className="text-xs text-zinc-500">Next due</p>
                  <p className="font-medium text-zinc-900">
                    {client.nextRelationshipContactDueAt
                      ? client.nextRelationshipContactDueAt.toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                  <p className="text-xs text-zinc-500">Last logged</p>
                  <p className="font-medium text-zinc-900">
                    {client.lastRelationshipContactAt
                      ? client.lastRelationshipContactAt.toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>
              </div>
              <form action={updateClientRelationshipCadence} className="mb-4 flex flex-wrap items-end gap-2">
                <input type="hidden" name="clientId" value={client.id} />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-600">Check-in every (days)</label>
                  <input
                    name="relationshipContactFrequencyDays"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="e.g. 14"
                    defaultValue={client.relationshipContactFrequencyDays ?? ""}
                    className="w-40 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Save cadence
                </button>
                <p className="w-full text-xs text-zinc-500">Clear the field and save to remove cadence and reminders.</p>
              </form>
              <form action={recordClientRelationshipContact}>
                <input type="hidden" name="clientId" value={client.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  Log contact now
                </button>
              </form>
            </Section>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
