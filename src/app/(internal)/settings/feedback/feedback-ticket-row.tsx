"use client";

import { FeedbackTicketStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateFeedbackTicketStatus } from "./actions";

type TicketRow = {
  id: string;
  title: string;
  message: string;
  area: string;
  email: string;
  role: string;
  pagePath: string | null;
  status: FeedbackTicketStatus;
  createdAtLabel: string;
};

export function FeedbackTicketRow(props: { ticket: TicketRow }) {
  const router = useRouter();
  const [status, setStatus] = useState<FeedbackTicketStatus>(props.ticket.status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    setError(null);
    const fd = new FormData();
    fd.set("id", props.ticket.id);
    fd.set("status", status);
    startTransition(() => {
      void (async () => {
        const result = await updateFeedbackTicketStatus(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      })();
    });
  }

  return (
    <tr className="border-t border-zinc-100 align-top">
      <td className="px-3 py-3 text-sm">
        <div className="font-medium text-zinc-900">{props.ticket.title}</div>
        <div className="mt-1 inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
          {props.ticket.area.replace(/_/g, " ")}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600">{props.ticket.message}</p>
      </td>
      <td className="px-3 py-3 text-xs text-zinc-600">
        <div>{props.ticket.email}</div>
        <div className="capitalize text-zinc-500">{props.ticket.role.replace(/_/g, " ")}</div>
        {props.ticket.pagePath ? <div className="text-zinc-400">{props.ticket.pagePath}</div> : null}
        <div className="text-zinc-400">{props.ticket.createdAtLabel}</div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FeedbackTicketStatus)}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs"
          >
            <option value={FeedbackTicketStatus.new}>New</option>
            <option value={FeedbackTicketStatus.in_review}>In review</option>
            <option value={FeedbackTicketStatus.resolved}>Resolved</option>
            <option value={FeedbackTicketStatus.rejected}>Rejected</option>
          </select>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </td>
    </tr>
  );
}

