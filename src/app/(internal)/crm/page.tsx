import Link from "next/link";
import { Building2, CalendarClock, UserPlus } from "lucide-react";
import { PageShell } from "@/components/workflow/page-shell";
import { Card } from "@/components/ui";

export default function CrmHomePage() {
  return (
    <PageShell title="CRM" subtitle="Leads, clients, and relationship check-ins">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/crm/leads" className="group block rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-zinc-300 hover:bg-zinc-50/80">
          <div className="flex items-center gap-2 text-zinc-900">
            <UserPlus className="h-5 w-5 text-violet-600" aria-hidden />
            <h2 className="text-base font-semibold">Leads</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">Pipeline and follow-ups before they become clients.</p>
          <span className="mt-3 inline-block text-sm font-medium text-sky-700 group-hover:underline">Open leads →</span>
        </Link>
        <Link href="/clients" className="group block rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-zinc-300 hover:bg-zinc-50/80">
          <div className="flex items-center gap-2 text-zinc-900">
            <Building2 className="h-5 w-5 text-emerald-600" aria-hidden />
            <h2 className="text-base font-semibold">Clients</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">Full client records, briefs, and brand context.</p>
          <span className="mt-3 inline-block text-sm font-medium text-sky-700 group-hover:underline">All clients →</span>
        </Link>
        <Link href="/crm/clients" className="group block rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-zinc-300 hover:bg-zinc-50/80">
          <div className="flex items-center gap-2 text-zinc-900">
            <CalendarClock className="h-5 w-5 text-amber-600" aria-hidden />
            <h2 className="text-base font-semibold">Check-ins</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">Clients with a relationship cadence and upcoming due dates.</p>
          <span className="mt-3 inline-block text-sm font-medium text-sky-700 group-hover:underline">CRM check-ins →</span>
        </Link>
      </div>
      <Card className="mt-6 p-5">
        <p className="text-sm text-zinc-600">
          Use <strong className="font-medium text-zinc-800">Leads</strong> for pre-sale work,{" "}
          <strong className="font-medium text-zinc-800">Clients</strong> for live accounts, and{" "}
          <strong className="font-medium text-zinc-800">Check-ins</strong> to stay on top of scheduled relationship touches.
        </p>
      </Card>
    </PageShell>
  );
}
