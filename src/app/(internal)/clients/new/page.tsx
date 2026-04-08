import { createClient } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ fromWonLead?: string }>;
}) {
  await requireRole(["admin"]);
  const sp = await searchParams;
  const fromWonLeadId = String(sp.fromWonLead ?? "").trim() || null;

  const lead = fromWonLeadId
    ? await prisma.lead.findUnique({
        where: { id: fromWonLeadId },
        select: {
          id: true,
          status: true,
          name: true,
          email: true,
          companyName: true,
          position: true,
          phoneNumber: true,
          notes: true,
        },
      })
    : null;

  const validWonLead = lead?.status === "won";
  const bannerLead = validWonLead ? lead : null;

  const defaultName = bannerLead ? (bannerLead.companyName?.trim() || bannerLead.name) : "";
  const defaultEmail = bannerLead?.email ?? "";
  const defaultPhone = bannerLead?.phoneNumber ?? "";
  const defaultBrandSummary = bannerLead?.notes ?? "";
  const defaultPocName = bannerLead?.name ?? "";
  const defaultPocEmail = bannerLead?.email ?? "";
  const defaultPocTitle = bannerLead?.position ?? "";

  return (
    <PageShell title="New client" subtitle="Admins can create clients">
      {bannerLead ? (
        <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Creating a client record after a <strong>won lead</strong>. After you save, you will continue to the new brief
          with this client pre-selected.
        </p>
      ) : fromWonLeadId && !validWonLead ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          That lead link is invalid or the lead is not marked won. You can still create a client as usual.
        </p>
      ) : null}
      <Section title="New Client Details" subtitle="Capture contact info and key account owners">
        <form action={createClient} className="space-y-4">
          {bannerLead ? <input type="hidden" name="fromWonLeadId" value={bannerLead.id} /> : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Client name" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue={defaultName} />
            <input name="email" placeholder="Client email" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue={defaultEmail} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input name="phoneNumber" placeholder="Phone number" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue={defaultPhone} />
            <select name="status" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue="active">
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="engagementType" className="text-sm font-medium text-zinc-900">
              Engagement type
            </label>
            <p className="text-xs text-zinc-500">
              Retainer accounts have ongoing agreements; project clients are usually discrete or one-off work.
            </p>
            <select
              id="engagementType"
              name="engagementType"
              className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm"
              defaultValue="project"
            >
              <option value="project">Project / one-off</option>
              <option value="retainer">Retainer</option>
            </select>
          </div>

          <input name="timezone" placeholder="Timezone (e.g. Europe/London)" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue="Europe/London" />

          <textarea
            name="brandSummary"
            placeholder="Brand summary (what your team needs to know for briefs)"
            className="w-full min-h-28 rounded-lg border border-zinc-200 bg-white p-2 text-sm"
            defaultValue={defaultBrandSummary}
          />

          <div className="space-y-2 pt-2 border-t border-zinc-200/70">
            <p className="text-sm font-medium text-zinc-900">Brand guidelines upload</p>
            <p className="text-xs text-zinc-500">Upload PDFs, images, or ZIPs. Stored locally in dev.</p>
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
              <input name="pocName" placeholder="Name" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" required defaultValue={defaultPocName} />
              <input name="pocEmail" placeholder="Email" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" required defaultValue={defaultPocEmail} />
              <input name="pocTitle" placeholder="Title (optional)" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" defaultValue={defaultPocTitle} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-900">Accounts contact</p>
              <input name="accountsName" placeholder="Name" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
              <input name="accountsEmail" placeholder="Email" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
              <input name="accountsTitle" placeholder="Title (optional)" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
            </div>
          </div>

          <button className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            Save client
          </button>
        </form>
      </Section>
    </PageShell>
  );
}
