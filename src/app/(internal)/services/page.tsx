import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Badge, Card } from "@/components/ui";

export default async function ServicesCatalogPage() {
  const products = await prisma.serviceProduct.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      kind: true,
      scopeType: true,
      defaultDeadlineDays: true,
    },
  });

  return (
    <PageShell title="Services" subtitle="Catalog products and packages for briefs">
      {products.length === 0 ? (
        <Card className="p-8 text-center text-sm text-zinc-500">No service products yet. Admins can add them from tooling or seed data.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/services/${p.id}`}
              className="block rounded-xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-zinc-300 hover:bg-zinc-50/80"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900">{p.name}</h2>
                <Badge className="capitalize">{p.kind.replace(/_/g, " ")}</Badge>
              </div>
              {p.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{p.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500">
                Scope: <span className="capitalize">{p.scopeType.replace(/_/g, " ")}</span>
                {" · "}
                Default deadline +{p.defaultDeadlineDays} days
              </p>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
