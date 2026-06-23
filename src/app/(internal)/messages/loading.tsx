export default function MessagesLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f4f5]">
      <div className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-3 w-48 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="flex-1 space-y-3 p-4">
        <div className="h-12 w-2/3 animate-pulse rounded-xl bg-zinc-200/70" />
        <div className="h-12 w-1/2 animate-pulse rounded-xl bg-zinc-200/60" />
        <div className="h-12 w-3/5 animate-pulse rounded-xl bg-zinc-200/50" />
      </div>
    </div>
  );
}
