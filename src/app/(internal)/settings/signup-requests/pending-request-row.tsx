"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approvePendingSignup, rejectPendingSignup } from "./actions";

export type PendingRow = {
  id: string;
  companyName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  createdAtLabel: string;
};

export function PendingRequestRow(props: { row: PendingRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  function runApprove() {
    setError(null);
    const fd = new FormData();
    fd.set("id", props.row.id);
    startTransition(() => {
      void (async () => {
        const result = await approvePendingSignup(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      })();
    });
  }

  function runReject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", props.row.id);
    startTransition(() => {
      void (async () => {
        const result = await rejectPendingSignup(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRejectOpen(false);
        router.refresh();
      })();
    });
  }

  return (
    <tr className="border-t border-zinc-100 align-top">
      <td className="px-3 py-3 text-sm">
        <div className="font-medium text-zinc-900">{props.row.companyName}</div>
        <div className="text-xs text-zinc-500">{props.row.createdAtLabel}</div>
      </td>
      <td className="px-3 py-3 text-sm">
        <div className="text-zinc-900">{props.row.fullName}</div>
        <div className="text-xs text-zinc-600">{props.row.email}</div>
        {props.row.phoneNumber ? <div className="text-xs text-zinc-500">{props.row.phoneNumber}</div> : null}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={runApprove}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setRejectOpen((v) => !v);
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
        {rejectOpen ? (
          <form onSubmit={runReject} className="mt-2 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-2">
            <label className="block text-xs font-medium text-zinc-700">Reason (optional)</label>
            <textarea
              name="reason"
              rows={2}
              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
              placeholder="Shown internally only"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
            >
              Confirm reject
            </button>
          </form>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </td>
    </tr>
  );
}
