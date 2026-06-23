import { Card } from "@/components/ui";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-200/70 ${className ?? ""}`} />;
}

export default function InternalLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Card className="overflow-hidden p-0">
        <Skeleton className="h-20 rounded-none" />
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-32 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-32 w-full" />
        </Card>
      </div>
    </div>
  );
}
