"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDealUpdate } from "@/app/(internal)/crm/deals/actions";

export type DealUpdateRow = {
  id: string;
  authorName: string;
  body: string;
  createdAtIso: string;
};

export function DealUpdatesPanel({ dealId, updates }: { dealId: string; updates: DealUpdateRow[] }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            try {
              await addDealUpdate(dealId, body);
              setBody("");
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not post update. Please try again.");
            }
          });
        }}
      >
        <label className="text-sm font-medium text-zinc-900" htmlFor="deal-update">
          Post an update
        </label>
        <textarea
          id="deal-update"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="PO numbers, invoice notes, handover details…"
          className="min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Posting…" : "Post update"}
        </button>
      </form>

      <div className="space-y-3">
        {updates.length === 0 ? (
          <p className="text-sm text-zinc-500">No updates yet — add POs, notes, or handover details for the team.</p>
        ) : (
          updates.map((u) => (
            <article key={u.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">{u.authorName}</p>
                <time className="text-xs text-zinc-500">
                  {new Date(u.createdAtIso).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{u.body}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
