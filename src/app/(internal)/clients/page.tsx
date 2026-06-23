import { HelpSubtitle } from "@/components/help/help-subtitle";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { ClientsList } from "@/components/clients/clients-list";
import { getSessionRole } from "@/lib/auth";
import { loadClientsListItems } from "@/lib/clients-list-data";
import { PageShell } from "@/components/workflow/page-shell";
import { Section } from "@/components/workflow/section";

export default async function ClientsPage() {
  const role = await getSessionRole();
  const isAdmin = role === "admin";
  const items = await loadClientsListItems();

  return (
    <PageShell
      title="Clients"
      subtitle={<HelpSubtitle text="Manage clients, contacts, and delivery scope" articleId="clients" />}
      action={
        isAdmin ? (
          <Link href="/clients/new" className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            New client
          </Link>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body={
            isAdmin
              ? "Create your first client to start scoping and briefing work."
              : "No client records are in the database this app is connected to. If you expected an import, ask an admin to confirm production DATABASE_URL points at Supabase."
          }
          ctaHref={isAdmin ? "/clients/new" : undefined}
          ctaLabel={isAdmin ? "Create client" : undefined}
        />
      ) : (
        <Section title={`All clients (${items.length})`} subtitle="Search by name, contact, email, or phone">
          <ClientsList clients={items} />
        </Section>
      )}
    </PageShell>
  );
}
