"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Activity, Bell, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DismissFeedItemButton } from "@/components/workflow/dashboard-notification-actions";

type FeedItem = {
  id: string;
  createdAtIso: string;
  title: string;
  body: string;
  href: string | null;
  kind: "personal" | "team";
  category: "calendar" | "crm" | "brief" | "comms" | "system";
  notificationId?: string;
  activityLogId?: string;
};

const CATEGORY_STYLES: Record<
  FeedItem["category"],
  { icon: string; chip: string; label: string }
> = {
  calendar: {
    icon: "bg-amber-50 text-amber-700 ring-amber-200/70",
    chip: "bg-amber-100/90 text-amber-900",
    label: "Calendar",
  },
  crm: {
    icon: "bg-violet-50 text-violet-700 ring-violet-200/70",
    chip: "bg-violet-100/90 text-violet-900",
    label: "CRM",
  },
  brief: {
    icon: "bg-sky-50 text-sky-700 ring-sky-200/70",
    chip: "bg-sky-100/90 text-sky-900",
    label: "Delivery",
  },
  comms: {
    icon: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
    chip: "bg-indigo-100/90 text-indigo-900",
    label: "Comms",
  },
  system: {
    icon: "bg-zinc-100 text-zinc-600 ring-zinc-200/80",
    chip: "bg-zinc-200/70 text-zinc-700",
    label: "System",
  },
};

function formatFeedTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DashboardFeedRow({ item, dismissSlot }: { item: FeedItem; dismissSlot: ReactNode }) {
  const isPersonal = item.kind === "personal";
  const tone = CATEGORY_STYLES[item.category];
  const mainClass = cn(
    "group flex min-w-0 flex-1 items-start gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4",
    item.href ? "transition-colors hover:bg-zinc-50/90" : ""
  );

  const mainInner = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          tone.icon
        )}
        aria-hidden
      >
        {isPersonal ? <Bell className="h-[18px] w-[18px]" strokeWidth={2} /> : <Activity className="h-[18px] w-[18px]" strokeWidth={2} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 gap-y-1">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              isPersonal ? "bg-sky-100/90 text-sky-900" : "bg-zinc-200/70 text-zinc-700"
            )}
          >
            {isPersonal ? "For you" : "Team"}
          </span>
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", tone.chip)}>
            {tone.label}
          </span>
          <h3 className="text-sm font-semibold leading-snug text-zinc-900">{item.title}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{item.body}</p>
        <p className="mt-2 text-[11px] font-medium tabular-nums text-zinc-400">{formatFeedTime(item.createdAtIso)}</p>
      </div>
      {item.href ? (
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500"
          aria-hidden
        />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
    </>
  );

  return (
    <div className="flex items-stretch">
      {item.href ? (
        <Link href={item.href} className={mainClass} aria-label={`Open: ${item.title}`}>
          {mainInner}
        </Link>
      ) : (
        <div className={mainClass}>{mainInner}</div>
      )}
      <div className="flex shrink-0 items-start py-3 pr-2 pt-3.5 sm:py-4 sm:pr-3 sm:pt-4">{dismissSlot}</div>
    </div>
  );
}

export function DashboardFeedCollapsed(props: { items: FeedItem[] }) {
  const [open, setOpen] = useState(false);
  const topItems = useMemo(() => props.items.slice(0, 3), [props.items]);
  const remainingItems = useMemo(() => props.items.slice(3), [props.items]);

  if (props.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-10 text-center">
        <p className="text-sm text-zinc-600">
          No activity yet. Brief moves, assignments, and messages will show here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <ul className="divide-y divide-zinc-100">
          {topItems.map((item) => (
            <li key={item.id}>
              <DashboardFeedRow
                item={item}
                dismissSlot={
                  <DismissFeedItemButton
                    notificationId={item.notificationId}
                    activityLogId={item.activityLogId}
                  />
                }
              />
            </li>
          ))}
          {remainingItems.length > 0 ? (
            <li>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 sm:px-5"
              >
                <span className="font-medium">
                  {remainingItems.length} more notification{remainingItems.length > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-zinc-500 underline underline-offset-2">View all</span>
              </button>
            </li>
          ) : null}
        </ul>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-900">More activity & notifications</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <ul className="divide-y divide-zinc-100">
                {remainingItems.map((item) => (
                  <li key={item.id}>
                    <DashboardFeedRow
                      item={item}
                      dismissSlot={
                        <DismissFeedItemButton
                          notificationId={item.notificationId}
                          activityLogId={item.activityLogId}
                        />
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

