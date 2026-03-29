"use client";

import type { BookingType, BriefType, BriefPriority, BriefStatus, ScopeStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PriorityPill, ScopePill, StatusPill } from "@/components/workflow/status-pill";
import { cn } from "@/lib/utils";

export type CalendarBriefSummary = {
  id: string;
  title: string;
  description: string;
  briefType: BriefType;
  priority: BriefPriority;
  status: BriefStatus;
  scopeStatus: ScopeStatus;
  deadline: string;
  internalDeliveryDate: string | null;
  clientDeliveryDate: string | null;
  reviewLink: string | null;
  clientName: string;
};

export type CalendarBookingLite = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  bookingType: BookingType;
  briefId: string | null;
  visibleToClient: boolean;
  userName: string | null;
  assigneeAvatarUrl: string | null;
  isMine: boolean;
  brief: CalendarBriefSummary | null;
  /** When the booking is tied to a client but not a brief. */
  standaloneClientName: string | null;
};

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatBookingType(t: BookingType): string {
  return t.replace(/_/g, " ");
}

function formatBriefType(t: BriefType): string {
  return String(t).replace(/_/g, " ");
}

function formatDayDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function assigneeInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function AssigneeFace({
  name,
  avatarUrl,
  className,
}: {
  name: string | null;
  avatarUrl: string | null;
  className?: string;
}) {
  const size = "h-8 w-8 shrink-0";
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={32}
        height={32}
        unoptimized
        className={cn(size, "rounded-full object-cover ring-2 ring-zinc-100", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 ring-2 ring-zinc-100",
        size,
        className
      )}
      aria-hidden
    >
      {name ? assigneeInitials(name) : "?"}
    </div>
  );
}

type Cell = { kind: "out"; day: number } | { kind: "in"; day: number; dateKey: string };

function buildMonthMatrix(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const prevMonthLast = new Date(year, month, 0).getDate();

  const cells: Cell[] = [];
  for (let i = 0; i < startPad; i++) {
    const day = prevMonthLast - startPad + i + 1;
    cells.push({ kind: "out", day });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = localDateKey(new Date(year, month, d));
    cells.push({ kind: "in", day: d, dateKey });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ kind: "out", day: next++ });
  }
  return cells;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function cellCornerClass(row: number, col: number, numRows: number) {
  const top = row === 0;
  const bottom = row === numRows - 1;
  const left = col === 0;
  const right = col === 6;
  return cn(
    top && left && "rounded-tl-xl",
    top && right && "rounded-tr-xl",
    bottom && left && "rounded-bl-xl",
    bottom && right && "rounded-br-xl"
  );
}

function DayCell({
  cell,
  list,
  todayKey,
  cornerClass,
  onSelectBooking,
  onShowDayOverflow,
}: {
  cell: Cell;
  list: CalendarBookingLite[];
  todayKey: string;
  cornerClass: string;
  onSelectBooking: (b: CalendarBookingLite) => void;
  onShowDayOverflow: (dateKey: string, bookings: CalendarBookingLite[]) => void;
}) {
  if (cell.kind === "out") {
    return (
      <div className={cn("min-h-[5.5rem] bg-zinc-50/70 p-1.5", cornerClass)}>
        <span className="text-xs tabular-nums text-zinc-300">{cell.day}</span>
      </div>
    );
  }

  const isToday = cell.dateKey === todayKey;
  const overflow = list.length > 3 ? list.slice(3) : [];

  return (
    <div
      className={cn(
        "min-h-[5.5rem] bg-white p-1.5",
        cornerClass,
        isToday && "border-2 border-sky-400/80"
      )}
    >
      <div
        className={cn(
          "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs tabular-nums",
          isToday ? "bg-sky-600 font-semibold text-white" : "font-medium text-zinc-600"
        )}
      >
        {cell.day}
      </div>
      <ul className="mt-1 space-y-0.5">
        {list.slice(0, 3).map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onSelectBooking(b)}
              className={cn(
                "w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight ring-1 transition hover:brightness-95",
                b.isMine
                  ? "bg-sky-50 text-sky-900 ring-sky-200/80"
                  : "bg-zinc-50 text-zinc-800 ring-zinc-200/70"
              )}
            >
              {b.title}
            </button>
          </li>
        ))}
      </ul>
      {overflow.length > 0 ? (
        <button
          type="button"
          onClick={() => onShowDayOverflow(cell.dateKey, list)}
          className="mt-0.5 w-full text-left text-[10px] font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
        >
          +{overflow.length} more
        </button>
      ) : null}
    </div>
  );
}

