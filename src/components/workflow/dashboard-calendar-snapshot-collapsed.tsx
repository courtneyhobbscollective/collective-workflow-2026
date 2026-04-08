"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarSnapshotItem = {
  id: string;
  title: string;
  context: string;
  startsAtIso: string;
  bookingType: string;
};

function bookingTypeTone(bookingType: string): { chip: string; label: string } {
  switch (bookingType) {
    case "review":
      return { chip: "bg-amber-100/90 text-amber-900", label: "Review" };
    case "kickoff":
      return { chip: "bg-violet-100/90 text-violet-900", label: "Kickoff" };
    case "handoff":
      return { chip: "bg-emerald-100/90 text-emerald-900", label: "Handoff" };
    case "internal":
      return { chip: "bg-sky-100/90 text-sky-900", label: "Internal" };
    default:
      return { chip: "bg-zinc-100 text-zinc-700", label: bookingType.replace(/_/g, " ") || "Booking" };
  }
}

function CalendarSnapshotCard({ item }: { item: CalendarSnapshotItem }) {
  const tone = bookingTypeTone(item.bookingType);
  return (
    <Link
      href="/calendar"
      className="block rounded-xl border border-zinc-100 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-zinc-200 hover:bg-zinc-50/90"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
          <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", tone.chip)}>
            {tone.label}
          </span>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{item.context}</p>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
          {new Date(item.startsAtIso).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </Link>
  );
}

export function DashboardCalendarSnapshotCollapsed(props: { items: CalendarSnapshotItem[] }) {
  const [open, setOpen] = useState(false);
  const topItems = useMemo(() => props.items.slice(0, 3), [props.items]);
  const remainingItems = useMemo(() => props.items.slice(3), [props.items]);

  if (props.items.length === 0) {
    return <p className="text-sm text-zinc-600">No upcoming bookings assigned to you.</p>;
  }

  return (
    <>
      <ul className="space-y-2">
        {topItems.map((item) => (
          <li key={item.id}>
            <CalendarSnapshotCard item={item} />
          </li>
        ))}
        {remainingItems.length > 0 ? (
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="block w-full rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-200 hover:bg-zinc-100/80"
            >
              <span className="font-medium">
                {remainingItems.length} more booking{remainingItems.length > 1 ? "s" : ""}
              </span>
              <span className="ml-2 text-xs text-zinc-500 underline underline-offset-2">View all</span>
            </button>
          </li>
        ) : null}
      </ul>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-900">All upcoming bookings</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <ul className="space-y-2">
                {remainingItems.map((item) => (
                  <li key={item.id}>
                    <CalendarSnapshotCard item={item} />
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

