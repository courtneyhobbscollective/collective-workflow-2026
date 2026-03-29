"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-600">
        The app hit an unexpected error. If you changed the Prisma schema or ran{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">npx prisma generate</code>, stop the dev
        server completely (Ctrl+C), run{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">npx prisma db push</code> if needed, then
        start <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">npm run dev</code> again. Hot reload does
        not reload the Prisma client, so a full restart is required.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">{error.message}</pre>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Try again
      </button>
    </div>
  );
}
