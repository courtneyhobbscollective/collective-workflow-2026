import { createClient } from "@/app/actions";
import { requireRole } from "@/lib/auth";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";

export default async function NewClientPage() {
  await requireRole(["admin"]);
  return (
    <PageShell title="New client" subtitle="Admins can create clients">
      <Section title="New Client Details" subtitle="Capture contact info and key account owners">
        <form action={createClient} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Client name" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
            <input name="email" placeholder="Client email" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input name="phoneNumber" placeholder="Phone number" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
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
              <input name="pocName" placeholder="Name" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" required />
              <input name="pocEmail" placeholder="Email" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" required />
              <input name="pocTitle" placeholder="Title (optional)" className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm" />
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
