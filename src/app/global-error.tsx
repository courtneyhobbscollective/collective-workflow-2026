"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 p-8 font-sans text-zinc-900">
        <div className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Workflow crashed</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Open <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">/api/health</code> in the browser to see whether{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">DATABASE_URL</code> and Postgres are OK.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">{error.message}</pre>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
