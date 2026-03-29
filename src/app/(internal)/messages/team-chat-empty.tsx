import Link from "next/link";

export function TeamChatEmpty() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium text-zinc-900">No channels yet</p>
      <p className="max-w-sm text-sm text-zinc-500">
        When an admin creates a client, a channel with the same name appears here and the whole team is added.
      </p>
      <Link
        href="/clients/new"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Add a client
      </Link>
    </div>
  );
}