type Scope = "all" | "mine";

const backdrop =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]";

function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: CalendarBookingLite;
  onClose: () => void;
}) {
  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);
  const timeFmt: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const startTime = start.toLocaleTimeString(undefined, timeFmt);
  const endTime = end.toLocaleTimeString(undefined, timeFmt);
  const sameCalendarDay = localDateKey(start) === localDateKey(end);
  const br = booking.brief;
  const hasContext = Boolean(br || booking.standaloneClientName);

  return (
    <div className={backdrop} role="dialog" aria-modal="true" aria-labelledby="cal-booking-title" onClick={onClose}>
      <div
        className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white ring-1 ring-black/[0.04]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-zinc-100 bg-gradient-to-br from-sky-50/90 via-white to-zinc-50/60 px-6 pb-5 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Calendar entry</p>
          <h2 id="cal-booking-title" className="mt-1.5 text-xl font-semibold leading-snug tracking-tight text-zinc-900">
            {booking.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-zinc-800 ring-1 ring-zinc-200/90">
              {formatBookingType(booking.bookingType)}
            </span>
            {booking.isMine ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600">Assigned to</span>
                <AssigneeFace name={booking.userName} avatarUrl={booking.assigneeAvatarUrl} />
                <span className="text-sm font-semibold text-zinc-900">You</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {br ? (
            <section className="rounded-xl border border-zinc-200/90 bg-gradient-to-b from-zinc-50/80 to-white p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Brief</h3>
              <p className="mt-2 text-sm font-medium text-zinc-600">{br.clientName}</p>
              <Link
                href={`/briefs/${br.id}`}
                className="mt-1 block text-base font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2 transition hover:text-sky-800 hover:decoration-sky-300"
              >
                {br.title}
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill status={br.status} />
                <ScopePill scopeStatus={br.scopeStatus} />
                <PriorityPill priority={br.priority} />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Brief type · <span className="capitalize">{formatBriefType(br.briefType)}</span>
              </p>
              {br.description.trim() ? (
                <p className="mt-3 border-t border-zinc-200/80 pt-3 text-sm leading-relaxed text-zinc-700 line-clamp-5">
                  {br.description}
                </p>
              ) : null}
              <dl className="mt-4 grid gap-3 border-t border-zinc-200/80 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Brief deadline</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">{formatDayDate(br.deadline)}</dd>
                </div>
                {br.clientDeliveryDate ? (
                  <div>
                    <dt className="text-xs font-medium text-zinc-500">Client delivery</dt>
                    <dd className="mt-0.5 font-medium text-zinc-900">{formatDayDate(br.clientDeliveryDate)}</dd>
                  </div>
                ) : null}
              </dl>
              {br.reviewLink ? (
                <a
                  href={br.reviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-900"
                >
                  Review link
                  <span className="text-xs opacity-80" aria-hidden>
                    ↗
                  </span>
                </a>
              ) : null}
            </section>
          ) : null}

          {booking.standaloneClientName ? (
            <section className="rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Client</h3>
              <p className="mt-2 text-sm font-semibold text-zinc-900">{booking.standaloneClientName}</p>
            </section>
          ) : null}

          <section className={cn(hasContext && "mt-5")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Schedule</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5">
                <p className="text-xs font-medium text-zinc-500">Starts</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{startTime}</p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5">
                <p className="text-xs font-medium text-zinc-500">Ends</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {endTime}
                  {!sameCalendarDay ? (
                    <span className="block pt-0.5 text-xs font-normal text-zinc-500">
                      {formatDayDate(end.toISOString())}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            {!booking.isMine ? (
              <div className="mt-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5">
                <p className="text-xs font-medium text-zinc-500">Assigned to</p>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <AssigneeFace name={booking.userName} avatarUrl={booking.assigneeAvatarUrl} />
                  <span className="text-sm font-semibold text-zinc-900">{booking.userName ?? "Unassigned"}</span>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
          {br ? (
            <Link
              href={`/briefs/${br.id}`}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Open brief
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DayOverflowModal({
  dateKey,
  bookings,
  onSelectBooking,
  onClose,
}: {
  dateKey: string;
  bookings: CalendarBookingLite[];
  onSelectBooking: (b: CalendarBookingLite) => void;
  onClose: () => void;
}) {
  const label = new Date(dateKey + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={backdrop} role="dialog" aria-modal="true" aria-labelledby="cal-day-title" onClick={onClose}>
      <div
        className="flex max-h-[min(28rem,85vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white ring-1 ring-black/[0.04]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 bg-gradient-to-br from-sky-50/80 via-white to-zinc-50/50 px-5 pb-4 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">This day</p>
          <h2 id="cal-day-title" className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
            All bookings
          </h2>
          <p className="mt-1 text-sm text-zinc-600">{label}</p>
        </div>
        <ul className="overflow-y-auto p-2">
          {bookings.map((b) => (
            <li key={b.id} className="border-b border-zinc-100 last:border-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectBooking(b);
                }}
                className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-zinc-50"
              >
                <span className="font-semibold text-zinc-900">{b.title}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(b.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {b.userName ?? "Unassigned"}
                  {b.brief ? ` · ${b.brief.clientName}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-zinc-100 bg-zinc-50/70 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalendarMonthGrid({
  bookings,
  viewerId,
}: {
  bookings: CalendarBookingLite[];
  viewerId: string | null;
}) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [scope, setScope] = useState<Scope>("all");
  const [detailBooking, setDetailBooking] = useState<CalendarBookingLite | null>(null);
  const [overflowDay, setOverflowDay] = useState<{ dateKey: string; bookings: CalendarBookingLite[] } | null>(null);

  const todayKey = localDateKey(new Date());

  const visibleBookings = useMemo(() => {
    if (scope === "mine" && viewerId) {
      return bookings.filter((b) => b.isMine);
    }
    return bookings;
  }, [bookings, scope, viewerId]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarBookingLite[]>();
    for (const b of visibleBookings) {
      const d = new Date(b.startsAt);
      const key = localDateKey(d);
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    }
    return map;
  }, [visibleBookings]);

  const matrix = useMemo(() => buildMonthMatrix(cursor.year, cursor.month), [cursor.year, cursor.month]);
  const dayRows = matrix.length / 7;

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const modalOpen = detailBooking !== null || overflowDay !== null;

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailBooking(null);
        setOverflowDay(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  function prevMonth() {
    setCursor((c) => {
      const d = new Date(c.year, c.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function nextMonth() {
    setCursor((c) => {
      const d = new Date(c.year, c.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToday() {
    const n = new Date();
    setCursor({ year: n.getFullYear(), month: n.getMonth() });
  }

  const navBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 transition hover:bg-zinc-50";

  const selectCls =
    "h-9 min-w-[8.5rem] rounded-lg border border-zinc-200 bg-white px-2 text-sm font-medium text-zinc-800";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">{monthLabel}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {viewerId ? (
            <label className="sr-only" htmlFor="cal-scope">
              Show bookings
            </label>
          ) : null}
          {viewerId ? (
            <select
              id="cal-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className={selectCls}
            >
              <option value="all">Everyone</option>
              <option value="mine">Mine only</option>
            </select>
          ) : null}
          <button type="button" className={navBtn} onClick={prevMonth} aria-label="Previous month">
            ‹
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            onClick={goToday}
          >
            Today
          </button>
          <button type="button" className={navBtn} onClick={nextMonth} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-200/80">
        {WEEKDAYS.map((d, col) => (
          <div
            key={d}
            className={cn(
              "bg-zinc-50 px-1 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-500",
              col === 0 && "rounded-tl-xl",
              col === 6 && "rounded-tr-xl"
            )}
          >
            {d}
          </div>
        ))}
        {matrix.map((cell, i) => {
          const row = Math.floor(i / 7);
          const col = i % 7;
          return (
            <DayCell
              key={i}
              cell={cell}
              todayKey={todayKey}
              cornerClass={cellCornerClass(row, col, dayRows)}
              list={cell.kind === "in" ? (byDay.get(cell.dateKey) ?? []) : []}
              onSelectBooking={setDetailBooking}
              onShowDayOverflow={(dateKey, list) => setOverflowDay({ dateKey, bookings: list })}
            />
          );
        })}
      </div>
      <p className="text-xs text-zinc-500">Grouped by start date (local time). Click a booking for details.</p>

      {detailBooking ? (
        <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />
      ) : null}
      {overflowDay ? (
        <DayOverflowModal
          dateKey={overflowDay.dateKey}
          bookings={overflowDay.bookings}
          onSelectBooking={setDetailBooking}
          onClose={() => setOverflowDay(null)}
        />
      ) : null}
    </div>
  );
}
