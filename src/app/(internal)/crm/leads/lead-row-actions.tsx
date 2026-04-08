"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { beginWonLeadConversion, finalizeLeadWon, markLeadLost } from "./actions";

export function LeadRowActions(props: { leadId: string; mode?: "open" | "won" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onWon() {
    if (!window.confirm("Mark this lead as won?")) return;
    const convertToBrief = window.confirm(
      "Convert this win to a new brief? Choose OK to continue to the brief (or new client) flow, or Cancel to mark won only."
    );
    startTransition(async () => {
      const result = await finalizeLeadWon(props.leadId, convertToBrief);
      if (!result.ok) {
        if (result.error === "admin-required-new-client") {
          const markWonOnly = window.confirm(
            "Creating a brief for this win requires adding a new client first, which only admins can do. Mark this lead as won without starting the brief flow?"
          );
          if (markWonOnly) {
            const again = await finalizeLeadWon(props.leadId, false);
            if (!again.ok) {
              window.alert("Could not update this lead.");
            }
          }
          router.refresh();
          return;
        }
        window.alert(result.error === "already-closed" ? "This lead is already closed." : "Could not update this lead.");
        router.refresh();
        return;
      }
      if (!result.convertToBrief) {
        router.refresh();
        return;
      }
      if (result.mode === "existing_client") {
        router.push(`/briefs/new?clientId=${encodeURIComponent(result.clientId)}&fromWonLead=${encodeURIComponent(props.leadId)}`);
        return;
      }
      router.push(`/clients/new?fromWonLead=${encodeURIComponent(props.leadId)}`);
    });
  }

  
  function onConvert() {
    startTransition(async () => {
      const result = await beginWonLeadConversion(props.leadId);
      if (!result.ok) {
        window.alert(result.error === "admin-required-new-client"
          ? "Only admins can convert this won lead because it needs a new client record first."
          : "Could not start conversion for this lead.");
        router.refresh();
        return;
      }
      if (result.mode === "existing_client") {
        router.push(`/briefs/new?clientId=${encodeURIComponent(result.clientId)}&fromWonLead=${encodeURIComponent(props.leadId)}`);
        return;
      }
      router.push(`/clients/new?fromWonLead=${encodeURIComponent(props.leadId)}`);
    });
  }

  function onLost() {
    if (!window.confirm("Mark this lead as lost? It will move to Lost leads.")) return;
    startTransition(async () => {
      const result = await markLeadLost(props.leadId);
      if (!result.ok) {
        window.alert(result.error === "already-closed" ? "This lead is already closed." : "Could not update this lead.");
      }
      router.refresh();
    });
  }

  if (props.mode === "won") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          disabled={pending}
          onClick={onConvert}
          className="rounded-md bg-sky-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50"
        >
          Convert
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={pending}
        onClick={onWon}
        className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        Won
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onLost}
        className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
      >
        Lost
      </button>
    </div>
  );
}
