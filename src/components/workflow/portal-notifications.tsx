"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

export type PortalNotificationItem = {
  id: string;
  whenLabel: string;
  title: string;
  body: string;
  href: string;
};

async function dismissOne(key: string) {
  const res = await fetch("/api/portal/notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "one", key }),
  });
  return res.ok;
}

async function dismissAll(keys: string[]) {
  const res = await fetch("/api/portal/notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "all", keys }),
  });
  return res.ok;
}

export function PortalClearAllNotificationsButton(props: { keys: string[] }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { keys } = props;
  return (
    <button
      type="button"
      disabled={pending || keys.length === 0}
      onClick={async () => {
        setPending(true);
        try {
          const ok = await dismissAll(keys);
          if (!ok && process.env.NODE_ENV === "development") {
            console.error("[portal] Clear all failed");
          }
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
      className="shrink-0 rounded-full border border-zinc-200/90 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800 disabled:opacity-50"
    >
      {pending ? "Clearing…" : "Clear all"}
    </button>
  );
}

export function PortalNotificationsList(props: { items: PortalNotificationItem[] }) {
  const { items } = props;
  if (!items.length) {
    return <p className="text-sm text-zinc-500">No notifications yet.</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((n) => (
        <div
          key={n.id}
          className="flex items-stretch gap-1 rounded-xl border border-zinc-100 bg-zinc-50 transition-colors hover:bg-zinc-100"
        >
          <Link href={n.href} className="min-w-0 flex-1 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900">{n.title}</p>
              <span className="shrink-0 text-[11px] text-zinc-500">{n.whenLabel}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-600">{n.body}</p>
          </Link>
          <div className="flex shrink-0 items-start py-2 pr-2 pt-3">
            <DismissPortalNotificationButton notificationKey={n.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DismissPortalNotificationButton(props: { notificationKey: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPending(true);
        try {
          const ok = await dismissOne(props.notificationKey);
          if (!ok && process.env.NODE_ENV === "development") {
            console.error("[portal] Dismiss failed");
          }
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
      className="rounded-md p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200/80 hover:text-zinc-600 disabled:opacity-40"
      aria-label="Dismiss notification"
    >
      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
    </button>
  );
}
