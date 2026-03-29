"use client";

import {
  dismissAllNotifications,
  dismissDashboardActivityFromFeed,
  dismissNotificationById,
} from "@/app/actions";
import { useTransition } from "react";
import { X } from "lucide-react";

export function ClearNotificationsButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => dismissAllNotifications())}
      className="shrink-0 rounded-full border border-zinc-200/90 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800 disabled:opacity-50"
    >
      {pending ? "Clearing…" : "Clear notifications"}
    </button>
  );
}

export function DismissFeedItemButton(props: {
  notificationId?: string;
  activityLogId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const { notificationId, activityLogId } = props;

  return (
    <button
      type="button"
      disabled={pending || (!notificationId && !activityLogId)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (notificationId) {
          startTransition(() => dismissNotificationById(notificationId));
        } else if (activityLogId) {
          startTransition(() => dismissDashboardActivityFromFeed(activityLogId));
        }
      }}
      className="rounded-md p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40"
      aria-label="Dismiss"
    >
      <X className="h-3 w-3" strokeWidth={2.25} />
    </button>
  );
}
