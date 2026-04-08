import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/workflow/page-shell";
import { Badge, Card } from "@/components/ui";

export default async function ServiceProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.serviceProduct.findUnique({
    where: { id },
    include: { deliverableTemplates: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return notFound();

  return (
    <PageShell
      title={product.name}
      subtitle="Service catalog product"
      action={
        <Link href="/services" className="text-sm font-medium text-sky-700 hover:text-sky-900">
          ← All services
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Overview</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="capitalize">{product.kind.replace(/_/g, " ")}</Badge>
            <Badge className="capitalize">{product.scopeType.replace(/_/g, " ")}</Badge>
          </div>
          {product.description ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-700">{product.description}</p>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No description.</p>
          )}
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Default deadline</dt>
              <dd className="text-zinc-800">Today + {product.defaultDeadlineDays} days</dd>
            </div>
            {product.monthlyRetainer != null ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500">Monthly retainer</dt>
                <dd className="text-zinc-800">{product.monthlyRetainer}</dd>
              </div>
            ) : null}
            {product.projectBudget != null ? (
              <div>
                <dt className="text-xs font-medium text-zinc-500">Project budget</dt>
                <dd className="text-zinc-800">{product.projectBudget}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-zinc-900">Package deliverables</h2>
          {product.deliverableTemplates.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No template lines (or not a fixed package).</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {product.deliverableTemplates.map((line) => (
                <li key={line.id} className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2">
                  <span className="font-medium text-zinc-900">{line.title}</span>
                  <span className="text-zinc-500"> · +{line.daysFromStart}d</span>
                  <span className="ml-1 text-xs capitalize text-zinc-500">({line.deliverableType})</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
